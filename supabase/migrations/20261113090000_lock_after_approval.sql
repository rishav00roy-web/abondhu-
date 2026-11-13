-- Fixes from the 2026-11-13 security review.
--   1. Once an application is sent, the vendor can no longer change what the
--      admin checks: photos, service areas and payment details. They can change
--      them again only if the admin rejects the application.
--   2. A mobile number that was only typed in (never verified by a login code)
--      can no longer block the real owner from logging in with that phone.
--   3. A customer can have at most 3 pickups waiting at a time.

-- ---------------------------------------------------------------------------
-- 1. Lock the checked parts of an application
-- ---------------------------------------------------------------------------
create or replace function public.vendor_can_edit() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vendors where id = auth.uid() and status in ('draft', 'rejected'));
$$;
revoke execute on function public.vendor_can_edit() from public, anon;
grant execute on function public.vendor_can_edit() to authenticated;

-- Service areas: anyone can read their own; changes only while editable.
drop policy vsa_own on public.vendor_service_areas;
create policy vsa_read on public.vendor_service_areas for select to authenticated
  using (vendor_id = auth.uid() or public.is_admin());
create policy vsa_own_insert on public.vendor_service_areas for insert to authenticated
  with check (vendor_id = auth.uid() and public.vendor_can_edit());
create policy vsa_own_update on public.vendor_service_areas for update to authenticated
  using (vendor_id = auth.uid() and public.vendor_can_edit())
  with check (vendor_id = auth.uid() and public.vendor_can_edit());
create policy vsa_own_delete on public.vendor_service_areas for delete to authenticated
  using (vendor_id = auth.uid() and public.vendor_can_edit());
create policy vsa_admin on public.vendor_service_areas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Document records (the photos themselves are uploaded by the server).
drop policy docs_own_insert on public.vendor_documents;
drop policy docs_own_delete on public.vendor_documents;
create policy docs_own_insert on public.vendor_documents for insert to authenticated
  with check (vendor_id = auth.uid() and status = 'uploaded' and public.vendor_can_edit());
create policy docs_own_delete on public.vendor_documents for delete to authenticated
  using (vendor_id = auth.uid() and status = 'uploaded' and public.vendor_can_edit());

-- Payment details.
drop policy payacct_own on public.vendor_payout_accounts;
create policy payacct_own_read on public.vendor_payout_accounts for select to authenticated
  using (vendor_id = auth.uid());
create policy payacct_own_insert on public.vendor_payout_accounts for insert to authenticated
  with check (vendor_id = auth.uid() and is_verified = false and public.vendor_can_edit());
create policy payacct_own_update on public.vendor_payout_accounts for update to authenticated
  using (vendor_id = auth.uid() and public.vendor_can_edit())
  with check (vendor_id = auth.uid() and is_verified = false and public.vendor_can_edit());
create policy payacct_own_delete on public.vendor_payout_accounts for delete to authenticated
  using (vendor_id = auth.uid() and public.vendor_can_edit());

-- Photo files: every upload and delete goes through the server, so the
-- browser may only read its own files. (Skipped on plain Postgres.)
do $outer$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    raise notice 'storage schema not found, skipping';
    return;
  end if;
  execute 'drop policy if exists "vendor docs: owner upload" on storage.objects';
  execute 'drop policy if exists "vendor docs: owner delete" on storage.objects';
end
$outer$;

-- ---------------------------------------------------------------------------
-- 2. A verified phone login always wins over a number someone only typed
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  verified_phone text := case when new.phone is not null and new.phone <> '' then '+' || ltrim(new.phone, '+') end;
begin
  if verified_phone is not null then
    -- Someone else typed this number without proving it is theirs: free it.
    update public.profiles set phone = null where phone = verified_phone and id <> new.id;
  end if;
  insert into public.profiles(id, phone, email)
  values (new.id, verified_phone, new.email)
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. At most 3 pickups waiting per customer (stops fake bulk bookings)
-- ---------------------------------------------------------------------------
create or replace function public.can_book(p_address uuid, p_pincode char(6), p_town smallint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.addresses a where a.id = p_address and a.profile_id = auth.uid() and a.pincode = p_pincode)
     and exists (select 1 from public.pincodes pc where pc.pincode = p_pincode and pc.town_id = p_town and pc.is_active)
     and not exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_blocked)
     and (select count(*) from public.pickups p
           where p.customer_id = auth.uid() and p.status not in ('completed', 'cancelled')) < 3;
$$;
revoke execute on function public.can_book(uuid, char, smallint) from public, anon;
grant execute on function public.can_book(uuid, char, smallint) to authenticated;
