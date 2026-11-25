-- Abondhu never pays scrap dealers: the dealer weighs the scrap, buys it and pays
-- the customer directly. So dealers no longer give UPI or bank details, and
-- sending an application no longer needs a vendor_payout_accounts row.
-- Same guard as 20261124090000_aadhaar_back.sql, minus the payout check.
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
       or not exists (select 1 from public.vendor_service_areas where vendor_id = new.id)
       or not exists (select 1 from public.vendor_aadhaar_vault where vendor_id = new.id)
       or not exists (select 1 from public.vendor_documents where vendor_id = new.id and doc_type = 'selfie')
       or not exists (select 1 from public.vendor_documents where vendor_id = new.id and doc_type = 'aadhaar_photo')
       or not exists (select 1 from public.vendor_documents where vendor_id = new.id and doc_type::text = 'aadhaar_back') then
      raise exception 'application is not complete';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.vendors_guard() from public, anon, authenticated;

-- Abondhu takes no money from customers and pays no dealers, so the payment
-- tables (never used, no real data) and their types go too.
drop table if exists public.vendor_payouts;
drop table if exists public.vendor_payout_accounts;
drop table if exists public.customer_payments;
drop type if exists public.payout_status;
drop type if exists public.payout_method;
drop type if exists public.payment_status;
drop type if exists public.payment_method;
