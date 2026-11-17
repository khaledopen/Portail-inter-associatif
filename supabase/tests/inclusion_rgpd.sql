-- Vérifie la migration 20261117040000_inclusion_rgpd. Les écritures sont annulées en fin de script.
begin;

insert into auth.users(id,phone,phone_confirmed_at) values
  ('e0000000-0000-4000-8000-000000000001','33600000101',now()),
  ('e0000000-0000-4000-8000-000000000002','33600000102',now()),
  ('e0000000-0000-4000-8000-000000000003','33600000103',now()),
  ('e0000000-0000-4000-8000-000000000004','33600000104',now());
insert into portal_private.associations(id,profile,published) values
  ('e1000000-0000-4000-8000-000000000001','{"name":"Inclusion A","category":"sante","lat":47,"lng":1,
    "procedures":[{"code":"mdph","title":"Dossier MDPH","documents":{"fr":["Certificat médical"]}}]}',true),
  ('e1000000-0000-4000-8000-000000000002','{"name":"Inclusion B","category":"travail","lat":47,"lng":1}',true);
insert into portal_private.slots(id,association_id,starts_at,ends_at,motif,partner_only) values
  ('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001',now()+interval '3 days',now()+interval '3 days 30 minutes','both',false),
  ('e2000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000002',now()+interval '3 days',now()+interval '3 days 30 minutes','both',true),
  ('e2000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000002',now()+interval '4 days',now()+interval '4 days 30 minutes','both',true),
  ('e2000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000001',now()+interval '5 days',now()+interval '5 days 30 minutes','both',false);
insert into portal_private.staff(user_id,association_id) values
  ('e0000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000002');
insert into portal_private.pilots(user_id) values ('e0000000-0000-4000-8000-000000000004');

-- Annuaire public : les créneaux de la bourse restent cachés.
set local role anon;
do $$
begin
  if public.portal_directory()::text like '%e2000000-0000-4000-8000-000000000002%' then
    raise exception 'Partner-only slot exposed';
  end if;
  if public.portal_directory()->'districts' is null then raise exception 'Districts missing'; end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000001',true);
do $$
begin
  -- Un usager ne peut pas réserver un créneau réservé aux partenaires.
  begin
    perform public.portal_user('book','{"slot":"e2000000-0000-4000-8000-000000000002","name":"X","motif":"firstVisit"}');
    raise exception 'Partner-only slot booked by resident';
  exception when invalid_parameter_value then null;
  end;
  -- Hors mode aidant, le numéro saisi est ignoré : le SMS part vers le numéro vérifié.
  perform set_config('portal.test.own', public.portal_user('book','{"slot":"e2000000-0000-4000-8000-000000000004",
    "name":"X","motif":"firstVisit","contactPhone":"+33611111111"}') #>> '{}', true);
  -- Mode aidant : le SMS part vers le numéro de la personne aidée, le quartier est conservé.
  perform set_config('portal.test.helper', public.portal_user('book','{"slot":"e2000000-0000-4000-8000-000000000001",
    "name":"Amina","motif":"firstVisit","helper":true,"contactPhone":"+33611111111","district":"La Source",
    "procedure":"mdph"}') #>> '{}', true);

  perform public.portal_user('visit','{"association":"e1000000-0000-4000-8000-000000000002"}');
  if jsonb_array_length(public.portal_user('dashboard')->'visited') <> 1 then raise exception 'Visit not recorded'; end if;
  perform public.portal_user('grant','{"source":"e1000000-0000-4000-8000-000000000001","target":"e1000000-0000-4000-8000-000000000002","purpose":"passport"}');

  begin
    perform public.portal_observatory();
    raise exception 'Observatory open to resident';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- Professionnel A : bourse aux créneaux, guichet, passeport, alerte typée, permanence récurrente.
select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000003',true);
do $$
declare d jsonb; walk uuid;
begin
  d := public.portal_staff('dashboard','{"association":"e1000000-0000-4000-8000-000000000001"}');
  if not exists (select 1 from jsonb_array_elements(d->'exchange') x where x->>'id'='e2000000-0000-4000-8000-000000000002'
    and (x->>'partnerOnly')::boolean) then raise exception 'Exchange missing partner slot'; end if;

  begin
    perform public.portal_staff('book_walk_in','{"association":"e1000000-0000-4000-8000-000000000001",
      "slot":"e2000000-0000-4000-8000-000000000002","name":"Jean","motif":"firstVisit","phone":"+33622222222"}');
    raise exception 'Walk-in booking without consent';
  exception when invalid_parameter_value then null;
  end;
  walk := (public.portal_staff('book_walk_in','{"association":"e1000000-0000-4000-8000-000000000001",
    "slot":"e2000000-0000-4000-8000-000000000002","name":"Jean","motif":"firstVisit","phone":"+33622222222",
    "consent":true,"district":"Argonne"}') #>> '{}')::uuid;
  perform set_config('portal.test.walk', walk::text, true);

  perform public.portal_staff('write_passport',jsonb_build_object('association','e1000000-0000-4000-8000-000000000001',
    'id',current_setting('portal.test.helper'),'summary',array['MDPH','Dossier initié','AAH','Relais emploi','Aucun']));
  perform public.portal_staff('alert','{"association":"e1000000-0000-4000-8000-000000000001","body":"Famille sans hébergement ce soir","kind":"hebergement"}');
  begin
    perform public.portal_staff('alert','{"association":"e1000000-0000-4000-8000-000000000001","body":"x","kind":"inconnu"}');
    raise exception 'Unknown alert kind accepted';
  exception when check_violation then null;
  end;
  if public.portal_staff('create_slot',jsonb_build_object('association','e1000000-0000-4000-8000-000000000001',
    'startsAt',now()+interval '10 days','endsAt',now()+interval '10 days 1 hour','motif','both','repeatWeeks',4,'partnerOnly',true)) <> '4'::jsonb
  then raise exception 'Recurring slots not created'; end if;
end;
$$;

reset role;
do $$
declare walk uuid := current_setting('portal.test.walk')::uuid;
begin
  if (select phone from portal_private.bookings where id=current_setting('portal.test.own')::uuid) <> '+33600000101'
  then raise exception 'Contact phone used without helper mode'; end if;
  if not exists (select 1 from portal_private.bookings where id=current_setting('portal.test.helper')::uuid
    and phone='+33611111111' and third_party and district='La Source' and documents = array['Certificat médical'])
  then raise exception 'Helper booking not stored correctly'; end if;
  if not exists (select 1 from portal_private.bookings where id=walk and user_id is null
    and booked_by='e0000000-0000-4000-8000-000000000003' and oriented_by='e1000000-0000-4000-8000-000000000001')
  then raise exception 'Walk-in booking not attributed'; end if;
  if not exists (select 1 from portal_private.audit where subject_id=walk and action='walk_in_booking')
  then raise exception 'Walk-in booking not audited'; end if;
  if not exists (select 1 from portal_private.sms_jobs where booking_id=walk and kind='confirmation')
  then raise exception 'Walk-in SMS missing'; end if;
end;
$$;
set local role authenticated;

-- Professionnel B : lecture du passeport avec historique du parcours.
select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000004',true);
do $$
declare d jsonb; p jsonb;
begin
  d := public.portal_staff('dashboard','{"association":"e1000000-0000-4000-8000-000000000002"}');
  if d->'alerts'->0->>'kind' <> 'hebergement' then raise exception 'Alert kind missing'; end if;
  if not exists (select 1 from jsonb_array_elements(d->'bookings') x where (x->>'walkIn')::boolean)
  then raise exception 'Walk-in not flagged for receiving association'; end if;
  p := public.portal_staff('read_passport',jsonb_build_object('association','e1000000-0000-4000-8000-000000000002',
    'id',d->'passports'->0->>'id'));
  if p->'history'->0->>'procedure' <> 'Dossier MDPH' then raise exception 'Passport history missing: %', p; end if;
end;
$$;

-- Usager : journal d'accès, export, effacement.
select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000001',true);
do $$
declare d jsonb; e jsonb;
begin
  d := public.portal_user('dashboard');
  if not exists (select 1 from jsonb_array_elements(d->'accessLog') x where x->>'action'='read_passport' and x->>'association'='Inclusion B')
  then raise exception 'Access log missing'; end if;
  if jsonb_array_length(d->'passports') <> 1 then raise exception 'Own passport not visible'; end if;
  e := public.portal_user('export');
  if jsonb_array_length(e->'bookings') < 1 or e->'bookings'->0 ? 'cancels_with' then raise exception 'Export incomplete or leaking token'; end if;
  begin
    perform public.portal_user('delete_account','{}');
    raise exception 'Deletion without confirmation';
  exception when invalid_parameter_value then null;
  end;
  perform public.portal_user('delete_account','{"confirm":"SUPPRIMER"}');
end;
$$;
reset role;

do $$
begin
  if exists (select 1 from auth.users where id='e0000000-0000-4000-8000-000000000001') then raise exception 'Account kept'; end if;
  if exists (select 1 from portal_private.bookings where id=current_setting('portal.test.helper')::uuid
    and (status<>'cancelled' or phone is not null or user_id is not null)) then raise exception 'Booking not anonymized'; end if;
  if exists (select 1 from portal_private.passports where user_id='e0000000-0000-4000-8000-000000000001')
  then raise exception 'Passport kept'; end if;
end;
$$;

-- Observatoire : seuil d'anonymisation et quartiers.
set local role authenticated;
select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000004',true);
select public.portal_observatory('save_district','{"name":"Argonne","city":"Orléans","qpv":true}');
do $$
declare o jsonb;
begin
  o := public.portal_observatory();
  if jsonb_array_length(o->'residentDistricts') <> 0 then raise exception 'Small group displayed'; end if;
  if jsonb_array_length(o->'districts') <> 1 then raise exception 'District not saved'; end if;
end;
$$;
reset role;

-- Limitation du formulaire public.
select set_config('request.headers','{"x-forwarded-for":"203.0.113.7"}',true);
set local role anon;
do $$
declare i int;
begin
  for i in 1..3 loop
    perform public.submit_association_application('W45' || lpad(i::text,7,'0'),'Asso '||i,'droits','Adresse','Arrêt',
      '0238000000','contact@example.org','Lundi','Mission',true);
  end loop;
  begin
    perform public.submit_association_application('W459999999','Asso 4','droits','Adresse','Arrêt',
      '0238000000','contact@example.org','Lundi','Mission',true);
    raise exception 'Throttle not applied';
  exception when sqlstate 'PT429' then null;
  end;
end;
$$;
reset role;

do $$
begin
  if (select count(*) from portal_private.association_applications where requester is not null) < 3
  then raise exception 'Requester hash missing'; end if;
  if portal_private.purge_expired() is null then raise exception 'Purge failed'; end if;
end;
$$;

rollback;
