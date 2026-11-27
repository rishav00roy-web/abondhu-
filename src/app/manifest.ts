import type { MetadataRoute } from "next";

// Lets Chrome install the site as an app (phone home screen / app drawer, or desktop),
// opening in its own window without the browser bar. Icons are in public/icons.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Abondhu",
    short_name: "Abondhu",
    description: "Book a doorstep scrap pickup with a verified scrap dealer near you.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#061727",
    lang: "en-IN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [{ name: "Scrap dealer login", short_name: "Dealers", url: "/partner", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] }],
  };
}
