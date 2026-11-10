# Abondhu web

Doorstep scrap pickup in Jorhat. Next.js 16 (App Router), TypeScript, Tailwind CSS v4,
Framer Motion, lucide-react, Supabase.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
npm test         # admin dashboard number checks (Node 22.18+)
```

Going live with vendor sign-up: see `docs/vendor-signup-setup.md`.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/vendor` | Why join, for scrap collectors; links to the sign-up |
| `/partner` | Vendor sign-up (English, one tap for Assamese) |
| `/admin` | Admin home: vendor counts, vendors by area, recent activity; approve or reject applications |

## Where things live

```
src/
  app/                    routes; app/api/ holds the server endpoints
    api/vendor/           vendor uploads photos, saves Aadhaar (encrypted)
    api/admin/            admin views a photo or the full Aadhaar (logged)
  components/
    site/                 landing page sections and their shared ui/motion pieces
    vendor/               sign-up wizard, its building blocks (ui.tsx), photo upload
    admin/                admin panel
    client-only.tsx       browser-only wrappers for the sign-up and admin pages
  lib/
    site-data.ts          landing page content (rates, FAQ, areas)
    vendor.ts             vendor types and format checks, shared by screens and API
    vendor-i18n.ts        every vendor-facing line, English and Assamese
    aadhaar.ts            Aadhaar checksum and formatting (browser and server)
    supabase.ts           browser Supabase client and calls to our API
    use-action.ts         busy/error handling for buttons
    server/               server-only: service-role client, auth checks, Aadhaar encryption
supabase/                 database migrations, seed and security tests
docs/                     setup guides
```

## Rules

- Simple yet durable: the simplest thing that works, tested and secure.
- Vendor screens stay very simple: big buttons, short words, every line in `vendor-i18n.ts`.
- A full Aadhaar number is only ever handled in `lib/server/` and stored encrypted.
- Colours and fonts: `src/app/globals.css`.
