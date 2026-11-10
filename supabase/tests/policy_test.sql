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

update public.vendors set status = 'submitted', onboarding_step = 6 where id = auth.uid();
select pg_temp.expect((select application_code like 'ABV-%' from public.vendors where id = auth.uid()), 'submitting gives an application code');
update public.vendors set business_name = 'changed' where id = auth.uid();
select pg_temp.expect((select business_name from public.vendors where id = auth.uid()) = 'Jorhat Kabadi', 'submitted application is locked for editing');
reset role;

select pg_temp.expect((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000b1') = 'vendor', 'profile role switched to vendor');

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

-- ---------- Customer C books a pickup ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
insert into public.addresses (id, profile_id, line1, pincode) values ('00000000-0000-0000-0000-0000000000d1', auth.uid(), 'Near Gar-Ali', '785001');
insert into public.pickups (id, customer_id, address_id, pincode, town_id)
select '00000000-0000-0000-0000-0000000000e1', auth.uid(), '00000000-0000-0000-0000-0000000000d1', '785001', id from public.towns where name = 'Jorhat';
select pg_temp.expect_error($$insert into public.pickups (customer_id, address_id, pincode, town_id, status) select auth.uid(), '00000000-0000-0000-0000-0000000000d1', '785001', 1, 'completed'$$, 'customer cannot create a completed pickup');

-- ---------- V accepts and completes it ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select pg_temp.expect((select count(*) from public.pickups where status = 'requested') = 1, 'approved vendor sees open pickups in their area');
select pg_temp.expect((select count(*) from public.addresses) = 0, 'vendor cannot see the address before accepting');
select (public.accept_pickup('00000000-0000-0000-0000-0000000000e1')).status;
select pg_temp.expect((select count(*) from public.addresses) = 1, 'vendor sees the address after accepting');
select pg_temp.expect_error($$select public.accept_pickup('00000000-0000-0000-0000-0000000000e1')$$, 'a pickup cannot be accepted twice');
select pg_temp.expect_error($$update public.pickups set status = 'completed' where id = '00000000-0000-0000-0000-0000000000e1'$$, 'vendor cannot skip straight to completed');
update public.pickups set status = 'on_the_way' where id = '00000000-0000-0000-0000-0000000000e1';
insert into public.pickup_items (pickup_id, material_id, quantity, rate_per_unit)
select '00000000-0000-0000-0000-0000000000e1', m.id, 8.4, 14 from public.materials m where slug = 'newspaper';
update public.pickups set status = 'weighed' where id = '00000000-0000-0000-0000-0000000000e1';
update public.pickups set status = 'completed', total_amount = 117.60 where id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.expect((select amount from public.pickup_items limit 1) = 117.60, 'item amount is weight x rate');

-- ---------- V2 (not approved) cannot take pickups ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
select pg_temp.expect((select count(*) from public.pickups) = 0, 'unapproved user sees no pickups');
select pg_temp.expect_error($$select public.accept_pickup('00000000-0000-0000-0000-0000000000e1')$$, 'unapproved vendor cannot accept pickups');

-- ---------- C rates it, sees the history ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
insert into public.ratings (pickup_id, rated_by, stars) values ('00000000-0000-0000-0000-0000000000e1', auth.uid(), 5);
select pg_temp.expect((select count(*) from public.pickup_status_history where pickup_id = '00000000-0000-0000-0000-0000000000e1') = 5, 'every status change is recorded');
select pg_temp.expect((select count(*) from public.vendor_payout_accounts) = 0, 'customer cannot see vendor bank or UPI details');

reset role;
rollback;
\echo ALL POLICY CHECKS PASSED
