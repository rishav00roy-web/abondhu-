import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts are bundled with the site (src/app/fonts), so builds never depend on Google Fonts being reachable.
const montserrat = localFont({ src: "./fonts/montserrat-latin-wght-normal.woff2", weight: "100 900", variable: "--font-montserrat" });
const playfair = localFont({
  src: [
    { path: "./fonts/playfair-display-latin-wght-normal.woff2", style: "normal" },
    { path: "./fonts/playfair-display-latin-wght-italic.woff2", style: "italic" },
  ],
  weight: "400 900",
  variable: "--font-playfair",
});
const geistMono = localFont({ src: "./fonts/geist-mono-latin-wght-normal.woff2", weight: "100 900", variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Abondhu | Wealth from waste, doorstep scrap pickup in Jorhat",
  description:
    "Doorstep scrap pickup in Jorhat. Weighed on a digital scale in front of you, paid on the spot, and sent to licensed recyclers.",
  icons: { icon: "/abondhu-mark.png" },
};

export const viewport: Viewport = {
  themeColor: "#061727",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${montserrat.variable} ${playfair.variable} ${geistMono.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-sm bg-gold px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-midnight transition-transform focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
