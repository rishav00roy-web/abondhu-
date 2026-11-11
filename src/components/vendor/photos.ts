"use client";

import { authedFetch } from "@/lib/supabase";
import type { PhotoType } from "@/lib/vendor";

/** Shrinks a camera photo to at most 1600px JPEG so uploads stay small on slow networks. */
export async function shrink(file: File): Promise<File> {
  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export async function uploadPhoto(file: File, docType: PhotoType) {
  const fd = new FormData();
  fd.append("file", await shrink(file));
  fd.append("doc_type", docType);
  await authedFetch("/api/vendor/upload", { method: "POST", body: fd });
}
