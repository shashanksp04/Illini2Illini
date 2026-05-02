import type { Metadata } from "next";

import { AdminGate } from "@/components/admin/AdminGate";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboardClient />
    </AdminGate>
  );
}
