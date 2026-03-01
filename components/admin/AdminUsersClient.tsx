"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type UserItem = {
  id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_banned: boolean;
  created_at: string;
};

function formatName(first: string | null, last: string | null): string {
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return "—";
}

export function AdminUsersClient() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { items: UserItem[] };
        error?: { message: string };
      };
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? "Failed to load users.");
        setItems([]);
        return;
      }
      setItems(json.data?.items ?? []);
    } catch {
      setError("Failed to load users.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleBanToggle(user: UserItem) {
    const nextBanned = !user.is_banned;
    const action = nextBanned ? "ban" : "unban";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    setActionId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_banned: nextBanned }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: { message: string } };
      if (res.ok && json.ok) {
        await fetchUsers();
      } else {
        setError(json?.error?.message ?? "Failed to update user.");
      }
    } catch {
      setError("Failed to update user.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{ backgroundColor: "#F8F9FB" }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin"
            className="text-sm font-medium"
            style={{ color: "#6B7280" }}
          >
            ← Admin
          </Link>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
            Users
          </h1>
        </div>

        <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-sm overflow-hidden">
          {error && (
            <p className="px-6 py-4 text-sm" style={{ color: "#DC2626" }}>
              {error}
            </p>
          )}
          {loading ? (
            <p className="px-6 py-8 text-sm" style={{ color: "#6B7280" }}>
              Loading…
            </p>
          ) : items.length === 0 ? (
            <p className="px-6 py-8 text-sm" style={{ color: "#6B7280" }}>
              No users.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB]">
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Email</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Username</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Name</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Role</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Banned</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Created</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#111827" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id} className="border-b border-[#E5E7EB]">
                      <td className="px-4 py-3" style={{ color: "#111827" }}>
                        {u.email}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>
                        {u.username ?? "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#111827" }}>
                        {formatName(u.first_name, u.last_name)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          style={
                            u.role === "ADMIN"
                              ? { backgroundColor: "#DBEAFE", color: "#1D4ED8" }
                              : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          style={
                            u.is_banned
                              ? { backgroundColor: "#FEE2E2", color: "#B91C1C" }
                              : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                          }
                        >
                          {u.is_banned ? "BANNED" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={actionId === u.id}
                          onClick={() => handleBanToggle(u)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#E84A27] focus:ring-offset-2 disabled:opacity-70"
                          style={{
                            borderColor: u.is_banned ? "#16A34A" : "#DC2626",
                            color: u.is_banned ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {actionId === u.id ? "…" : u.is_banned ? "Unban" : "Ban"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
