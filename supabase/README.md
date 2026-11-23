# Abondhu database (Supabase)

Every table for every Abondhu service, created in one go. Only Jorhat is
switched on (`towns.is_active`, `pincodes.is_active`).

| File | What it does |
| --- | --- |
| `migrations/20261110090000_core_schema.sql` | All tables, enums, indexes, audit log and triggers |
| `migrations/20261110090100_security.sql` | Row level security: who can see and change what |
| `migrations/20261110090200_storage.sql` | Private photo buckets (vendor documents, pickup photos) |
| `migrations/20261110090300_aadhaar_vault.sql` | Encrypted store for full Aadhaar numbers (server-only) |
| `migrations/20261110090400_harden_functions.sql` | Locks trigger functions out of the public API |
| `migrations/20261111090000_vendor_staff.sql` | Vendor workers and their encrypted Aadhaar |
| `migrations/20261112090000_state_guards.sql` | Status rules: pickup totals from items, complete applications only, blocked/suspended checks, vendor role on approval |
| `migrations/20261113090000_lock_after_approval.sql` | Vendors can't change checked photos, areas or UPI once sent; a typed phone never blocks the real owner; max 3 waiting pickups per customer |
| `seed.sql` | Towns, Jorhat pincodes and the list of scrap types |
| `tests/` | Local security checks (`tests/run.sh`) |

## Putting it into Supabase (first time)

1. Open the project in the Supabase dashboard, then **SQL Editor > New query**.
2. Paste and run each migration file **in order** (by the date and number in the file name, oldest first).
3. Paste and run `seed.sql`.
4. **Table Editor** should now show 23 tables.

Later, the Supabase CLI can do the same with `supabase link` and `supabase db push`.

## What lives where

- **People:** `profiles` (one per login, created automatically), `addresses`
- **Places:** `towns`, `pincodes` (must start with 78)
- **Scrap types:** `material_categories`, `materials`, optional suggestions only. Vendors write each item's name freely (any language) and enter the rate from their printed chart.
- **Vendors:** `vendors`, `vendor_service_areas`, `vendor_kyc`,
  `vendor_documents`, `vendor_payout_accounts`
- **Pickups:** `pickup_slots`, `pickups`, `pickup_items`, `pickup_photos`, `pickup_status_history`
- **Money:** `customer_payments`, `vendor_payouts`
- **Support:** `ratings`, `complaints`, `notifications`
- **Safety:** `audit_log`, `vendor_aadhaar_vault`

## Rules built in

- A full Aadhaar number is stored only in `vendor_aadhaar_vault`, encrypted by the
  server with a key held in the hosting environment (`AADHAAR_KEY`), never in the
  database. No browser can read that table, admins included; admins see a number only
  through a server endpoint that logs each view. Everywhere else keeps the last 4 digits.
- KYC results, approvals and payouts are written by the server (service role key)
  or an admin, never by the vendor's own browser.
- Vendors edit their application only while it is a draft (or after a rejection).
- Pickups move through fixed steps: requested, accepted, on the way, weighed, completed.
  `accept_pickup()` makes sure only one vendor can take a pickup.
- Changes to vendors, KYC, payments and roles are written to `audit_log`.
