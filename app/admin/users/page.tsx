import { AdminGate } from "@/components/admin/AdminGate";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export default function AdminUsersPage() {
  return (
    <AdminGate>
      <AdminUsersClient />
    </AdminGate>
  );
}
