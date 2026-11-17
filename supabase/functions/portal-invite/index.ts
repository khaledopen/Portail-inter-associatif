// Invite un bénévole ou salarié d'association par e-mail.
// Appelée par un pilote connecté : l'autorisation est vérifiée par public.portal_admin('invite_staff').
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reply(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: cors });
}

function keys() {
  const publishable = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}') as Record<string, string>;
  const secret = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}') as Record<string, string>;
  return {
    url: Deno.env.get('SUPABASE_URL')!,
    publicKey: publishable.default || Deno.env.get('SUPABASE_ANON_KEY')!,
    secretKey: secret.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  };
}

function emailError(code: string | undefined, message: string) {
  if (code === 'email_address_not_authorized' || /not authorized/i.test(message)) {
    return 'L’envoi d’e-mails vers cette adresse n’est pas encore possible : configurez un serveur SMTP dans Supabase (Authentication → Emails → SMTP).';
  }
  if (code === 'over_email_send_rate_limit' || /rate limit/i.test(message)) {
    return 'Trop d’e-mails envoyés récemment. Réessayez dans une heure ou configurez un serveur SMTP.';
  }
  return 'L’e-mail d’invitation n’a pas pu être envoyé. L’accès sera ajouté dès que la personne aura un compte.';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return reply(405, { error: 'Méthode non autorisée' });
  const authorization = request.headers.get('Authorization');
  if (!authorization) return reply(401, { error: 'Connexion requise' });

  let association: string, email: string;
  try {
    ({ association, email } = await request.json());
  } catch {
    return reply(400, { error: 'Requête invalide' });
  }

  const { url, publicKey, secretKey } = keys();
  const asPilot = createClient(url, publicKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await asPilot.rpc('portal_admin', {
    p_action: 'invite_staff', p_data: { id: association, email },
  });
  if (error) {
    const status = error.code === '42501' ? 403 : 400;
    return reply(status, { error: ['42501', '22023'].includes(error.code ?? '') ? error.message : 'Invitation impossible' });
  }

  const result = data as { userExists: boolean; neverSignedIn: boolean; email: string; association: string };
  const portal = Deno.env.get('PORTAL_URL') || request.headers.get('Origin') || '';
  const redirectTo = portal ? new URL('/bienvenue', portal).toString() : undefined;
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (result.userExists && !result.neverSignedIn) {
    return reply(200, { status: 'linked', message: `Ce compte existait déjà : il a maintenant accès à ${result.association}.` });
  }
  const sent = result.userExists
    ? await admin.auth.resetPasswordForEmail(result.email, { redirectTo })
    : await admin.auth.admin.inviteUserByEmail(result.email, { redirectTo, data: { association: result.association } });
  if (sent.error) {
    return reply(502, { status: 'saved', error: emailError(sent.error.code, sent.error.message) });
  }
  return reply(200, { status: 'invited', message: `Invitation envoyée à ${result.email} pour ${result.association}.` });
});
