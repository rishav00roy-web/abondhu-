-- Aadhaar vault: the only place a full Aadhaar number lives, and only encrypted.
--
-- How it works
--   * The server encrypts the number (AES-256-GCM) with a key kept in the
--     hosting environment (AADHAAR_KEY), never in the database or the repo.
--     The database only ever sees ciphertext.
--   * aadhaar_hmac is a keyed hash of the number, so the same Aadhaar cannot
--     be used for two vendors, without storing the number itself.
--   * No browser can read this table: there are no policies for anon or
--     authenticated users, admins included. Admins view a number through a
--     server endpoint, which decrypts it and writes the view to audit_log.
--   * delete_after: the row (and the Aadhaar photo) are removed after this date.

create table public.vendor_aadhaar_vault (
  vendor_id          uuid primary key references public.vendors(id) on delete cascade,
  aadhaar_ciphertext text not null check (aadhaar_ciphertext !~ '^[0-9 ]{12,14}$'),  -- never plain digits
  aadhaar_hmac       text not null unique,
  aadhaar_last4      char(4) not null check (aadhaar_last4 ~ '^[0-9]{4}$'),
  key_version        smallint not null default 1,
  consent_at         timestamptz not null,   -- vendor ticked the consent box
  delete_after       timestamptz,
  created_at         timestamptz not null default now()
);

alter table public.vendor_aadhaar_vault enable row level security;
alter table public.vendor_aadhaar_vault force row level security;
revoke all on public.vendor_aadhaar_vault from anon, authenticated;

create trigger audit_aadhaar_vault after insert or update or delete on public.vendor_aadhaar_vault
  for each row execute function public.audit_row();

-- The audit copy must not hold the ciphertext either: keep only who/when.
create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rec_id text;
  o jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  n jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
begin
  rec_id := coalesce(n->>'id', o->>'id', n->>'vendor_id', o->>'vendor_id');
  if tg_table_name = 'vendor_aadhaar_vault' then
    o := o - 'aadhaar_ciphertext' - 'aadhaar_hmac';
    n := n - 'aadhaar_ciphertext' - 'aadhaar_hmac';
  end if;
  insert into public.audit_log(actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), lower(tg_op), tg_table_name, rec_id, o, n);
  return coalesce(new, old);
end $$;
