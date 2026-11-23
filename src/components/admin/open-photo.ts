"use client";

import { postJson } from "@/lib/supabase";

/**
 * Opens a private photo in a new tab through a 5-minute link. The tab opens first,
 * inside the click, so phone browsers don't block it as a pop-up.
 */
export async function openPhoto(path: string, bucket: "vendor-docs" | "pickup-photos" = "vendor-docs") {
  const w = window.open("about:blank", "_blank");
  try {
    const { url } = await postJson("/api/admin/doc-url", { path, bucket });
    if (w) w.location.href = url;
  } catch (e) {
    w?.close();
    throw e;
  }
}
