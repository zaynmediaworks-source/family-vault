-- Run after the existing Family Vault schema. No financial rows are changed.
create or replace function private.add_household_creator()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or new.created_by is distinct from auth.uid() then
    raise exception 'Authentication required';
  end if;
  insert into public.household_members (household_id,user_id,role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$;
revoke all on function private.add_household_creator() from public, anon, authenticated;
create trigger household_creator_membership
after insert on public.households for each row execute function private.add_household_creator();

drop policy members_insert on public.household_members;
create policy members_insert on public.household_members
for insert to authenticated
with check ((select private.is_household_owner(household_id)));
