# Abondhu web

Front-end mock of the Abondhu doorstep scrap-pickup site. Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, lucide-react. No backend: the booking form validates and shows a confirmation only.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run export   # static copy in out/
```

- Palette and tokens: `src/app/globals.css` (white ivory page, Mint Whisper / Emerald / Forest / Dark Evergreen).
- Content (rates, FAQ, cities, sample receipt): `src/lib/data.ts`.
- Sections: `src/components/`. Motion follows design-motion-principles: one orchestrated hero moment (receipt prints while the scale climbs), a scroll-drawn timeline, and quick feedback on controls. `MotionConfig reducedMotion="user"` plus `useReducedMotion` checks honour reduced motion.
- `preview/` builds a single self-contained HTML file of the same components for sharing (`npx esbuild ...`, see `preview/build.mjs`).
