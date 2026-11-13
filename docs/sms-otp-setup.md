# Turn on real SMS login codes (MSG91)

Supabase still makes and checks every 6-digit code. The `send-sms` function in
`supabase/functions/send-sms/` only delivers it through MSG91, using the
DLT-approved template. The login screens don't change.

Do this only after the MSG91 **Test DLT** SMS has reached your phone
(steps 1 to 7 of the setup guide). Nothing here goes in chat or in the code:
the keys are pasted straight into Supabase.

## 0. The MSG91 template

The variable in the MSG91 template must be called `otp`, so the message reads:

```
##otp## is your Abondhu login code. It is valid for 10 minutes. Do not share it with anyone. - Lios Lab
```

(On BSNL DLT the same text has `{#num#}` where MSG91 has `##otp##`.)

## 1. Deploy the function

Supabase dashboard > project **abondhu** > **Edge Functions** > deploy `send-sms`
from this folder, with **Verify JWT turned off** (Supabase Auth calls it with
its own signature, not a user login). With the CLI:

```
supabase functions deploy send-sms --no-verify-jwt --project-ref ybfnffviryebfpqbzjji
```

## 2. Turn on the hook

1. **Authentication > Auth Hooks > Add hook > Send SMS hook**.
2. Type: **HTTPS**. URL: `https://ybfnffviryebfpqbzjji.supabase.co/functions/v1/send-sms`
3. Press **Generate secret**, copy it (starts with `v1,whsec_`), then **Create**.

## 3. Add the three secrets

**Edge Functions > Secrets** (Project Settings > Edge Functions):

| Name | Value |
| --- | --- |
| `SEND_SMS_HOOK_SECRET` | The hook secret from step 2 |
| `MSG91_AUTH_KEY` | Your MSG91 auth key (MSG91 help: "Where can I find my authentication key?") |
| `MSG91_TEMPLATE_ID` | MSG91 > SMS > Templates > copy icon on "Abondhu login OTP" |

## 4. Auth settings

**Authentication > Sign In / Providers > Phone**: keep it on. The Twilio fields
can stay as placeholders; the hook replaces them.

**Authentication > Rate Limits**: raise "SMS messages sent per hour" from the
default to about 300, so ~100 vendors plus customers aren't blocked.

## 5. Test

1. Log in at `/account` with your own number: the code should arrive from ABONDU.
2. Try a second phone on another network.
3. Supabase test numbers (code 123456) still work and never send a real SMS.
4. If a code doesn't arrive: **Edge Functions > send-sms > Logs** says whether
   MSG91 refused it (the reason is shown, never the phone or code), then MSG91 > **Logs**.

## 6. Show SMS to vendors

Vendor sign-up still shows SMS as "Coming soon". Once step 5 works, set
`SMS_READY = true` in `src/components/vendor/VendorSignup.tsx` (Claude can do this).

## Running the checks

```
cd supabase/functions/send-sms && deno test
```

Uses a fake MSG91, so it sends no real SMS.
