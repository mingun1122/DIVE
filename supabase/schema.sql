-- 게코섬 Supabase 기본 스키마
create extension if not exists pgcrypto;

create table if not exists public.geckos (
  id uuid primary key default gen_random_uuid(),
  species text not null,
  morph text not null,
  sex text not null default '미구분',
  hatch_date date,
  age text,
  price integer not null default 0,
  status text not null default '분양 가능'
    check (status in ('분양 가능', '예약중', '분양완료')),
  description text,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.geckos enable row level security;

drop policy if exists "public_read_geckos" on public.geckos;
create policy "public_read_geckos"
on public.geckos for select
to anon, authenticated
using (true);

drop policy if exists "authenticated_insert_geckos" on public.geckos;
create policy "authenticated_insert_geckos"
on public.geckos for insert
to authenticated
with check (true);

drop policy if exists "authenticated_update_geckos" on public.geckos;
create policy "authenticated_update_geckos"
on public.geckos for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_delete_geckos" on public.geckos;
create policy "authenticated_delete_geckos"
on public.geckos for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('geckos', 'geckos', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_gecko_images" on storage.objects;
create policy "public_read_gecko_images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'geckos');

drop policy if exists "authenticated_upload_gecko_images" on storage.objects;
create policy "authenticated_upload_gecko_images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'geckos');

drop policy if exists "authenticated_update_gecko_images" on storage.objects;
create policy "authenticated_update_gecko_images"
on storage.objects for update
to authenticated
using (bucket_id = 'geckos');

drop policy if exists "authenticated_delete_gecko_images" on storage.objects;
create policy "authenticated_delete_gecko_images"
on storage.objects for delete
to authenticated
using (bucket_id = 'geckos');
