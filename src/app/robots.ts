import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// /admin, /partner and /account stay crawlable so Google can read their "noindex" tag and drop them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
