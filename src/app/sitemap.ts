import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Only the public pages. Log-in, vendor dashboard and admin are left out on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/vendor`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
