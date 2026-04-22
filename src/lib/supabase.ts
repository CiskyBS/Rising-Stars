import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export type UserRole = "admin" | "parent";
export type AttendanceAction = "check_in" | "check_out";
export type DocumentType =
  | "terms_conditions"
  | "data_policy"
  | "data_deletion"
  | "privacy_policy"
  | "image_policy";
export type LegalRole = "mother" | "father" | "legal_guardian" | "other";
export type EmergencyActionPlan = "call_parent_first" | "call_ambulance_if_needed";
export type ImageUsageConsent = "none" | "internal_only" | "public_allowed";

export interface AssociationProfileRow {
  id: string;
  owner_id: string;
  association_name: string;
  app_title: string;
  invite_code: string;
  qr_code_value: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_data_url: string;
  is_public: boolean;
  created_at: string;
}

export interface UserProfileRow {
  id: string;
  owner_id: string;
  association_id: string | null;
  role: UserRole;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  alternate_phone: string;
  legal_role: LegalRole;
  locale: string;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  created_at: string;
}

export interface ChildRow {
  id: string;
  association_id: string | null;
  parent_user_id: string | null;
  full_name: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  place_of_birth: string;
  fiscal_code: string;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  allergies: string;
  medical_conditions: string;
  medications: string;
  dietary_notes: string;
  epi_pen_required: boolean;
  epi_pen_notes: string;
  emergency_action_plan: EmergencyActionPlan;
  doctor_name: string;
  doctor_phone: string;
  image_usage_consent: ImageUsageConsent;
  additional_notes: string;
  created_at: string;
}

export interface AttendanceRow {
  id: string;
  association_id: string | null;
  child_id: string;
  action: AttendanceAction;
  location_name: string;
  created_at: string;
  children?: {
    full_name: string;
  } | null;
}

export interface AuthorizedContactRow {
  id: string;
  child_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  can_drop_off: boolean;
  can_pick_up: boolean;
  document_number: string;
  verification_note: string;
  created_at: string;
}

export interface AssociationDocumentRow {
  id: string;
  association_id: string;
  document_type: DocumentType;
  title: string;
  file_name: string;
  file_data: string;
  required: boolean;
  uploaded_at: string;
}

export interface DocumentAcceptanceRow {
  id: string;
  association_id: string;
  document_id: string;
  parent_user_id: string;
  accepted: boolean;
  accepted_at: string;
}

export interface AuditLogRow {
  id: string;
  association_id: string | null;
  actor_user_id: string | null;
  actor_role: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ParentRegistrationForm {
  locale: string;
  first_name: string;
  last_name: string;
  phone: string;
  alternate_phone: string;
  legal_role: LegalRole;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  email: string;
  password: string;
}

export interface ChildFormValues {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  place_of_birth: string;
  fiscal_code: string;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  allergies: string;
  medical_conditions: string;
  medications: string;
  dietary_notes: string;
  epi_pen_required: boolean;
  epi_pen_notes: string;
  emergency_action_plan: EmergencyActionPlan;
  doctor_name: string;
  doctor_phone: string;
  image_usage_consent: ImageUsageConsent;
  additional_notes: string;
}

export interface AuthorizedContactValues {
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  can_drop_off: boolean;
  can_pick_up: boolean;
  document_number: string;
  verification_note: string;
}

export const REQUIRED_DOCUMENTS: { type: DocumentType; label: string; description: string }[] = [
  {
    type: "terms_conditions",
    label: "Termini e condizioni",
    description: "Regole generali di adesione all'associazione e utilizzo del servizio.",
  },
  {
    type: "data_policy",
    label: "Policy sui dati personali",
    description: "Informazioni su raccolta, gestione e conservazione dei dati.",
  },
  {
    type: "data_deletion",
    label: "Cancellazione dei dati personali",
    description: "Procedure e diritti relativi alla rimozione dei dati.",
  },
  {
    type: "privacy_policy",
    label: "Informativa sulla privacy",
    description: "Consenso informato relativo alla privacy dell'intero nucleo familiare.",
  },
  {
    type: "image_policy",
    label: "Autorizzazione uso immagini",
    description: "Scelta fra nessun utilizzo, uso interno o libero utilizzo delle immagini.",
  },
];

export const getQrCodeImageUrl = (value: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(value)}`;

export const createInviteCode = () => `RS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

export const createQrValue = (seed?: string) => `rising-stars:${seed ?? "association"}:${crypto.randomUUID()}`;

export const buildChildFullName = (values: Pick<ChildFormValues, "first_name" | "last_name">) =>
  `${values.first_name.trim()} ${values.last_name.trim()}`.trim();

export const getEmptyChildForm = (): ChildFormValues => ({
  first_name: "",
  last_name: "",
  birth_date: "",
  gender: "",
  place_of_birth: "",
  fiscal_code: "",
  street_address: "",
  city: "",
  postal_code: "",
  country: "Italia",
  allergies: "",
  medical_conditions: "",
  medications: "",
  dietary_notes: "",
  epi_pen_required: false,
  epi_pen_notes: "",
  emergency_action_plan: "call_parent_first",
  doctor_name: "",
  doctor_phone: "",
  image_usage_consent: "internal_only",
  additional_notes: "",
});

export const getEmptyAuthorizedContact = (): AuthorizedContactValues => ({
  full_name: "",
  relationship: "",
  phone: "",
  email: "",
  can_drop_off: true,
  can_pick_up: true,
  document_number: "",
  verification_note: "",
});

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Impossibile leggere il file"));
    reader.readAsDataURL(file);
  });

export const logAuditEvent = async ({
  associationId,
  actorRole,
  entityType,
  entityId,
  action,
  details,
}: {
  associationId?: string | null;
  actorRole: UserRole | "system";
  entityType: string;
  entityId?: string | null;
  action: string;
  details?: Record<string, unknown>;
}) => {
  if (!supabase) {
    return;
  }

  await supabase.from("audit_logs").insert({
    association_id: associationId ?? null,
    actor_role: actorRole,
    entity_type: entityType,
    entity_id: entityId ?? null,
    action,
    details: details ?? null,
  });
};

export const getUserProfile = async (ownerId: string) => {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  return (data ?? null) as UserProfileRow | null;
};

export const ensureAdminContext = async (user: User) => {
  if (!supabase) {
    return null;
  }

  let { data: associationData } = await supabase
    .from("association_profiles")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!associationData) {
    const defaultName = user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "La tua associazione";

    const { data: insertedAssociation, error: associationError } = await supabase
      .from("association_profiles")
      .insert({
        owner_id: user.id,
        association_name: defaultName,
        app_title: `${defaultName} Families`,
        invite_code: createInviteCode(),
        qr_code_value: createQrValue(user.id),
      })
      .select("*")
      .single();

    if (associationError) {
      throw associationError;
    }

    associationData = insertedAssociation;
  }

  let { data: profileData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!profileData) {
    const firstName = user.email?.split("@")[0]?.split(/[._-]/)[0] || "Admin";
    const { data: insertedProfile, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        owner_id: user.id,
        association_id: associationData.id,
        role: "admin",
        email: user.email ?? "",
        first_name: firstName,
        last_name: "",
        legal_role: "legal_guardian",
      })
      .select("*")
      .single();

    if (profileError) {
      throw profileError;
    }

    profileData = insertedProfile;
  }

  return {
    association: associationData as AssociationProfileRow,
    profile: profileData as UserProfileRow,
  };
};

export const DATABASE_SETUP_SQL = `create extension if not exists pgcrypto;

create table if not exists public.association_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  association_name text not null default 'La tua associazione',
  app_title text not null default 'Family Portal',
  invite_code text not null default 'TEMP-CODE',
  qr_code_value text not null default 'TEMP-QR',
  primary_color text not null default '#0f766e',
  secondary_color text not null default '#f59e0b',
  accent_color text not null default '#7c3aed',
  logo_data_url text not null default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.association_profiles add column if not exists app_title text not null default 'Family Portal';
alter table public.association_profiles add column if not exists invite_code text not null default 'TEMP-CODE';
alter table public.association_profiles add column if not exists qr_code_value text not null default 'TEMP-QR';
alter table public.association_profiles add column if not exists primary_color text not null default '#0f766e';
alter table public.association_profiles add column if not exists secondary_color text not null default '#f59e0b';
alter table public.association_profiles add column if not exists accent_color text not null default '#7c3aed';
alter table public.association_profiles add column if not exists logo_data_url text not null default '';
alter table public.association_profiles add column if not exists is_public boolean not null default true;
create unique index if not exists association_profiles_owner_id_idx on public.association_profiles(owner_id);
create unique index if not exists association_profiles_invite_code_idx on public.association_profiles(invite_code);
create unique index if not exists association_profiles_qr_code_value_idx on public.association_profiles(qr_code_value);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  association_id uuid references public.association_profiles(id) on delete cascade,
  role text not null default 'parent' check (role in ('admin', 'parent')),
  email text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  alternate_phone text not null default '',
  legal_role text not null default 'other' check (legal_role in ('mother', 'father', 'legal_guardian', 'other')),
  locale text not null default 'it',
  street_address text not null default '',
  city text not null default '',
  postal_code text not null default '',
  country text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists user_profiles_owner_id_idx on public.user_profiles(owner_id);
create index if not exists user_profiles_association_id_idx on public.user_profiles(association_id);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  association_id uuid references public.association_profiles(id) on delete cascade,
  parent_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  first_name text not null default '',
  last_name text not null default '',
  birth_date date,
  gender text not null default '',
  place_of_birth text not null default '',
  fiscal_code text not null default '',
  street_address text not null default '',
  city text not null default '',
  postal_code text not null default '',
  country text not null default '',
  allergies text not null default '',
  medical_conditions text not null default '',
  medications text not null default '',
  dietary_notes text not null default '',
  epi_pen_required boolean not null default false,
  epi_pen_notes text not null default '',
  emergency_action_plan text not null default 'call_parent_first' check (emergency_action_plan in ('call_parent_first', 'call_ambulance_if_needed')),
  doctor_name text not null default '',
  doctor_phone text not null default '',
  image_usage_consent text not null default 'internal_only' check (image_usage_consent in ('none', 'internal_only', 'public_allowed')),
  additional_notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.children add column if not exists association_id uuid references public.association_profiles(id) on delete cascade;
alter table public.children add column if not exists parent_user_id uuid references auth.users(id) on delete set null;
alter table public.children add column if not exists first_name text not null default '';
alter table public.children add column if not exists last_name text not null default '';
alter table public.children add column if not exists birth_date date;
alter table public.children add column if not exists gender text not null default '';
alter table public.children add column if not exists place_of_birth text not null default '';
alter table public.children add column if not exists fiscal_code text not null default '';
alter table public.children add column if not exists street_address text not null default '';
alter table public.children add column if not exists city text not null default '';
alter table public.children add column if not exists postal_code text not null default '';
alter table public.children add column if not exists country text not null default '';
alter table public.children add column if not exists allergies text not null default '';
alter table public.children add column if not exists medical_conditions text not null default '';
alter table public.children add column if not exists medications text not null default '';
alter table public.children add column if not exists dietary_notes text not null default '';
alter table public.children add column if not exists epi_pen_required boolean not null default false;
alter table public.children add column if not exists epi_pen_notes text not null default '';
alter table public.children add column if not exists emergency_action_plan text not null default 'call_parent_first';
alter table public.children add column if not exists doctor_name text not null default '';
alter table public.children add column if not exists doctor_phone text not null default '';
alter table public.children add column if not exists image_usage_consent text not null default 'internal_only';
alter table public.children add column if not exists additional_notes text not null default '';
create index if not exists children_association_id_idx on public.children(association_id);
create index if not exists children_parent_user_id_idx on public.children(parent_user_id);

create table if not exists public.authorized_contacts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  full_name text not null,
  relationship text not null default '',
  phone text not null default '',
  email text not null default '',
  can_drop_off boolean not null default true,
  can_pick_up boolean not null default true,
  document_number text not null default '',
  verification_note text not null default '',
  is_active boolean not null default true,
  pickup_pin text not null default '',
  pickup_qr_token text not null default '',
  verified_by_admin boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.authorized_contacts add column if not exists is_active boolean not null default true;
alter table public.authorized_contacts add column if not exists pickup_pin text not null default '';
alter table public.authorized_contacts add column if not exists pickup_qr_token text not null default '';
alter table public.authorized_contacts add column if not exists verified_by_admin boolean not null default false;
alter table public.authorized_contacts add column if not exists verified_at timestamptz;
create index if not exists authorized_contacts_child_id_idx on public.authorized_contacts(child_id);
create index if not exists authorized_contacts_pickup_qr_token_idx on public.authorized_contacts(pickup_qr_token);

create table if not exists public.association_documents (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.association_profiles(id) on delete cascade,
  document_type text not null check (document_type in ('terms_conditions', 'data_policy', 'data_deletion', 'privacy_policy', 'image_policy')),
  title text not null,
  file_name text not null default '',
  file_data text not null,
  required boolean not null default true,
  language text not null default 'it',
  version integer not null default 1,
  file_hash text not null default '',
  superseded_at timestamptz,
  uploaded_at timestamptz not null default now()
);

alter table public.association_documents add column if not exists language text not null default 'it';
alter table public.association_documents add column if not exists version integer not null default 1;
alter table public.association_documents add column if not exists file_hash text not null default '';
alter table public.association_documents add column if not exists superseded_at timestamptz;
create unique index if not exists association_documents_unique_type_idx on public.association_documents(association_id, document_type);

create table if not exists public.document_acceptances (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.association_profiles(id) on delete cascade,
  document_id uuid not null references public.association_documents(id) on delete cascade,
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  accepted boolean not null default true,
  accepted_version integer not null default 1,
  accepted_document_title text not null default '',
  accepted_file_hash text not null default '',
  signed_full_name text not null default '',
  acceptance_source text not null default 'app',
  accepted_ip text not null default '',
  accepted_user_agent text not null default '',
  accepted_at timestamptz not null default now()
);

alter table public.document_acceptances add column if not exists accepted_version integer not null default 1;
alter table public.document_acceptances add column if not exists accepted_document_title text not null default '';
alter table public.document_acceptances add column if not exists accepted_file_hash text not null default '';
alter table public.document_acceptances add column if not exists signed_full_name text not null default '';
alter table public.document_acceptances add column if not exists acceptance_source text not null default 'app';
alter table public.document_acceptances add column if not exists accepted_ip text not null default '';
alter table public.document_acceptances add column if not exists accepted_user_agent text not null default '';
create unique index if not exists document_acceptances_unique_idx on public.document_acceptances(document_id, parent_user_id);
create index if not exists document_acceptances_parent_user_id_idx on public.document_acceptances(parent_user_id);

create table if not exists public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  association_id uuid references public.association_profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  action text not null check (action in ('check_in', 'check_out')),
  location_name text not null,
  created_at timestamptz not null default now()
);

alter table public.attendance_events add column if not exists association_id uuid references public.association_profiles(id) on delete cascade;
create index if not exists attendance_events_association_id_idx on public.attendance_events(association_id);

create table if not exists public.authorized_contact_access_logs (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.association_profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  authorized_contact_id uuid not null references public.authorized_contacts(id) on delete cascade,
  action_type text not null check (action_type in ('drop_off', 'pick_up', 'verification')),
  verification_method text not null default 'manual' check (verification_method in ('manual', 'pin', 'qr')),
  success boolean not null default true,
  performed_by_user_id uuid references auth.users(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists authorized_contact_access_logs_association_id_idx on public.authorized_contact_access_logs(association_id);
create index if not exists authorized_contact_access_logs_child_id_idx on public.authorized_contact_access_logs(child_id);
create index if not exists authorized_contact_access_logs_contact_id_idx on public.authorized_contact_access_logs(authorized_contact_id);

create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.association_profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  reported_by_user_id uuid references auth.users(id) on delete set null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  incident_type text not null default 'general',
  description text not null default '',
  actions_taken text not null default '',
  ambulance_called boolean not null default false,
  parent_contacted boolean not null default false,
  parent_contacted_at timestamptz,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists incident_reports_association_id_idx on public.incident_reports(association_id);
create index if not exists incident_reports_child_id_idx on public.incident_reports(child_id);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.association_profiles(id) on delete cascade,
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('export_data', 'delete_data', 'rectification')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'rejected')),
  request_note text not null default '',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists privacy_requests_association_id_idx on public.privacy_requests(association_id);
create index if not exists privacy_requests_parent_user_id_idx on public.privacy_requests(parent_user_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  association_id uuid references public.association_profiles(id) on delete cascade,
  actor_user_id uuid references auth.users(id) default auth.uid(),
  actor_role text not null default 'system',
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_association_id_idx on public.audit_logs(association_id);

alter table public.association_profiles enable row level security;
alter table public.user_profiles enable row level security;
alter table public.children enable row level security;
alter table public.authorized_contacts enable row level security;
alter table public.association_documents enable row level security;
alter table public.document_acceptances enable row level security;
alter table public.attendance_events enable row level security;
alter table public.authorized_contact_access_logs enable row level security;
alter table public.incident_reports enable row level security;
alter table public.privacy_requests enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "association_profiles_select_access" on public.association_profiles;
create policy "association_profiles_select_access"
  on public.association_profiles
  for select
  to public
  using (
    is_public = true
    or owner_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.owner_id = auth.uid() and up.association_id = public.association_profiles.id
    )
  );

drop policy if exists "association_profiles_insert_owner" on public.association_profiles;
create policy "association_profiles_insert_owner"
  on public.association_profiles
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "association_profiles_update_owner" on public.association_profiles;
create policy "association_profiles_update_owner"
  on public.association_profiles
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "user_profiles_select_access" on public.user_profiles;
create policy "user_profiles_select_access"
  on public.user_profiles
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "user_profiles_update_access" on public.user_profiles;
create policy "user_profiles_update_access"
  on public.user_profiles
  for update
  to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  )
  with check (
    owner_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "children_select_access" on public.children;
create policy "children_select_access"
  on public.children
  for select
  to authenticated
  using (
    parent_user_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "children_insert_access" on public.children;
create policy "children_insert_access"
  on public.children
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.user_profiles up
      where up.owner_id = auth.uid() and up.association_id = association_id
    )
  );

drop policy if exists "children_update_access" on public.children;
create policy "children_update_access"
  on public.children
  for update
  to authenticated
  using (
    parent_user_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  )
  with check (
    parent_user_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "children_delete_access" on public.children;
create policy "children_delete_access"
  on public.children
  for delete
  to authenticated
  using (
    parent_user_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "authorized_contacts_select_access" on public.authorized_contacts;
create policy "authorized_contacts_select_access"
  on public.authorized_contacts
  for select
  to authenticated
  using (
    exists (
      select 1 from public.children c
      where c.id = child_id and (
        c.parent_user_id = auth.uid()
        or exists (
          select 1 from public.association_profiles ap
          where ap.id = c.association_id and ap.owner_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "authorized_contacts_insert_access" on public.authorized_contacts;
create policy "authorized_contacts_insert_access"
  on public.authorized_contacts
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.children c
      where c.id = child_id and (
        c.parent_user_id = auth.uid()
        or exists (
          select 1 from public.association_profiles ap
          where ap.id = c.association_id and ap.owner_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "authorized_contacts_update_access" on public.authorized_contacts;
create policy "authorized_contacts_update_access"
  on public.authorized_contacts
  for update
  to authenticated
  using (
    exists (
      select 1 from public.children c
      where c.id = child_id and (
        c.parent_user_id = auth.uid()
        or exists (
          select 1 from public.association_profiles ap
          where ap.id = c.association_id and ap.owner_id = auth.uid()
        )
      )
    )
  )
  with check (
    exists (
      select 1 from public.children c
      where c.id = child_id and (
        c.parent_user_id = auth.uid()
        or exists (
          select 1 from public.association_profiles ap
          where ap.id = c.association_id and ap.owner_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "authorized_contacts_delete_access" on public.authorized_contacts;
create policy "authorized_contacts_delete_access"
  on public.authorized_contacts
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.children c
      where c.id = child_id and (
        c.parent_user_id = auth.uid()
        or exists (
          select 1 from public.association_profiles ap
          where ap.id = c.association_id and ap.owner_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "association_documents_select_access" on public.association_documents;
create policy "association_documents_select_access"
  on public.association_documents
  for select
  to public
  using (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and (
        ap.is_public = true
        or ap.owner_id = auth.uid()
        or exists (
          select 1 from public.user_profiles up
          where up.association_id = ap.id and up.owner_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "association_documents_manage_owner" on public.association_documents;
create policy "association_documents_manage_owner"
  on public.association_documents
  for all
  to authenticated
  using (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "document_acceptances_select_access" on public.document_acceptances;
create policy "document_acceptances_select_access"
  on public.document_acceptances
  for select
  to authenticated
  using (
    parent_user_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "document_acceptances_insert_own" on public.document_acceptances;
create policy "document_acceptances_insert_own"
  on public.document_acceptances
  for insert
  to authenticated
  with check (parent_user_id = auth.uid());

drop policy if exists "attendance_events_select_access" on public.attendance_events;
create policy "attendance_events_select_access"
  on public.attendance_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.children c
      where c.id = child_id and c.parent_user_id = auth.uid()
    )
  );

drop policy if exists "attendance_events_insert_access" on public.attendance_events;
create policy "attendance_events_insert_access"
  on public.attendance_events
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.children c
      where c.id = child_id and c.parent_user_id = auth.uid() and c.association_id = association_id
    )
  );

drop policy if exists "authorized_contact_access_logs_select_access" on public.authorized_contact_access_logs;
create policy "authorized_contact_access_logs_select_access"
  on public.authorized_contact_access_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.children c
      where c.id = child_id and c.parent_user_id = auth.uid()
    )
  );

drop policy if exists "authorized_contact_access_logs_insert_access" on public.authorized_contact_access_logs;
create policy "authorized_contact_access_logs_insert_access"
  on public.authorized_contact_access_logs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.children c
      where c.id = child_id and c.parent_user_id = auth.uid()
    )
  );

drop policy if exists "incident_reports_select_access" on public.incident_reports;
create policy "incident_reports_select_access"
  on public.incident_reports
  for select
  to authenticated
  using (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.children c
      where c.id = child_id and c.parent_user_id = auth.uid()
    )
  );

drop policy if exists "incident_reports_insert_access" on public.incident_reports;
create policy "incident_reports_insert_access"
  on public.incident_reports
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.children c
      where c.id = child_id and c.parent_user_id = auth.uid() and c.association_id = association_id
    )
  );

drop policy if exists "incident_reports_update_access" on public.incident_reports;
create policy "incident_reports_update_access"
  on public.incident_reports
  for update
  to authenticated
  using (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "privacy_requests_select_access" on public.privacy_requests;
create policy "privacy_requests_select_access"
  on public.privacy_requests
  for select
  to authenticated
  using (
    parent_user_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "privacy_requests_insert_own" on public.privacy_requests;
create policy "privacy_requests_insert_own"
  on public.privacy_requests
  for insert
  to authenticated
  with check (parent_user_id = auth.uid());

drop policy if exists "privacy_requests_update_admin" on public.privacy_requests;
create policy "privacy_requests_update_admin"
  on public.privacy_requests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "audit_logs_select_access" on public.audit_logs;
create policy "audit_logs_select_access"
  on public.audit_logs
  for select
  to authenticated
  using (
    actor_user_id = auth.uid()
    or exists (
      select 1 from public.association_profiles ap
      where ap.id = association_id and ap.owner_id = auth.uid()
    )
  );

drop policy if exists "audit_logs_insert_own" on public.audit_logs;
create policy "audit_logs_insert_own"
  on public.audit_logs
  for insert
  to authenticated
  with check (actor_user_id = auth.uid() or actor_user_id is null);`;