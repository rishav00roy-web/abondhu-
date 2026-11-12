-- Tighter rules for the three status flows (vendor application, pickup, account).
-- Each rule closes a gap found in the 2026-11-12 state machine review.

-- ---------------------------------------------------------------------------
-- Blocked people are never "approved vendors".
-- ---------------------------------------------------------------------------
create or replace function public.is_approved_vendor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.vendors v join public.profiles p on p.id = v.id
    where v.id = auth.uid() and v.status = 'approved' and not p.is_blocked
  );
$$;

-- ---------------------------------------------------------------------------
-- Pickups: the browser may change only the status and the notes.
-- Weight and money come from the weighed items, worked out by the database.
-- ---------------------------------------------------------------------------
revoke insert, update on public.pickups from authenticated;
grant insert (id, customer_id, address_id, pincode, town_id, customer_note, estimated_weight_kg) on public.pickups to authenticated;
grant update (status, customer_note, cancel_reason) on public.pickups to authenticated;

-- A customer books only for themselves, at their own address, in a matching town, and only if not blocked.
-- The checks live in a function: a policy reading addresses would loop back into pickups' policies.
create or replace function public.can_book(p_address uuid, p_pincode char(6), p_town smallint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.addresses a where a.id = p_address and a.profile_id = auth.uid() and a.pincode = p_pincode)
     and exists (select 1 from public.pincodes pc where pc.pincode = p_pincode and pc.town_id = p_town and pc.is_active)
     and not exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_blocked);
$$;
revoke execute on function public.can_book(uuid, char, smallint) from public, anon;
grant execute on function public.can_book(uuid, char, smallint) to authenticated;

drop policy pickups_customer_new on public.pickups;
create policy pickups_customer_new on public.pickups for insert to authenticated
  with check (customer_id = auth.uid() and status = 'requested' and vendor_id is null
              and public.can_book(address_id, pincode, town_id));

create or replace function public.pickups_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  ok boolean := false;
  items int;
begin
  if me is null or public.is_admin()
     or current_setting('abondhu.accepting', true) = 'on' then
    return new;  -- server, admin, or accept_pickup()
  end if;
  if new.vendor_id is distinct from old.vendor_id then
    raise exception 'use accept_pickup() to take a pickup';
  end if;
  if new.status = old.status then
    ok := old.status not in ('completed', 'cancelled');  -- finished pickups are frozen
  elsif me = old.customer_id then
    ok := new.status = 'cancelled' and old.status in ('requested', 'assigned', 'accepted');
  elsif me = old.vendor_id then
    ok := public.is_approved_vendor() and (old.status, new.status) in (
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

  -- Weighing: totals are the sum of the items, never typed in.
  if new.status in ('weighed', 'completed') and new.status is distinct from old.status then
    select count(*), coalesce(sum(quantity) filter (where unit = 'kg'), 0), coalesce(sum(amount), 0)
      into items, new.total_weight_kg, new.total_amount
      from public.pickup_items where pickup_id = new.id;
    if items = 0 then
      raise exception 'add the weighed items first';
    end if;
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' then new.cancelled_at := now(); end if;
  if new.status = 'completed' and old.status <> 'completed' then new.completed_at := now(); end if;
  if new.status = 'accepted'  and old.status <> 'accepted'  then new.accepted_at  := now(); end if;
  return new;
end $$;
revoke execute on function public.pickups_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Vendor application
-- ---------------------------------------------------------------------------
-- Sending needs every part of the sign-up, whatever the screens did.
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
       or not exists (select 1 from public.vendor_payout_accounts where vendor_id = new.id) then
      raise exception 'application is not complete';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.vendors_guard() from public, anon, authenticated;

-- A re-sent application goes back to the top of the review queue.
create or replace function public.vendor_on_submit() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = 'submitted' and (old.status is distinct from 'submitted') then
    new.submitted_at := now();
    if new.application_code is null then
      new.application_code := 'ABV-' || lpad(nextval('public.vendor_application_seq')::text, 6, '0');
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.vendor_on_submit() from public, anon, authenticated;

-- The vendor role follows the admin's decision, not the start of the sign-up,
-- so someone who gives up or is rejected can still book pickups as a customer.
-- Suspended vendors keep the role (they are still vendors, just paused).
drop trigger vendors_set_role on public.vendors;
drop function public.vendor_set_role();

create or replace function public.vendor_status_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' then
    update public.profiles set role = 'vendor' where id = new.id and role = 'customer';
  elsif new.status in ('draft', 'submitted', 'rejected') then
    update public.profiles set role = 'customer' where id = new.id and role = 'vendor';
  end if;
  -- A vendor who stops being approved hands back pickups not yet started.
  -- Pickups already on the way or weighed stay for an admin to sort out.
  if old.status = 'approved' and new.status <> 'approved' then
    update public.pickups set status = 'requested', vendor_id = null, accepted_at = null
     where vendor_id = new.id and status in ('assigned', 'accepted');
  end if;
  return new;
end $$;
create trigger vendors_status_changed after update of status on public.vendors
  for each row when (new.status is distinct from old.status)
  execute function public.vendor_status_changed();
revoke execute on function public.vendor_status_changed() from public, anon, authenticated;

-- Existing sign-ups that are not approved go back to customer.
update public.profiles p set role = 'customer'
  from public.vendors v
 where v.id = p.id and p.role = 'vendor' and v.status not in ('approved', 'suspended');
