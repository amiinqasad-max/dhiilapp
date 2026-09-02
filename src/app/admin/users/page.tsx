"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Skeleton, ErrorState, toast } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load users.");
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!user) return router.push("/login?next=/admin/users");
    if (user.role !== "ADMIN") return router.push("/");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  async function toggleActive(u: AdminUser) {
    setBusyId(u.id);
    try {
      await apiFetch(`/api/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !u.isActive }) });
      toast(u.isActive ? "User suspended." : "User reactivated.");
      load();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Failed to update user.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/admin" className="text-sm text-brand-700">← Admin</Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Users</h1>

      {error && <div className="mt-4"><ErrorState message={error} onRetry={load} /></div>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users === null &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={5}><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))}
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={u.isActive ? "text-brand-700" : "text-red-600"}>
                    {u.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" loading={busyId === u.id} onClick={() => toggleActive(u)}>
                    {u.isActive ? "Suspend" : "Reactivate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
