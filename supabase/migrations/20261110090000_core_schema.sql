-- Abondhu core schema: every table for every service, written once.
-- Only Jorhat is switched on at launch (towns.is_active / pincodes.is_active).
-- Plain Postgres apart from references to Supabase's auth.users, so it can
-- later be moved to any Postgres host by dump and restore.
--
-- Privacy rule: a full Aadhaar number is never stored anywhere. KYC keeps the
-- last 4 digits, the name and date of birth, and the provider's reference.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role        as enum ('customer', 'vendor', 'admin');
create type public.vendor_type      as enum ('individual_collector', 'scrap_shop', 'recycler');
create type public.vendor_status    as enum ('draft', 'submitted', 'approved', 'rejected', 'suspended');
create type public.kyc_method       as enum ('digilocker', 'manual_upload');
create type public.kyc_status       as enum ('pending', 'verified', 'failed', 'needs_review');
create type public.document_type    as enum ('shop_photo', 'selfie', 'aadhaar_photo', 'masked_aadhaar', 'trade_licence', 'other');
create type public.document_status  as enum ('uploaded', 'accepted', 'rejected');
create type public.payout_method    as enum ('upi', 'bank');
create type public.material_unit    as enum ('kg', 'pc');
create type public.pickup_status    as enum ('requested', 'assigned', 'accepted', 'on_the_way', 'weighed', 'completed', 'cancelled');
create type public.payment_method   as enum ('cash', 'upi', 'bank');
create type public.payment_status   as enum ('pending', 'paid', 'failed', 'refunded');
create type public.payout_status    as enum ('pending', 'processing', 'paid', 'failed');
create type public.complaint_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.notify_channel   as enum ('sms', 'whatsapp', 'push', 'in_app');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Places: towns and pincodes (Assam only)
-- ---------------------------------------------------------------------------
create table public.towns (
  id          smallint generated always as identity primary key,
  name        text not null unique,
  district    text not null,
  state       text not null default 'Assam' check (state = 'Assam'),
  is_active   boolean not null default false,
  pickup_days text,
  created_at  timestamptz not null default now()
);

create table public.pincodes (
  pincode    char(6) primary key check (pincode ~ '^78[0-9]{4}$'),
  town_id    smallint not null references public.towns(id),
  area_name  text,
  is_active  boolean not null default false
);
create index pincodes_town_idx on public.pincodes(town_id);

-- ---------------------------------------------------------------------------
-- People and logins
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  role               public.user_role not null default 'customer',
  full_name          text,
  phone              text unique check (phone ~ '^\+91[6-9][0-9]{9}$'),
  email              text,
  preferred_language text not null default 'en' check (preferred_language in ('as', 'en')),
  is_blocked         boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  label       text,
  line1       text not null,
  line2       text,
  landmark    text,
  pincode     char(6) not null references public.pincodes(pincode),
  latitude    numeric(9,6),
  longitude   numeric(9,6),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index addresses_profile_idx on public.addresses(profile_id);

-- ---------------------------------------------------------------------------
-- Scrap types: optional suggestions only. Vendors write each item's name freely
-- and enter the rate from their printed chart at the pickup.
-- ---------------------------------------------------------------------------
create table public.material_categories (
  id    smallint generated always as identity primary key,
  slug  text not null unique,
  name  text not null
);

create table public.materials (
  id           smallint generated always as identity primary key,
  slug         text not null unique,
  name         text not null,
  category_id  smallint not null references public.material_categories(id),
  unit         public.material_unit not null default 'kg',
  is_active    boolean not null default true,
  sort_order   smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------------
create table public.vendors (
  id                 uuid primary key references public.profiles(id) on delete cascade,
  application_code   text unique,
  business_name      text,
  vendor_type        public.vendor_type,
  status             public.vendor_status not null default 'draft',
  onboarding_step    smallint not null default 1 check (onboarding_step between 1 and 6),
  address_id         uuid references public.addresses(id),
  vehicle_type       text,
  daily_capacity_kg  integer check (daily_capacity_kg is null or daily_capacity_kg > 0),
  submitted_at       timestamptz,
  reviewed_at        timestamptz,
  reviewed_by        uuid references public.profiles(id),
  rejection_reason   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index vendors_status_idx on public.vendors(status);
create trigger vendors_updated before update on public.vendors
  for each row execute function public.set_updated_at();

create table public.vendor_service_areas (
  vendor_id  uuid not null references public.vendors(id) on delete cascade,
  pincode    char(6) not null references public.pincodes(pincode),
  primary key (vendor_id, pincode)
);
create index vendor_service_areas_pincode_idx on public.vendor_service_areas(pincode);

-- KYC: no column can hold a full Aadhaar number.
create table public.vendor_kyc (
  id                  uuid primary key default gen_random_uuid(),
  vendor_id           uuid not null references public.vendors(id) on delete cascade,
  method              public.kyc_method not null,
  status              public.kyc_status not null default 'pending',
  aadhaar_last4       char(4) check (aadhaar_last4 ~ '^[0-9]{4}$'),
  name_on_aadhaar     text,
  date_of_birth       date,
  gender              text,
  provider            text,             -- e.g. 'setu'
  provider_reference  text,             -- the provider's request id
  name_matches        boolean,
  failure_reason      text,
  verified_at         timestamptz,
  reviewed_by         uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index vendor_kyc_vendor_idx on public.vendor_kyc(vendor_id);
create unique index vendor_kyc_provider_ref_uidx on public.vendor_kyc(provider, provider_reference)
  where provider_reference is not null;
create trigger vendor_kyc_updated before update on public.vendor_kyc
  for each row execute function public.set_updated_at();

create table public.vendor_documents (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  doc_type      public.document_type not null,
  storage_path  text not null,          -- path inside the private 'vendor-docs' bucket
  status        public.document_status not null default 'uploaded',
  review_note   text,
  uploaded_at   timestamptz not null default now()
);
create index vendor_documents_vendor_idx on public.vendor_documents(vendor_id);

create table public.vendor_payout_accounts (
  id               uuid primary key default gen_random_uuid(),
  vendor_id        uuid not null references public.vendors(id) on delete cascade,
  method           public.payout_method not null,
  upi_id           text check (upi_id is null or upi_id ~ '^[A-Za-z0-9.\-_]{2,}@[A-Za-z]{2,}$'),
  account_holder   text,
  account_number   text check (account_number is null or account_number ~ '^[0-9]{9,18}$'),
  ifsc             text check (ifsc is null or ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  is_primary       boolean not null default true,
  is_verified      boolean not null default false,
  created_at       timestamptz not null default now(),
  check (
    (method = 'upi'  and upi_id is not null) or
    (method = 'bank' and account_number is not null and ifsc is not null and account_holder is not null)
  )
);
create unique index vendor_payout_primary_uidx on public.vendor_payout_accounts(vendor_id) where is_primary;

-- ---------------------------------------------------------------------------
-- Pickups
-- ---------------------------------------------------------------------------
create table public.pickup_slots (
  id          bigint generated always as identity primary key,
  town_id     smallint not null references public.towns(id),
  slot_date   date not null,
  start_time  time not null,
  end_time    time not null check (end_time > start_time),
  capacity    smallint not null default 10 check (capacity > 0),
  unique (town_id, slot_date, start_time)
);

create table public.pickups (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique default ('AB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_id          uuid not null references public.profiles(id),
  address_id           uuid not null references public.addresses(id),
  pincode              char(6) not null references public.pincodes(pincode),
  town_id              smallint not null references public.towns(id),
  slot_id              bigint references public.pickup_slots(id),
  vendor_id            uuid references public.vendors(id),
  status               public.pickup_status not null default 'requested',
  estimated_weight_kg  numeric(8,2),
  customer_note        text,
  total_weight_kg      numeric(8,2),
  total_amount         numeric(10,2),
  commission_amount    numeric(10,2),
  cancel_reason        text,
  requested_at         timestamptz not null default now(),
  accepted_at          timestamptz,
  completed_at         timestamptz,
  cancelled_at         timestamptz,
  updated_at           timestamptz not null default now()
);
create index pickups_customer_idx on public.pickups(customer_id, requested_at desc);
create index pickups_vendor_idx   on public.pickups(vendor_id, status);
create index pickups_open_idx     on public.pickups(pincode, status) where status in ('requested', 'assigned');
create index pickups_town_status_idx on public.pickups(town_id, status, requested_at desc);
create trigger pickups_updated before update on public.pickups
  for each row execute function public.set_updated_at();

create table public.pickup_items (
  id              bigint generated always as identity primary key,
  pickup_id       uuid not null references public.pickups(id) on delete cascade,
  item_name       text not null check (length(trim(item_name)) > 0),  -- vendor writes it freely, any language
  material_id     smallint references public.materials(id),         -- optional: set only if picked from suggestions
  unit            public.material_unit not null default 'kg',
  quantity        numeric(8,2) not null check (quantity > 0),       -- kg or pieces
  rate_per_unit   numeric(10,2) not null check (rate_per_unit >= 0),
  amount          numeric(12,2) generated always as (round(quantity * rate_per_unit, 2)) stored
);
create index pickup_items_pickup_idx on public.pickup_items(pickup_id);

create table public.pickup_photos (
  id            bigint generated always as identity primary key,
  pickup_id     uuid not null references public.pickups(id) on delete cascade,
  storage_path  text not null,
  kind          text not null default 'scale' check (kind in ('scale', 'scrap', 'other')),
  uploaded_by   uuid references public.profiles(id),
  uploaded_at   timestamptz not null default now()
);

create table public.pickup_status_history (
  id           bigint generated always as identity primary key,
  pickup_id    uuid not null references public.pickups(id) on delete cascade,
  from_status  public.pickup_status,
  to_status    public.pickup_status not null,
  changed_by   uuid,
  changed_at   timestamptz not null default now(),
  note         text
);
create index pickup_status_history_pickup_idx on public.pickup_status_history(pickup_id, changed_at);

create or replace function public.log_pickup_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.pickup_status_history(pickup_id, from_status, to_status, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger pickups_status_log after insert or update of status on public.pickups
  for each row execute function public.log_pickup_status();

-- ---------------------------------------------------------------------------
-- Money
-- ---------------------------------------------------------------------------
-- What Abondhu (via the vendor) pays the customer for their scrap.
create table public.customer_payments (
  id          uuid primary key default gen_random_uuid(),
  pickup_id   uuid not null references public.pickups(id),
  amount      numeric(10,2) not null check (amount >= 0),
  method      public.payment_method not null,
  status      public.payment_status not null default 'pending',
  reference   text,
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index customer_payments_pickup_idx on public.customer_payments(pickup_id);

create table public.vendor_payouts (
  id                 uuid primary key default gen_random_uuid(),
  vendor_id          uuid not null references public.vendors(id),
  payout_account_id  uuid references public.vendor_payout_accounts(id),
  period_start       date not null,
  period_end         date not null check (period_end >= period_start),
  amount             numeric(12,2) not null,
  status             public.payout_status not null default 'pending',
  reference          text,
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);
create index vendor_payouts_vendor_idx on public.vendor_payouts(vendor_id, period_end desc);

-- ---------------------------------------------------------------------------
-- Support
-- ---------------------------------------------------------------------------
create table public.ratings (
  id          bigint generated always as identity primary key,
  pickup_id   uuid not null unique references public.pickups(id) on delete cascade,
  rated_by    uuid not null references public.profiles(id),
  stars       smallint not null check (stars between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

create table public.complaints (
  id           uuid primary key default gen_random_uuid(),
  pickup_id    uuid references public.pickups(id),
  raised_by    uuid not null references public.profiles(id),
  category     text not null check (category in ('weight', 'payment', 'behaviour', 'no_show', 'app', 'other')),
  description  text not null,
  status       public.complaint_status not null default 'open',
  resolved_by  uuid references public.profiles(id),
  resolution   text,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
create index complaints_status_idx on public.complaints(status, created_at desc);

create table public.notifications (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  channel     public.notify_channel not null default 'in_app',
  title       text not null,
  body        text,
  sent_at     timestamptz,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_profile_idx on public.notifications(profile_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Safety: audit log of who changed what
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  action      text not null,
  table_name  text not null,
  record_id   text,
  old_data    jsonb,
  new_data    jsonb,
  at          timestamptz not null default now()
);
create index audit_log_table_idx on public.audit_log(table_name, record_id, at desc);

create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rec_id text;
begin
  rec_id := coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id');
  insert into public.audit_log(actor_id, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(), lower(tg_op), tg_table_name, rec_id,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger audit_vendors      after insert or update or delete on public.vendors            for each row execute function public.audit_row();
create trigger audit_vendor_kyc   after insert or update or delete on public.vendor_kyc         for each row execute function public.audit_row();
create trigger audit_payouts      after insert or update or delete on public.vendor_payouts     for each row execute function public.audit_row();
create trigger audit_cust_pay     after insert or update or delete on public.customer_payments  for each row execute function public.audit_row();
create trigger audit_profiles     after update of role, is_blocked on public.profiles           for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------
-- New login -> profile row. Phone comes from Supabase Auth (E.164 without '+').
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, phone, email)
  values (
    new.id,
    case when new.phone is not null and new.phone <> '' then '+' || ltrim(new.phone, '+') end,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vendor application codes like ABV-JRT-000123
create sequence public.vendor_application_seq;
create or replace function public.vendor_on_submit() returns trigger
language plpgsql as $$
begin
  if new.status = 'submitted' and (old.status is distinct from 'submitted') then
    new.submitted_at := coalesce(new.submitted_at, now());
    if new.application_code is null then
      new.application_code := 'ABV-' || lpad(nextval('public.vendor_application_seq')::text, 6, '0');
    end if;
  end if;
  return new;
end $$;
create trigger vendors_on_submit before update of status on public.vendors
  for each row execute function public.vendor_on_submit();
