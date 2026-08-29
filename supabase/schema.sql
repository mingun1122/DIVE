create extension if not exists pgcrypto;

create table if not exists public.geckos (
  id uuid primary key default gen_random_uuid(),
  individual_id text,
  species text not null,
  morph text not null,
  sex text not null default '미구분',
  hatch_date date,
  age text,
  weight text,
  price integer not null default 0,
  status text not null default '분양 가능' check (status in ('분양 가능','예약중','분양완료')),
  description text,
  detail text,
  tags text[] not null default '{}',
  images jsonb not null default '[]'::jsonb,
  is_visible boolean not null default true,
  instagram_media_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
 );

-- 이전 버전의 geckos 테이블이 이미 있어도 필요한 컬럼을 안전하게 추가합니다.
alter table public.geckos add column if not exists individual_id text;
alter table public.geckos add column if not exists species text;
alter table public.geckos add column if not exists morph text;
alter table public.geckos add column if not exists sex text default '미구분';
alter table public.geckos add column if not exists hatch_date date;
alter table public.geckos add column if not exists age text;
alter table public.geckos add column if not exists weight text;
alter table public.geckos add column if not exists price integer default 0;
alter table public.geckos add column if not exists status text default '분양 가능';
alter table public.geckos add column if not exists description text;
alter table public.geckos add column if not exists detail text;
alter table public.geckos add column if not exists tags text[] default '{}';
alter table public.geckos add column if not exists images jsonb default '[]'::jsonb;
alter table public.geckos add column if not exists is_visible boolean default true;
alter table public.geckos add column if not exists instagram_media_id text;
alter table public.geckos add column if not exists created_at timestamptz default now();
alter table public.geckos add column if not exists updated_at timestamptz default now();

create index if not exists geckos_created_at_idx on public.geckos(created_at desc);
create index if not exists geckos_visible_idx on public.geckos(is_visible);

alter table public.geckos enable row level security;
-- 이전 게코섬 버전에서 만들었던 정책도 제거해 중복 권한을 방지합니다.
drop policy if exists "public_read_geckos" on public.geckos;
drop policy if exists "authenticated_insert_geckos" on public.geckos;
drop policy if exists "authenticated_update_geckos" on public.geckos;
drop policy if exists "authenticated_delete_geckos" on public.geckos;
drop policy if exists "public_read_visible_geckos" on public.geckos;
create policy "public_read_visible_geckos" on public.geckos for select to anon using (is_visible = true);
drop policy if exists "admin_read_all_geckos" on public.geckos;
create policy "admin_read_all_geckos" on public.geckos for select to authenticated using (true);
drop policy if exists "admin_insert_geckos" on public.geckos;
create policy "admin_insert_geckos" on public.geckos for insert to authenticated with check (true);
drop policy if exists "admin_update_geckos" on public.geckos;
create policy "admin_update_geckos" on public.geckos for update to authenticated using (true) with check (true);
drop policy if exists "admin_delete_geckos" on public.geckos;
create policy "admin_delete_geckos" on public.geckos for delete to authenticated using (true);

create table if not exists public.instagram_posts (
  id uuid primary key default gen_random_uuid(),
  media_id text,
  caption text,
  images jsonb not null default '[]'::jsonb,
  target text not null default 'instagram',
  related_gecko_id uuid references public.geckos(id) on delete set null,
  status text not null default 'published',
  created_at timestamptz not null default now()
);
alter table public.instagram_posts enable row level security;
drop policy if exists "admin_read_instagram_posts" on public.instagram_posts;
create policy "admin_read_instagram_posts" on public.instagram_posts for select to authenticated using (true);
drop policy if exists "admin_insert_instagram_posts" on public.instagram_posts;
create policy "admin_insert_instagram_posts" on public.instagram_posts for insert to authenticated with check (true);

insert into storage.buckets (id,name,public) values ('geckos','geckos',true) on conflict (id) do update set public=true;
drop policy if exists "public_read_gecko_images" on storage.objects;
create policy "public_read_gecko_images" on storage.objects for select to anon,authenticated using (bucket_id='geckos');
drop policy if exists "admin_upload_gecko_images" on storage.objects;
create policy "admin_upload_gecko_images" on storage.objects for insert to authenticated with check (bucket_id='geckos');
drop policy if exists "admin_update_gecko_images" on storage.objects;
create policy "admin_update_gecko_images" on storage.objects for update to authenticated using (bucket_id='geckos') with check (bucket_id='geckos');
drop policy if exists "admin_delete_gecko_images" on storage.objects;
create policy "admin_delete_gecko_images" on storage.objects for delete to authenticated using (bucket_id='geckos');
