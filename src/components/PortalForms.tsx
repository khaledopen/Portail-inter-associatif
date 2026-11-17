import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { client, operation, welcomeUrl } from '../data/portal';
import { usePortal } from '../context/PortalContext';
import { useAccessibility } from '../context/AccessibilityContext';
import type { Association, TimeSlot } from '../data/types';

export const panel = 'comfort-card rounded-card border border-border bg-white p-5 space-y-3';
export const button = 'rounded-btn bg-primary text-white font-bold px-4 py-2 min-h-[44px] disabled:opacity-60';
export const field = 'block w-full rounded-btn border border-border bg-surface px-3 py-2 min-h-[44px]';

export function ActionForm({ children, label, onSubmit, reset = false }: {
  children?: ReactNode;
  label: string;
  onSubmit: (data: FormData) => Promise<unknown>;
  reset?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    setPending(true);
    setError('');
    try {
      await onSubmit(new FormData(form));
      if (reset) form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’opération a échoué.');
    } finally {
      setPending(false);
    }
  }
  return <form className="space-y-3" onSubmit={submit}>
    <fieldset className="space-y-3" disabled={pending}>
      {children}
      <button type="submit" className={button}>{pending ? 'Veuillez patienter…' : label}</button>
    </fieldset>
    {error && <p role="alert" className="font-semibold text-red-700">{error}</p>}
  </form>;
}

export function Value({ label, name, type = 'text', initial, required = true }: {
  label: string; name: string; type?: string; initial?: string; required?: boolean;
}) {
  return <label className="block font-semibold">{label}
    <input className={field} name={name} type={type} required={required} defaultValue={initial} />
  </label>;
}

export function TextBox({ label, name, initial, max = 5000 }: { label: string; name: string; initial?: string; max?: number }) {
  return <label className="block font-semibold">{label}
    <textarea className={field} name={name} defaultValue={initial} maxLength={max} rows={3} required />
  </label>;
}

export function AssociationSelect({ name = 'association', label = 'Association', omit }: { name?: string; label?: string; omit?: string }) {
  const { associations } = usePortal();
  return <label className="block font-semibold">{label}
    <select name={name} className={field} defaultValue="" required>
      <option value="" disabled>Choisir une association</option>
      {associations.filter((a) => a.id !== omit).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
  </label>;
}

export function normalizePhone(value: string) {
  const clean = value.replace(/[\s.()-]/g, '');
  const normalized = /^0[1-9]\d{8}$/.test(clean) ? '+33' + clean.slice(1)
    : clean.startsWith('00') ? '+' + clean.slice(2) : clean;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error('Saisissez un numéro de téléphone valide.');
  return normalized;
}

export function PhoneLogin() {
  const [phone, setPhone] = useState('');
  return phone ? <div className="space-y-3">
    <p>Nous avons envoyé un code au {phone}.</p>
    <ActionForm label="Vérifier le code" onSubmit={async (data) => {
      const { error } = await client().auth.verifyOtp({ phone, token: String(data.get('code')).trim(), type: 'sms' });
      if (error) throw new Error('Le code est incorrect ou expiré.');
    }}>
      <label className="block font-semibold">Code reçu par SMS
        <input name="code" className={field} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{4,8}" required />
      </label>
    </ActionForm>
    <button type="button" className="underline min-h-[44px]" onClick={() => setPhone('')}>Modifier le numéro ou renvoyer le code</button>
  </div> : <ActionForm label="Recevoir un code par SMS" onSubmit={async (data) => {
    const value = normalizePhone(String(data.get('phone')));
    const { error } = await client().auth.signInWithOtp({ phone: value });
    if (error) throw new Error('Le code n’a pas pu être envoyé. Vérifiez votre numéro ou réessayez plus tard.');
    setPhone(value);
  }}><Value label="Votre numéro de mobile" type="tel" name="phone" /></ActionForm>;
}

function StaffHelp() {
  const [sent, setSent] = useState('');
  return <div className="border-t pt-4 space-y-3">
    <details className="space-y-2"><summary className="font-semibold cursor-pointer min-h-[44px]">Mot de passe oublié ou invitation expirée ?</summary>
      {sent ? <p role="status">Si un compte existe pour {sent}, un e-mail vient d’être envoyé avec un lien pour choisir un mot de passe.</p>
        : <ActionForm label="Recevoir un lien par e-mail" onSubmit={async (data) => {
          const email = String(data.get('email')).trim();
          const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: welcomeUrl() });
          if (error) throw new Error('L’e-mail n’a pas pu être envoyé. Réessayez plus tard.');
          setSent(email);
        }}><Value label="Adresse e-mail du compte" name="email" type="email" /></ActionForm>}
    </details>
    <p>Votre association n’est pas encore inscrite ?{' '}
      <Link className="underline font-semibold" to="/inscription-association">Demander le référencement</Link></p>
  </div>;
}

export function PrivateArea({ title, staff = false, children }: { title: string; staff?: boolean; children: ReactNode }) {
  const { session } = usePortal();
  return <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-5">
    <h1 className="text-3xl font-display font-extrabold text-secondary">{title}</h1>
    {session === undefined ? <p role="status">Vérification de la connexion…</p> : session ?
      <><button className="underline min-h-[44px]" onClick={() => void client().auth.signOut()}>Se déconnecter</button>
        <div key={session.user.id} className="space-y-5">{children}</div></>
      : <div className={panel}>{staff ? <ActionForm label="Se connecter" onSubmit={async (data) => {
        const { error } = await client().auth.signInWithPassword({
          email: String(data.get('email')).trim(), password: String(data.get('password')),
        });
        if (error) throw new Error('Identifiants invalides ou compte indisponible.');
      }}><Value label="Adresse e-mail" name="email" type="email" />
        <Value label="Mot de passe" name="password" type="password" /></ActionForm> : <PhoneLogin />}
        {staff && <StaffHelp />}</div>}
  </div>;
}

export function DistrictField({ initial, name = 'district' }: { initial?: string; name?: string }) {
  const { districts } = usePortal();
  return <label className="block font-semibold">Votre quartier ou commune (facultatif, pour les statistiques anonymes)
    <input className={field} name={name} list="portal-districts" defaultValue={initial} maxLength={80} />
    <datalist id="portal-districts">{districts.map((item) => <option key={item.name} value={item.name}>{item.city ?? ''}</option>)}</datalist>
  </label>;
}

export function BookingForm({ association, slot, motif, district }: { association: Association; slot: TimeSlot; motif: string; district?: string }) {
  const { session, reloadDirectory } = usePortal();
  const [helper, setHelper] = useState(false);
  const { language } = useAccessibility();
  const [confirmed, setConfirmed] = useState(false);
  const [procedureCode, setProcedureCode] = useState('');
  if (confirmed) return <p role="status">Rendez-vous confirmé chez {association.name}, {slot.dayLabel} à {slot.time}.</p>;
  if (session === undefined) return <p role="status">Vérification de la connexion…</p>;
  if (!session?.user.phone_confirmed_at) return <div className="space-y-3">
    <p>Vérifiez le mobile qui recevra la confirmation. Si vous aidez quelqu’un, utilisez son téléphone avec son accord.</p>
    {session && <button type="button" className="underline" onClick={() => void client().auth.signOut()}>Changer de compte</button>}
    {!session && <PhoneLogin />}
  </div>;
  const procedure = association.procedures?.find((item) => item.code === procedureCode);
  const documents = procedure?.documents[language] ?? procedure?.documents.fr
    ?? (motif === 'followUp' ? association.documentsRequired.followUp : association.documentsRequired.firstVisit);
  return <ActionForm label="Confirmer le rendez-vous" onSubmit={async (data) => {
    await operation('user', 'book', {
      slot: slot.id, motif, name: data.get('name'), helper, procedure: procedureCode, language,
      contactPhone: helper ? normalizePhone(String(data.get('contactPhone') ?? '')) : undefined,
      district: String(data.get('district') ?? '').trim() || undefined,
    });
    setConfirmed(true);
    void reloadDirectory();
  }}>
    {!!association.procedures?.length && <label className="block font-semibold">Démarche
      <select className={field} value={procedureCode} onChange={(event) => setProcedureCode(event.target.value)}>
        <option value="">Autre démarche</option>
        {association.procedures.map((item) => <option key={item.code} value={item.code}>{item.title}</option>)}
      </select>
    </label>}
    {procedure?.description && <p>{procedure.description}</p>}
    {!!documents.length && <div><p className="font-bold">Documents à apporter</p>
      <ul className="list-disc pl-5">{documents.map((item, index) => <li key={index}>{item}</li>)}</ul>
    </div>}
    <Value label="Prénom de la personne qui viendra" name="name" />
    <label className="flex gap-2 items-center min-h-[44px]">
      <input type="checkbox" checked={helper} onChange={(event) => setHelper(event.target.checked)} /> Je réserve pour quelqu’un d’autre
    </label>
    {helper && <Value label="Mobile de la personne aidée (reçoit la confirmation et le rappel)" name="contactPhone" type="tel" />}
    <DistrictField initial={district} />
    <button type="button" className="underline min-h-[44px]" onClick={() => void reloadDirectory()}>Actualiser les disponibilités</button>
  </ActionForm>;
}
