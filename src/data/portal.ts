import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

// Lu avant la création du client, qui efface le fragment d'URL après avoir ouvert la session.
const authFragment = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.hash.slice(1));
export const authLink = {
  type: authFragment.get('type'),
  error: authFragment.get('error_description')?.replace(/\+/g, ' ') ?? null,
};

export const supabase = url && key?.startsWith('sb_publishable_') ? createClient(url, key) : null;

export function client() {
  if (!supabase) throw new Error('Le service est indisponible pour le moment.');
  return supabase;
}

export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await client().rpc(name, args);
  if (error) {
    if (error.code === '23505') throw new Error('Cet élément est déjà enregistré ou le créneau vient d’être pris.');
    if (['42501', '22023', 'PT429'].includes(error.code)) throw new Error(error.message);
    if (/^22|^23/.test(error.code)) throw new Error('Vérifiez les informations saisies.');
    throw new Error('L’opération a échoué. Réessayez dans un instant.');
  }
  return data as T;
}

export type Area = 'user' | 'staff' | 'admin';

export function operation<T = unknown>(area: Area, action: string, data: Record<string, unknown> = {}) {
  return rpc<T>(`portal_${area}`, { p_action: action, p_data: data });
}

export const dateLabel = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris',
});

export const statusLabel: Record<string, string> = {
  confirmed: 'Confirmé', cancelled: 'Annulé', completed: 'Effectué', absent: 'Absent',
  open: 'Ouvert', closed: 'Clos',
};

export async function inviteStaff(association: string, email: string) {
  const { data, error } = await client().functions.invoke('portal-invite', { body: { association, email } });
  if (error) {
    const context = (error as { context?: Response }).context;
    const details = context ? await context.json().catch(() => null) : null;
    throw new Error(details?.error ?? 'L’invitation n’a pas pu être envoyée.');
  }
  return data as { status: 'invited' | 'linked'; message: string };
}

export const welcomeUrl = () => new URL('/bienvenue', window.location.origin).toString();
