import type { Metadata } from "next";
import { AdminPanelClient } from "@/components/client-only";

export const metadata: Metadata = { title: "Abondhu admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminPanelClient />;
}
