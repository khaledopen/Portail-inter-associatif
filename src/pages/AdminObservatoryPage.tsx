import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ActionForm, field, panel, PrivateArea, TextBox, Value } from '../components/PortalForms';
import { usePortal } from '../context/PortalContext';
import type { Association, CategoryId, DigitalHelpCenter } from '../data/mockData';
import { dateLabel, inviteStaff, operation, rpc } from '../data/portal';
import { useDashboard } from './UserSpacePage';

type Draft = { id: string; profile: Partial<Association> & { isQpv?: boolean }; published: boolean };
type Application = {
  id: string; name: string; organization_number: string; contact_email: string; mission: string; address: string;
};
type Stats = {
  total: number | null; completed: number | null; waitDays: number | null; saturation: number | null;
  themes: { theme: CategoryId; volume: number }[]; districts: { district: string; qpv: boolean | null; volume: number }[];
};
interface AdminDashboard {
  associations: Draft[];
  applications: Application[];
  resources: { id: string; title: string; url: string }[];
  helpCenters: DigitalHelpCenter[];
  stats: Stats;
  members?: { association: string; user: string; email: string | null; lastSignIn: string | null }[];
  invitations?: { id: string; association: string; email: string; createdAt: string; status: 'pending' | 'sent' | 'active' }[];
}

const invitationStatus = {
  pending: 'invitation envoyée, compte pas encore créé',
  sent: 'compte créé, mot de passe pas encore choisi',
  active: 'actif',
} as const;

function TeamAccess({ association, data, update, invite }: {
  association: string;
  data: AdminDashboard;
  update: (action: string, values: Record<string, unknown>) => Promise<void>;
  invite: (association: string, email: string) => Promise<void>;
}) {
  const members = (data.members ?? []).filter((item) => item.association === association);
  const invitations = (data.invitations ?? []).filter((item) => item.association === association && item.status !== 'active');
  return <div className="border-t pt-3 space-y-3">
    <h3 className="font-bold">Équipe de l’association</h3>
    {!members.length && <p>Aucun compte n’a encore accès à cette fiche.</p>}
    <ul className="space-y-2">{members.map((item) => <li key={item.user} className="flex flex-wrap items-center gap-2">
      <span>{item.email ?? item.user} · {item.lastSignIn ? `dernière connexion ${dateLabel.format(new Date(item.lastSignIn))}` : 'jamais connecté'}</span>
      <ActionForm label="Retirer l’accès" onSubmit={() => update('staff_access', { id: association, user: item.user, remove: true })} />
    </li>)}</ul>
    {!!invitations.length && <>
      <h4 className="font-semibold">Invitations en cours</h4>
      <ul className="space-y-2">{invitations.map((item) => <li key={item.id} className="flex flex-wrap items-center gap-2">
        <span>{item.email} · {invitationStatus[item.status]}</span>
        <ActionForm label="Renvoyer l’e-mail" onSubmit={() => invite(association, item.email)} />
        <ActionForm label="Annuler l’invitation" onSubmit={() => update('revoke_invitation', { id: item.id })} />
      </li>)}</ul>
    </>}
    <ActionForm label="Envoyer l’invitation" reset onSubmit={(form) => invite(association, String(form.get('email')).trim())}>
      <Value label="Inviter une personne de l’association par e-mail" name="email" type="email" />
    </ActionForm>
    <details className="space-y-2"><summary className="cursor-pointer">Ajouter un compte existant par identifiant (avancé)</summary>
      <ActionForm label="Mettre à jour l’accès professionnel" onSubmit={(form) =>
        update('staff_access', { id: association, user: form.get('user'), remove: form.has('remove') })}>
        <Value label="Identifiant Supabase Auth du compte professionnel" name="user" />
        <label className="flex gap-2"><input type="checkbox" name="remove" /> Retirer son accès à cette association</label>
      </ActionForm>
    </details>
  </div>;
}

const themes: Record<CategoryId, string> = {
  papiers: 'Papiers et séjour', logement: 'Logement et énergie', sante: 'Santé et handicap',
  travail: 'Travail et formation', famille: 'Famille et budget', droits: 'Droits et démarches',
};
type Observatory = {
  threshold: number;
  residentDistricts: { district: string; qpv: boolean; volume: number }[];
  waitByTheme: { theme: CategoryId; volume: number; waitDays: number }[];
  monthly: { month: string; volume: number }[];
  outcomes: { cancelled: number | null; absent: number | null; oriented: number | null; walkIn: number | null };
  saturationByAssociation: { association: string; slots: number; reserved: number; rate: number }[];
  districts: { name: string; city: string | null; qpv: boolean }[];
};
const loadObservatory = () => rpc<Observatory>('portal_observatory', { p_action: 'stats', p_data: {} });

function DetailedStatistics() {
  const { data, error, refresh } = useDashboard(loadObservatory);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Chargement des indicateurs détaillés…</p>;
  const save = async (action: string, values: Record<string, unknown>) => {
    await rpc('portal_observatory', { p_action: action, p_data: values });
    await refresh();
  };
  const outcomes = [['Annulations', data.outcomes.cancelled], ['Absences', data.outcomes.absent],
    ['Orientations entre structures', data.outcomes.oriented], ['Réservations au guichet', data.outcomes.walkIn]] as const;
  return <section className={panel}>
    <h2 className="text-xl font-bold">Baromètre détaillé</h2>
    <p>Groupes de moins de {data.threshold} demandes masqués. Le quartier de résidence est déclaré librement par l’usager.</p>
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">{outcomes.map(([label, value]) =>
      <div className="bg-surface p-3 rounded-btn" key={label}><dt>{label}</dt><dd className="text-xl font-bold">{value ?? '—'}</dd></div>)}</dl>
    {!!data.monthly.length && <div className="h-56" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={data.monthly}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} />
        <Tooltip /><Bar dataKey="volume" name="Demandes" fill="#176B57" />
      </BarChart></ResponsiveContainer>
    </div>}
    <h3 className="font-bold">Demandes par mois</h3>
    <ul>{data.monthly.map((item) => <li key={item.month}>{item.month} · {item.volume}</li>)}</ul>
    <h3 className="font-bold">Quartier de résidence déclaré</h3>
    {!data.residentDistricts.length && <p>Aucun groupe affichable.</p>}
    <ul>{data.residentDistricts.map((item) => <li key={item.district}>{item.district}{item.qpv && ' (QPV)'} · {item.volume}</li>)}</ul>
    <h3 className="font-bold">Délai moyen par thème</h3>
    <ul>{data.waitByTheme.map((item) => <li key={item.theme}>{themes[item.theme] ?? item.theme} · {item.waitDays} jours ({item.volume} demandes)</li>)}</ul>
    <h3 className="font-bold">Saturation des structures à 30 jours</h3>
    {!data.saturationByAssociation.length && <p>Aucune structure avec assez de créneaux.</p>}
    <ul>{data.saturationByAssociation.map((item) => <li key={item.association}>{item.association} · {item.rate} % ({item.reserved}/{item.slots})</li>)}</ul>
    <details className="space-y-2"><summary className="font-semibold">Quartiers proposés aux usagers</summary>
      <ActionForm label="Enregistrer le quartier" reset onSubmit={(form) => save('save_district', {
        name: String(form.get('name')).trim(), city: String(form.get('city') ?? '').trim(), qpv: form.has('qpv'),
      })}>
        <Value label="Nom du quartier" name="name" /><Value label="Commune" name="city" required={false} />
        <label className="flex gap-2"><input type="checkbox" name="qpv" /> Quartier prioritaire de la ville (QPV)</label>
      </ActionForm>
      <ul>{data.districts.map((item) => <li key={item.name} className="flex flex-wrap items-center gap-2">
        <span>{item.name}{item.city && `, ${item.city}`}{item.qpv && ' (QPV)'}</span>
        <ActionForm label="Retirer" onSubmit={() => save('remove_district', { name: item.name })} />
      </li>)}</ul>
    </details>
  </section>;
}

const loadAdmin = () => operation<AdminDashboard>('admin', 'dashboard');

const profileFields = [
  ['name','Nom'],['shortName','Nom court'],['address','Adresse'],['city','Code postal et commune'],
  ['quartier','Quartier'],['taoStop','Arrêt TAO'],['taoLine','Ligne TAO'],['phone','Téléphone public'],
  ['hours','Horaires'],['publicAccueilli','Public accueilli'],['falcSummary','Résumé en langage simple'],
] as const;

function list(data: FormData, name: string) {
  return String(data.get(name) ?? '').split('\n').map((value) => value.trim()).filter(Boolean);
}

function Coordinates({ lat, lng }: { lat?: number; lng?: number }) {
  return <div className="grid sm:grid-cols-2 gap-3">
    <label>Latitude<input className={field} type="number" name="lat" step="any" min="-90" max="90" defaultValue={lat} /></label>
    <label>Longitude<input className={field} type="number" name="lng" step="any" min="-180" max="180" defaultValue={lng} /></label>
  </div>;
}

function coordinates(form: FormData) {
  return { lat: form.get('lat') ? Number(form.get('lat')) : null, lng: form.get('lng') ? Number(form.get('lng')) : null };
}

function EditAssociation({ draft, save }: { draft?: Draft; save: (values: Record<string, unknown>) => Promise<void> }) {
  const profile = draft?.profile;
  return <ActionForm label="Enregistrer la fiche" onSubmit={async (form) => {
    const values = Object.fromEntries(profileFields.map(([name]) => [name, String(form.get(name) ?? '').trim()]));
    const location = coordinates(form);
    if (form.has('published') && (location.lat === null || location.lng === null || !values.address || !values.city)) {
      throw new Error('Renseignez l’adresse, la commune et les coordonnées pour publier la fiche.');
    }
    let procedures: unknown;
    try {
      procedures = JSON.parse(String(form.get('procedures') || '[]'));
    } catch {
      throw new Error('Le format JSON des démarches est invalide.');
    }
    await save({ id: draft?.id, published: form.has('published'), profile: {
      ...values, ...location, shortName: values.shortName || values.name, category: form.get('category'),
      secondaryCategories: form.getAll('secondary'), isQpv: form.has('qpv'), mission: form.get('mission'),
      languagesSpoken: list(form, 'languages'), documentsRequired: { firstVisit: list(form, 'first'), followUp: list(form, 'follow') },
      procedures,
    } });
  }}>
    <div className="grid sm:grid-cols-2 gap-3">{profileFields.map(([name, label]) =>
      <Value key={name} name={name} label={label} initial={profile?.[name]} required={name === 'name'} />)}</div>
    <Coordinates lat={profile?.lat} lng={profile?.lng} />
    <label className="block">Thème principal<select name="category" className={field} defaultValue={profile?.category}>
      {Object.entries(themes).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select></label>
    <fieldset className="flex flex-wrap gap-3"><legend>Compétences complémentaires</legend>
      {Object.entries(themes).map(([id, name]) => <label key={id} className="flex gap-1">
        <input type="checkbox" name="secondary" value={id} defaultChecked={profile?.secondaryCategories?.includes(id as CategoryId)} />{name}
      </label>)}
    </fieldset>
    <TextBox label="Missions" name="mission" initial={profile?.mission} />
    <label className="block">Langues parlées, une par ligne<textarea name="languages" className={field} defaultValue={profile?.languagesSpoken?.join('\n')} /></label>
    <label className="block">Documents du premier rendez-vous, un par ligne<textarea name="first" className={field} defaultValue={profile?.documentsRequired?.firstVisit.join('\n')} /></label>
    <label className="block">Documents de suivi, un par ligne<textarea name="follow" className={field} defaultValue={profile?.documentsRequired?.followUp.join('\n')} /></label>
    <details className="space-y-2"><summary>Démarches et checklists par langue</summary>
      <label className="block">Catalogue JSON
        <textarea name="procedures" className={field} rows={6} defaultValue={JSON.stringify(profile?.procedures ?? [], null, 2)} />
      </label>
      <p>Chaque démarche contient un code, un titre et les listes de documents par langue. Le guide Supabase donne un exemple.</p>
    </details>
    <label className="flex gap-2"><input type="checkbox" name="qpv" defaultChecked={profile?.isQpv} /> Quartier prioritaire</label>
    <label className="flex gap-2"><input type="checkbox" name="published" defaultChecked={draft?.published} /> Publier dans l’annuaire</label>
  </ActionForm>;
}

function HelpCenterForm({ item, save }: { item?: DigitalHelpCenter; save: (values: Record<string, unknown>) => Promise<void> }) {
  const fields = [['name','Nom'],['type','Type de lieu'],['address','Adresse'],['quartier','Quartier'],
    ['taoStop','Arrêt TAO'],['hours','Horaires'],['phone','Téléphone']] as const;
  return <ActionForm label="Enregistrer le lieu" reset={!item} onSubmit={(form) => save({ id: item?.id, profile: {
    ...Object.fromEntries(fields.map(([name]) => [name,String(form.get(name) ?? '').trim()])), ...coordinates(form),
  } })}>
    <div className="grid sm:grid-cols-2 gap-3">{fields.map(([name, label]) =>
      <Value key={name} name={name} label={label} initial={item?.[name]} required={name === 'name' || name === 'address'} />)}</div>
    <Coordinates lat={item?.lat} lng={item?.lng} />
  </ActionForm>;
}

function Statistics({ stats }: { stats: Stats }) {
  const metrics = [['Demandes', stats.total], ['Rendez-vous effectués', stats.completed],
    ['Délai moyen en jours', stats.waitDays], ['Saturation à 30 jours (%)', stats.saturation]] as const;
  const series = stats.themes.map((item) => ({ ...item, name: themes[item.theme] }));
  return <section className={panel}>
    <h2 className="text-xl font-bold">Indicateurs territoriaux</h2>
    <p>Les groupes de moins de cinq demandes ne sont pas affichés.</p>
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">{metrics.map(([label, value]) =>
      <div className="bg-surface p-3 rounded-btn" key={label}><dt>{label}</dt><dd className="text-xl font-bold">{value ?? '—'}</dd></div>)}</dl>
    {!!series.length && <div className="h-64" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={series}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} />
        <Tooltip /><Bar dataKey="volume" name="Demandes" fill="#176B57" />
      </BarChart></ResponsiveContainer>
    </div>}
    <h3 className="font-bold">Par thème</h3>
    <ul>{series.map((item) => <li key={item.theme}>{item.name} · {item.volume}</li>)}</ul>
    <h3 className="font-bold">Par quartier</h3>
    {!stats.districts.length && <p>Aucun groupe affichable.</p>}
    <ul>{stats.districts.map((item) => <li key={`${item.district}-${item.qpv}`}>{item.district}{item.qpv && ' (QPV)'} · {item.volume}</li>)}</ul>
  </section>;
}

function AdminView() {
  const { reloadDirectory } = usePortal();
  const { data, error, refresh } = useDashboard(loadAdmin);
  const [notice, setNotice] = useState('');
  async function update(action: string, values: Record<string, unknown>) {
    setNotice('');
    await operation('admin', action, values);
    setNotice('Modification enregistrée.');
    await refresh();
    void reloadDirectory();
  }
  async function invite(association: string, email: string) {
    setNotice('');
    try {
      const result = await inviteStaff(association, email);
      setNotice(result.message);
    } finally {
      await refresh();
    }
  }
  async function approve(id: string) {
    setNotice('');
    const result = await operation<{ association: string; email: string; name: string }>('admin', 'review', { id, status: 'approved' });
    await refresh();
    void reloadDirectory();
    try {
      const sent = await inviteStaff(result.association, result.email);
      setNotice(`Fiche brouillon créée pour ${result.name}. ${sent.message} Complétez l’adresse et les coordonnées avant de publier.`);
    } catch (cause) {
      setNotice(`Fiche brouillon créée pour ${result.name}, mais l’invitation n’est pas partie : ${cause instanceof Error ? cause.message : ''}`);
      await refresh();
    }
  }
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Chargement de l’observatoire…</p>;
  return <>
    <p role="status" className="font-semibold">{notice}</p>
    <Statistics stats={data.stats} />
    <DetailedStatistics />
    <section className={panel}><h2 className="text-xl font-bold">Demandes de référencement</h2>
      {!data.applications.length && <p>Aucune demande en attente.</p>}
      {data.applications.map((item) => <details key={item.id} className="border p-3 rounded-btn space-y-2">
        <summary className="font-bold">{item.name} · {item.organization_number}</summary>
        <p>{item.address} · {item.contact_email}</p><p>{item.mission}</p>
        <p>L’invitation sera envoyée à {item.contact_email} pour créer le compte de l’association.</p>
        <ActionForm label="Valider et inviter l’association" onSubmit={() => approve(item.id)} />
        <ActionForm label="Rejeter la demande" onSubmit={() => update('review', { id: item.id, status: 'rejected' })} />
      </details>)}
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Fiches associations</h2>
      <details className="space-y-3"><summary className="font-bold">Ajouter une association</summary>
        <EditAssociation save={(values) => update('save_association', values)} />
      </details>
      {data.associations.map((item) => <details key={item.id} className="border p-3 rounded-btn space-y-3">
        <summary>{item.profile.name} · {item.published ? 'Publiée' : 'Brouillon'}</summary>
        <EditAssociation draft={item} save={(values) => update('save_association', values)} />
        <TeamAccess association={item.id} data={data} update={update} invite={invite} />
      </details>)}
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Lieux d’aide numérique</h2>
      <details className="space-y-2"><summary>Ajouter un lieu</summary><HelpCenterForm save={(values) => update('save_help_center', values)} /></details>
      {data.helpCenters.map((item) => <details className="space-y-2" key={item.id}><summary>{item.name}</summary>
        <HelpCenterForm item={item} save={(values) => update('save_help_center', values)} />
        <ActionForm label="Retirer le lieu" onSubmit={() => update('remove_help_center', { id: item.id })} />
      </details>)}
    </section>
    <section className={panel}><h2 className="text-xl font-bold">Documents communs</h2>
      <ActionForm label="Publier le lien" reset onSubmit={(form) => update('resource', { title: form.get('title'), url: form.get('url') })}>
        <Value label="Titre" name="title" /><Value label="Adresse HTTPS du document" name="url" type="url" />
      </ActionForm>
      {data.resources.map((item) => <div key={item.id}><p>{item.title}</p>
        <ActionForm label="Retirer le document" onSubmit={() => update('remove_resource', { id: item.id })} />
      </div>)}
    </section>
  </>;
}

export function AdminObservatoryPage() {
  return <PrivateArea title="Observatoire et administration" staff><AdminView /></PrivateArea>;
}
