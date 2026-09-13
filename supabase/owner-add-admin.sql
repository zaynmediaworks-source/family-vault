create or replace function public.add_platform_admin(p_email text) returns void language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
if auth.uid() is distinct from '459cd4b7-a14d-4604-b06d-1eea3ba90c70'::uuid or not private.is_platform_admin() then raise exception 'Hanya pemilik platform dengan verifikasi Admin yang dapat menambah Admin'; end if;
select u.id into target from auth.users u join public.profiles p on p.id=u.id where lower(u.email)=lower(btrim(p_email)) and p.status='approved' and u.email_confirmed_at is not null;
if target is null then raise exception 'Akun aktif dengan email terverifikasi tidak ditemukan'; end if;
insert into public.platform_admins(user_id,role) values(target,'admin') on conflict(user_id) do nothing;
insert into public.security_events(actor_user_id,event_type,detail) values(auth.uid(),'platform_admin_added',jsonb_build_object('user_id',target));
end $$;
revoke all on function public.add_platform_admin(text) from public,anon;
grant execute on function public.add_platform_admin(text) to authenticated;

