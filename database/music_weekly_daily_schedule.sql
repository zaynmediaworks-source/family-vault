alter table public.music_settings
add column daily_schedule jsonb not null default '{}'::jsonb check (jsonb_typeof(daily_schedule) = 'object'),
add column daily_timezone text not null default 'Asia/Makassar' check (daily_timezone in ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura'));
