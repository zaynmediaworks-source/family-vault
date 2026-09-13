create table public.music_tracks(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 160),artist text not null default '',url text not null check(url like 'https://%'),sort_order integer not null default 0,enabled boolean not null default true,created_at timestamptz not null default now());
create table public.music_settings(id boolean primary key default true check(id),enabled boolean not null default false,mode text not null default 'daily' check(mode in ('daily','playlist')),daily_track_id uuid references public.music_tracks(id) on delete set null);
insert into public.music_settings(id) values(true);
alter table public.music_tracks enable row level security;
alter table public.music_settings enable row level security;
grant select,insert,update,delete on public.music_tracks to authenticated;
grant select,update on public.music_settings to authenticated;
create policy music_read on public.music_tracks for select to authenticated using(true);
create policy music_admin on public.music_tracks for all to authenticated using((select private.is_platform_admin())) with check((select private.is_platform_admin()));
create policy music_settings_read on public.music_settings for select to authenticated using(true);
create policy music_settings_admin on public.music_settings for update to authenticated using((select private.is_platform_admin())) with check((select private.is_platform_admin()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('vault-music','vault-music',true,20971520,array['audio/mpeg','audio/mp3']) on conflict(id) do nothing;
create policy music_upload on storage.objects for insert to authenticated with check(bucket_id='vault-music' and (select private.is_platform_admin()));
create policy music_delete on storage.objects for delete to authenticated using(bucket_id='vault-music' and (select private.is_platform_admin()));
create policy music_storage_read on storage.objects for select to authenticated using(bucket_id='vault-music');

