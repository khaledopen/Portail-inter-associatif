begin;

create function public.portal_user(p_action text, p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); item uuid; source uuid; target uuid; result jsonb;
begin
  if actor is null then raise exception 'Connexion requise' using errcode='42501'; end if;
  if p_action = 'book' then
    return to_jsonb(portal_private.make_booking(actor, (p_data->>'slot')::uuid,
      p_data->>'name', p_data->>'motif', (p_data->>'helper')::boolean, null, p_data->>'procedure', p_data->>'language'));
  elsif p_action = 'cancel' then
    return to_jsonb(portal_private.cancel_booking((p_data->>'id')::uuid,null));
  elsif p_action = 'open_case' then
    target := (p_data->>'association')::uuid;
    if not exists (select 1 from portal_private.associations where id=target and published)
    then raise exception 'Association indisponible' using errcode='22023'; end if;
    insert into portal_private.cases(user_id,association_id,subject,complex_case)
      values(actor,target,p_data->>'subject',coalesce((p_data->>'complex')::boolean,false)) returning id into item;
    insert into portal_private.messages(case_id,from_staff,body) values(item,false,p_data->>'body');
    return to_jsonb(item);
  elsif p_action = 'reply' then
    item := (p_data->>'id')::uuid;
    perform 1 from portal_private.cases where id=item and user_id=actor and status='open' for share;
    if not found then raise exception 'Conversation indisponible' using errcode='42501'; end if;
    insert into portal_private.messages(case_id,from_staff,body) values(item,false,p_data->>'body');
  elsif p_action in ('grant','revoke') then
    source := (p_data->>'source')::uuid;
    target := (p_data->>'target')::uuid;
    if p_action='grant' then
      if not exists (select 1 from portal_private.associations where id=target and published)
        or not exists (select 1 from portal_private.associations where id=source and published)
      then raise exception 'Association indisponible' using errcode='22023'; end if;
      insert into portal_private.consents(user_id,source_id,target_id,purpose)
        values(actor,source,target,p_data->>'purpose')
        on conflict(user_id,source_id,target_id,purpose) do update
        set granted_at=now(), expires_at=now()+interval '30 days', revoked_at=null;
    else
      update portal_private.consents set revoked_at=now()
        where user_id=actor and source_id=source and target_id=target and purpose=p_data->>'purpose';
    end if;
    insert into portal_private.audit(actor_id,subject_id,association_id,action,details)
      values(actor,actor,source,p_action,jsonb_build_object('target',target,'purpose',p_data->>'purpose'));
  elsif p_action = 'dashboard' then
    select jsonb_build_object(
      'bookings', coalesce((select jsonb_agg(jsonb_build_object(
        'id',b.id,'name',b.first_name,'status',b.status,'startsAt',s.starts_at,'association',a.profile->>'name',
        'address',concat_ws(', ',a.profile->>'address',a.profile->>'city'),'phone',a.profile->>'phone','documents',b.documents)
        order by s.starts_at desc)
        from portal_private.bookings b join portal_private.slots s on s.id=b.slot_id
        join portal_private.associations a on a.id=s.association_id where b.user_id=actor),'[]'::jsonb),
      'cases',coalesce((select jsonb_agg(jsonb_build_object(
        'id',c.id,'subject',c.subject,'status',c.status,'association',a.profile->>'name','messages',
        coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'body',m.body,'staff',m.from_staff)
          order by m.created_at) from portal_private.messages m where m.case_id=c.id),'[]'::jsonb))
        order by c.created_at desc) from portal_private.cases c
        join portal_private.associations a on a.id=c.association_id where c.user_id=actor),'[]'::jsonb),
      'consents',coalesce((select jsonb_agg(to_jsonb(c)-'user_id') from portal_private.consents c where c.user_id=actor),'[]'::jsonb)
    ) into result;
    return result;
  else
    raise exception 'Action inconnue' using errcode='22023';
  end if;
  return 'null'::jsonb;
end;
$$;

create function public.portal_staff(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); org uuid := (p_data->>'association')::uuid;
  item uuid := (p_data->>'id')::uuid; subject uuid; passport portal_private.passports; result jsonb;
begin
  if actor is null then raise exception 'Connexion requise' using errcode='42501'; end if;
  if p_action='memberships' then
    return coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'name',a.profile->>'name'))
      from portal_private.staff s join portal_private.associations a on a.id=s.association_id
      where s.user_id=actor),'[]'::jsonb);
  end if;
  if not portal_private.is_staff(org) then raise exception 'Accès réservé à l’association' using errcode='42501'; end if;
  if p_action='create_slot' then
    if (p_data->>'startsAt')::timestamptz <= now() then raise exception 'Date passée' using errcode='22023'; end if;
    perform 1 from portal_private.associations where id=org for update;
    if exists(select 1 from portal_private.slots s where s.association_id=org and not s.closed
      and tstzrange(s.starts_at,s.ends_at) && tstzrange((p_data->>'startsAt')::timestamptz,(p_data->>'endsAt')::timestamptz))
    then raise exception 'Créneau déjà ouvert sur cette plage' using errcode='22023'; end if;
    insert into portal_private.slots(association_id,starts_at,ends_at,motif)
      values(org,(p_data->>'startsAt')::timestamptz,(p_data->>'endsAt')::timestamptz,p_data->>'motif');
  elsif p_action='close_slot' then
    perform 1 from portal_private.slots where id=item and association_id=org for update;
    if not found or exists (select 1 from portal_private.bookings where slot_id=item and status='confirmed')
    then raise exception 'Créneau introuvable ou réservé' using errcode='22023'; end if;
    update portal_private.slots set closed=true where id=item;
  elsif p_action='booking_status' then
    update portal_private.bookings b set status=p_data->>'status'
      from portal_private.slots s where b.id=item and b.slot_id=s.id and s.association_id=org
        and s.starts_at<=now() and b.status='confirmed' and p_data->>'status' in ('completed','absent');
    if not found then raise exception 'Rendez-vous indisponible' using errcode='22023'; end if;
  elsif p_action='orient' then
    select b.user_id into subject from portal_private.bookings b join portal_private.slots s on s.id=b.slot_id
      where b.id=item and s.association_id=org and b.status<>'cancelled';
    if subject is null then raise exception 'Dossier indisponible' using errcode='42501'; end if;
    return to_jsonb(portal_private.make_booking(subject,(p_data->>'slot')::uuid,p_data->>'name',p_data->>'motif',false,org));
  elsif p_action in ('reply','close_case') then
    perform 1 from portal_private.cases where id=item and association_id=org and status='open' for update;
    if not found then raise exception 'Conversation indisponible' using errcode='42501'; end if;
    if p_action='reply' then
      insert into portal_private.messages(case_id,from_staff,body) values(item,true,p_data->>'body');
    else
      update portal_private.cases set status='closed' where id=item;
    end if;
  elsif p_action='staff_message' then
    insert into portal_private.staff_messages(sender,recipient,body) values(org,(p_data->>'target')::uuid,p_data->>'body');
  elsif p_action='alert' then
    insert into portal_private.alerts(association_id,body) values(org,p_data->>'body');
  elsif p_action='resolve_alert' then
    update portal_private.alerts set resolved_at=now() where id=item and association_id=org;
  elsif p_action='write_passport' then
    select b.user_id into subject from portal_private.bookings b join portal_private.slots s on s.id=b.slot_id
      where b.id=item and s.association_id=org and b.status<>'cancelled';
    if subject is null then raise exception 'Dossier indisponible' using errcode='42501'; end if;
    if exists (select 1 from jsonb_array_elements_text(p_data->'summary') x(line) where length(btrim(line)) not between 1 and 500)
    then raise exception 'Indiquez cinq lignes de 500 caractères maximum' using errcode='22023'; end if;
    insert into portal_private.passports(user_id,association_id,summary)
      values(subject,org,array(select jsonb_array_elements_text(p_data->'summary')))
      on conflict(user_id,association_id) do update set summary=excluded.summary,updated_at=now();
    insert into portal_private.audit(actor_id,subject_id,association_id,action) values(actor,subject,org,'write_passport');
  elsif p_action='read_passport' then
    select * into passport from portal_private.passports where id=item;
    if not found or (passport.association_id<>org and not exists (
      select 1 from portal_private.consents where user_id=passport.user_id and source_id=passport.association_id
        and target_id=org and purpose='passport' and revoked_at is null and expires_at>now()
      for share
    )) then raise exception 'Dossier indisponible' using errcode='42501'; end if;
    insert into portal_private.audit(actor_id,subject_id,association_id,action) values(actor,passport.user_id,org,'read_passport');
    return jsonb_build_object('summary',passport.summary);
  elsif p_action='dashboard' then
    select jsonb_build_object(
      'slots',coalesce((select jsonb_agg(to_jsonb(s) || jsonb_build_object('reserved',exists(
        select 1 from portal_private.bookings b where b.slot_id=s.id and b.status='confirmed')) order by s.starts_at)
        from portal_private.slots s where s.association_id=org and s.starts_at>=now()-interval '7 days'),'[]'::jsonb),
      'bookings',coalesce((select jsonb_agg(jsonb_build_object(
        'id',b.id,'name',b.first_name,'status',b.status,'startsAt',s.starts_at) order by s.starts_at)
        from portal_private.bookings b join portal_private.slots s on s.id=b.slot_id
        where s.association_id=org and s.starts_at>=now()-interval '30 days'),'[]'::jsonb),
      'cases',coalesce((select jsonb_agg(jsonb_build_object(
        'id',c.id,'subject',c.subject,'status',c.status,'messages',
        coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'body',m.body,'staff',m.from_staff) order by m.created_at)
        from portal_private.messages m where m.case_id=c.id),'[]'::jsonb))
        order by c.created_at desc) from portal_private.cases c where c.association_id=org),'[]'::jsonb),
      'passports',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'association',a.profile->>'name','updatedAt',p.updated_at))
        from portal_private.passports p join portal_private.associations a on a.id=p.association_id
        where p.association_id=org or exists (select 1 from portal_private.consents c
          where c.target_id=org and c.user_id=p.user_id and c.source_id=p.association_id
            and c.purpose='passport' and c.revoked_at is null and c.expires_at>now())),'[]'::jsonb),
      'alerts',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'body',a.body,'own',a.association_id=org,
        'association',s.profile->>'name') order by a.created_at desc) from portal_private.alerts a
        join portal_private.associations s on s.id=a.association_id where a.resolved_at is null),'[]'::jsonb),
      'staffMessages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'body',m.body,
        'sender',s.profile->>'name','recipient',r.profile->>'name') order by m.created_at desc)
        from portal_private.staff_messages m join portal_private.associations s on s.id=m.sender
        join portal_private.associations r on r.id=m.recipient where m.sender=org or m.recipient=org),'[]'::jsonb),
      'resources',coalesce((select jsonb_agg(to_jsonb(r) order by r.title) from portal_private.resources r),'[]'::jsonb)
    ) into result;
    return result;
  else
    raise exception 'Action inconnue' using errcode='22023';
  end if;
  return 'null'::jsonb;
end;
$$;

create function public.portal_admin(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare item uuid := (p_data->>'id')::uuid; profile_data jsonb; request portal_private.association_applications;
begin
  if not exists (select 1 from portal_private.pilots where user_id=auth.uid())
  then raise exception 'Accès réservé aux pilotes' using errcode='42501'; end if;
  if p_action='review' then
    update portal_private.association_applications set status=p_data->>'status'
      where id=item and status='pending' and p_data->>'status' in ('approved','rejected') returning * into request;
    if not found then raise exception 'Demande indisponible' using errcode='22023'; end if;
    if request.status='approved' then
      insert into portal_private.associations(application_id,profile) values(request.id,
        jsonb_build_object('name',request.name,'shortName',request.name,'category',request.category,
          'address',request.address,'taoStop',request.tao_stop,'phone',request.phone,'hours',request.opening_hours,
          'mission',request.mission));
    end if;
  elsif p_action='save_association' then
    select jsonb_object_agg(key,value) into profile_data from jsonb_each(p_data->'profile')
      where key in ('name','shortName','category','secondaryCategories','quartier','isQpv','address','city','lat','lng',
        'taoStop','taoLine','phone','hours','publicAccueilli','mission','falcSummary','documentsRequired','languagesSpoken','procedures');
    if profile_data ? 'procedures' then
      if jsonb_typeof(profile_data->'procedures') <> 'array'
        or jsonb_array_length(profile_data->'procedures') > 100
      then raise exception 'Liste de démarches invalide' using errcode='22023'; end if;
      if exists (select 1 from jsonb_array_elements(profile_data->'procedures') d where
        not coalesce(d->>'code' ~ '^[a-z0-9-]{1,80}$' and length(btrim(d->>'title')) between 1 and 160
          and jsonb_typeof(d->'documents')='object',false))
        or exists (select 1 from jsonb_array_elements(profile_data->'procedures') d group by d->>'code' having count(*)>1)
        or exists (select 1 from jsonb_array_elements(profile_data->'procedures') d
          cross join lateral jsonb_each(d->'documents') l where l.key not in ('fr','en','es','ar','pt','uk')
            or jsonb_typeof(l.value)<>'array')
      then raise exception 'Code, titre ou liste de documents invalide pour une démarche' using errcode='22023'; end if;
      if exists(select 1 from jsonb_array_elements(profile_data->'procedures') d
        cross join lateral jsonb_each(d->'documents') l
        cross join lateral jsonb_array_elements(l.value) f
        where jsonb_typeof(f)<>'string' or length(f #>> '{}')>300)
      then raise exception 'Document de démarche invalide' using errcode='22023'; end if;
    end if;
    if item is null then
      insert into portal_private.associations(profile,published) values(profile_data,coalesce((p_data->>'published')::boolean,false));
    else
      update portal_private.associations set profile=profile_data,published=coalesce((p_data->>'published')::boolean,false) where id=item;
      if not found then raise exception 'Fiche introuvable' using errcode='22023'; end if;
    end if;
  elsif p_action='staff_access' then
    if coalesce((p_data->>'remove')::boolean,false) then
      delete from portal_private.staff where user_id=(p_data->>'user')::uuid and association_id=item;
    else
      insert into portal_private.staff(user_id,association_id) values((p_data->>'user')::uuid,item) on conflict do nothing;
    end if;
  elsif p_action='resource' then
    insert into portal_private.resources(title,url) values(p_data->>'title',p_data->>'url');
  elsif p_action='remove_resource' then
    delete from portal_private.resources where id=item;
  elsif p_action='save_help_center' then
    select jsonb_object_agg(key,value) into profile_data from jsonb_each(p_data->'profile')
      where key in ('name','type','address','quartier','taoStop','hours','phone','lat','lng');
    if not coalesce(length(btrim(profile_data->>'name'))>0 and (profile_data->>'lat')::numeric between -90 and 90
      and (profile_data->>'lng')::numeric between -180 and 180, false)
    then raise exception 'Nom et coordonnées valides requis' using errcode='22023'; end if;
    if item is null then
      insert into portal_private.help_centers(profile) values(profile_data);
    else
      update portal_private.help_centers set profile=profile_data where id=item;
    end if;
  elsif p_action='remove_help_center' then
    delete from portal_private.help_centers where id=item;
  elsif p_action='dashboard' then
    return jsonb_build_object(
      'applications',coalesce((select jsonb_agg(to_jsonb(a) order by a.charter_accepted_at desc)
        from portal_private.association_applications a where a.status='pending'),'[]'::jsonb),
      'associations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'profile',profile,'published',published)
        order by profile->>'name') from portal_private.associations),'[]'::jsonb),
      'resources',coalesce((select jsonb_agg(to_jsonb(r)) from portal_private.resources r),'[]'::jsonb),
      'helpCenters',coalesce((select jsonb_agg(h.profile || jsonb_build_object('id',h.id) order by h.profile->>'name')
        from portal_private.help_centers h),'[]'::jsonb),
      'stats', (with demand as (
        select a.profile->>'category' theme,a.profile->>'quartier' district,a.profile->'isQpv' = 'true'::jsonb qpv,
          greatest(0,extract(epoch from (s.starts_at-b.created_at))/86400) wait_days,b.status
        from portal_private.bookings b join portal_private.slots s on s.id=b.slot_id
        join portal_private.associations a on a.id=s.association_id
      ), capacity as (
        select count(*) total, count(*) filter (where exists (select 1 from portal_private.bookings b
          where b.slot_id=s.id and b.status='confirmed')) reserved
        from portal_private.slots s where not s.closed and s.starts_at between now() and now()+interval '30 days'
      )
      select jsonb_build_object('total', case when count(*)>=5 then count(*) end,
        'completed',case when count(*) filter (where status='completed')>=5 then count(*) filter (where status='completed') end,
        'waitDays',case when count(*)>=5 then round(avg(wait_days),1) end,
        'saturation',(select case when total>=5 and reserved>=5 and total-reserved>=5 then round(100.0*reserved/total,1) end from capacity),
        'themes',coalesce((select jsonb_agg(to_jsonb(x)) from (select theme,count(*) volume from demand group by theme having count(*)>=5) x),'[]'::jsonb),
        'districts',coalesce((select jsonb_agg(to_jsonb(x)) from (select district,qpv,count(*) volume from demand
          where district is not null group by district,qpv having count(*)>=5) x),'[]'::jsonb)) from demand)
    );
  else
    raise exception 'Action inconnue' using errcode='22023';
  end if;
  return 'null'::jsonb;
end;
$$;

revoke all on function public.portal_user(text,jsonb), public.portal_staff(text,jsonb), public.portal_admin(text,jsonb)
  from public, anon, authenticated;
grant execute on function public.portal_user(text,jsonb), public.portal_staff(text,jsonb), public.portal_admin(text,jsonb)
  to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('portal-vault','portal-vault',false,10485760,array['application/pdf','image/jpeg','image/png']);
create policy portal_vault_read on storage.objects for select to authenticated
  using (bucket_id='portal-vault' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy portal_vault_upload on storage.objects for insert to authenticated
  with check (bucket_id='portal-vault' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy portal_vault_delete on storage.objects for delete to authenticated
  using (bucket_id='portal-vault' and (storage.foldername(name))[1]=(select auth.uid())::text);

commit;
