/** Shrinks a camera photo to at most 1600px JPEG so uploads stay small on slow networks. */
export async function shrink(file: File): Promise<File> {
  try {
    return await toJpeg(file);
  } catch {
    return file;
  }
}

/** Photo types the server accepts. */
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024; // Vercel refuses uploads over 4.5 MB

/**
 * Checks a photo the moment it is picked, so a problem shows right there instead of
 * failing later with a general error. Returns the shrunk JPEG, or null when this phone's
 * browser can't read the photo (for example an iPhone HEIC photo opened on a computer)
 * and the original can't be sent as it is.
 */
export async function readyPhoto(file: File): Promise<File | null> {
  try {
    return await toJpeg(file);
  } catch {
    return OK_TYPES.includes(file.type) && file.size <= MAX_BYTES ? file : null;
  }
}

async function toJpeg(file: File): Promise<File> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  if (!blob) throw new Error("could not encode");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}
