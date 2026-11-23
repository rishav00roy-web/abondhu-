import "server-only";
import { HttpError } from "./supabase-admin";

const MAX_BYTES = 5 * 1024 * 1024;
/** Allowed photo types and the file extension each is saved with. */
export const PHOTO_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** The photo sent under `key`, checked for size and type, or a 400 with a plain message. */
export function photoFrom(form: FormData, key: string, missing = "Please choose a photo."): File {
  const f = form.get(key);
  if (!(f instanceof File) || f.size === 0) throw new HttpError(400, missing);
  if (f.size > MAX_BYTES) throw new HttpError(400, "Photo is too large (max 5 MB).");
  if (!PHOTO_EXT[f.type]) throw new HttpError(400, "Please upload a photo (JPG or PNG).");
  return f;
}
