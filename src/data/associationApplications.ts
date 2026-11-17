import type { CategoryId } from './types';

interface AssociationApplication {
  name: string;
  rna: string;
  category: CategoryId;
  address: string;
  taoStop: string;
  phone: string;
  email: string;
  hours: string;
  mission: string;
  rgpdAccepted: boolean;
}

export async function submitAssociationApplication(application: AssociationApplication) {
  const organizationNumber = application.rna.replace(/\s/g, '').toUpperCase();
  const phone = application.phone.replace(/[\s().-]/g, '');
  const email = application.email.trim();

  if (!/^(W[0-9]{9}|[0-9]{14})$/.test(organizationNumber)) {
    throw new Error('Saisissez un RNA (W suivi de 9 chiffres) ou un SIRET (14 chiffres).');
  }
  if (!/^(?:\+|00)?[0-9]{9,15}$/.test(phone)) {
    throw new Error('Vérifiez le téléphone d’accueil. Exemple : 02 38 00 00 00 ou +33 2 38 00 00 00.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Vérifiez l’adresse e-mail du référent. Exemple : contact@association.fr.');
  }
  const requiredFields = [
    [application.name, 'le nom de l’association'],
    [application.address, 'l’adresse'],
    [application.taoStop, 'l’arrêt de transport'],
    [application.hours, 'les horaires'],
    [application.mission, 'les missions et le public accueilli'],
  ] as const;
  for (const [value, label] of requiredFields) {
    if (!value.trim()) throw new Error(`Renseignez ${label}.`);
  }

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key?.startsWith('sb_publishable_')) {
    throw new Error('Le formulaire est indisponible pour le moment. Réessayez plus tard.');
  }

  let response: Response;
  try {
    response = await fetch(new URL('/rest/v1/rpc/submit_association_application', url), {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        p_name: application.name,
        p_organization_number: organizationNumber,
        p_category: application.category,
        p_address: application.address,
        p_tao_stop: application.taoStop,
        p_phone: phone,
        p_contact_email: email,
        p_opening_hours: application.hours,
        p_mission: application.mission,
        p_charter_accepted: application.rgpdAccepted,
      }),
    });
  } catch {
    throw new Error('Impossible de joindre le service. Réessayez dans un instant.');
  }

  if (!response.ok) {
    if (response.status === 429) throw new Error('Trop de demandes ont été envoyées depuis cette connexion. Réessayez dans une heure.');
    if (response.status === 400) {
      const details = await response.json().catch(() => null);
      if (['22023', '23502', '23514'].includes(details?.code)) {
        throw new Error('Les informations ont été refusées. Relisez les champs et vérifiez que la charte est acceptée avant de réessayer.');
      }
    }
    throw new Error('La demande n’a pas pu être envoyée. Réessayez dans un instant.');
  }
}
