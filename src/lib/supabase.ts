import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export type AttendanceAction = "check_in" | "check_out";

export interface ChildRow {
  id: string;
  full_name: string;
  created_at: string;
}

export interface AttendanceRow {
  id: string;
  child_id: string;
  action: AttendanceAction;
  location_name: string;
  created_at: string;
  children?: {
    full_name: string;
  } | null;
}

export interface AssociationProfileRow {
  id: string;
  owner_id: string;
  association_name: string;
  qr_code_value: string;
  created_at: string;
}

export const getQrCodeImageUrl = (value: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(value)}`;

export const DATABASE_SETUP_SQL = `create extension if not exists pgcrypto;

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  full_name text not null check (char_length(trim(full_name)) > 1),
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  child_id uuid not null references public.children(id) on delete cascade,
  action text not null check (action in ('check_in', 'check_out')),
  location_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.association_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) default auth.uid(),
  association_name text not null default 'La tua associazione',
  qr_code_value text not null unique,
  created_at timestamptz not null default now()
);

alter table public.children enable row level security;
alter table public.attendance_events enable row level security;
alter table public.association_profiles enable row level security;

drop policy if exists "children_select_own" on public.children;
create policy "children_select_own"
  on public.children
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "children_insert_own" on public.children;
create policy "children_insert_own"
  on public.children
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "children_delete_own" on public.children;
create policy "children_delete_own"
  on public.children
  for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "attendance_select_own" on public.attendance_events;
create policy "attendance_select_own"
  on public.attendance_events
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "attendance_insert_own" on public.attendance_events;
create policy "attendance_insert_own"
  on public.attendance_events
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "association_profiles_select_own" on public.association_profiles;
create policy "association_profiles_select_own"
  on public.association_profiles
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "association_profiles_insert_own" on public.association_profiles;
create policy "association_profiles_insert_own"
  on public.association_profiles
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "association_profiles_update_own" on public.association_profiles;
create policy "association_profiles_update_own"
  on public.association_profiles
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());`;
