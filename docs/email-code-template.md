# Email login: send a code, not a link

Supabase writes the login email from a template. Its default templates send a
**link**. Our pages ask for a **6-digit code**, so both templates below must
show `{{ .Token }}` (the code). Supabase uses two templates:

- **Confirm signup**: the first email to a new address.
- **Magic Link**: every email after that, to an address that already has an account.

If only one is changed, some people still get a link. Change both.

## Steps (about 3 minutes)

1. Supabase > project **abondhu** > **Authentication** > **Emails** (Templates tab).
2. Open **Confirm signup**. Subject: `Your Abondhu code`. Replace the whole body
   with the HTML below. Save.
3. Open **Magic Link**. Same subject, same HTML. Save.
4. **Authentication** > **Sign In / Providers** > **Email**: check
   **Email OTP Length** is **6** (our code box takes 6 digits). Save.
5. Test: on `/partner` choose "Get the code by email instead". The email should
   show a big 6-digit number and no button.

```html
<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#0a2540">
  <h2 style="margin:0 0 8px">Abondhu</h2>
  <p style="margin:0 0 16px">Your login code is:</p>
  <p style="font-size:36px;font-weight:bold;letter-spacing:8px;margin:0 0 16px">{{ .Token }}</p>
  <p style="margin:0 0 4px">Type this code on the Abondhu page. It works for 1 hour.</p>
  <p style="margin:0;color:#667">Did not ask for it? You can ignore this email.</p>
</div>
```

Do not put `{{ .ConfirmationURL }}` in either template: that is the link.
