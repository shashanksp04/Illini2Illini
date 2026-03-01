import { AdminGate } from "@/components/admin/AdminGate";
import { AdminReportsClient } from "@/components/admin/AdminReportsClient";

export default function AdminReportsPage() {
  return (
    <AdminGate>
      <AdminReportsClient />
    </AdminGate>
  );
}
