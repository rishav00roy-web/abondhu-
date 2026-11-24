import type { MetadataRoute } from "next";
import { PAGES } from "@/lib/agent-text";
import { SITE_URL } from "@/lib/site-data";

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: p.path === "/" ? SITE_URL : SITE_URL + p.path, changeFrequency: "monthly", priority: p.path === "/" ? 1 : 0.5 }));
}
