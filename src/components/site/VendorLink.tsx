"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";

// One check per page load, shared by every vendor link on the page.
let vendorCheck: Promise<boolean> | null = null;

/** True when the signed-in person has a vendor account (any status). */
function checkVendor(): Promise<boolean> {
  vendorCheck ??= (async () => {
    const sb = getSupabase();
    if (!sb) return false;
    const uid = (await sb.auth.getSession()).data.session?.user.id;
    if (!uid) return false;
    const { data } = await sb.from("vendors").select("id").eq("id", uid).maybeSingle();
    return !!data;
  })().catch(() => false);
  return vendorCheck;
}

/**
 * "Become a vendor" link that turns into "Visit your dashboard" (to /partner)
 * for someone already signed up as a vendor.
 */
export function VendorLink({ className, onClick, children, ...rest }: {
  className?: string;
  onClick?: () => void;
  children?: ReactNode; // extra bits after the label, such as an arrow
  "aria-current"?: "page";
}) {
  const [isVendor, setIsVendor] = useState(false);
  useEffect(() => {
    let live = true;
    checkVendor().then((v) => live && setIsVendor(v));
    return () => {
      live = false;
    };
  }, []);
  return (
    <Link href={isVendor ? "/partner" : "/vendor"} className={className} onClick={onClick} {...rest}>
      {isVendor ? "Visit your dashboard" : "Become a vendor"} {children}
    </Link>
  );
}
