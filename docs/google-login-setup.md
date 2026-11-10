# Turn on "Continue with Google" (customer login)

The code is ready; Google sign-in starts working once these two dashboards are set up.
Takes about 10 minutes. Nothing here goes in chat or in the code: the secret is pasted straight into Supabase.

## 1. Google Cloud: make the login keys

1. Open https://console.cloud.google.com and sign in. Create a project (top bar > New project), name it `Abondhu`.
2. Left menu > **APIs & Services > OAuth consent screen** (also called "Google Auth Platform" > Branding).
   - App name: `Abondhu`. Support email: your email.
   - Audience / User type: **External**.
   - Authorised domain: `supabase.co` (add `vercel.app` too while the site is on abondhu.vercel.app).
   - Save. Then under **Audience**, press **Publish app** so anyone can log in (not just test users).
3. Left menu > **Clients** (or **Credentials > Create credentials > OAuth client ID**).
   - Application type: **Web application**. Name: `Abondhu web`.
   - Authorised JavaScript origins: `https://abondhu.vercel.app`
   - Authorised redirect URIs: `https://ybfnffviryebfpqbzjji.supabase.co/auth/v1/callback`
   - Create. Google shows a **Client ID** and a **Client secret**. Keep this tab open.

## 2. Supabase: switch Google on

1. Supabase dashboard > project **abondhu** > **Authentication > Sign In / Providers > Google**.
2. Turn it on. Paste the **Client ID** and **Client secret** from step 1. Save.
3. **Authentication > URL Configuration**:
   - Site URL: `https://abondhu.vercel.app`
   - Redirect URLs: add `https://abondhu.vercel.app/account`
     (optional, to test on Vercel preview links: `https://*-rishav00roy-webs-projects.vercel.app/**`)

## 3. Try it

Open https://abondhu.vercel.app, press **Sell your scrap**, then **Continue with Google**.
You should land back on the account page saying "Hello, <your name>".

If Google says `redirect_uri_mismatch`, the redirect URI in step 1.3 has a typo.
If you land on the home page instead of the account page, the Redirect URL in step 2.3 is missing.
