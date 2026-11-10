-- Abondhu security: row level security on every table.
-- Rule of thumb: people see and change only their own rows; admins see all;
-- anything that must be trusted (KYC results, approvals, payouts) is written
-- by the server with the service role key, which bypasses these policies.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and not is_blocked);
$$;

create or replace function public.is_approved_vendor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vendors where id = auth.uid() and status = 'approved');
$$;

create or replace function public.can_see_pickup(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pickups p
    where p.id = p_id and (p.customer_id = auth.uid() or p.vendor_id = auth.uid())
  ) or public.is_admin();
$$;

revoke all on function public.is_admin(), public.is_approved_vendor(), public.can_see_pickup(uuid) from public;
grant execute on function public.is_admin(), public.is_approved_vendor(), public.can_see_pickup(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Turn RLS on everywhere
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'towns','pincodes','profiles','addresses','material_categories','materials','material_rates',
    'vendors','vendor_service_areas','vendor_materials','vendor_kyc','vendor_documents','vendor_payout_accounts',
    'pickup_slots','pickups','pickup_items','pickup_photos','pickup_status_history',
    'customer_payments','vendor_payouts','ratings','complaints','notifications','audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Public reference data: anyone can read, admins write
-- ---------------------------------------------------------------------------
create policy towns_read      on public.towns               for select to anon, authenticated using (true);
create policy pincodes_read   on public.pincodes            for select to anon, authenticated using (true);
create policy cats_read       on public.material_categories for select to anon, authenticated using (true);
create policy materials_read  on public.materials           for select to anon, authenticated using (true);
create policy rates_read      on public.material_rates      for select to anon, authenticated using (true);
create policy slots_read      on public.pickup_slots        for select to anon, authenticated using (true);

create policy towns_admin     on public.towns               for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy pincodes_admin  on public.pincodes            for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cats_admin      on public.material_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy materials_admin on public.materials           for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy rates_admin     on public.material_rates      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy slots_admin     on public.pickup_slots        for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Profiles: own row; role and blocking only by admins
-- ---------------------------------------------------------------------------
create policy profiles_self_read   on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin       on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke update on public.profiles from authenticated;
grant update (full_name, email, preferred_language) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------
create policy addresses_own on public.addresses for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy addresses_admin_read on public.addresses for select to authenticated using (public.is_admin());
create policy addresses_vendor_read on public.addresses for select to authenticated using (
  exists (select 1 from public.pickups p where p.address_id = addresses.id and p.vendor_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- Vendors: a vendor fills in their own application; only admins approve
-- ---------------------------------------------------------------------------
create policy vendors_own_read   on public.vendors for select to authenticated using (id = auth.uid() or public.is_admin());
create policy vendors_own_insert on public.vendors for insert to authenticated with check (id = auth.uid() and status = 'draft');
create policy vendors_own_update on public.vendors for update to authenticated
  using (id = auth.uid() and status in ('draft', 'rejected'))
  with check (id = auth.uid() and status in ('draft', 'submitted'));
create policy vendors_admin      on public.vendors for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke update on public.vendors from authenticated;
grant update (business_name, vendor_type, onboarding_step, address_id, vehicle_type, daily_capacity_kg, status)
  on public.vendors to authenticated;
grant update (reviewed_at, reviewed_by, rejection_reason) on public.vendors to authenticated; -- admin only via policy + guard below

-- Guard: non-admins can only move draft/rejected -> draft/submitted, and
-- cannot touch review fields.
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
  return new;
end $$;
create trigger vendors_guard before update on public.vendors
  for each row execute function public.vendors_guard();

-- Becoming a vendor flips the profile role (users cannot change role themselves).
create or replace function public.vendor_set_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set role = 'vendor' where id = new.id and role = 'customer';
  return new;
end $$;
create trigger vendors_set_role after insert on public.vendors
  for each row execute function public.vendor_set_role();

-- Service areas and materials: the vendor manages their own lists
create policy vsa_own on public.vendor_service_areas for all to authenticated
  using (vendor_id = auth.uid() or public.is_admin()) with check (vendor_id = auth.uid() or public.is_admin());
create policy vm_own  on public.vendor_materials for all to authenticated
  using (vendor_id = auth.uid() or public.is_admin()) with check (vendor_id = auth.uid() or public.is_admin());

-- KYC: vendors can read their own result; only the server (service role) writes it
create policy kyc_read on public.vendor_kyc for select to authenticated using (vendor_id = auth.uid() or public.is_admin());
create policy kyc_admin_update on public.vendor_kyc for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Documents: vendor uploads and reads their own; admin reviews
create policy docs_own_read   on public.vendor_documents for select to authenticated using (vendor_id = auth.uid() or public.is_admin());
create policy docs_own_insert on public.vendor_documents for insert to authenticated with check (vendor_id = auth.uid() and status = 'uploaded');
create policy docs_own_delete on public.vendor_documents for delete to authenticated using (vendor_id = auth.uid() and status = 'uploaded');
create policy docs_admin      on public.vendor_documents for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Payout accounts: vendor manages their own; admin reads; nobody else
create policy payacct_own on public.vendor_payout_accounts for all to authenticated
  using (vendor_id = auth.uid()) with check (vendor_id = auth.uid() and is_verified = false);
create policy payacct_admin on public.vendor_payout_accounts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Pickups
-- ---------------------------------------------------------------------------
create policy pickups_customer_read on public.pickups for select to authenticated using (customer_id = auth.uid());
create policy pickups_customer_new  on public.pickups for insert to authenticated
  with check (customer_id = auth.uid() and status = 'requested' and vendor_id is null);
create policy pickups_vendor_read   on public.pickups for select to authenticated using (
  vendor_id = auth.uid()
  or (status = 'requested' and public.is_approved_vendor()
      and exists (select 1 from public.vendor_service_areas a where a.vendor_id = auth.uid() and a.pincode = pickups.pincode))
);
create policy pickups_party_update  on public.pickups for update to authenticated
  using (customer_id = auth.uid() or vendor_id = auth.uid())
  with check (customer_id = auth.uid() or vendor_id = auth.uid());
create policy pickups_admin         on public.pickups for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke update on public.pickups from authenticated;
grant update (status, customer_note, cancel_reason, total_weight_kg, total_amount, cancelled_at, completed_at, vendor_id, slot_id)
  on public.pickups to authenticated;

-- Allowed status moves for customers and vendors (admins and the server can do anything).
create or replace function public.pickups_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  ok boolean := false;
begin
  if me is null or public.is_admin()
     or current_setting('abondhu.accepting', true) = 'on' then
    return new;  -- server, admin, or accept_pickup()
  end if;
  if new.vendor_id is distinct from old.vendor_id then
    raise exception 'use accept_pickup() to take a pickup';
  end if;
  if new.status = old.status then
    ok := true;
  elsif me = old.customer_id then
    ok := new.status = 'cancelled' and old.status in ('requested', 'assigned', 'accepted');
  elsif me = old.vendor_id then
    ok := (old.status, new.status) in (
      ('assigned'::public.pickup_status,   'accepted'::public.pickup_status),
      ('accepted'::public.pickup_status,   'on_the_way'::public.pickup_status),
      ('on_the_way'::public.pickup_status, 'weighed'::public.pickup_status),
      ('weighed'::public.pickup_status,    'completed'::public.pickup_status),
      ('accepted'::public.pickup_status,   'cancelled'::public.pickup_status),
      ('on_the_way'::public.pickup_status, 'cancelled'::public.pickup_status)
    );
  end if;
  if not ok then
    raise exception 'status change % -> % not allowed', old.status, new.status;
  end if;
  if new.status = 'cancelled' then new.cancelled_at := now(); end if;
  if new.status = 'completed' then new.completed_at := now(); end if;
  if new.status = 'accepted'  then new.accepted_at  := now(); end if;
  return new;
end $$;
create trigger pickups_guard before update on public.pickups
  for each row execute function public.pickups_guard();

-- An approved vendor takes an open pickup in their area. Race-safe: only one wins.
create or replace function public.accept_pickup(p_id uuid) returns public.pickups
language plpgsql security definer set search_path = public as $$
declare
  result public.pickups;
begin
  if not public.is_approved_vendor() then
    raise exception 'only approved vendors can accept pickups';
  end if;
  perform set_config('abondhu.accepting', 'on', true);
  update public.pickups p
     set vendor_id = auth.uid(), status = 'accepted', accepted_at = now()
   where p.id = p_id
     and p.status = 'requested'
     and exists (select 1 from public.vendor_service_areas a where a.vendor_id = auth.uid() and a.pincode = p.pincode)
  returning p.* into result;
  perform set_config('abondhu.accepting', 'off', true);
  if result.id is null then
    raise exception 'pickup is no longer available';
  end if;
  return result;
end $$;
revoke all on function public.accept_pickup(uuid) from public;
grant execute on function public.accept_pickup(uuid) to authenticated;

-- Items and photos: visible to both sides; written by the assigned vendor while weighing
create policy items_read  on public.pickup_items for select to authenticated using (public.can_see_pickup(pickup_id));
create policy items_write on public.pickup_items for all to authenticated
  using (exists (select 1 from public.pickups p where p.id = pickup_id and p.vendor_id = auth.uid() and p.status in ('on_the_way', 'weighed')))
  with check (exists (select 1 from public.pickups p where p.id = pickup_id and p.vendor_id = auth.uid() and p.status in ('on_the_way', 'weighed')));
create policy items_admin on public.pickup_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy photos_read   on public.pickup_photos for select to authenticated using (public.can_see_pickup(pickup_id));
create policy photos_insert on public.pickup_photos for insert to authenticated
  with check (uploaded_by = auth.uid() and exists (select 1 from public.pickups p where p.id = pickup_id and p.vendor_id = auth.uid()));

create policy history_read on public.pickup_status_history for select to authenticated using (public.can_see_pickup(pickup_id));

-- ---------------------------------------------------------------------------
-- Money: read your own; only admins/server write
-- ---------------------------------------------------------------------------
create policy cpay_read   on public.customer_payments for select to authenticated using (public.can_see_pickup(pickup_id));
create policy cpay_admin  on public.customer_payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy vpay_read   on public.vendor_payouts for select to authenticated using (vendor_id = auth.uid() or public.is_admin());
create policy vpay_admin  on public.vendor_payouts for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Support
-- ---------------------------------------------------------------------------
create policy ratings_read   on public.ratings for select to authenticated using (public.can_see_pickup(pickup_id));
create policy ratings_insert on public.ratings for insert to authenticated with check (
  rated_by = auth.uid()
  and exists (select 1 from public.pickups p where p.id = pickup_id and p.customer_id = auth.uid() and p.status = 'completed')
);

create policy complaints_own   on public.complaints for select to authenticated using (raised_by = auth.uid() or public.is_admin());
create policy complaints_new   on public.complaints for insert to authenticated with check (raised_by = auth.uid() and status = 'open');
create policy complaints_admin on public.complaints for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy notif_own_read   on public.notifications for select to authenticated using (profile_id = auth.uid());
create policy notif_own_update on public.notifications for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy audit_admin_read on public.audit_log for select to authenticated using (public.is_admin());
