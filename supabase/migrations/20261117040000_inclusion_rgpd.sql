-- Écarts restants du cahier des charges et du volet « Interface inclusive » :
--   * mode aidant avec numéro de rappel distinct (volet 2) ;
--   * réservation au guichet pour un usager sans compte, accord oral attesté et journalisé (cahier, espace pro) ;
--   * bourse aux créneaux réservés aux partenaires et ouverture de permanences récurrentes ;
--   * fil d'alerte typé (hébergement, alimentaire…) ;
--   * historique de parcours joint au passeport de liaison ;
--   * historique des associations consultées, journal des accès, export et effacement (RGPD) ;
--   * quartier déclaré par l'usager et observatoire détaillé avec seuil d'anonymisation ;
--   * limitation des demandes publiques de référencement et purge automatique selon les durées de conservation.
begin;

-- Paramètres internes ---------------------------------------------------------

create table portal_private.settings (
  key text primary key,
  value text not null
);
insert into portal_private.settings(key, value) values
  ('requester_salt', gen_random_uuid()::text),
  ('retention_months_bookings', '24'),
  ('retention_months_cases', '24'),
  ('retention_months_audit', '12'),
  ('retention_months_staff_messages', '12'),
  ('retention_months_alerts', '6'),
  ('retention_months_visits', '6'),
  ('max_helper_bookings', '5'),
  ('max_walk_in_per_day', '40'),
  ('max_applications_per_requester_hour', '3'),
  ('max_applications_per_hour', '30');

create function portal_private.setting(p_key text) returns text
language sql stable set search_path = '' as $$
  select value from portal_private.settings where key = p_key
$$;

create table portal_private.districts (
  name text primary key check (length(btrim(name)) between 1 and 80),
  city text,
  qpv boolean not null default false
);

create table portal_private.visits (
  user_id uuid not null references auth.users on delete cascade,
  association_id uuid not null references portal_private.associations on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, association_id)
);

-- Colonnes ajoutées -------------------------------------------------------------

alter table portal_private.bookings
  alter column user_id drop not null,
  alter column phone drop not null,
  add column booked_by uuid references auth.users on delete set null,
  add column third_party boolean not null default false,
  add column district text check (district is null or length(btrim(district)) between 1 and 80);
create index booking_by_booker on portal_private.bookings(booked_by, created_at desc);

alter table portal_private.slots
  add column partner_only boolean not null default false;

alter table portal_private.alerts
  add column kind text not null default 'autre'
    check (kind in ('hebergement', 'alimentaire', 'sante', 'violence', 'autre'));

alter table portal_private.association_applications
  add column requester text;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'portal_private' loop
    execute format('alter table portal_private.%I enable row level security', t);
    execute format('revoke all on table portal_private.%I from public, anon, authenticated', t);
  end loop;
end;
$$;

-- Limitation du formulaire public de référencement ----------------------------

create function portal_private.throttle_applications() returns trigger
language plpgsql set search_path = '' as $$
declare
  headers jsonb;
  ip text;
begin
  begin
    headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    headers := null;
  end;
  ip := btrim(split_part(coalesce(headers->>'cf-connecting-ip', headers->>'x-forwarded-for', headers->>'x-real-ip', ''), ',', 1));
  if ip <> '' then
    new.requester := encode(sha256(convert_to(portal_private.setting('requester_salt') || ':' || ip, 'UTF8')), 'hex');
    if (select count(*) from portal_private.association_applications
        where requester = new.requester and charter_accepted_at > now() - interval '1 hour')
        >= portal_private.setting('max_applications_per_requester_hour')::int
    then raise exception 'Trop de demandes envoyées. Réessayez plus tard.' using errcode = 'PT429'; end if;
  end if;
  if (select count(*) from portal_private.association_applications where charter_accepted_at > now() - interval '1 hour')
      >= portal_private.setting('max_applications_per_hour')::int
  then raise exception 'Trop de demandes envoyées. Réessayez plus tard.' using errcode = 'PT429'; end if;
  return new;
end;
$$;

create trigger association_applications_throttle
  before insert on portal_private.association_applications
  for each row execute function portal_private.throttle_applications();

-- Réservation : aidant, guichet et bourse aux créneaux --------------------------

drop function portal_private.make_booking(uuid, uuid, text, text, boolean, uuid, text, text);

create function portal_private.make_booking(
  p_user uuid, p_slot uuid, p_name text, p_motif text, p_helper boolean, p_source uuid,
  p_procedure text default null, p_language text default 'fr',
  p_phone text default null, p_district text default null, p_booked_by uuid default null
) returns uuid language plpgsql set search_path = '' as $$
declare
  s portal_private.slots; b uuid; account_phone text; phone_number text;
  profile_data jsonb; procedure_data jsonb; docs jsonb; third boolean;
begin
  if p_user is null and p_booked_by is null then
    raise exception 'Réservation non attribuée' using errcode = '42501';
  end if;
  select * into s from portal_private.slots where id = p_slot for update;
  if not found or s.closed or s.starts_at <= now() or s.motif not in (p_motif, 'both')
    or (s.partner_only and p_source is null and p_booked_by is null)
    or not exists (select 1 from portal_private.associations where id = s.association_id and published)
  then raise exception 'Créneau indisponible' using errcode = '22023'; end if;

  if p_source is not null and p_user is not null and not exists (
    select 1 from portal_private.consents where user_id = p_user and source_id = p_source
      and target_id = s.association_id and purpose = 'orientation' and revoked_at is null and expires_at > now()
    for share
  ) then raise exception 'Accord de l’usager requis' using errcode = '42501'; end if;

  if p_user is not null then
    select case when u.phone like '+%' then u.phone else '+' || u.phone end into account_phone
      from auth.users u where u.id = p_user and u.phone_confirmed_at is not null;
    if account_phone is null then raise exception 'Téléphone vérifié requis' using errcode = '42501'; end if;
  end if;
  phone_number := coalesce(nullif(btrim(p_phone), ''), account_phone);
  if phone_number is null or phone_number !~ '^[+][1-9][0-9]{7,14}$' then
    raise exception 'Numéro de téléphone invalide' using errcode = '22023';
  end if;
  third := account_phone is distinct from phone_number;
  if third and p_user is not null then
    if not coalesce(p_helper, false) then
      raise exception 'Un autre numéro n’est possible qu’en réservant pour quelqu’un d’autre' using errcode = '22023';
    end if;
    if (select count(*) from portal_private.bookings x join portal_private.slots y on y.id = x.slot_id
        where x.user_id = p_user and x.third_party and x.status = 'confirmed' and y.starts_at > now())
        >= portal_private.setting('max_helper_bookings')::int
    then raise exception 'Nombre maximal de rendez-vous pris pour des proches atteint' using errcode = '22023'; end if;
  end if;

  select profile into profile_data from portal_private.associations where id = s.association_id;
  if nullif(p_procedure, '') is not null then
    select value into procedure_data from jsonb_array_elements(coalesce(profile_data->'procedures', '[]'))
      where value->>'code' = p_procedure;
    if not found then raise exception 'Démarche indisponible' using errcode = '22023'; end if;
  end if;
  docs := coalesce(procedure_data->'documents'->coalesce(p_language, 'fr'), procedure_data->'documents'->'fr',
    profile_data->'documentsRequired'->p_motif, '[]');

  insert into portal_private.bookings(slot_id, user_id, first_name, phone, motif, helper, oriented_by,
      procedure_code, documents, booked_by, third_party, district)
    values (p_slot, p_user, btrim(p_name), phone_number, p_motif, coalesce(p_helper, false) or p_user is null,
      p_source, nullif(p_procedure, ''), array(select jsonb_array_elements_text(docs)),
      p_booked_by, third, nullif(btrim(p_district), ''))
    returning id into b;
  insert into portal_private.sms_jobs(booking_id, kind, due_at) values (b, 'confirmation', now());
  if s.starts_at > now() + interval '1 day' then
    insert into portal_private.sms_jobs(booking_id, kind, due_at) values (b, 'reminder', s.starts_at - interval '1 day');
  end if;
  return b;
end;
$$;

-- Annuaire public : sans créneaux réservés aux partenaires, avec la liste des quartiers

create or replace function public.portal_directory() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'associations', coalesce((
      select jsonb_agg(a.profile || jsonb_build_object('id', a.id, 'slots', coalesce((
        select jsonb_agg(jsonb_build_object('id', s.id, 'startsAt', s.starts_at, 'motif', s.motif) order by s.starts_at)
        from portal_private.slots s where s.association_id = a.id and not s.closed and not s.partner_only
          and s.starts_at > now() and s.starts_at <= now() + interval '60 days'
          and not exists (select 1 from portal_private.bookings b where b.slot_id = s.id and b.status <> 'cancelled')
      ), '[]'::jsonb)) order by a.profile->>'name')
      from portal_private.associations a where a.published
    ), '[]'::jsonb),
    'helpCenters', coalesce((select jsonb_agg(h.profile || jsonb_build_object('id', h.id))
      from portal_private.help_centers h), '[]'::jsonb),
    'districts', coalesce((select jsonb_agg(jsonb_build_object('name', d.name, 'city', d.city) order by d.name)
      from portal_private.districts d), '[]'::jsonb)
  )
$$;

-- Espace usager ------------------------------------------------------------------

alter function public.portal_user(text, jsonb) set schema portal_private;
alter function portal_private.portal_user(text, jsonb) rename to user_core;
revoke all on function portal_private.user_core(text, jsonb) from public, anon, authenticated;

create function public.portal_user(p_action text, p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); item uuid; result jsonb; helper boolean := coalesce((p_data->>'helper')::boolean, false);
begin
  if actor is null then raise exception 'Connexion requise' using errcode = '42501'; end if;

  if p_action = 'book' then
    return to_jsonb(portal_private.make_booking(actor, (p_data->>'slot')::uuid, p_data->>'name', p_data->>'motif',
      helper, null, p_data->>'procedure', p_data->>'language',
      case when helper then p_data->>'contactPhone' end, p_data->>'district'));

  elsif p_action = 'visit' then
    item := (p_data->>'association')::uuid;
    if exists (select 1 from portal_private.associations where id = item and published) then
      insert into portal_private.visits(user_id, association_id) values (actor, item)
        on conflict (user_id, association_id) do update set seen_at = now();
      delete from portal_private.visits v where v.user_id = actor and v.association_id in (
        select association_id from portal_private.visits where user_id = actor order by seen_at desc offset 30);
    end if;

  elsif p_action = 'dashboard' then
    result := portal_private.user_core('dashboard', p_data);
    return result || jsonb_build_object(
      'visited', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'name', a.profile->>'name',
          'phone', a.profile->>'phone', 'address', concat_ws(', ', a.profile->>'address', a.profile->>'city'),
          'seenAt', v.seen_at) order by v.seen_at desc)
        from portal_private.visits v join portal_private.associations a on a.id = v.association_id
        where v.user_id = actor and a.published), '[]'::jsonb),
      'passports', coalesce((select jsonb_agg(jsonb_build_object('association', a.profile->>'name',
          'summary', to_jsonb(p.summary), 'updatedAt', p.updated_at) order by p.updated_at desc)
        from portal_private.passports p join portal_private.associations a on a.id = p.association_id
        where p.user_id = actor), '[]'::jsonb),
      'accessLog', coalesce((select jsonb_agg(jsonb_build_object('action', l.action,
          'association', a.profile->>'name', 'at', l.created_at) order by l.created_at desc)
        from (select * from portal_private.audit where subject_id = actor
          and action in ('read_passport', 'write_passport') order by created_at desc limit 50) l
        left join portal_private.associations a on a.id = l.association_id), '[]'::jsonb));

  elsif p_action = 'export' then
    insert into portal_private.audit(actor_id, subject_id, action) values (actor, actor, 'export');
    return jsonb_build_object(
      'generatedAt', now(),
      'account', (select jsonb_build_object('id', u.id, 'phone', u.phone) from auth.users u where u.id = actor),
      'bookings', coalesce((select jsonb_agg(to_jsonb(b) - 'cancels_with' - 'user_id' - 'booked_by'
          || jsonb_build_object('startsAt', s.starts_at, 'association', a.profile->>'name') order by s.starts_at)
        from portal_private.bookings b join portal_private.slots s on s.id = b.slot_id
        join portal_private.associations a on a.id = s.association_id where b.user_id = actor), '[]'::jsonb),
      'cases', coalesce((select jsonb_agg(jsonb_build_object('subject', c.subject, 'status', c.status,
          'association', a.profile->>'name', 'createdAt', c.created_at, 'messages', coalesce((
            select jsonb_agg(jsonb_build_object('fromAssociation', m.from_staff, 'body', m.body, 'at', m.created_at)
              order by m.created_at) from portal_private.messages m where m.case_id = c.id), '[]'::jsonb)))
        from portal_private.cases c join portal_private.associations a on a.id = c.association_id
        where c.user_id = actor), '[]'::jsonb),
      'consents', coalesce((select jsonb_agg(jsonb_build_object('source', s.profile->>'name', 'target', t.profile->>'name',
          'purpose', c.purpose, 'grantedAt', c.granted_at, 'expiresAt', c.expires_at, 'revokedAt', c.revoked_at))
        from portal_private.consents c join portal_private.associations s on s.id = c.source_id
        join portal_private.associations t on t.id = c.target_id where c.user_id = actor), '[]'::jsonb),
      'passports', coalesce((select jsonb_agg(jsonb_build_object('association', a.profile->>'name',
          'summary', to_jsonb(p.summary), 'updatedAt', p.updated_at))
        from portal_private.passports p join portal_private.associations a on a.id = p.association_id
        where p.user_id = actor), '[]'::jsonb),
      'visits', coalesce((select jsonb_agg(jsonb_build_object('association', a.profile->>'name', 'seenAt', v.seen_at))
        from portal_private.visits v join portal_private.associations a on a.id = v.association_id
        where v.user_id = actor), '[]'::jsonb),
      'accessLog', coalesce((select jsonb_agg(jsonb_build_object('action', l.action,
          'association', a.profile->>'name', 'at', l.created_at) order by l.created_at)
        from portal_private.audit l left join portal_private.associations a on a.id = l.association_id
        where l.subject_id = actor), '[]'::jsonb));

  elsif p_action = 'delete_account' then
    if p_data->>'confirm' is distinct from 'SUPPRIMER' then
      raise exception 'Saisissez SUPPRIMER pour confirmer' using errcode = '22023';
    end if;
    if exists (select 1 from storage.objects where bucket_id = 'portal-vault'
      and (storage.foldername(name))[1] = actor::text)
    then raise exception 'Supprimez d’abord les documents de votre coffre-fort' using errcode = '22023'; end if;
    update portal_private.bookings b set status = 'cancelled' from portal_private.slots s
      where b.slot_id = s.id and b.user_id = actor and b.status = 'confirmed' and s.starts_at > now();
    delete from portal_private.sms_jobs j using portal_private.bookings b
      where j.booking_id = b.id and b.user_id = actor and j.sent_at is null;
    update portal_private.bookings set user_id = null, first_name = 'Anonyme', phone = null,
      documents = '{}', booked_by = null where user_id = actor;
    delete from portal_private.cases where user_id = actor;
    delete from portal_private.passports where user_id = actor;
    delete from portal_private.consents where user_id = actor;
    delete from portal_private.visits where user_id = actor;
    insert into portal_private.audit(actor_id, subject_id, action) values (actor, actor, 'delete_account');
    delete from auth.users where id = actor;
    return 'true'::jsonb;

  else
    return portal_private.user_core(p_action, p_data);
  end if;
  return 'null'::jsonb;
end;
$$;

-- Espace professionnel ---------------------------------------------------------------

alter function public.portal_staff(text, jsonb) set schema portal_private;
alter function portal_private.portal_staff(text, jsonb) rename to staff_core;
revoke all on function portal_private.staff_core(text, jsonb) from public, anon, authenticated;

create function public.portal_staff(p_action text, p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); org uuid := (p_data->>'association')::uuid; item uuid := (p_data->>'id')::uuid;
  target uuid; passport portal_private.passports; result jsonb; b uuid;
  start_at timestamptz; end_at timestamptz; repeat int; created int := 0; i int;
begin
  if actor is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_action = 'memberships' then return portal_private.staff_core(p_action, p_data); end if;
  if not portal_private.is_staff(org) then raise exception 'Accès réservé à l’association' using errcode = '42501'; end if;

  if p_action = 'create_slot' then
    start_at := (p_data->>'startsAt')::timestamptz;
    end_at := (p_data->>'endsAt')::timestamptz;
    repeat := coalesce((p_data->>'repeatWeeks')::int, 1);
    if start_at <= now() then raise exception 'Date passée' using errcode = '22023'; end if;
    if end_at <= start_at or end_at - start_at > interval '12 hours' then
      raise exception 'La fin doit suivre le début, dans la même journée' using errcode = '22023';
    end if;
    if repeat not between 1 and 26 then raise exception 'Répétition limitée à 26 semaines' using errcode = '22023'; end if;
    perform 1 from portal_private.associations where id = org for update;
    for i in 0 .. repeat - 1 loop
      if not exists (select 1 from portal_private.slots s where s.association_id = org and not s.closed
        and tstzrange(s.starts_at, s.ends_at) && tstzrange(start_at + make_interval(weeks => i), end_at + make_interval(weeks => i)))
      then
        insert into portal_private.slots(association_id, starts_at, ends_at, motif, partner_only)
          values (org, start_at + make_interval(weeks => i), end_at + make_interval(weeks => i), p_data->>'motif',
            coalesce((p_data->>'partnerOnly')::boolean, false));
        created := created + 1;
      end if;
    end loop;
    if created = 0 then raise exception 'Créneau déjà ouvert sur cette plage' using errcode = '22023'; end if;
    return to_jsonb(created);

  elsif p_action = 'book_walk_in' then
    if (p_data->>'consent')::boolean is distinct from true then
      raise exception 'L’accord de la personne présente est requis' using errcode = '22023';
    end if;
    if (select count(*) from portal_private.audit where actor_id = actor and action = 'walk_in_booking'
        and created_at > now() - interval '1 day') >= portal_private.setting('max_walk_in_per_day')::int
    then raise exception 'Nombre maximal de réservations au guichet atteint pour aujourd’hui' using errcode = '22023'; end if;
    select association_id into target from portal_private.slots where id = (p_data->>'slot')::uuid;
    if target is null then raise exception 'Créneau indisponible' using errcode = '22023'; end if;
    b := portal_private.make_booking(null, (p_data->>'slot')::uuid, p_data->>'name', p_data->>'motif', true,
      case when target <> org then org end, p_data->>'procedure', coalesce(p_data->>'language', 'fr'),
      p_data->>'phone', p_data->>'district', actor);
    insert into portal_private.audit(actor_id, subject_id, association_id, action, details)
      values (actor, b, org, 'walk_in_booking', jsonb_build_object('target', target, 'consent', 'oral'));
    return to_jsonb(b);

  elsif p_action = 'alert' then
    insert into portal_private.alerts(association_id, body, kind)
      values (org, p_data->>'body', coalesce(nullif(p_data->>'kind', ''), 'autre'));

  elsif p_action = 'read_passport' then
    select * into passport from portal_private.passports where id = item;
    if not found or (passport.association_id <> org and not exists (
      select 1 from portal_private.consents where user_id = passport.user_id and source_id = passport.association_id
        and target_id = org and purpose = 'passport' and revoked_at is null and expires_at > now()
      for share
    )) then raise exception 'Dossier indisponible' using errcode = '42501'; end if;
    insert into portal_private.audit(actor_id, subject_id, association_id, action)
      values (actor, passport.user_id, org, 'read_passport');
    return jsonb_build_object(
      'summary', to_jsonb(passport.summary),
      'updatedAt', passport.updated_at,
      'association', (select profile->>'name' from portal_private.associations where id = passport.association_id),
      'history', coalesce((select jsonb_agg(jsonb_build_object(
          'startsAt', s.starts_at, 'association', a.profile->>'name', 'status', x.status, 'motif', x.motif,
          'procedure', coalesce((select d->>'title' from jsonb_array_elements(coalesce(a.profile->'procedures', '[]')) d
            where d->>'code' = x.procedure_code limit 1), x.procedure_code),
          'orientedBy', (select o.profile->>'name' from portal_private.associations o where o.id = x.oriented_by))
          order by s.starts_at desc)
        from portal_private.bookings x join portal_private.slots s on s.id = x.slot_id
        join portal_private.associations a on a.id = s.association_id
        where x.user_id = passport.user_id and x.status <> 'cancelled'
          and (s.association_id = passport.association_id or x.oriented_by = passport.association_id)), '[]'::jsonb));

  elsif p_action = 'dashboard' then
    result := portal_private.staff_core('dashboard', p_data);
    return result || jsonb_build_object(
      'bookings', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.first_name, 'status', b.status,
          'startsAt', s.starts_at, 'walkIn', b.user_id is null and b.booked_by is not null,
          'orientedBy', (select o.profile->>'name' from portal_private.associations o where o.id = b.oriented_by),
          'hasAccount', b.user_id is not null) order by s.starts_at)
        from portal_private.bookings b join portal_private.slots s on s.id = b.slot_id
        where s.association_id = org and s.starts_at >= now() - interval '30 days'), '[]'::jsonb),
      'alerts', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'body', a.body, 'kind', a.kind,
          'own', a.association_id = org, 'association', s.profile->>'name', 'createdAt', a.created_at)
          order by a.created_at desc)
        from portal_private.alerts a join portal_private.associations s on s.id = a.association_id
        where a.resolved_at is null), '[]'::jsonb),
      'exchange', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'startsAt', s.starts_at, 'motif', s.motif,
          'partnerOnly', s.partner_only, 'associationId', a.id, 'association', a.profile->>'name',
          'category', a.profile->>'category', 'secondaryCategories', a.profile->'secondaryCategories') order by s.starts_at)
        from (select * from portal_private.slots s where not s.closed and s.starts_at > now()
            and s.starts_at <= now() + interval '60 days'
            and not exists (select 1 from portal_private.bookings b where b.slot_id = s.id and b.status <> 'cancelled')
          order by s.starts_at limit 300) s
        join portal_private.associations a on a.id = s.association_id where a.published), '[]'::jsonb));

  else
    return portal_private.staff_core(p_action, p_data);
  end if;
  return 'null'::jsonb;
end;
$$;

-- Observatoire détaillé -------------------------------------------------------------

create function public.portal_observatory(p_action text default 'stats', p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare k constant int := 5;
begin
  if not exists (select 1 from portal_private.pilots where user_id = auth.uid())
  then raise exception 'Accès réservé aux pilotes' using errcode = '42501'; end if;

  if p_action = 'save_district' then
    insert into portal_private.districts(name, city, qpv)
      values (btrim(p_data->>'name'), nullif(btrim(p_data->>'city'), ''), coalesce((p_data->>'qpv')::boolean, false))
      on conflict (name) do update set city = excluded.city, qpv = excluded.qpv;
    return 'null'::jsonb;
  elsif p_action = 'remove_district' then
    delete from portal_private.districts where name = p_data->>'name';
    return 'null'::jsonb;
  elsif p_action <> 'stats' then
    raise exception 'Action inconnue' using errcode = '22023';
  end if;

  return (with demand as (
    select b.id, b.status, b.created_at, b.oriented_by, b.booked_by, b.user_id, s.starts_at,
      a.profile->>'category' theme, a.profile->>'name' association,
      greatest(0, extract(epoch from (s.starts_at - b.created_at)) / 86400) wait_days,
      d.name resident_district, d.qpv resident_qpv
    from portal_private.bookings b join portal_private.slots s on s.id = b.slot_id
    join portal_private.associations a on a.id = s.association_id
    left join portal_private.districts d on lower(d.name) = lower(btrim(b.district))
  )
  select jsonb_build_object(
    'threshold', k,
    'residentDistricts', coalesce((select jsonb_agg(to_jsonb(x) order by x.volume desc) from (
      select coalesce(resident_district, 'Non renseigné') district, coalesce(resident_qpv, false) qpv, count(*) volume
      from demand group by 1, 2 having count(*) >= k) x), '[]'::jsonb),
    'waitByTheme', coalesce((select jsonb_agg(to_jsonb(x)) from (
      select theme, count(*) volume, round(avg(wait_days)::numeric, 1) "waitDays"
      from demand group by theme having count(*) >= k) x), '[]'::jsonb),
    'monthly', coalesce((select jsonb_agg(to_jsonb(x) order by x.month) from (
      select to_char(date_trunc('month', created_at at time zone 'Europe/Paris'), 'YYYY-MM') "month", count(*) volume
      from demand where created_at > now() - interval '12 months' group by 1 having count(*) >= k) x), '[]'::jsonb),
    'outcomes', (select jsonb_build_object(
      'cancelled', case when count(*) filter (where status = 'cancelled') >= k then count(*) filter (where status = 'cancelled') end,
      'absent', case when count(*) filter (where status = 'absent') >= k then count(*) filter (where status = 'absent') end,
      'oriented', case when count(*) filter (where oriented_by is not null) >= k then count(*) filter (where oriented_by is not null) end,
      'walkIn', case when count(*) filter (where user_id is null and booked_by is not null) >= k
        then count(*) filter (where user_id is null and booked_by is not null) end) from demand),
    'saturationByAssociation', coalesce((select jsonb_agg(to_jsonb(x) order by x.rate desc) from (
      select a.profile->>'name' association, count(*) slots,
        count(*) filter (where exists (select 1 from portal_private.bookings b where b.slot_id = s.id and b.status = 'confirmed')) reserved,
        round(100.0 * count(*) filter (where exists (select 1 from portal_private.bookings b
          where b.slot_id = s.id and b.status = 'confirmed')) / count(*), 1) rate
      from portal_private.slots s join portal_private.associations a on a.id = s.association_id
      where a.published and not s.closed and s.starts_at between now() and now() + interval '30 days'
      group by a.id having count(*) >= k) x), '[]'::jsonb),
    'districts', coalesce((select jsonb_agg(to_jsonb(d) order by d.name) from portal_private.districts d), '[]'::jsonb)
  ));
end;
$$;

-- Conservation des données ------------------------------------------------------------

create function portal_private.purge_expired() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  anonymized int; cases_deleted int; audit_deleted int; misc int := 0; n int;
  months_bookings interval := make_interval(months => portal_private.setting('retention_months_bookings')::int);
begin
  delete from portal_private.sms_jobs j using portal_private.bookings b, portal_private.slots s
    where j.booking_id = b.id and b.slot_id = s.id
      and ((j.sent_at is not null and j.sent_at < now() - interval '3 months')
        or (j.sent_at is null and s.starts_at < now() - interval '1 month'));
  update portal_private.bookings b set user_id = null, first_name = 'Anonyme', phone = null, documents = '{}', booked_by = null
    from portal_private.slots s
    where b.slot_id = s.id and s.starts_at < now() - months_bookings
      and (b.user_id is not null or b.phone is not null);
  get diagnostics anonymized = row_count;
  delete from portal_private.cases c
    where c.created_at < now() - make_interval(months => portal_private.setting('retention_months_cases')::int)
      and not exists (select 1 from portal_private.messages m where m.case_id = c.id
        and m.created_at >= now() - make_interval(months => portal_private.setting('retention_months_cases')::int));
  get diagnostics cases_deleted = row_count;
  delete from portal_private.audit
    where created_at < now() - make_interval(months => portal_private.setting('retention_months_audit')::int);
  get diagnostics audit_deleted = row_count;
  delete from portal_private.consents where coalesce(revoked_at, expires_at) < now() - interval '12 months';
  get diagnostics n = row_count; misc := misc + n;
  delete from portal_private.staff_messages
    where created_at < now() - make_interval(months => portal_private.setting('retention_months_staff_messages')::int);
  get diagnostics n = row_count; misc := misc + n;
  delete from portal_private.alerts where resolved_at is not null
    and resolved_at < now() - make_interval(months => portal_private.setting('retention_months_alerts')::int);
  get diagnostics n = row_count; misc := misc + n;
  delete from portal_private.visits
    where seen_at < now() - make_interval(months => portal_private.setting('retention_months_visits')::int);
  get diagnostics n = row_count; misc := misc + n;
  update portal_private.association_applications set requester = null
    where requester is not null and charter_accepted_at < now() - interval '30 days';
  delete from portal_private.association_applications a where a.status = 'rejected'
    and a.charter_accepted_at < now() - interval '12 months';
  get diagnostics n = row_count; misc := misc + n;
  return jsonb_build_object('anonymizedBookings', anonymized, 'deletedCases', cases_deleted,
    'deletedAudit', audit_deleted, 'deletedOther', misc);
end;
$$;
revoke all on function portal_private.purge_expired() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('portal-purge-expired', '17 3 * * *', 'select portal_private.purge_expired()');
  end if;
exception when others then
  raise notice 'Planification de la purge à configurer manuellement : %', sqlerrm;
end;
$$;

-- Droits ------------------------------------------------------------------------------

revoke all on function public.portal_user(text, jsonb), public.portal_staff(text, jsonb),
  public.portal_observatory(text, jsonb) from public, anon, authenticated;
grant execute on function public.portal_user(text, jsonb), public.portal_staff(text, jsonb),
  public.portal_observatory(text, jsonb) to authenticated;
revoke all on function public.portal_directory() from public, anon, authenticated;
grant execute on function public.portal_directory() to anon, authenticated;
revoke all on function portal_private.make_booking(uuid, uuid, text, text, boolean, uuid, text, text, text, text, uuid)
  from public, anon, authenticated;

commit;
