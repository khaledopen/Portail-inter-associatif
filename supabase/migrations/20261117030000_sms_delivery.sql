begin;

create function public.portal_claim_sms() returns jsonb
language sql security definer set search_path = '' as $$
  with todo as (
    select j.id from portal_private.sms_jobs j
    join portal_private.bookings b on b.id=j.booking_id
    join portal_private.slots s on s.id=b.slot_id
    where j.sent_at is null and j.attempts<6 and j.due_at<=now()
      and (j.locked_until is null or j.locked_until<=now())
      and ((j.kind='cancellation' and b.status='cancelled')
        or (j.kind<>'cancellation' and b.status='confirmed' and s.starts_at>now()))
    order by j.due_at limit 10 for update of j skip locked
  ), leased as (
    update portal_private.sms_jobs j set locked_until=now()+interval '5 minutes',
      lease=gen_random_uuid(),attempts=j.attempts+1 from todo where j.id=todo.id returning j.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',j.id,'lease',j.lease,'kind',j.kind,'booking',b.id,'cancelToken',b.cancels_with,
    'phone',b.phone,'startsAt',s.starts_at,'association',a.profile->>'name',
    'address',concat_ws(', ',a.profile->>'address',a.profile->>'city'),
    'documents',b.documents
  )),'[]'::jsonb)
  from leased j join portal_private.bookings b on b.id=j.booking_id
  join portal_private.slots s on s.id=b.slot_id
  join portal_private.associations a on a.id=s.association_id
$$;

create function public.portal_finish_sms(p_id uuid,p_lease uuid,p_delivered boolean) returns void
language sql security definer set search_path = '' as $$
  update portal_private.sms_jobs set
    sent_at=case when p_delivered then now() else null end,
    due_at=case when p_delivered then due_at else now()+make_interval(mins=>attempts*5) end,
    locked_until=null,lease=null
  where id=p_id and lease=p_lease and sent_at is null
$$;

revoke all on function public.portal_claim_sms(), public.portal_finish_sms(uuid,uuid,boolean)
  from public, anon, authenticated;
grant execute on function public.portal_claim_sms(), public.portal_finish_sms(uuid,uuid,boolean) to service_role;

commit;
