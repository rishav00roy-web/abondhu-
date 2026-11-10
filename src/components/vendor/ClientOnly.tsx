"use client";

import dynamic from "next/dynamic";

// Sign-up and admin keep the login session in the browser, so they render client-side only.
export const VendorSignupClient = dynamic(() => import("./VendorSignup").then((m) => m.VendorSignup), { ssr: false });
export const AdminPanelClient = dynamic(() => import("./AdminPanel").then((m) => m.AdminPanel), { ssr: false });
