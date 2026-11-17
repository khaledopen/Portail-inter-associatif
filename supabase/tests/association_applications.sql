begin;

set local role anon;

do $$
begin
  begin
    perform id from portal_private.association_applications;
    raise exception 'Anonymous read unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.submit_association_application(
      'W000000000', 'Test association', 'droits', '12 rue Test',
      'Gare', '02 38 00 00 00', 'test@example.org', 'Lundi', 'Test', false
    );
    raise exception 'Submission without charter unexpectedly succeeded';
  exception when invalid_parameter_value then
    null;
  end;

  begin
    perform public.submit_association_application(
      'incorrect', 'Test association', 'droits', '12 rue Test',
      'Gare', '02 38 00 00 00', 'test@example.org', 'Lundi', 'Test', true
    );
    raise exception 'Invalid organization number unexpectedly succeeded';
  exception when check_violation then
    null;
  end;
end;
$$;

select public.submit_association_application(
  'w 000000000', 'Test association', 'droits', '12 rue Test',
  'Gare', '02 38 00 00 00', 'test@example.org', 'Lundi', 'Test', true
);
select public.submit_association_application(
  'W000000000', 'Un autre nom', 'droits', '12 rue Test',
  'Gare', '02 38 00 00 00', 'test@example.org', 'Lundi', 'Test', true
);

reset role;

do $$
begin
  if (select count(*) from portal_private.association_applications
      where organization_number = 'W000000000' and status = 'pending') <> 1
  or not exists (
    select 1 from portal_private.association_applications
    where organization_number = 'W000000000' and status = 'pending'
      and name = 'Test association' and phone = '0238000000'
      and charter_accepted_at is not null
  ) then
    raise exception 'Submission was not persisted, normalized, or deduplicated as expected';
  end if;
end;
$$;

rollback;
