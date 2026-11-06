import type { Metadata, Viewport } from "next";
import { Geist_Mono, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-playfair" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Abondhu | Doorstep scrap recycling across Assam",
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
      <body>{children}</body>
    </html>
  );
}
