import type { Metadata, Viewport } from "next";
import { Geist_Mono, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-playfair" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Abondhu | Wealth from waste, doorstep scrap pickup in Assam",
  description:
    "Doorstep scrap pickup in Guwahati and across Assam. Weighed on a digital scale in front of you, paid on the spot.",
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
