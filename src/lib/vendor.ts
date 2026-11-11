// Vendor values shared by the sign-up, the admin panel and the API routes.
// They mirror the enums in supabase/migrations/20261110090000_core_schema.sql.

export type VendorStatus = "draft" | "submitted" | "approved" | "rejected" | "suspended";
export type VendorType = "individual_collector" | "scrap_shop" | "recycler";
export type Vehicle = "cycle" | "cart" | "auto" | "truck";

/** Photos a vendor can upload during sign-up. */
export const PHOTO_TYPES = ["selfie", "aadhaar_photo", "shop_photo"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

/** Workers a vendor sends on pickups. An admin checks each one. */
export type StaffStatus = "pending" | "approved" | "rejected";
export const MAX_STAFF = 20;

/** A vendor can change their application only in these states. */
export const EDITABLE_STATUSES: VendorStatus[] = ["draft", "rejected"];

/** Simple format checks for what vendors type. */
/**
 * Clean whatever was typed, pasted or autofilled into a 10-digit Indian mobile:
 * drops spaces/dashes, a leading +91 or 91 (only when there are extra digits),
 * and leading zeros, then keeps at most 10 digits.
 */
export function cleanMobile(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  d = d.replace(/^0+/, "");
  return d.slice(0, 10);
}

export const isValid = {
  mobile: (s: string) => /^[6-9]\d{9}$/.test(s),
  email: (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s),
  upi: (s: string) => /^[A-Za-z0-9.\-_]{2,}@[A-Za-z]{2,}$/.test(s),
  account: (s: string) => /^[0-9]{9,18}$/.test(s),
  ifsc: (s: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(s),
};
