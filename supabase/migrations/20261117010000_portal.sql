begin;

create table portal_private.associations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique references portal_private.association_applications,
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  published boolean not null default false,
  check (nullif(btrim(profile->>'name'), '') is not null),
  check (coalesce(profile->>'category' in ('papiers','logement','sante','travail','famille','droits'), false)),
  check (not published or coalesce(
    jsonb_typeof(profile->'lat') = 'number' and jsonb_typeof(profile->'lng') = 'number'
    and (profile->>'lat')::numeric between -90 and 90
    and (profile->>'lng')::numeric between -180 and 180, false))
);

create table portal_private.staff (
  user_id uuid not null references auth.users on delete cascade,
  association_id uuid not null references portal_private.associations,
  primary key (user_id, association_id)
);
create table portal_private.pilots (
  user_id uuid primary key references auth.users on delete cascade
);
create table portal_private.slots (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references portal_private.associations,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  motif text not null check (motif in ('firstVisit', 'followUp', 'both')),
  closed boolean not null default false,
  unique (association_id, starts_at)
);
create table portal_private.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references portal_private.slots,
  user_id uuid not null references auth.users on delete cascade,
  first_name text not null check (length(btrim(first_name)) between 1 and 100),
  phone text not null check (phone ~ '^[+][1-9][0-9]{7,14}$'),
  motif text not null check (motif in ('firstVisit', 'followUp')),
  helper boolean not null default false,
  oriented_by uuid references portal_private.associations,
  procedure_code text,
  documents text[] not null default '{}',
  cancels_with uuid not null unique default gen_random_uuid(),
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed','absent')),
  created_at timestamptz not null default now()
);
create unique index booking_one_per_slot on portal_private.bookings(slot_id) where status <> 'cancelled';
create index booking_by_user on portal_private.bookings(user_id, created_at desc);

create table portal_private.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  association_id uuid not null references portal_private.associations,
  subject text not null check (length(btrim(subject)) between 1 and 160),
  status text not null default 'open' check (status in ('open','closed')),
  complex_case boolean not null default false,
  created_at timestamptz not null default now()
);
create index cases_by_association on portal_private.cases(association_id);
create index cases_by_user on portal_private.cases(user_id);
create table portal_private.messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references portal_private.cases on delete cascade,
  from_staff boolean not null,
  body text not null check (length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index messages_by_case on portal_private.messages(case_id, created_at);
create table portal_private.staff_messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references portal_private.associations,
  recipient uuid not null references portal_private.associations,
  body text not null check (length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  check (sender <> recipient)
);
create table portal_private.alerts (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references portal_private.associations,
  body text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create table portal_private.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  url text not null check (url ~ '^https://[^[:space:]]+$')
);
create table portal_private.help_centers (
  id uuid primary key default gen_random_uuid(),
  profile jsonb not null check (jsonb_typeof(profile) = 'object')
);
create table portal_private.passports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  association_id uuid not null references portal_private.associations,
  summary text[] not null check (cardinality(summary) = 5),
  updated_at timestamptz not null default now(),
  unique (user_id, association_id)
);
create table portal_private.consents (
  user_id uuid not null references auth.users on delete cascade,
  source_id uuid not null references portal_private.associations,
  target_id uuid not null references portal_private.associations,
  purpose text not null check (purpose in ('passport','orientation')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  revoked_at timestamptz,
  primary key (user_id, source_id, target_id, purpose),
  check (source_id <> target_id)
);
create table portal_private.audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  subject_id uuid not null,
  association_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table portal_private.sms_jobs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references portal_private.bookings on delete cascade,
  kind text not null check (kind in ('confirmation','reminder','cancellation')),
  due_at timestamptz not null,
  locked_until timestamptz,
  lease uuid,
  attempts integer not null default 0,
  sent_at timestamptz,
  unique (booking_id, kind)
);
create index sms_jobs_due on portal_private.sms_jobs(due_at) where sent_at is null;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'portal_private' loop
    execute format('alter table portal_private.%I enable row level security', t);
    execute format('revoke all on table portal_private.%I from public, anon, authenticated', t);
  end loop;
end;
$$;

create function portal_private.is_staff(p_association uuid) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from portal_private.staff s where s.user_id = auth.uid() and s.association_id = p_association)
$$;

create function public.portal_directory() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'associations', coalesce((
      select jsonb_agg(a.profile || jsonb_build_object('id',a.id,'slots',coalesce((
        select jsonb_agg(jsonb_build_object('id',s.id,'startsAt',s.starts_at,'motif',s.motif) order by s.starts_at)
        from portal_private.slots s where s.association_id = a.id and not s.closed
          and s.starts_at > now() and s.starts_at <= now() + interval '60 days'
          and not exists (select 1 from portal_private.bookings b where b.slot_id=s.id and b.status <> 'cancelled')
      ),'[]'::jsonb)) order by a.profile->>'name')
      from portal_private.associations a where a.published
    ),'[]'::jsonb),
    'helpCenters', coalesce((select jsonb_agg(h.profile || jsonb_build_object('id',h.id))
      from portal_private.help_centers h),'[]'::jsonb)
  )
$$;

create function portal_private.make_booking(p_user uuid, p_slot uuid, p_name text, p_motif text, p_helper boolean, p_source uuid,
  p_procedure text default null, p_language text default 'fr')
returns uuid language plpgsql set search_path = '' as $$
declare s portal_private.slots; b uuid; phone_number text; profile_data jsonb; procedure_data jsonb; docs jsonb;
begin
  select * into s from portal_private.slots where id=p_slot for update;
  if not found or s.closed or s.starts_at <= now() or s.motif not in (p_motif,'both')
    or not exists (select 1 from portal_private.associations where id=s.association_id and published)
  then raise exception 'Créneau indisponible' using errcode='22023'; end if;
  if p_source is not null and not exists (
    select 1 from portal_private.consents where user_id=p_user and source_id=p_source
      and target_id=s.association_id and purpose='orientation' and revoked_at is null and expires_at>now()
    for share
  ) then raise exception 'Accord de l’usager requis' using errcode='42501'; end if;
  select case when u.phone like '+%' then u.phone else '+' || u.phone end into phone_number
    from auth.users u where u.id=p_user and u.phone_confirmed_at is not null;
  if phone_number is null then raise exception 'Téléphone vérifié requis' using errcode='42501'; end if;
  select profile into profile_data from portal_private.associations where id=s.association_id;
  if nullif(p_procedure,'') is not null then
    select value into procedure_data from jsonb_array_elements(coalesce(profile_data->'procedures','[]')) where value->>'code'=p_procedure;
    if not found then raise exception 'Démarche indisponible' using errcode='22023'; end if;
  end if;
  docs := coalesce(procedure_data->'documents'->p_language, procedure_data->'documents'->'fr',
    profile_data->'documentsRequired'->p_motif, '[]');
  insert into portal_private.bookings(slot_id,user_id,first_name,phone,motif,helper,oriented_by,procedure_code,documents)
    values (p_slot,p_user,btrim(p_name),phone_number,p_motif,coalesce(p_helper,false),p_source,
      nullif(p_procedure,''),array(select jsonb_array_elements_text(docs)))
    returning id into b;
  insert into portal_private.sms_jobs(booking_id,kind,due_at) values(b,'confirmation',now());
  if s.starts_at > now() + interval '1 day' then
    insert into portal_private.sms_jobs(booking_id,kind,due_at) values(b,'reminder',s.starts_at - interval '1 day');
  end if;
  return b;
end;
$$;

create function portal_private.cancel_booking(p_id uuid, p_token uuid) returns boolean
language plpgsql set search_path = '' as $$
declare changed uuid;
begin
  update portal_private.bookings b set status='cancelled' from portal_private.slots s
  where b.id=p_id and b.slot_id=s.id and s.starts_at>now() and b.status='confirmed'
    and ((p_token is not null and b.cancels_with=p_token)
      or (p_token is null and b.user_id=auth.uid()))
  returning b.id into changed;
  if changed is null then return false; end if;
  insert into portal_private.sms_jobs(booking_id,kind,due_at) values(changed,'cancellation',now());
  return true;
end;
$$;

create function public.portal_cancel_link(p_id uuid, p_token uuid) returns boolean
language sql security definer set search_path = '' as $$
  select case when p_token is not null then portal_private.cancel_booking(p_id,p_token) else false end
$$;

revoke all on function public.portal_directory(), public.portal_cancel_link(uuid,uuid) from public, anon, authenticated;
grant execute on function public.portal_directory(), public.portal_cancel_link(uuid,uuid) to anon, authenticated;

commit;
