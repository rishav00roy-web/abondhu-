import "server-only";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

// AADHAAR_KEY: 32 random bytes, base64. Generate with:  openssl rand -base64 32
// Keep it only in the hosting environment. Losing it means stored numbers can't be read.
function keys() {
  const raw = process.env.AADHAAR_KEY;
  const master = raw ? Buffer.from(raw, "base64") : null;
  if (!master || master.length !== 32) throw new Error("AADHAAR_KEY must be 32 bytes, base64");
  const derive = (info: string) => Buffer.from(hkdfSync("sha256", master, Buffer.alloc(0), info, 32));
  return { enc: derive("abondhu-aadhaar-enc-v1"), mac: derive("abondhu-aadhaar-mac-v1") };
}

/** AES-256-GCM. Output: "v1:" + base64(iv | tag | ciphertext). */
export function encryptAadhaar(digits: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keys().enc, iv);
  const ct = Buffer.concat([c.update(digits, "utf8"), c.final()]);
  return "v1:" + Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}

export function decryptAadhaar(stored: string): string {
  const [ver, b64] = stored.split(":");
  if (ver !== "v1" || !b64) throw new Error("Unknown Aadhaar ciphertext version");
  const buf = Buffer.from(b64, "base64");
  const d = createDecipheriv("aes-256-gcm", keys().enc, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
}

/** Keyed hash so the same Aadhaar can't be registered twice, without storing it in the clear. */
export const aadhaarHmac = (digits: string) => createHmac("sha256", keys().mac).update(digits).digest("hex");
