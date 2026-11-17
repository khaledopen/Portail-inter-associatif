-- À exécuter uniquement dans le projet de test, après les migrations.
-- Crée une fiche fictive et ajoute un créneau libre à chaque nouvelle exécution.
begin;

insert into portal_private.associations (id, profile, published)
values (
  'f3000000-0000-4000-8000-000000000001',
  jsonb_build_object(
    'name', 'Association fictive — test de réservation',
    'shortName', 'Association de test',
    'category', 'droits',
    'quartier', 'Centre',
    'city', 'Orléans',
    'address', 'Adresse fictive de test',
    'lat', 47.9029,
    'lng', 1.9093,
    'mission', 'Fiche fictive utilisée pour tester le portail.',
    'documentsRequired', jsonb_build_object('firstVisit', jsonb_build_array('Document fictif'))
  ),
  true
)
on conflict (id) do nothing;

with time_slot as (
  select date_trunc('minute', greatest(
    now() + interval '2 days',
    coalesce(max(starts_at) + interval '31 minutes', now())
  )) as starts_at
  from portal_private.slots
  where association_id = 'f3000000-0000-4000-8000-000000000001'
)
insert into portal_private.slots (association_id, starts_at, ends_at, motif)
select 'f3000000-0000-4000-8000-000000000001', starts_at, starts_at + interval '30 minutes', 'both'
from time_slot
on conflict (association_id, starts_at) do nothing;

commit;
