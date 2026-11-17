begin;

create schema if not exists portal_private;
revoke all on schema portal_private from public, anon, authenticated;

create table portal_private.association_applications (
  id uuid primary key default gen_random_uuid(),
  organization_number text not null check (organization_number ~ '^(W[0-9]{9}|[0-9]{14})$'),
  name text not null check (char_length(name) between 1 and 160),
  category text not null check (category in ('papiers', 'logement', 'sante', 'travail', 'famille', 'droits')),
  address text not null check (char_length(address) between 1 and 250),
  tao_stop text not null check (char_length(tao_stop) between 1 and 160),
  phone text not null check (phone ~ '^([+]|00)?[0-9]{9,15}$'),
  contact_email text not null check (
    char_length(contact_email) <= 254 and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  opening_hours text not null check (char_length(opening_hours) between 1 and 300),
  mission text not null check (char_length(mission) between 1 and 2000),
  charter_accepted_at timestamptz not null default now(),
  charter_version text not null default '2026-11-17',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

alter table portal_private.association_applications enable row level security;
revoke all on table portal_private.association_applications from public, anon, authenticated;

create unique index association_applications_pending_number
  on portal_private.association_applications (organization_number)
  where status = 'pending';

create function public.submit_association_application(
  p_organization_number text, p_name text, p_category text, p_address text,
  p_tao_stop text, p_phone text, p_contact_email text, p_opening_hours text,
  p_mission text, p_charter_accepted boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_charter_accepted is distinct from true then
    raise exception using errcode = '22023', message = 'Charter acceptance required';
  end if;

  insert into portal_private.association_applications (
    organization_number, name, category, address, tao_stop, phone,
    contact_email, opening_hours, mission
  ) values (
    upper(regexp_replace(p_organization_number, '[[:space:]]+', '', 'g')),
    btrim(p_name), p_category, btrim(p_address), btrim(p_tao_stop),
    regexp_replace(p_phone, '[[:space:]().-]+', '', 'g'),
    btrim(p_contact_email), btrim(p_opening_hours), btrim(p_mission)
  )
  on conflict (organization_number) where status = 'pending' do nothing;
end;
$$;

revoke all on function public.submit_association_application(text, text, text, text, text, text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.submit_association_application(text, text, text, text, text, text, text, text, text, boolean)
  to anon, authenticated;

commit;
