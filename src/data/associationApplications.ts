import type { CategoryId } from './mockData';

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
        p_organization_number: application.rna,
        p_category: application.category,
        p_address: application.address,
        p_tao_stop: application.taoStop,
        p_phone: application.phone,
        p_contact_email: application.email,
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
        throw new Error('Vérifiez les champs du formulaire, notamment le numéro RNA ou SIRET et le téléphone.');
      }
    }
    throw new Error('La demande n’a pas pu être envoyée. Réessayez dans un instant.');
  }
}
