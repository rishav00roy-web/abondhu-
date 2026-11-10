# Abondhu database (Supabase)

Every table for every Abondhu service, created in one go. Only Jorhat is
switched on (`towns.is_active`, `pincodes.is_active`).

| File | What it does |
| --- | --- |
| `migrations/20261110090000_core_schema.sql` | All tables, enums, indexes, audit log and triggers |
| `migrations/20261110090100_security.sql` | Row level security: who can see and change what |
| `migrations/20261110090200_storage.sql` | Private photo buckets (vendor documents, pickup photos) |
| `seed.sql` | Towns, Jorhat pincodes, materials and starting rates |
| `tests/` | Local security checks (`tests/run.sh`) |

## Putting it into Supabase (first time)

1. Open the project in the Supabase dashboard, then **SQL Editor > New query**.
2. Paste and run each migration file **in order** (090000, then 090100, then 090200).
3. Paste and run `seed.sql`.
4. **Table Editor** should now show 24 tables.

Later, the Supabase CLI can do the same with `supabase link` and `supabase db push`.

## What lives where

- **People:** `profiles` (one per login, created automatically), `addresses`
- **Places:** `towns`, `pincodes` (must start with 78)
- **Scrap and prices:** `material_categories`, `materials`, `material_rates` (with history)
- **Vendors:** `vendors`, `vendor_service_areas`, `vendor_materials`, `vendor_kyc`,
  `vendor_documents`, `vendor_payout_accounts`
- **Pickups:** `pickup_slots`, `pickups`, `pickup_items`, `pickup_photos`, `pickup_status_history`
- **Money:** `customer_payments`, `vendor_payouts`
- **Support:** `ratings`, `complaints`, `notifications`
- **Safety:** `audit_log`

## Rules built in

- A full Aadhaar number can never be stored. `vendor_kyc` keeps the last 4 digits,
  name, date of birth and the provider's reference only.
- KYC results, approvals and payouts are written by the server (service role key)
  or an admin, never by the vendor's own browser.
- Vendors edit their application only while it is a draft (or after a rejection).
- Pickups move through fixed steps: requested, accepted, on the way, weighed, completed.
  `accept_pickup()` makes sure only one vendor can take a pickup.
- Changes to vendors, KYC, rates, payments and roles are written to `audit_log`.
