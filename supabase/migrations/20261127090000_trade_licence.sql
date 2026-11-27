-- Scrap dealers now give their trade licence: the number (sign-up step 3, before
-- Aadhaar) and a photo of it (step 4, next to the Aadhaar photos). The photo is a
-- vendor_documents row of the existing 'trade_licence' type, in the private
-- vendor-docs bucket, admin-only like the Aadhaar photos.
alter table public.vendors add column if not exists trade_licence_no text;
alter table public.vendors drop constraint if exists vendors_trade_licence_len;
alter table public.vendors add constraint vendors_trade_licence_len check (char_length(trade_licence_no) between 3 and 40);
grant update (trade_licence_no) on public.vendors to authenticated;

-- Same guard as 20261125120000_no_dealer_payment.sql, plus the trade licence checks.
-- Only new submissions need them; dealers already sent or approved are not touched.
create or replace function public.vendors_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;  -- service role or admin
  end if;
  if new.reviewed_at is distinct from old.reviewed_at
     or new.reviewed_by is distinct from old.reviewed_by
     or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'only admins can review vendors';
  end if;
  if new.status not in ('draft', 'submitted') then
    raise exception 'vendors cannot set status %', new.status;
  end if;
  if new.status = 'submitted' and old.status <> 'submitted' then
    if new.address_id is null
       or new.trade_licence_no is null
       or not exists (select 1 from public.vendor_service_areas where vendor_id = new.id)
       or not exists (select 1 from public.vendor_aadhaar_vault where vendor_id = new.id)
       or not exists (select 1 from public.vendor_documents where vendor_id = new.id and doc_type = 'selfie')
       or not exists (select 1 from public.vendor_documents where vendor_id = new.id and doc_type = 'aadhaar_photo')
       or not exists (select 1 from public.vendor_documents where vendor_id = new.id and doc_type::text = 'aadhaar_back')
       or not exists (select 1 from public.vendor_documents where vendor_id = new.id and doc_type = 'trade_licence') then
      raise exception 'application is not complete';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.vendors_guard() from public, anon, authenticated;
