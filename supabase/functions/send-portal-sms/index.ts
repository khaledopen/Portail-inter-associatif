interface SmsJob {
  id: string;
  lease: string;
  kind: 'confirmation' | 'reminder' | 'cancellation';
  booking: string;
  cancelToken: string;
  phone: string;
  startsAt: string;
  association: string;
  address: string;
  documents: string[] | null;
}

function setting(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variable manquante : ${name}`);
  return value;
}

async function rpc<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}') as Record<string, string>;
  const key = keys.default || Deno.env.get('SUPABASE_SECRET_KEY') || setting('SUPABASE_SERVICE_ROLE_KEY');
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
  if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(`${setting('SUPABASE_URL')}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`RPC ${name} : ${response.status}`);
  return response.status === 204 ? undefined as T : await response.json();
}

function bookingMessage(job: SmsJob, portalUrl: URL) {
  const date = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris',
  }).format(new Date(job.startsAt));
  const link = new URL('/annulation', portalUrl);
  link.hash = new URLSearchParams({ id: job.booking, token: job.cancelToken }).toString();
  const title = { confirmation: 'Rendez-vous confirmé', reminder: 'Rappel de rendez-vous', cancellation: 'Rendez-vous annulé' };
  const message = [`${title[job.kind]} : ${job.association}, ${date}.`];
  if (job.kind !== 'cancellation') {
    message.push(job.address, `Annuler : ${link}`);
    if (job.documents?.length) message.push(`À apporter : ${job.documents.join(', ').slice(0, 480)}`);
  }
  return message.join('\n');
}

function smsSender(): (phone: string, message: string) => Promise<boolean> {
  const provider = Deno.env.get('PORTAL_SMS_PROVIDER') ?? 'twilio';
  if (provider === 'vonage') {
    const apiKey = setting('VONAGE_API_KEY');
    const apiSecret = setting('VONAGE_API_SECRET');
    const from = setting('VONAGE_SMS_FROM');
    return async (phone, message) => {
      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        body: new URLSearchParams({
          api_key: apiKey, api_secret: apiSecret, from,
          to: phone.replace(/^\+/, ''), text: message, type: 'unicode',
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) {
        await response.body?.cancel();
        return false;
      }
      const result = await response.json() as { messages?: { status: string }[] };
      return !!result.messages?.length && result.messages.every((message) => message.status === '0');
    };
  }
  if (provider !== 'twilio') throw new Error('Fournisseur SMS inconnu');
  const account = setting('TWILIO_ACCOUNT_SID');
  const auth = btoa(`${account}:${setting('TWILIO_AUTH_TOKEN')}`);
  const service = setting('TWILIO_MESSAGING_SERVICE_SID');
  return async (phone, message) => {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
      body: new URLSearchParams({ To: phone, MessagingServiceSid: service, Body: message }),
      signal: AbortSignal.timeout(12000),
    });
    await response.body?.cancel();
    return response.ok;
  };
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const secret = Deno.env.get('PORTAL_CRON_SECRET');
  if (!secret || request.headers.get('x-portal-cron-secret') !== secret) {
    return new Response(null, { status: 401 });
  }
  try {
    const send = smsSender();
    const portalUrl = new URL(setting('PORTAL_URL'));
    const jobs = await rpc<SmsJob[]>('portal_claim_sms');
    const results = await Promise.allSettled(jobs.map(async (job) => {
      let delivered = false;
      try { delivered = await send(job.phone, bookingMessage(job, portalUrl)); } catch { /* The lease is released for a later attempt. */ }
      await rpc('portal_finish_sms', { p_id: job.id, p_lease: job.lease, p_delivered: delivered });
      return delivered;
    }));
    return Response.json({ processed: jobs.length, delivered: results.filter(
      (result) => result.status === 'fulfilled' && result.value
    ).length });
  } catch {
    return new Response(null, { status: 503 });
  }
});
