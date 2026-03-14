import { AdminGate } from "@/components/admin/AdminGate";
import { AdminListingsClient } from "@/components/admin/AdminListingsClient";

export default function AdminListingsPage() {
  return (
    <AdminGate>
      <AdminListingsClient />
    </AdminGate>
  );
}
