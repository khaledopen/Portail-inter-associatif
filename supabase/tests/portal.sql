begin;

insert into auth.users(id,phone,phone_confirmed_at) values
  ('f0000000-0000-4000-8000-000000000001','33600000001',now()),
  ('f0000000-0000-4000-8000-000000000002','33600000002',now()),
  ('f0000000-0000-4000-8000-000000000003','33600000003',now()),
  ('f0000000-0000-4000-8000-000000000004','33600000004',now());
insert into portal_private.associations(id,profile,published) values
  ('f1000000-0000-4000-8000-000000000001','{"name":"Test A","category":"droits","lat":47,"lng":1,
    "procedures":[{"code":"formulaire","title":"Formulaire","documents":{"fr":["Justificatif"],"en":["Supporting document"]}}]}',true),
  ('f1000000-0000-4000-8000-000000000002','{"name":"Test B","category":"droits","lat":47,"lng":1}',true),
  ('f1000000-0000-4000-8000-000000000003','{"name":"Test privé","category":"droits"}',false);
insert into portal_private.slots(id,association_id,starts_at,ends_at,motif) values
  ('f2000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001',now()+interval '2 days',now()+interval '2 days 30 minutes','both'),
  ('f2000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000002',now()+interval '2 days',now()+interval '2 days 30 minutes','followUp');
insert into portal_private.staff(user_id,association_id) values
  ('f0000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000001'),
  ('f0000000-0000-4000-8000-000000000004','f1000000-0000-4000-8000-000000000002');
insert into portal_private.pilots(user_id) values ('f0000000-0000-4000-8000-000000000004');

set local role anon;
do $$
begin
  if public.portal_directory()::text like '%Test privé%' then raise exception 'Private profile leaked'; end if;
  begin
    perform public.portal_user('dashboard');
    raise exception 'Anonymous dashboard access';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.portal_claim_sms();
    raise exception 'Anonymous SMS visibility';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000001',true);
select set_config('portal.test.booking',public.portal_user('book',
  '{"slot":"f2000000-0000-4000-8000-000000000001","name":"Test","motif":"firstVisit","procedure":"formulaire","language":"en"}') #>> '{}',true);
do $$
begin
  if public.portal_user('dashboard')->'bookings'->0->'documents' is distinct from '["Supporting document"]'::jsonb
  then raise exception 'Wrong checklist language'; end if;
end;
$$;
select public.portal_user('open_case','{"association":"f1000000-0000-4000-8000-000000000001","subject":"Demande","body":"Texte","complex":true}');
select public.portal_user('grant','{"source":"f1000000-0000-4000-8000-000000000001","target":"f1000000-0000-4000-8000-000000000002","purpose":"passport"}');
select public.portal_user('grant','{"source":"f1000000-0000-4000-8000-000000000001","target":"f1000000-0000-4000-8000-000000000002","purpose":"orientation"}');

select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000002',true);
do $$
begin
  if public.portal_user('dashboard')->'bookings' <> '[]'::jsonb then raise exception 'Cross-user booking visibility'; end if;
  if public.portal_user('cancel',jsonb_build_object('id',current_setting('portal.test.booking'))) <> 'false'::jsonb
    then raise exception 'Cross-user cancellation'; end if;
  begin
    perform public.portal_user('book','{"slot":"f2000000-0000-4000-8000-000000000001","name":"Autre","motif":"firstVisit"}');
    raise exception 'Double booking';
  exception when unique_violation then null;
  end;
  begin
    perform public.portal_admin('dashboard');
    raise exception 'Admin access for resident';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000003',true);
select public.portal_staff('write_passport',jsonb_build_object('association','f1000000-0000-4000-8000-000000000001',
  'id',current_setting('portal.test.booking'),'summary',array['un','deux','trois','quatre','cinq']));
select public.portal_staff('orient',jsonb_build_object('association','f1000000-0000-4000-8000-000000000001',
  'id',current_setting('portal.test.booking'),'slot','f2000000-0000-4000-8000-000000000002',
  'name','Test','motif','followUp'));

select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000004',true);
select public.portal_admin('save_association','{"profile":{"name":"Brouillon","category":"droits",
  "procedures":[{"code":"papiers","title":"Démarche test","documents":{"fr":["Document"]}}]}}');
select public.portal_admin('save_help_center','{"profile":{"name":"Centre test","lat":47.9,"lng":1.9}}');
select set_config('portal.test.passport',public.portal_staff('dashboard',
  '{"association":"f1000000-0000-4000-8000-000000000002"}')->'passports'->0->>'id',true);
select public.portal_staff('read_passport',jsonb_build_object('association','f1000000-0000-4000-8000-000000000002',
  'id',current_setting('portal.test.passport')));
do $$
begin
  if public.portal_admin('dashboard')->'stats' is null then raise exception 'Admin stats missing'; end if;
  begin
    perform public.portal_staff('dashboard','{"association":"f1000000-0000-4000-8000-000000000001"}');
    raise exception 'Cross-association dashboard';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000001',true);
select public.portal_user('revoke','{"source":"f1000000-0000-4000-8000-000000000001","target":"f1000000-0000-4000-8000-000000000002","purpose":"passport"}');
select public.portal_user('cancel',jsonb_build_object('id',current_setting('portal.test.booking')));
select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000002',true);
select public.portal_user('book','{"slot":"f2000000-0000-4000-8000-000000000001","name":"Autre","motif":"firstVisit"}');
select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000004',true);
do $$
begin
  begin
    perform public.portal_staff('read_passport',jsonb_build_object('association','f1000000-0000-4000-8000-000000000002',
      'id',current_setting('portal.test.passport')));
    raise exception 'Revoked consent still allows access';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role service_role;
do $$
declare job jsonb;
begin
  select value into job from jsonb_array_elements(public.portal_claim_sms()) where value->>'association' in ('Test A','Test B');
  if job is null then raise exception 'SMS outbox is empty'; end if;
  perform public.portal_finish_sms((job->>'id')::uuid,(job->>'lease')::uuid,true);
end;
$$;
reset role;

rollback;
