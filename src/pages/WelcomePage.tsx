import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../context/PortalContext';
import { ActionForm, field, panel } from '../components/PortalForms';
import { authLink, client } from '../data/portal';

const rules = [
  { test: (value: string) => value.length >= 12, label: '12 caractères minimum' },
  { test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value), label: 'une minuscule et une majuscule' },
  { test: (value: string) => /\d/.test(value), label: 'un chiffre' },
  { test: (value: string) => /[^A-Za-z0-9]/.test(value), label: 'un symbole' },
];

export function WelcomePage() {
  const { session } = usePortal();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  return <div className="max-w-xl mx-auto p-4 sm:p-8 space-y-5">
    <h1 className="text-3xl font-display font-extrabold text-secondary">Bienvenue sur le portail</h1>
    {authLink.error && !session && <p role="alert" className="font-semibold text-red-700">
      Ce lien n’est plus valable ({authLink.error}). Demandez une nouvelle invitation à l’équipe de coordination,
      ou utilisez « Mot de passe oublié » sur la page de connexion.
    </p>}
    {session === undefined && <p role="status">Vérification du lien…</p>}
    {session === null && !authLink.error && <div className={panel}>
      <p>Ouvrez cette page depuis le lien reçu par e-mail pour choisir votre mot de passe.</p>
      <Link className="underline font-semibold" to="/espace-pro">Aller à la connexion</Link>
    </div>}
    {session && (done ? <div className={panel} role="status">
      <p className="font-bold">Votre mot de passe est enregistré.</p>
      <p>Vous pouvez maintenant gérer votre association.</p>
      <div className="flex flex-wrap gap-3">
        <Link className="underline font-semibold" to="/espace-pro">Ouvrir l’espace associations</Link>
        <Link className="underline font-semibold" to="/observatoire">Ouvrir l’observatoire (pilotes)</Link>
      </div>
    </div> : <div className={panel}>
      <p>Compte : <strong>{session.user.email}</strong></p>
      <p>Choisissez le mot de passe que vous utiliserez pour vous connecter.</p>
      <ActionForm label="Enregistrer mon mot de passe" onSubmit={async (data) => {
        const value = String(data.get('password'));
        if (rules.some((rule) => !rule.test(value))) throw new Error('Le mot de passe ne respecte pas toutes les règles.');
        if (value !== data.get('confirm')) throw new Error('Les deux mots de passe sont différents.');
        const { error } = await client().auth.updateUser({ password: value });
        if (error) throw new Error(/pwned|leaked|weak/i.test(error.message)
          ? 'Ce mot de passe est trop faible ou déjà connu. Choisissez-en un autre.'
          : 'Le mot de passe n’a pas pu être enregistré. Réessayez.');
        setDone(true);
      }}>
        <label className="block font-semibold">Nouveau mot de passe
          <input className={field} name="password" type="password" autoComplete="new-password" required
            value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <ul className="text-sm space-y-1">{rules.map((rule) =>
          <li key={rule.label} className={rule.test(password) ? 'text-primary font-semibold' : 'text-ink-muted'}>
            {rule.test(password) ? '✓' : '•'} {rule.label}
          </li>)}</ul>
        <label className="block font-semibold">Confirmez le mot de passe
          <input className={field} name="confirm" type="password" autoComplete="new-password" required />
        </label>
      </ActionForm>
    </div>)}
  </div>;
}
