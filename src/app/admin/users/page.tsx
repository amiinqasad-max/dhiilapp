"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/I18nContext";
import { apiFetch, translateApiError } from "@/lib/api-client";
import { Skeleton, ErrorState, toast } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import type { Role } from "@/types";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

const roleKey: Record<Role, string> = {
  CLIENT: "admin.roleClient",
  PROFESSIONAL: "admin.roleProfessional",
  ADMIN: "admin.roleAdmin",
};

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(data.users);
    } catch (err) {
      setError(translateApiError(err, t));
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
      toast(u.isActive ? t("admin.userSuspended") : t("admin.userReactivated"));
      load();
    } catch (err) {
      toast(translateApiError(err, t), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/admin" className="text-sm text-brand-700">{t("admin.backToAdmin")}</Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{t("admin.usersTitle")}</h1>

      {error && <div className="mt-4"><ErrorState message={error} onRetry={load} /></div>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("admin.colName")}</th>
              <th className="px-4 py-3">{t("admin.colEmail")}</th>
              <th className="px-4 py-3">{t("admin.colRole")}</th>
              <th className="px-4 py-3">{t("admin.colStatus")}</th>
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
                <td className="px-4 py-3 text-gray-600">{t(roleKey[u.role])}</td>
                <td className="px-4 py-3">
                  <span className={u.isActive ? "text-brand-700" : "text-red-600"}>
                    {u.isActive ? t("admin.statusActive") : t("admin.statusSuspended")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" loading={busyId === u.id} onClick={() => toggleActive(u)}>
                    {u.isActive ? t("admin.suspendButton") : t("admin.reactivateButton")}
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
