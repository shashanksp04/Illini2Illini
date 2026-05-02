import type { Metadata } from "next";

import { AdminGate } from "@/components/admin/AdminGate";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export const metadata: Metadata = {
  title: "Admin · Users | Illini2Illini",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <AdminGate>
      <AdminUsersClient />
    </AdminGate>
  );
}
