# Login protection ("are you human" check)

Stops bots from asking for thousands of login codes, which would use up the
email (and later SMS) allowance so real people get no code.

The website code is ready and stays off until a key is added. Do the steps
**in this order**: turning it on in Supabase first would block every login.

1. **Cloudflare** (free): sign up at dash.cloudflare.com, open **Turnstile**,
   click **Add widget**. Name: `Abondhu`. Hostnames: `abondhu.com` and
   `www.abondhu.com`. Mode: **Managed**. Create. You get a **Site key** and a
   **Secret key**.
2. **Vercel**: project `abondhu-` > **Settings > Environment Variables** > add
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = the Site key (Production). Then
   **Deployments** > latest > **Redeploy**. Wait until it is Ready.
3. Check abondhu.com/account: a small "Verify you are human" box shows above
   "Send code" and ticks itself.
4. **Supabase**: **Authentication > Attack Protection** > turn on **Enable
   Captcha protection**, provider **Turnstile**, paste the **Secret key**, Save.
5. Test: log in once on /account, /partner and /admin.

To turn it off again: switch it off in Supabase first, then remove the Vercel
variable and redeploy.

Also worth checking once: **Authentication > Rate Limits** > "emails sent per
hour". With your own email sender the default is low (around 30 an hour); set
it to about 100.
