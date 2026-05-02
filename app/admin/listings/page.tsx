import type { Metadata } from "next";

import { AdminGate } from "@/components/admin/AdminGate";
import { AdminListingsClient } from "@/components/admin/AdminListingsClient";

export const metadata: Metadata = {
  title: "Admin · Listings | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function AdminListingsPage() {
  return (
    <AdminGate>
      <AdminListingsClient />
    </AdminGate>
  );
}
