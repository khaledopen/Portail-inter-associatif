-- Vérifie la migration 20261117060000_staff_invitations. Les écritures sont annulées en fin de script.
begin;

insert into auth.users(id, email, phone, phone_confirmed_at) values
  ('d0000000-0000-4000-8000-000000000001', 'pilote@example.org', null, null),
  ('d0000000-0000-4000-8000-000000000002', 'deja@example.org', null, null),
  ('d0000000-0000-4000-8000-000000000003', null, '33600000301', now());
insert into portal_private.pilots(user_id) values ('d0000000-0000-4000-8000-000000000001');
insert into portal_private.association_applications(id, organization_number, name, category, address, tao_stop,
    phone, contact_email, opening_hours, mission)
  values ('d1000000-0000-4000-8000-000000000001', 'W451234567', 'Asso invitée', 'droits', '1 rue Test', 'Gare',
    '0238000000', 'Contact@Asso.example.org', 'Lundi', 'Mission');

set local role authenticated;

-- Un usager ne peut pas inviter.
select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000003', true);
do $$
begin
  perform public.portal_admin('invite_staff', '{"id":"d1000000-0000-4000-8000-000000000001","email":"x@example.org"}');
  raise exception 'Resident invited staff';
exception when insufficient_privilege then null;
end;
$$;

select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000001', true);
do $$
declare r jsonb; i jsonb; d jsonb;
begin
  -- La validation renvoie la fiche créée et l'e-mail de contact à inviter.
  r := public.portal_admin('review', '{"id":"d1000000-0000-4000-8000-000000000001","status":"approved"}');
  if r->>'association' is null or r->>'email' <> 'Contact@Asso.example.org' then raise exception 'Review result: %', r; end if;
  perform set_config('portal.test.asso', r->>'association', true);

  -- Adresse sans compte : invitation en attente.
  i := public.portal_admin('invite_staff', jsonb_build_object('id', r->>'association', 'email', ' Contact@Asso.example.org '));
  if (i->>'userExists')::boolean or i->>'email' <> 'contact@asso.example.org' then raise exception 'Invite result: %', i; end if;

  -- Adresse avec un compte existant : accès immédiat.
  i := public.portal_admin('invite_staff', jsonb_build_object('id', r->>'association', 'email', 'DEJA@example.org'));
  if not (i->>'userExists')::boolean then raise exception 'Existing account not detected'; end if;

  begin
    perform public.portal_admin('invite_staff', jsonb_build_object('id', r->>'association', 'email', 'pas-un-mail'));
    raise exception 'Invalid email accepted';
  exception when invalid_parameter_value then null;
  end;

  d := public.portal_admin('dashboard');
  if jsonb_array_length(d->'invitations') <> 2 then raise exception 'Invitations missing: %', d->'invitations'; end if;
  if not exists (select 1 from jsonb_array_elements(d->'invitations') x where x->>'email' = 'contact@asso.example.org' and x->>'status' = 'pending')
  then raise exception 'Pending status missing'; end if;
  if not exists (select 1 from jsonb_array_elements(d->'members') x where x->>'email' = 'deja@example.org')
  then raise exception 'Existing account not linked'; end if;
end;
$$;
reset role;

-- Création du compte par l'invitation Supabase : le déclencheur relie l'association.
insert into auth.users(id, email) values ('d0000000-0000-4000-8000-000000000004', 'contact@asso.example.org');
do $$
begin
  if not exists (select 1 from portal_private.staff where user_id = 'd0000000-0000-4000-8000-000000000004'
    and association_id = current_setting('portal.test.asso')::uuid) then raise exception 'Invited account not linked'; end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000004', true);
do $$
begin
  if jsonb_array_length(public.portal_staff('memberships')) <> 1 then raise exception 'Invited member cannot see association'; end if;
end;
$$;

-- Annulation de l'invitation : l'accès est retiré.
select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000001', true);
select public.portal_admin('revoke_invitation', jsonb_build_object('id',
  (select x->>'id' from jsonb_array_elements(public.portal_admin('dashboard')->'invitations') x
    where x->>'email' = 'contact@asso.example.org')));
select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000004', true);
do $$
begin
  if jsonb_array_length(public.portal_staff('memberships')) <> 0 then raise exception 'Revoked member keeps access'; end if;
end;
$$;
reset role;

rollback;
