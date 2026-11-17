-- Invitations des bénévoles et salariés des associations par e-mail.
-- Le pilote invite une adresse pour une association (par défaut l'e-mail de contact de la demande validée).
-- La fonction Edge portal-invite envoie l'invitation Supabase Auth ; dès que le compte existe,
-- un déclencheur sur auth.users le relie à l'association.
begin;

create table portal_private.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references portal_private.associations on delete cascade,
  email text not null check (length(email) <= 254 and email ~ '^[^[:space:]@A-Z]+@[^[:space:]@A-Z]+[.][^[:space:]@A-Z]+$'),
  invited_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  linked_at timestamptz,
  unique (association_id, email)
);
create index staff_invitations_email on portal_private.staff_invitations(email);
alter table portal_private.staff_invitations enable row level security;
revoke all on table portal_private.staff_invitations from public, anon, authenticated;

create function portal_private.link_invitations(p_user uuid, p_email text) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into portal_private.staff(user_id, association_id)
    select p_user, i.association_id from portal_private.staff_invitations i where i.email = lower(btrim(p_email))
    on conflict do nothing;
  update portal_private.staff_invitations set linked_at = coalesce(linked_at, now())
    where email = lower(btrim(p_email));
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function portal_private.link_invitations(uuid, text) from public, anon, authenticated;

create function portal_private.on_auth_user_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is not null and (tg_op = 'INSERT' or new.email is distinct from old.email) then
    perform portal_private.link_invitations(new.id, new.email);
  end if;
  return new;
end;
$$;
revoke all on function portal_private.on_auth_user_email() from public, anon, authenticated;

create trigger portal_link_staff_invitations
  after insert or update of email on auth.users
  for each row execute function portal_private.on_auth_user_email();

-- Espace pilote : invitation, suivi des comptes et validation qui renvoie l'adresse à inviter.
alter function public.portal_admin(text, jsonb) set schema portal_private;
alter function portal_private.portal_admin(text, jsonb) rename to admin_core;
revoke all on function portal_private.admin_core(text, jsonb) from public, anon, authenticated;

create function public.portal_admin(p_action text, p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); item uuid := (p_data->>'id')::uuid; mail text; existing uuid; result jsonb; org uuid;
begin
  if not exists (select 1 from portal_private.pilots where user_id = actor)
  then raise exception 'Accès réservé aux pilotes' using errcode = '42501'; end if;

  if p_action = 'review' then
    perform portal_private.admin_core(p_action, p_data);
    select jsonb_build_object('association', a.id, 'name', r.name, 'email', r.contact_email)
      into result
      from portal_private.association_applications r
      left join portal_private.associations a on a.application_id = r.id
      where r.id = item;
    return coalesce(result, 'null'::jsonb);

  elsif p_action = 'invite_staff' then
    mail := lower(btrim(p_data->>'email'));
    if mail is null or mail !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(mail) > 254 then
      raise exception 'Adresse e-mail invalide' using errcode = '22023';
    end if;
    if not exists (select 1 from portal_private.associations where id = item) then
      raise exception 'Fiche introuvable' using errcode = '22023';
    end if;
    insert into portal_private.staff_invitations(association_id, email, invited_by)
      values (item, mail, actor)
      on conflict (association_id, email) do update set invited_by = excluded.invited_by, created_at = now();
    select id into existing from auth.users where lower(email) = mail limit 1;
    if existing is not null then
      perform portal_private.link_invitations(existing, mail);
    end if;
    insert into portal_private.audit(actor_id, subject_id, association_id, action, details)
      values (actor, coalesce(existing, item), item, 'invite_staff', jsonb_build_object('email', mail));
    return jsonb_build_object('userExists', existing is not null, 'email', mail,
      'neverSignedIn', existing is not null and (select last_sign_in_at is null from auth.users where id = existing),
      'association', (select profile->>'name' from portal_private.associations where id = item));

  elsif p_action = 'revoke_invitation' then
    delete from portal_private.staff_invitations where id = item returning association_id, email into org, mail;
    if org is null then raise exception 'Invitation introuvable' using errcode = '22023'; end if;
    delete from portal_private.staff s using auth.users u
      where s.user_id = u.id and lower(u.email) = mail and s.association_id = org;
    return 'null'::jsonb;

  elsif p_action = 'dashboard' then
    result := portal_private.admin_core(p_action, p_data);
    return result || jsonb_build_object(
      'members', coalesce((select jsonb_agg(jsonb_build_object('association', s.association_id, 'user', s.user_id,
          'email', u.email, 'lastSignIn', u.last_sign_in_at) order by u.email)
        from portal_private.staff s join auth.users u on u.id = s.user_id), '[]'::jsonb),
      'invitations', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'association', i.association_id,
          'email', i.email, 'createdAt', i.created_at,
          'status', case when u.id is null then 'pending'
            when u.last_sign_in_at is null then 'sent' else 'active' end) order by i.created_at desc)
        from portal_private.staff_invitations i left join auth.users u on lower(u.email) = i.email), '[]'::jsonb));

  else
    return portal_private.admin_core(p_action, p_data);
  end if;
end;
$$;

revoke all on function public.portal_admin(text, jsonb) from public, anon, authenticated;
grant execute on function public.portal_admin(text, jsonb) to authenticated;

commit;
