"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/PageContainer";

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
    <PageContainer>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-all duration-200">
            &larr; Admin
          </Link>
          <h1 className="text-2xl font-bold text-brand">Users</h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-card">
          {error && (
            <p className="px-6 py-4 text-sm text-red-600">{error}</p>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <p className="text-sm text-gray-500">No users.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Username</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Banned</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id} className="border-b border-gray-200 bg-white last:border-b-0">
                      <td className="px-4 py-3 text-gray-900">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {u.username ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatName(u.first_name, u.last_name)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.role === "ADMIN"
                              ? "bg-gray-100 text-brand"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.is_banned
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {u.is_banned ? "BANNED" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={actionId === u.id}
                          onClick={() => handleBanToggle(u)}
                          className={`inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            u.is_banned
                              ? "border-green-300 bg-white text-green-600 hover:bg-green-50 focus:ring-green-500"
                              : "border-red-300 bg-white text-red-600 hover:bg-red-50 focus:ring-red-500"
                          }`}
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
    </PageContainer>
  );
}
