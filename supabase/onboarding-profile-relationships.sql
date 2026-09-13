begin;

alter table public.profiles
  add column if not exists contact_phone text;

alter table public.profiles
  drop constraint if exists profiles_contact_phone_length,
  add constraint profiles_contact_phone_length
    check (contact_phone is null or char_length(contact_phone) between 7 and 31);

alter table public.household_members
  add column if not exists relationship text not null default 'family_member';

alter table public.household_join_requests
  add column if not exists relationship text not null default 'family_member';

alter table public.household_members
  drop constraint if exists household_members_relationship_check,
  add constraint household_members_relationship_check
    check (relationship in ('self','husband','wife','partner','child','parent','sibling','guardian','family_member','other'));

alter table public.household_join_requests
  drop constraint if exists household_join_requests_relationship_check,
  add constraint household_join_requests_relationship_check
    check (relationship in ('husband','wife','partner','child','parent','sibling','guardian','family_member','other'));

update public.household_members hm
set relationship='self'
from public.households h
where h.id=hm.household_id
  and h.vault_type='personal'
  and hm.role='owner'
  and hm.relationship='family_member';

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_name text;
  v_phone text;
begin
  v_name := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'display_name','')),80),'');
  v_phone := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'contact_phone','')),31),'');
  if v_phone is not null and v_phone !~ '^[+0-9][0-9 ()-]{6,30}$' then
    v_phone := null;
  end if;

  insert into public.profiles(id,email,display_name,contact_phone,status,can_create_household,approved_at)
  values(new.id,new.email,v_name,v_phone,'approved',false,now())
  on conflict(id) do update
    set email=excluded.email,
        display_name=coalesce(public.profiles.display_name,excluded.display_name),
        contact_phone=coalesce(public.profiles.contact_phone,excluded.contact_phone);
  return new;
end;
$$;

create or replace function public.create_household_with_relationship(
  p_name text,
  p_vault_type text,
  p_relationship text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_household_id uuid;
  v_name text := btrim(coalesce(p_name,''));
  v_type text := lower(btrim(coalesce(p_vault_type,'')));
  v_relationship text := lower(btrim(coalesce(p_relationship,'')));
begin
  if auth.uid() is null then raise exception 'Kamu perlu login terlebih dahulu'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and status='approved') then
    raise exception 'Akun belum aktif';
  end if;
  if char_length(v_name) not between 2 and 80 then raise exception 'Nama Vault harus 2 sampai 80 karakter'; end if;
  if v_type not in ('personal','shared') then raise exception 'Jenis Vault tidak valid'; end if;

  if v_type='personal' then
    v_relationship := 'self';
  elsif v_relationship not in ('husband','wife','partner','child','parent','sibling','guardian','family_member','other') then
    raise exception 'Peran keluarga tidak valid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  if exists(select 1 from public.household_members where user_id=auth.uid()) then
    raise exception 'Kamu sudah memiliki atau menjadi anggota Vault';
  end if;

  insert into public.households(name,created_by,status,vault_type)
  values(v_name,auth.uid(),'pending',v_type)
  returning id into v_household_id;

  update public.household_members
  set relationship=v_relationship
  where household_id=v_household_id and user_id=auth.uid() and role='owner';

  insert into public.security_events(actor_user_id,household_id,event_type,detail)
  values(auth.uid(),v_household_id,'household_created',jsonb_build_object('vault_type',v_type));

  return v_household_id;
end;
$$;

revoke all on function public.create_household_with_relationship(text,text,text) from public, anon;
grant execute on function public.create_household_with_relationship(text,text,text) to authenticated;

create or replace function public.create_household_invite(p_household_id uuid)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  c text;
  v_count integer;
begin
  if auth.uid() is null then raise exception 'Kamu perlu login terlebih dahulu'; end if;
  if not private.is_household_owner(p_household_id) then raise exception 'Hanya Owner yang dapat mengundang anggota'; end if;
  if not exists(select 1 from public.households where id=p_household_id and status='active' and vault_type='shared') then
    raise exception 'Undangan hanya tersedia untuk Shared Vault yang aktif';
  end if;
  select count(*) into v_count from public.household_members where household_id=p_household_id;
  if v_count>=10 then raise exception 'Vault sudah penuh (maksimal 10 anggota)'; end if;
  c := upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  insert into public.household_invites(household_id,code,created_by) values(p_household_id,c,auth.uid());
  insert into public.security_events(actor_user_id,household_id,event_type,detail) values(auth.uid(),p_household_id,'invite_created','{}'::jsonb);
  return c;
end;
$$;

revoke all on function public.create_household_invite(uuid) from public, anon;
grant execute on function public.create_household_invite(uuid) to authenticated;

drop function if exists public.join_household_by_code(text);

create function public.join_household_by_code(p_code text,p_relationship text default 'family_member')
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_invite uuid;
  v_household uuid;
  v_request uuid;
  v_count integer;
  v_relationship text := lower(btrim(coalesce(p_relationship,'')));
begin
  if auth.uid() is null then raise exception 'Kamu perlu login terlebih dahulu'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and status='approved') then
    raise exception 'Akun belum aktif';
  end if;
  if v_relationship not in ('husband','wife','partner','child','parent','sibling','guardian','family_member','other') then
    raise exception 'Peran keluarga tidak valid';
  end if;

  select i.id,i.household_id into v_invite,v_household
  from public.household_invites i
  join public.households h on h.id=i.household_id
  where i.code=upper(trim(p_code))
    and i.used_at is null
    and i.expires_at>now()
    and h.status='active'
    and h.vault_type='shared'
  order by i.created_at desc
  limit 1
  for update of i;

  if v_invite is null then raise exception 'Kode undangan tidak valid, Vault belum aktif, atau kode sudah kedaluwarsa'; end if;
  if exists(select 1 from public.household_members where user_id=auth.uid() and household_id=v_household) then
    raise exception 'Kamu sudah menjadi anggota Vault ini';
  end if;

  select count(*) into v_count from public.household_members where household_id=v_household;
  if v_count>=10 then raise exception 'Vault sudah penuh (maksimal 10 anggota)'; end if;

  insert into public.household_join_requests(household_id,user_id,invite_id,status,relationship)
  values(v_household,auth.uid(),v_invite,'pending',v_relationship)
  on conflict (household_id,user_id) where status='pending'
  do update set requested_at=now(),relationship=excluded.relationship
  returning id into v_request;

  update public.household_invites set used_by=auth.uid(),used_at=now() where id=v_invite;
  insert into public.security_events(actor_user_id,household_id,event_type,detail)
  values(auth.uid(),v_household,'household_join_requested',jsonb_build_object('request_id',v_request,'relationship',v_relationship));
  return v_request;
end;
$$;

revoke all on function public.join_household_by_code(text,text) from public, anon;
grant execute on function public.join_household_by_code(text,text) to authenticated;

create or replace function public.approve_household_join_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  r public.household_join_requests%rowtype;
  v_count integer;
begin
  if auth.uid() is null then raise exception 'Kamu perlu login terlebih dahulu'; end if;
  select * into r from public.household_join_requests where id=p_request_id for update;
  if r.id is null then raise exception 'Permintaan tidak ditemukan'; end if;
  if not private.is_household_owner(r.household_id) then raise exception 'Hanya Owner Vault yang dapat menyetujui'; end if;
  if r.status<>'pending' then raise exception 'Permintaan ini sudah diproses'; end if;
  if not exists(select 1 from public.households where id=r.household_id and status='active' and vault_type='shared') then
    raise exception 'Shared Vault belum aktif';
  end if;
  select count(*) into v_count from public.household_members where household_id=r.household_id;
  if v_count>=10 then raise exception 'Vault sudah penuh (maksimal 10 anggota)'; end if;

  insert into public.household_members(household_id,user_id,role,relationship)
  values(r.household_id,r.user_id,'member',r.relationship)
  on conflict(household_id,user_id) do nothing;

  update public.household_join_requests
  set status='approved',reviewed_by=auth.uid(),reviewed_at=now()
  where id=r.id;

  insert into public.security_events(actor_user_id,household_id,event_type,detail)
  values(auth.uid(),r.household_id,'household_join_approved',jsonb_build_object('request_id',r.id,'user_id',r.user_id,'relationship',r.relationship));
  return r.household_id;
end;
$$;

create or replace function public.reject_household_join_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  r public.household_join_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Kamu perlu login terlebih dahulu'; end if;
  select * into r from public.household_join_requests where id=p_request_id for update;
  if r.id is null then raise exception 'Permintaan tidak ditemukan'; end if;
  if not private.is_household_owner(r.household_id) then raise exception 'Hanya Owner Vault yang dapat menolak'; end if;
  if r.status<>'pending' then raise exception 'Permintaan ini sudah diproses'; end if;

  update public.household_join_requests
  set status='rejected',reviewed_by=auth.uid(),reviewed_at=now()
  where id=r.id;

  insert into public.security_events(actor_user_id,household_id,event_type,detail)
  values(auth.uid(),r.household_id,'household_join_rejected',jsonb_build_object('request_id',r.id,'user_id',r.user_id));
  return r.household_id;
end;
$$;

revoke all on function public.approve_household_join_request(uuid) from public, anon;
revoke all on function public.reject_household_join_request(uuid) from public, anon;
grant execute on function public.approve_household_join_request(uuid) to authenticated;
grant execute on function public.reject_household_join_request(uuid) to authenticated;

drop function if exists public.get_household_join_requests(uuid);

create function public.get_household_join_requests(p_household_id uuid)
returns table(
  request_id uuid,
  user_id uuid,
  display_name text,
  email text,
  contact_phone text,
  relationship text,
  status text,
  requested_at timestamptz
)
language sql
security definer
set search_path=''
as $$
  select r.id,r.user_id,p.display_name,p.email,p.contact_phone,r.relationship,r.status,r.requested_at
  from public.household_join_requests r
  left join public.profiles p on p.id=r.user_id
  where r.household_id=p_household_id
    and private.is_household_owner(p_household_id)
  order by r.requested_at desc;
$$;

revoke all on function public.get_household_join_requests(uuid) from public, anon;
grant execute on function public.get_household_join_requests(uuid) to authenticated;

notify pgrst,'reload schema';
commit;

