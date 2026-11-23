"use client";

import { authedFetch } from "@/lib/supabase";
import { shrink } from "@/lib/shrink-photo";
import type { PhotoType } from "@/lib/vendor";

export async function uploadPhoto(file: File, docType: PhotoType) {
  const fd = new FormData();
  fd.append("file", await shrink(file));
  fd.append("doc_type", docType);
  await authedFetch("/api/vendor/upload", { method: "POST", body: fd });
}
