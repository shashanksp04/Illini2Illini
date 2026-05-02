import type { Metadata } from "next";

import { AdminGate } from "@/components/admin/AdminGate";
import { AdminReportsClient } from "@/components/admin/AdminReportsClient";

export const metadata: Metadata = {
  title: "Admin · Reports | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function AdminReportsPage() {
  return (
    <AdminGate>
      <AdminReportsClient />
    </AdminGate>
  );
}
