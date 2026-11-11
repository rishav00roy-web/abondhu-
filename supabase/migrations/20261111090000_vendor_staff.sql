-- Vendor workers: the people an approved vendor sends out on pickups.
-- Each worker gives a mobile number, an Aadhaar (number + card photo) and a face
-- photo. An admin checks them and approves or rejects. Workers do not log in.
--
-- Writes come only from the server (service role) through /api/vendor/staff,
-- except the admin's approve / reject, which the admin page does directly.
-- Photos live in the private 'vendor-docs' bucket under <vendor id>/staff/,
-- so the existing bucket rules already let the vendor and admins see them.

create type public.staff_status as enum ('pending', 'approved', 'rejected');

create table public.vendor_staff (
  id                  uuid primary key default gen_random_uuid(),
  vendor_id           uuid not null references public.vendors(id) on delete cascade,
  full_name           text not null check (length(trim(full_name)) between 2 and 80),
  phone               text not null check (phone ~ '^\+91[6-9][0-9]{9}$'),
  aadhaar_last4       char(4) not null check (aadhaar_last4 ~ '^[0-9]{4}$'),
  aadhaar_photo_path  text not null,
  face_photo_path     text not null,
  status              public.staff_status not null default 'pending',
  rejection_reason    text,
  reviewed_at         timestamptz,
  reviewed_by         uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index vendor_staff_vendor_idx on public.vendor_staff(vendor_id);
create index vendor_staff_status_idx on public.vendor_staff(status);
create trigger vendor_staff_updated before update on public.vendor_staff
  for each row execute function public.set_updated_at();
create trigger audit_vendor_staff after insert or update or delete on public.vendor_staff
  for each row execute function public.audit_row();

alter table public.vendor_staff enable row level security;
create policy staff_read on public.vendor_staff for select to authenticated
  using (vendor_id = auth.uid() or public.is_admin());
create policy staff_admin_update on public.vendor_staff for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke insert, update, delete on public.vendor_staff from anon, authenticated;
grant update (status, rejection_reason, reviewed_at, reviewed_by) on public.vendor_staff to authenticated;

-- Full Aadhaar numbers of workers: encrypted, same rules as vendor_aadhaar_vault.
create table public.staff_aadhaar_vault (
  staff_id           uuid primary key references public.vendor_staff(id) on delete cascade,
  aadhaar_ciphertext text not null check (aadhaar_ciphertext !~ '^[0-9 ]{12,14}$'),  -- never plain digits
  aadhaar_hmac       text not null unique,
  aadhaar_last4      char(4) not null check (aadhaar_last4 ~ '^[0-9]{4}$'),
  key_version        smallint not null default 1,
  consent_at         timestamptz not null,
  created_at         timestamptz not null default now()
);
alter table public.staff_aadhaar_vault enable row level security;
alter table public.staff_aadhaar_vault force row level security;
revoke all on public.staff_aadhaar_vault from anon, authenticated;

create trigger audit_staff_aadhaar_vault after insert or update or delete on public.staff_aadhaar_vault
  for each row execute function public.audit_row();

-- Keep the audit copy free of the encrypted number for both vaults.
create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rec_id text;
  o jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  n jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
begin
  rec_id := coalesce(n->>'id', o->>'id', n->>'vendor_id', o->>'vendor_id', n->>'staff_id', o->>'staff_id');
  if tg_table_name in ('vendor_aadhaar_vault', 'staff_aadhaar_vault') then
    o := o - 'aadhaar_ciphertext' - 'aadhaar_hmac';
    n := n - 'aadhaar_ciphertext' - 'aadhaar_hmac';
  end if;
  insert into public.audit_log(actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), lower(tg_op), tg_table_name, rec_id, o, n);
  return coalesce(new, old);
end $$;
revoke execute on function public.audit_row() from public, anon, authenticated;
