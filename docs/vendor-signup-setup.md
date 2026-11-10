# Vendor sign-up: switching it on

The code is ready. These steps connect it to a real database. About 20 minutes.

Pages:
- `/partner` is the vendor sign-up (English, one tap for Assamese).
- `/admin` is where you approve or reject applications.

## 1. Create the Supabase project

1. supabase.com > New project. Region: **Mumbai (ap-south-1)**. Free plan is fine for now.
2. Save the database password in your password manager. Never paste it in chat.

## 2. Load the database

Follow `supabase/README.md` ("Putting it into Supabase"): run the 4 migration
files in order in the SQL Editor, then `seed.sql`. You should see 23 tables.

**Check the Jorhat pincodes** in `seed.sql` (785001, 785004–785008, 785010, 785014).
These were guessed. A vendor whose pincode is not in the list can't sign up.
To add one later: `insert into pincodes (pincode, town_id, is_active) select '785xxx', id, true from towns where name = 'Jorhat';`

## 3. Turn on phone login (test numbers, free)

1. Authentication > Sign In / Providers > **Phone**: enable it.
2. Supabase asks for an SMS provider even for test numbers. Pick Twilio and type
   placeholder values for now (MSG91 replaces this at launch).
3. In the same panel, **Test phone numbers**: add lines like
   `919812345678=123456` (your number without +, then the fixed code).
   Add one for yourself (admin) and a few for test vendors.
   Numbers must start with 6, 7, 8 or 9 after the 91.

## 4. Add the keys to Vercel

Vercel > project > Settings > Environment Variables. Add all four
(from Supabase > Project Settings > API, except the last):

| Name | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret key. Server only, never share |
| `AADHAAR_KEY` | Run `openssl rand -base64 32` once and paste the result |

**Back up `AADHAAR_KEY`** in your password manager. If it is lost, the stored
Aadhaar numbers can never be read again. Don't change it once vendors have signed up.

Then redeploy (Deployments > ... > Redeploy).

## 5. Make yourself admin

1. Open `/partner` and sign up once with your own test number (step 1 only is enough;
   this creates your login).
2. In the SQL Editor run:
   `update profiles set role = 'admin' where phone = '+919812345678';`
   (use your number).
3. Open `/admin` and log in with the same number.

## 6. Try the whole flow

With a second test number on a phone: fill all 6 steps on `/partner`, send it, then
approve it on `/admin`. The vendor's screen shows "You're approved!" next time they open it.

## What is not in yet

- SMS to vendors on approval (comes with MSG91 at launch).
- Reading the Aadhaar photo automatically (OCR). An admin checks the photo for now.
- Customer bookings and the vendor pickup dashboard (tables are ready, screens later).
