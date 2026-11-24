# New-pickup emails to dealers

When a customer books, every approved dealer who covers that pincode is told,
and the first to tap **Accept** on their home screen (`/partner`) gets it.

The pickup always shows on the dealers' home screens. The **email** is sent
only once these two settings are added in Vercel (Project > Settings >
Environment Variables, Production), then redeploy:

| Name | Value |
| --- | --- |
| `SMTP_USER` | the Gmail address that sends (now noreply@abondhu.com on Hostinger; set SMTP_HOST=smtp.hostinger.com) |
| `SMTP_PASS` | a Gmail **app password** for that address (Google Account > Security > App passwords), not the normal password |

Optional: `SMTP_HOST` (default `smtp.gmail.com`) for a domain mailbox later.

Gmail sends about 500 emails a day, enough for about 100 dealers in Jorhat.
Later, WhatsApp or SMS can replace the email in `src/app/api/pickup/notify/route.ts`.

A pickup nobody accepts within an hour shows **No dealer yet** in the admin page.
