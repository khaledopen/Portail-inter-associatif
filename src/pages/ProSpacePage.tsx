import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../context/PortalContext';
import { ActionForm, AssociationSelect, DistrictField, field, normalizePhone, panel, PrivateArea, TextBox, Value } from '../components/PortalForms';
import { dateLabel, operation, statusLabel } from '../data/portal';
import type { CategoryId } from '../data/mockData';
import { type MessageThread, Threads, useDashboard } from './UserSpacePage';

interface StaffDashboard {
  slots: { id: string; starts_at: string; ends_at: string; closed: boolean; reserved: boolean }[];
  bookings: { id: string; name: string; status: string; startsAt: string; walkIn?: boolean; hasAccount?: boolean; orientedBy?: string | null }[];
  cases: MessageThread[];
  passports: { id: string; association: string; updatedAt: string }[];
  alerts: { id: string; association: string; own: boolean; body: string; kind?: string }[];
  exchange: ExchangeSlot[];
  staffMessages: { id: string; sender: string; recipient: string; body: string }[];
  resources: { id: string; title: string; url: string }[];
}

interface PassportStep {
  startsAt: string; association: string; status: string; procedure: string | null; orientedBy: string | null;
}

interface ExchangeSlot {
  id: string; startsAt: string; motif: 'firstVisit' | 'followUp' | 'both'; partnerOnly: boolean;
  associationId: string; association: string; category: CategoryId; secondaryCategories?: CategoryId[] | null;
}

const alertKinds: Record<string, string> = {
  hebergement: 'Hébergement', alimentaire: 'Aide alimentaire', sante: 'Santé', violence: 'Violences', autre: 'Autre',
};
const competences: Record<CategoryId, string> = {
  papiers: 'Papiers et séjour', logement: 'Logement et énergie', sante: 'Santé et handicap',
  travail: 'Travail et formation', famille: 'Famille et budget', droits: 'Droits et démarches',
};
const motifLabel = { both: 'tous motifs', firstVisit: 'premier rendez-vous', followUp: 'suivi' } as const;

function SlotPicker({ slots, exclude }: { slots: ExchangeSlot[]; exclude?: string }) {
  const [competence, setCompetence] = useState<CategoryId | ''>('');
  const options = slots.filter((slot) => slot.associationId !== exclude && (!competence
    || slot.category === competence || slot.secondaryCategories?.includes(competence)));
  const groups = [...new Set(options.map((slot) => slot.association))];
  return <>
    <label className="block">Compétence recherchée
      <select className={field} value={competence} onChange={(event) => setCompetence(event.target.value as CategoryId | '')}>
        <option value="">Toutes les compétences</option>
        {Object.entries(competences).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
    </label>
    <label className="block">Créneau
      <select name="slot" className={field} required defaultValue="">
        <option value="" disabled>{options.length ? 'Choisir un créneau' : 'Aucun créneau disponible'}</option>
        {groups.map((name) => <optgroup key={name} label={name}>{options.filter((slot) => slot.association === name).map((slot) =>
          <option key={slot.id} value={slot.id}>
            {dateLabel.format(new Date(slot.startsAt))} ({motifLabel[slot.motif]}){slot.partnerOnly ? ' · réservé partenaires' : ''}
          </option>)}</optgroup>)}
      </select>
    </label>
  </>;
}

const loadMemberships = () => operation<{ id: string; name: string }[]>('staff', 'memberships');

function Memberships() {
  const { data, error } = useDashboard(loadMemberships);
  const [selection, setSelection] = useState('');
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Vérification de vos accès…</p>;
  if (!data.length) return <p>Aucune association n’est liée à votre compte. Contactez l’équipe de coordination.</p>;
  const association = data.find((item) => item.id === selection) ?? data[0];
  return <>
    <label className="block font-bold">Association active
      <select className={field} value={association.id} onChange={(event) => setSelection(event.target.value)}>
        {data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <StaffDashboardView key={association.id} association={association.id} />
  </>;
}

function SlotMotif({ both = false }: { both?: boolean }) {
  return <label className="block font-semibold">Motif
    <select className={field} name="motif">
      {both && <option value="both">Premier rendez-vous ou suivi</option>}
      <option value="firstVisit">Premier rendez-vous</option>
      <option value="followUp">Suivi</option>
    </select>
  </label>;
}

function StaffDashboardView({ association }: { association: string }) {
  const { reloadDirectory } = usePortal();
  const load = useCallback(() => operation<StaffDashboard>('staff', 'dashboard', { association }), [association]);
  const { data, error, refresh } = useDashboard(load);
  const [passport, setPassport] = useState<{ id: string; summary: string[]; history: PassportStep[] }>();
  const [notice, setNotice] = useState('');
  async function update(action: string, values: Record<string, unknown> = {}) {
    await operation('staff', action, { ...values, association });
    await refresh();
  }
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Chargement de votre espace…</p>;
  const localDay = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris' });
  const today = localDay.format(new Date());
  return <>
    <section className={panel}>
      <h2 className="text-xl font-bold">Rendez-vous du jour</h2>
      {data.bookings.filter((booking) => localDay.format(new Date(booking.startsAt)) === today).map((booking) =>
        <p key={booking.id}>{dateLabel.format(new Date(booking.startsAt))} · {booking.name} · {statusLabel[booking.status]}</p>)}
      {!data.bookings.some((booking) => localDay.format(new Date(booking.startsAt)) === today) && <p>Aucun rendez-vous aujourd’hui.</p>}
      <details className="space-y-3"><summary className="font-bold">Tous les rendez-vous</summary>
        {data.bookings.map((booking) => <details key={booking.id} className="border rounded-btn p-3 space-y-3">
          <summary>{dateLabel.format(new Date(booking.startsAt))} · {booking.name} · {statusLabel[booking.status]}
            {booking.walkIn && ' · pris au guichet'}{booking.orientedBy && ` · orienté par ${booking.orientedBy}`}</summary>
          {booking.status === 'confirmed' && Date.parse(booking.startsAt) <= Date.now() &&
            <ActionForm label="Mettre à jour le rendez-vous" onSubmit={(form) =>
              update('booking_status', { id: booking.id, status: form.get('status') })}>
              <label className="block">Résultat<select className={field} name="status">
                <option value="completed">Effectué</option><option value="absent">Absent</option>
              </select></label>
            </ActionForm>}
          {booking.status !== 'cancelled' && booking.hasAccount !== false && <>
            <details className="space-y-2"><summary className="font-semibold">Orienter vers une autre association</summary>
              <p>L’usager doit donner son accord à l’orientation dans son espace.</p>
              <ActionForm label="Réserver chez le partenaire" onSubmit={async (form) => {
                await update('orient', { id: booking.id, slot: form.get('slot'), motif: form.get('motif'), name: booking.name });
                void reloadDirectory();
              }}>
                <SlotPicker slots={data.exchange ?? []} exclude={association} /><SlotMotif />
              </ActionForm>
            </details>
            <details className="space-y-2"><summary className="font-semibold">Rédiger le passeport de liaison</summary>
              <ActionForm label="Enregistrer les cinq lignes" onSubmit={(form) =>
                update('write_passport', { id: booking.id, summary: ['1','2','3','4','5'].map((line) => form.get(line)) })}>
                {['Besoin exprimé', 'Démarches effectuées', 'Dossier en cours', 'Prochaines étapes', 'Point de vigilance'].map((label, index) =>
                  <TextBox key={label} label={label} name={String(index + 1)} max={500} />)}
              </ActionForm>
            </details>
          </>}
        </details>)}
      </details>
    </section>
    <section className={panel}>
      <h2 className="text-xl font-bold">Réserver pour une personne présente</h2>
      <p>Pour une personne sans compte ni internet : le SMS de confirmation et de rappel part vers son mobile.</p>
      {notice && <p role="status" className="font-semibold">{notice}</p>}
      <ActionForm label="Réserver le créneau" reset onSubmit={async (form) => {
        setNotice('');
        await update('book_walk_in', {
          slot: form.get('slot'), motif: form.get('motif'), name: form.get('name'),
          phone: normalizePhone(String(form.get('phone') ?? '')), district: String(form.get('district') ?? '').trim() || undefined,
          consent: form.has('consent'),
        });
        setNotice('Rendez-vous réservé. La personne recevra un SMS de confirmation.');
        void reloadDirectory();
      }}>
        <SlotPicker slots={data.exchange ?? []} /><SlotMotif />
        <Value label="Prénom de la personne" name="name" />
        <Value label="Son numéro de mobile" name="phone" type="tel" />
        <DistrictField />
        <label className="flex gap-2"><input type="checkbox" name="consent" required />
          La personne présente accepte la réservation et l’envoi de SMS à ce numéro.</label>
      </ActionForm>
    </section>
    <section className={panel}>
      <h2 className="text-xl font-bold">Agenda des permanences</h2>
      <ActionForm label="Ouvrir un créneau" reset onSubmit={async (form) => {
        const start = new Date(String(form.get('start')));
        const end = new Date(String(form.get('end')));
        if (start >= end) throw new Error('L’heure de fin doit suivre l’heure de début.');
        await update('create_slot', {
          startsAt: start.toISOString(), endsAt: end.toISOString(), motif: form.get('motif'),
          repeatWeeks: Number(form.get('repeat') || 1), partnerOnly: form.has('partnerOnly'),
        });
        void reloadDirectory();
      }}>
        <p>Les horaires saisis suivent le fuseau de cet appareil.</p>
        <Value label="Début" name="start" type="datetime-local" />
        <Value label="Fin" name="end" type="datetime-local" />
        <SlotMotif both />
        <label className="block font-semibold">Répéter chaque semaine pendant
          <input className={field} type="number" name="repeat" min={1} max={26} defaultValue={1} /> semaine(s)
        </label>
        <label className="flex gap-2"><input type="checkbox" name="partnerOnly" />
          Réserver ce créneau aux orientations des partenaires (bourse aux créneaux)</label>
      </ActionForm>
      {data.slots.filter((slot) => !slot.closed).map((slot) => <div key={slot.id} className="border-t pt-2">
        <p>{dateLabel.format(new Date(slot.starts_at))} – {dateLabel.format(new Date(slot.ends_at))}
          {(slot as { partner_only?: boolean }).partner_only && ' · réservé partenaires'}</p>
        {slot.reserved ? <p>Réservé</p> : <ActionForm label="Fermer le créneau" onSubmit={async () => {
          await update('close_slot', { id: slot.id });
          void reloadDirectory();
        }} />}
      </div>)}
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Demandes et messages des usagers</h2>
      <Threads threads={data.cases} reply={(id, body) => update('reply', { id, body })} close={(id) => update('close_case', { id })} />
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Passeports de liaison</h2>
      {!data.passports.length && <p>Aucun passeport accessible.</p>}
      {data.passports.map((item) => <div key={item.id} className="space-y-2">
        <p>{item.association} · {dateLabel.format(new Date(item.updatedAt))}</p>
        <ActionForm label="Consulter le passeport" onSubmit={async () => {
          setPassport(undefined);
          const result = await operation<{ summary: string[]; history?: PassportStep[] }>('staff', 'read_passport', { id: item.id, association });
          setPassport({ id: item.id, summary: result.summary, history: result.history ?? [] });
        }} />
        {passport?.id === item.id && <>
          <ol className="list-decimal pl-5">
            {['Besoin', 'Démarches', 'Dossier en cours', 'Prochaines étapes', 'Vigilance'].map((label, index) =>
              <li key={label}><span className="font-semibold">{label} :</span> {passport.summary[index]}</li>)}
          </ol>
          {!!passport.history.length && <><h3 className="font-bold">Parcours</h3><ul className="list-disc pl-5">
            {passport.history.map((step, index) => <li key={index}>
              {dateLabel.format(new Date(step.startsAt))} · {step.association}{step.procedure && ` · ${step.procedure}`}
              {' · '}{statusLabel[step.status] ?? step.status}{step.orientedBy && ` · orienté par ${step.orientedBy}`}
            </li>)}</ul></>}
        </>}
      </div>)}
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Relais urgence</h2>
      <ActionForm label="Publier une alerte" reset onSubmit={(form) => update('alert', { body: form.get('body'), kind: form.get('kind') })}>
        <label className="block font-semibold">Type d’urgence
          <select name="kind" className={field}>{Object.entries(alertKinds).map(([id, label]) =>
            <option key={id} value={id}>{label}</option>)}</select>
        </label>
        <TextBox label="Besoin urgent, sans nom ni coordonnées personnelles" name="body" max={1000} />
      </ActionForm>
      {data.alerts.map((alert) => <article key={alert.id} className="border-t pt-2">
        <p className="font-bold">{alertKinds[alert.kind ?? 'autre']} · {alert.association}</p><p>{alert.body}</p>
        {alert.own && <ActionForm label="Résoudre l’alerte" onSubmit={() => update('resolve_alert', { id: alert.id })} />}
      </article>)}
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Messagerie entre associations</h2>
      <ActionForm label="Envoyer le message" reset onSubmit={(form) =>
        update('staff_message', { target: form.get('target'), body: form.get('body') })}>
        <AssociationSelect name="target" label="Destinataire" omit={association} /><TextBox label="Message" name="body" />
      </ActionForm>
      {data.staffMessages.map((message) => <article key={message.id} className="border-t pt-2">
        <p className="font-bold">{message.sender} → {message.recipient}</p><p className="whitespace-pre-wrap">{message.body}</p>
      </article>)}
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Documents communs</h2>
      {!data.resources.length && <p>Aucun document publié.</p>}
      <ul>{data.resources.map((item) => <li key={item.id}><a href={item.url} className="underline" target="_blank" rel="noreferrer">{item.title}</a></li>)}</ul>
    </section>
    <Link to="/annuaire" className="block underline">Annuaire des associations et compétences</Link>
  </>;
}

export function ProSpacePage() {
  return <PrivateArea title="Espace associations" staff>
    <Memberships />
  </PrivateArea>;
}
