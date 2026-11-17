import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client, dateLabel, operation, statusLabel } from '../data/portal';
import { usePortal } from '../context/PortalContext';
import { ActionForm, AssociationSelect, button, field, panel, PrivateArea, TextBox, Value } from '../components/PortalForms';

const bucket = 'portal-vault';

export interface MessageThread {
  id: string;
  subject: string;
  status: 'open' | 'closed';
  association?: string;
  messages: { id: string; body: string; staff: boolean }[];
}

interface UserDashboard {
  bookings: { id: string; status: string; startsAt: string; association: string; address: string; phone: string; documents: string[] }[];
  cases: MessageThread[];
  consents: { source_id: string; target_id: string; purpose: string; expires_at: string; revoked_at: string | null }[];
  visited: { id: string; name: string; phone: string | null; address: string; seenAt: string }[];
  passports: { association: string; summary: string[]; updatedAt: string }[];
  accessLog: { action: string; association: string | null; at: string }[];
}

const accessLabel: Record<string, string> = {
  read_passport: 'a consulté votre passeport de liaison', write_passport: 'a mis à jour votre passeport de liaison',
};

async function removeVault(user: string) {
  for (;;) {
    const { data, error } = await client().storage.from(bucket).list(user, { limit: 100 });
    if (error) throw new Error('Impossible de vider le coffre-fort.');
    if (!data.length) return;
    const { error: failed } = await client().storage.from(bucket).remove(data.map((file) => `${user}/${file.name}`));
    if (failed) throw new Error('Impossible de vider le coffre-fort.');
  }
}

function MyData({ user }: { user: string }) {
  return <div className="space-y-3">
    <ActionForm label="Télécharger toutes mes données" onSubmit={async () => {
      const data = await operation('user', 'export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mes-donnees-portail.json';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }} />
    <details className="space-y-2"><summary className="font-semibold">Supprimer mon compte</summary>
      <p>Vos rendez-vous à venir seront annulés, vos documents, messages, passeports et accords seront effacés.
        Les rendez-vous passés sont conservés sans nom ni téléphone pour les statistiques.</p>
      <ActionForm label="Supprimer définitivement mon compte" onSubmit={async (form) => {
        if (String(form.get('confirm')).trim() !== 'SUPPRIMER') throw new Error('Saisissez SUPPRIMER pour confirmer.');
        await removeVault(user);
        await operation('user', 'delete_account', { confirm: 'SUPPRIMER' });
        await client().auth.signOut().catch(() => undefined);
      }}><Value label="Saisissez SUPPRIMER pour confirmer" name="confirm" /></ActionForm>
    </details>
  </div>;
}

export function useDashboard<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void load().then((result) => { if (active) { setData(result); setError(''); } })
      .catch((cause: Error) => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [load]);
  async function refresh() {
    try {
      setData(await load());
      setError('');
    } catch {
      setError('Impossible d’actualiser les informations.');
    }
  }
  return { data, error, refresh };
}

export function Threads({ threads, reply, close }: {
  threads: MessageThread[];
  reply: (id: string, body: FormDataEntryValue | null) => Promise<unknown>;
  close?: (id: string) => Promise<unknown>;
}) {
  return <div className="space-y-3">
    {!threads.length && <p>Aucune conversation.</p>}
    {threads.map((thread) => <details key={thread.id} className="border rounded-btn p-3 space-y-3">
      <summary className="font-bold cursor-pointer">{thread.subject} · {thread.association ?? statusLabel[thread.status]}</summary>
      <ol className="space-y-2">{thread.messages.map((message) => <li key={message.id} className="bg-surface rounded-btn p-2">
        <span className="font-bold">{message.staff ? 'Association' : 'Usager'}</span>
        <p className="whitespace-pre-wrap">{message.body}</p>
      </li>)}</ol>
      {thread.status === 'open' && <ActionForm label="Envoyer" reset onSubmit={(data) => reply(thread.id, data.get('body'))}>
        <TextBox label="Réponse" name="body" />
      </ActionForm>}
      {thread.status === 'open' && close && <ActionForm label="Clore la conversation" onSubmit={() => close(thread.id)} />}
    </details>)}
  </div>;
}

function CaseForm({ submit }: { submit: (data: Record<string, unknown>) => Promise<void> }) {
  const [step, setStep] = useState(1);
  const [association, setAssociation] = useState('');
  const [subject, setSubject] = useState('');
  const [complex, setComplex] = useState(false);
  const [sent, setSent] = useState(false);
  return <div className="space-y-2">
    {sent && <p role="status">Votre demande a été transmise à l’association choisie.</p>}
    {step > 1 && <button className="underline min-h-[44px]" onClick={() => setStep(step - 1)}>Étape précédente</button>}
    {step === 1 && <ActionForm key={1} label="Continuer" onSubmit={async (data) => {
      setAssociation(String(data.get('association')));
      setSent(false);
      setStep(2);
    }}><AssociationSelect /></ActionForm>}
    {step === 2 && <ActionForm key={2} label="Continuer" onSubmit={async (data) => {
      setSubject(String(data.get('subject')));
      setComplex(data.has('complex'));
      setStep(3);
    }}>
      <Value label="Sujet de votre demande" name="subject" initial={subject} />
      <label className="flex items-center gap-2"><input type="checkbox" name="complex" defaultChecked={complex} /> Mon cas nécessite un accompagnement particulier</label>
    </ActionForm>}
    {step === 3 && <ActionForm key={3} label="Transmettre ma demande" onSubmit={async (data) => {
      await submit({ association, subject, complex, body: data.get('body') });
      setStep(1);
      setSubject('');
      setSent(true);
    }}><TextBox label="Expliquez votre situation" name="body" /></ActionForm>}
  </div>;
}

function Vault({ user }: { user: string }) {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    void client().storage.from(bucket).list(user, { offset: page * 30, limit: 30, sortBy: { column: 'name', order: 'asc' } })
      .then(({ data, error: failed }) => {
        if (!active) return;
        setError(failed ? 'Le coffre-fort est indisponible.' : '');
        setFiles(data?.map((file) => file.name) ?? []);
      });
    return () => { active = false; };
  }, [user, page]);

  async function loadFiles() {
    const { data, error: failed } = await client().storage.from(bucket).list(user, { offset: page * 30, limit: 30, sortBy: { column: 'name', order: 'asc' } });
    if (failed) throw new Error('Impossible d’actualiser le coffre-fort.');
    setFiles(data.map((file) => file.name));
  }

  return <div className="space-y-3">
    {error && <p role="alert">{error}</p>}
    <ActionForm label="Ajouter au coffre-fort" reset onSubmit={async (data) => {
      const file = data.get('file');
      if (!(file instanceof File) || !file.size || file.size > 10485760) throw new Error('Choisissez un fichier de 10 Mo maximum.');
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) throw new Error('Choisissez un PDF, JPEG ou PNG.');
      const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 150);
      const { error: failed } = await client().storage.from(bucket).upload(`${user}/${crypto.randomUUID()}_${name}`, file);
      if (failed) throw new Error('Le fichier n’a pas pu être ajouté.');
      await loadFiles();
    }}><label className="block">Document PDF, JPEG ou PNG
      <input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required className={field} />
    </label></ActionForm>
    {files.map((name) => <details key={name} className="space-y-2">
      <summary className="break-all">{name.slice(37)}</summary>
      <ActionForm label="Télécharger" onSubmit={async () => {
        const { data, error: failed } = await client().storage.from(bucket).download(`${user}/${name}`);
        if (failed) throw new Error('Téléchargement impossible.');
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = name.slice(37);
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }} />
      <ActionForm label="Supprimer ce document" onSubmit={async () => {
        const { error: failed } = await client().storage.from(bucket).remove([`${user}/${name}`]);
        if (failed) throw new Error('Suppression impossible.');
        await loadFiles();
      }} />
    </details>)}
    <div className="flex gap-2">
      {page > 0 && <button className={button} onClick={() => setPage(page - 1)}>Page précédente</button>}
      {files.length === 30 && <button className={button} onClick={() => setPage(page + 1)}>Page suivante</button>}
    </div>
  </div>;
}

const loadUser = () => operation<UserDashboard>('user', 'dashboard');

function UserDashboardView() {
  const { session, associations, reloadDirectory } = usePortal();
  const { data, error, refresh } = useDashboard(loadUser);
  const associationName = (id: string) => associations.find((item) => item.id === id)?.name ?? 'Association';
  async function update(action: string, values: Record<string, unknown>) {
    await operation('user', action, values);
    await refresh();
  }
  if (error) return <p role="alert">{error}</p>;
  if (!data || !session) return <p role="status">Chargement de votre espace…</p>;
  const visited = data.visited ?? [], passports = data.passports ?? [], accessLog = data.accessLog ?? [];
  const upcoming = data.bookings.filter((booking) => booking.status === 'confirmed' && Date.parse(booking.startsAt) > Date.now())
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const history = data.bookings.filter((booking) => !upcoming.includes(booking));
  return <>
    <section className={panel}>
      <h2 className="text-xl font-bold">Mes prochains rendez-vous</h2>
      {!upcoming.length && <p>Aucun prochain rendez-vous.</p>}
      {upcoming.map((booking) => <article key={booking.id} className="border-t pt-3 space-y-1">
        <h3 className="font-bold">{dateLabel.format(new Date(booking.startsAt))} · {booking.association}</h3>
        <p>{booking.address}</p>
        {!!booking.documents.length && <details><summary>Documents à apporter</summary>
          <ul className="list-disc pl-5">{booking.documents.map((document, index) => <li key={index}>{document}</li>)}</ul>
        </details>}
        {booking.phone && <a className="underline" href={`tel:${booking.phone.replace(/[^+0-9]/g, '')}`}>{booking.phone}</a>}
        <ActionForm label="Annuler ce rendez-vous" onSubmit={async () => {
          const cancelled = await operation<boolean>('user', 'cancel', { id: booking.id });
          if (!cancelled) throw new Error('Ce rendez-vous ne peut plus être annulé.');
          await refresh();
          void reloadDirectory();
        }} />
      </article>)}
      <details><summary>Historique</summary><ul>{history.map((booking) =>
        <li key={booking.id}>{dateLabel.format(new Date(booking.startsAt))} · {booking.association} · {statusLabel[booking.status]}</li>)}</ul></details>
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Associations consultées</h2>
      {!visited.length && <p>Aucune association consultée récemment.</p>}
      <ul className="space-y-2">{visited.map((item) => <li key={item.id}>
        <Link className="font-bold underline" to={`/association/${item.id}`}>{item.name}</Link>
        <span> · {item.address}</span>
        {item.phone && <> · <a className="underline" href={`tel:${item.phone.replace(/[^+0-9]/g, '')}`}>Appeler</a></>}
      </li>)}</ul>
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Mes messages</h2>
      <Threads threads={data.cases} reply={(id, body) => update('reply', { id, body })} />
      <h3 className="font-bold">Contacter une association</h3>
      <CaseForm submit={(values) => update('open_case', values)} />
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Mes documents privés</h2><Vault user={session.user.id} /></section>
    <section className={panel}><h2 className="text-xl font-bold">Mon passeport de liaison</h2>
      {!passports.length && <p>Aucune association n’a encore rédigé de passeport.</p>}
      {passports.map((item) => <article key={item.association + item.updatedAt} className="border-t pt-2">
        <p className="font-bold">{item.association} · {dateLabel.format(new Date(item.updatedAt))}</p>
        <ol className="list-decimal pl-5">{item.summary.map((line, index) => <li key={index}>{line}</li>)}</ol>
      </article>)}
      <details><summary className="font-semibold">Qui a consulté mon dossier ?</summary>
        {!accessLog.length && <p>Aucune consultation enregistrée.</p>}
        <ul>{accessLog.map((item, index) => <li key={index}>
          {dateLabel.format(new Date(item.at))} · {item.association ?? 'Association'} {accessLabel[item.action] ?? item.action}
        </li>)}</ul>
      </details>
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Mes autorisations de partage</h2>
      <ActionForm label="Donner mon accord pour 30 jours" onSubmit={(form) => update('grant', {
        source: form.get('source'), target: form.get('target'), purpose: form.get('purpose'),
      })}><AssociationSelect name="source" label="Association à l’origine du dossier" />
        <AssociationSelect name="target" label="Association destinataire" />
        <label className="block">Ce que j’autorise
          <select name="purpose" className={field}><option value="passport">Partager mon passeport de liaison</option>
            <option value="orientation">Réserver un rendez-vous pour moi chez le destinataire</option></select>
        </label>
        <label className="flex gap-2"><input type="checkbox" required /> Je donne mon accord à ces deux associations pour cette action.</label>
      </ActionForm>
      {data.consents.filter((item) => !item.revoked_at && Date.parse(item.expires_at) > Date.now()).map((item) =>
        <div key={`${item.source_id}-${item.target_id}-${item.purpose}`} className="border-t pt-2">
          <p>{associationName(item.source_id)} → {associationName(item.target_id)} · {item.purpose === 'passport' ? 'Passeport' : 'Orientation'}</p>
          <ActionForm label="Retirer cet accord" onSubmit={() => update('revoke', {
            source: item.source_id, target: item.target_id, purpose: item.purpose,
          })} />
        </div>)}
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Mes données personnelles</h2><MyData user={session.user.id} /></section>
  </>;
}

export function UserSpacePage() {
  return <PrivateArea title="Mon espace usager"><UserDashboardView /></PrivateArea>;
}
