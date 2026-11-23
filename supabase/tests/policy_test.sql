-- Security checks for the vendor sign-up and pickup flow. Run on a local
-- Postgres after supabase_stub.sql, the migrations and seed.sql.
-- Every check raises an error if it fails. Runs in a transaction and rolls back.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.expect_error(sql text, why text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'ok (blocked): %', why;
    return;
  end;
  raise exception 'FAILED, should have been blocked: %', why;
end $$;

create function pg_temp.expect(cond boolean, what text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'FAILED: %', what; end if;
  raise notice 'ok: %', what;
end $$;

-- People: V and V2 are vendors, C a customer, A an admin
insert into auth.users (id, phone) values
  ('00000000-0000-0000-0000-00000000000a', '919800000001'),
  ('00000000-0000-0000-0000-0000000000b1', '919800000002'),
  ('00000000-0000-0000-0000-0000000000b2', '919800000003'),
  ('00000000-0000-0000-0000-0000000000c1', '919800000004');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.expect((select phone from public.profiles where id = '00000000-0000-0000-0000-0000000000b1') = '+919800000002', 'login creates a profile with +91 phone');

-- ---------- Vendor V signs up ----------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

update public.profiles set full_name = 'Vendor One' where id = auth.uid();
select pg_temp.expect_error($$update public.profiles set role = 'admin' where id = auth.uid()$$, 'user cannot make themselves admin');

insert into public.vendors (id, business_name, vendor_type) values (auth.uid(), 'Jorhat Kabadi', 'scrap_shop');
insert into public.vendor_service_areas values (auth.uid(), '785001');
insert into public.vendor_documents (vendor_id, doc_type, storage_path) values (auth.uid(), 'selfie', auth.uid() || '/selfie.jpg');
insert into public.vendor_payout_accounts (vendor_id, method, upi_id) values (auth.uid(), 'upi', 'vendor1@okaxis');

select pg_temp.expect_error($$insert into public.vendor_service_areas values (auth.uid(), '110001')$$, 'pincode outside Assam rejected');
select pg_temp.expect_error($$update public.vendors set status = 'approved' where id = auth.uid()$$, 'vendor cannot approve themselves');
select pg_temp.expect_error($$insert into public.vendor_kyc (vendor_id, method, status, aadhaar_last4) values (auth.uid(), 'digilocker', 'verified', '1234')$$, 'vendor cannot write their own KYC result');
select pg_temp.expect_error($$insert into public.vendors (id) values ('00000000-0000-0000-0000-0000000000b2')$$, 'cannot create a vendor row for someone else');

select pg_temp.expect_error($$update public.vendors set status = 'submitted' where id = auth.uid()$$, 'cannot send an application with steps missing');
insert into public.addresses (id, profile_id, label, line1, pincode) values ('00000000-0000-0000-0000-0000000000d9', auth.uid(), 'shop', 'Shop lane', '785001');
update public.vendors set address_id = '00000000-0000-0000-0000-0000000000d9' where id = auth.uid();
insert into public.vendor_documents (vendor_id, doc_type, storage_path) values (auth.uid(), 'aadhaar_photo', auth.uid() || '/aadhaar.jpg');
reset role;
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
insert into public.vendor_aadhaar_vault (vendor_id, aadhaar_ciphertext, aadhaar_hmac, aadhaar_last4, consent_at)
values ('00000000-0000-0000-0000-0000000000b1', 'v1:Zm9vYmFyYmF6:cXV4', 'hmac-abc', '1234', now());
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
update public.vendors set status = 'submitted', onboarding_step = 6 where id = auth.uid();
select pg_temp.expect((select application_code like 'ABV-%' from public.vendors where id = auth.uid()), 'submitting gives an application code');
update public.vendors set business_name = 'changed' where id = auth.uid();
select pg_temp.expect((select business_name from public.vendors where id = auth.uid()) = 'Jorhat Kabadi', 'submitted application is locked for editing');
reset role;

select pg_temp.expect((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000b1') = 'customer', 'sending an application does not make you a vendor yet');

-- ---------- Server writes the KYC result (service role) ----------
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
insert into public.vendor_kyc (vendor_id, method, status, aadhaar_last4, name_on_aadhaar, provider, provider_reference, verified_at)
values ('00000000-0000-0000-0000-0000000000b1', 'digilocker', 'verified', '1234', 'VENDOR ONE', 'setu', 'req-1', now());
select pg_temp.expect_error($$insert into public.vendor_kyc (vendor_id, method, aadhaar_last4) values ('00000000-0000-0000-0000-0000000000b1', 'digilocker', '123412341234')$$, 'a full 12-digit Aadhaar cannot be stored');
reset role;

-- ---------- Vendor V2 cannot see V ----------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
select pg_temp.expect((select count(*) from public.vendors) = 0, 'another user sees no vendor applications');
select pg_temp.expect((select count(*) from public.vendor_kyc) = 0, 'another user sees no KYC');
select pg_temp.expect((select count(*) from public.vendor_payout_accounts) = 0, 'another user sees no payout details');
select pg_temp.expect((select count(*) from public.audit_log) = 0, 'non-admin cannot read the audit log');
select pg_temp.expect((select count(*) from public.materials) = 14, 'anyone can read materials');

-- ---------- Admin approves V ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
select pg_temp.expect((select count(*) from public.vendors where status = 'submitted') = 1, 'admin sees the submitted application');
update public.vendors set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() where id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.expect((select count(*) from public.audit_log where table_name = 'vendors') >= 3, 'vendor changes are in the audit log');
select pg_temp.expect((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000b1') = 'vendor', 'approval makes the profile a vendor');

-- ---------- Customer C books a pickup ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
insert into public.addresses (id, profile_id, line1, pincode) values ('00000000-0000-0000-0000-0000000000d1', auth.uid(), 'Near Gar-Ali', '785001');
insert into public.pickups (id, customer_id, address_id, pincode, town_id, customer_note)
select '00000000-0000-0000-0000-0000000000e1', auth.uid(), '00000000-0000-0000-0000-0000000000d1', '785001', id, 'Preferred day: Thu 12 Nov. Newspapers' from public.towns where name = 'Jorhat';
select pg_temp.expect_error($$insert into public.pickups (customer_id, address_id, pincode, town_id) select '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000d1', '785001', 1$$, 'customer cannot book for someone else');
select pg_temp.expect_error($$insert into public.pickups (customer_id, address_id, pincode, town_id, status) select auth.uid(), '00000000-0000-0000-0000-0000000000d1', '785001', 1, 'completed'$$, 'customer cannot create a completed pickup');

-- ---------- V accepts and completes it ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select pg_temp.expect((select count(*) from public.pickups where status = 'requested') = 1, 'approved vendor sees open pickups in their area');
select pg_temp.expect((select count(*) from public.addresses where profile_id <> auth.uid()) = 0, 'vendor cannot see the address before accepting');
select (public.accept_pickup('00000000-0000-0000-0000-0000000000e1')).status;
select pg_temp.expect((select count(*) from public.addresses where profile_id <> auth.uid()) = 1, 'vendor sees the address after accepting');
select pg_temp.expect_error($$select public.accept_pickup('00000000-0000-0000-0000-0000000000e1')$$, 'a pickup cannot be accepted twice');
select pg_temp.expect_error($$update public.pickups set status = 'completed' where id = '00000000-0000-0000-0000-0000000000e1'$$, 'vendor cannot skip straight to completed');
update public.pickups set status = 'on_the_way' where id = '00000000-0000-0000-0000-0000000000e1';
insert into public.pickup_items (pickup_id, item_name, quantity, rate_per_unit)
values ('00000000-0000-0000-0000-0000000000e1', 'পুৰণি কাকত (old newspaper)', 8.4, 14);
update public.pickups set status = 'weighed' where id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.expect_error($$update public.pickups set total_amount = 5000 where id = '00000000-0000-0000-0000-0000000000e1'$$, 'vendor cannot type in the total');
update public.pickups set status = 'completed' where id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.expect((select amount from public.pickup_items limit 1) = 117.60, 'item amount is weight x rate');
select pg_temp.expect((select total_amount = 117.60 and total_weight_kg = 8.4 from public.pickups where id = '00000000-0000-0000-0000-0000000000e1'), 'pickup totals are added up from the items');
select pg_temp.expect_error($$update public.pickups set customer_note = 'x' where id = '00000000-0000-0000-0000-0000000000e1'$$, 'a finished pickup cannot be changed');

-- ---------- V2 (not approved) cannot take pickups ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
select pg_temp.expect((select count(*) from public.pickups) = 0, 'unapproved user sees no pickups');
select pg_temp.expect_error($$select public.accept_pickup('00000000-0000-0000-0000-0000000000e1')$$, 'unapproved vendor cannot accept pickups');

-- ---------- C rates it, sees the history ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
insert into public.ratings (pickup_id, rated_by, stars) values ('00000000-0000-0000-0000-0000000000e1', auth.uid(), 5);
select pg_temp.expect_error($$update public.pickups set total_amount = 99999 where id = '00000000-0000-0000-0000-0000000000e1'$$, 'customer cannot change the money on their pickup');
select pg_temp.expect_error($$insert into public.pickups (customer_id, address_id, pincode, town_id, total_amount) select auth.uid(), '00000000-0000-0000-0000-0000000000d1', '785001', 1, 5000$$, 'customer cannot book with a total filled in');
select pg_temp.expect((select count(*) from public.pickup_status_history where pickup_id = '00000000-0000-0000-0000-0000000000e1') = 5, 'every status change is recorded');
select pg_temp.expect((select count(*) from public.vendor_payout_accounts) = 0, 'customer cannot see vendor bank or UPI details');

-- ---------- Aadhaar vault ----------
reset role;
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$insert into public.vendor_aadhaar_vault (vendor_id, aadhaar_ciphertext, aadhaar_hmac, aadhaar_last4, consent_at) values ('00000000-0000-0000-0000-0000000000b2', '1234 5678 9012', 'hmac-x', '9012', now())$$, 'a plain Aadhaar number is refused in the vault');
reset role;
insert into public.vendors (id) values ('00000000-0000-0000-0000-0000000000b2') on conflict do nothing;
set local role service_role;
select pg_temp.expect_error($$insert into public.vendor_aadhaar_vault (vendor_id, aadhaar_ciphertext, aadhaar_hmac, aadhaar_last4, consent_at) values ('00000000-0000-0000-0000-0000000000b2', 'v1:b3RoZXI=:eHl6', 'hmac-abc', '1234', now())$$, 'the same Aadhaar cannot be used by two vendors');
reset role;
select pg_temp.expect(not exists (select 1 from public.audit_log where table_name = 'vendor_aadhaar_vault' and (new_data ? 'aadhaar_ciphertext' or new_data ? 'aadhaar_hmac')), 'audit log never copies the encrypted number');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
select pg_temp.expect_error($$select * from public.vendor_aadhaar_vault$$, 'even an admin cannot read the vault directly');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select pg_temp.expect_error($$select * from public.vendor_aadhaar_vault$$, 'a vendor cannot read the vault');

-- ---------- Workers (vendor_staff) ----------
reset role;
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
insert into public.vendor_staff (id, vendor_id, full_name, phone, aadhaar_last4, aadhaar_photo_path, face_photo_path)
values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', 'Worker One', '+919800000009', '4321',
        '00000000-0000-0000-0000-0000000000b1/staff/f1/aadhaar.jpg', '00000000-0000-0000-0000-0000000000b1/staff/f1/face.jpg');
insert into public.staff_aadhaar_vault (staff_id, aadhaar_ciphertext, aadhaar_hmac, aadhaar_last4, consent_at)
values ('00000000-0000-0000-0000-0000000000f1', 'v1:c3RhZmY=:eHl6', 'hmac-staff', '4321', now());
select pg_temp.expect_error($$insert into public.staff_aadhaar_vault (staff_id, aadhaar_ciphertext, aadhaar_hmac, aadhaar_last4, consent_at) values ('00000000-0000-0000-0000-0000000000f1', '1234 5678 9012', 'hmac-y', '9012', now())$$, 'a plain worker Aadhaar is refused');
select pg_temp.expect_error($$insert into public.vendor_staff (vendor_id, full_name, phone, aadhaar_last4, aadhaar_photo_path, face_photo_path) values ('00000000-0000-0000-0000-0000000000b1', 'X', '12345', '1', 'a', 'b')$$, 'bad worker phone or name refused');
reset role;
select pg_temp.expect(not exists (select 1 from public.audit_log where table_name = 'staff_aadhaar_vault' and (new_data ? 'aadhaar_ciphertext' or new_data ? 'aadhaar_hmac')), 'audit log never copies a worker''s encrypted number');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select pg_temp.expect((select count(*) from public.vendor_staff) = 1, 'vendor sees their own worker');
update public.vendor_staff set status = 'approved';
select pg_temp.expect((select status from public.vendor_staff) = 'pending', 'vendor cannot approve their own worker');
select pg_temp.expect_error($$insert into public.vendor_staff (vendor_id, full_name, phone, aadhaar_last4, aadhaar_photo_path, face_photo_path) values (auth.uid(), 'Sneaky', '+919800000010', '1111', 'a', 'b')$$, 'vendor cannot add a worker without the server');
select pg_temp.expect_error($$select * from public.staff_aadhaar_vault$$, 'a vendor cannot read the worker vault');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
select pg_temp.expect((select count(*) from public.vendor_staff) = 0, 'another vendor cannot see the worker');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
update public.vendor_staff set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() where id = '00000000-0000-0000-0000-0000000000f1';
select pg_temp.expect((select status from public.vendor_staff where id = '00000000-0000-0000-0000-0000000000f1') = 'approved', 'admin approves a worker');
select pg_temp.expect_error($$update public.vendor_staff set full_name = 'changed'$$, 'admin cannot change worker details from the browser');
select pg_temp.expect_error($$select * from public.staff_aadhaar_vault$$, 'even an admin cannot read the worker vault directly');

-- ---------- Holes closed in the 2026-11-12 review ----------
reset role;
insert into auth.users (id, phone) values ('00000000-0000-0000-0000-0000000000c2', '919800000005');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', true);
select pg_temp.expect_error($$insert into public.pickups (customer_id, address_id, pincode, town_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000d1', '785001', 1)$$, 'customer cannot book at someone else''s address');

-- C books again; V takes it, then an admin suspends V
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
insert into public.pickups (id, customer_id, address_id, pincode, town_id) values ('00000000-0000-0000-0000-0000000000e2', auth.uid(), '00000000-0000-0000-0000-0000000000d1', '785001', 1);
insert into public.pickups (id, customer_id, address_id, pincode, town_id) values ('00000000-0000-0000-0000-0000000000e3', auth.uid(), '00000000-0000-0000-0000-0000000000d1', '785001', 1);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select (public.accept_pickup('00000000-0000-0000-0000-0000000000e2')).status;
select (public.accept_pickup('00000000-0000-0000-0000-0000000000e3')).status;
update public.pickups set status = 'on_the_way' where id = '00000000-0000-0000-0000-0000000000e3';
select pg_temp.expect_error($$update public.pickups set status = 'weighed' where id = '00000000-0000-0000-0000-0000000000e3'$$, 'cannot mark weighed with nothing weighed');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
update public.vendors set status = 'suspended', rejection_reason = 'complaints' where id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.expect((select status = 'requested' and vendor_id is null from public.pickups where id = '00000000-0000-0000-0000-0000000000e2'), 'suspending hands back pickups not yet started');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select pg_temp.expect_error($$update public.pickups set status = 'cancelled' where id = '00000000-0000-0000-0000-0000000000e3'$$, 'a suspended vendor cannot move pickups');
select pg_temp.expect_error($$select public.accept_pickup('00000000-0000-0000-0000-0000000000e2')$$, 'a suspended vendor cannot accept pickups');

-- Blocked people
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
update public.vendors set status = 'approved' where id = '00000000-0000-0000-0000-0000000000b1';
reset role;
update public.profiles set is_blocked = true where id in ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select pg_temp.expect_error($$select public.accept_pickup('00000000-0000-0000-0000-0000000000e2')$$, 'a blocked vendor cannot accept pickups');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
select pg_temp.expect_error($$insert into public.pickups (customer_id, address_id, pincode, town_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000d1', '785001', 1)$$, 'a blocked customer cannot book');

-- ---------- Holes closed in the 2026-11-13 review ----------
-- An approved vendor cannot change what the admin checked
reset role;
update public.profiles set is_blocked = false where id = '00000000-0000-0000-0000-0000000000b1';
insert into public.vendor_payout_accounts (vendor_id, method, upi_id)
  select '00000000-0000-0000-0000-0000000000b1', 'upi', 'vendor@okaxis'
  where not exists (select 1 from public.vendor_payout_accounts where vendor_id = '00000000-0000-0000-0000-0000000000b1');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select pg_temp.expect((select status from public.vendors where id = auth.uid()) = 'approved', 'vendor V is approved');
delete from public.vendor_documents where vendor_id = auth.uid();
select pg_temp.expect((select count(*) from public.vendor_documents where vendor_id = auth.uid()) > 0, 'approved vendor cannot delete their checked photos');
select pg_temp.expect_error($$insert into public.vendor_documents (vendor_id, doc_type, storage_path) values (auth.uid(), 'selfie', 'x/other-person.jpg')$$, 'approved vendor cannot add a different photo');
select pg_temp.expect_error($$insert into public.vendor_service_areas (vendor_id, pincode) select auth.uid(), pincode from public.pincodes where pincode <> '785001'$$, 'approved vendor cannot add more areas');
delete from public.vendor_service_areas where vendor_id = auth.uid();
select pg_temp.expect((select count(*) from public.vendor_service_areas where vendor_id = auth.uid()) > 0, 'approved vendor cannot remove their areas');
update public.vendor_payout_accounts set upi_id = 'thief@okaxis' where vendor_id = auth.uid();
select pg_temp.expect((select upi_id from public.vendor_payout_accounts where vendor_id = auth.uid()) <> 'thief@okaxis', 'approved vendor cannot change their UPI');
-- A vendor still filling in the form (V2) can change these
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
insert into public.vendor_service_areas (vendor_id, pincode) values (auth.uid(), '785004') on conflict do nothing;
select pg_temp.expect((select count(*) from public.vendor_service_areas where vendor_id = auth.uid() and pincode = '785004') = 1, 'a vendor filling in the form can pick areas');

-- A typed-in number never blocks the real owner's phone login
reset role;
update public.profiles set phone = '+919811111111' where id = '00000000-0000-0000-0000-0000000000c2';
insert into auth.users (id, phone) values ('00000000-0000-0000-0000-0000000000c3', '919811111111');
select pg_temp.expect((select phone from public.profiles where id = '00000000-0000-0000-0000-0000000000c3') = '+919811111111', 'real owner logs in by phone even after someone typed their number');
select pg_temp.expect((select phone from public.profiles where id = '00000000-0000-0000-0000-0000000000c2') is null, 'the typed copy of the number is freed');

-- At most 3 pickups waiting per customer
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c3', true);
insert into public.addresses (id, profile_id, line1, pincode) values ('00000000-0000-0000-0000-0000000000d3', auth.uid(), 'Home lane', '785001');
insert into public.pickups (id, customer_id, address_id, pincode, town_id) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), '00000000-0000-0000-0000-0000000000d3', '785001', 1);
insert into public.pickups (customer_id, address_id, pincode, town_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000d3', '785001', 1);
insert into public.pickups (customer_id, address_id, pincode, town_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000d3', '785001', 1);
select pg_temp.expect_error($$insert into public.pickups (customer_id, address_id, pincode, town_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000d3', '785001', 1)$$, 'a 4th waiting pickup is refused');
update public.pickups set status = 'cancelled' where id = '00000000-0000-0000-0000-0000000000a1';
insert into public.pickups (customer_id, address_id, pincode, town_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000d3', '785001', 1);
select pg_temp.expect((select count(*) from public.pickups where customer_id = auth.uid() and status = 'requested') = 3, 'after cancelling one, the customer can book again');

reset role;
rollback;
\echo ALL POLICY CHECKS PASSED
