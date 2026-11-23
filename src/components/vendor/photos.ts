"use client";

import { authedFetch } from "@/lib/supabase";
import type { PhotoType } from "@/lib/vendor";

export async function uploadPhoto(file: File, docType: PhotoType) {
  const fd = new FormData();
  fd.append("file", file); // already shrunk when picked (PhotoPick)
  fd.append("doc_type", docType);
  await authedFetch("/api/vendor/upload", { method: "POST", body: fd });
}
