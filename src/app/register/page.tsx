"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/Misc";
import type { Role } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [role, setRole] = useState<Role>("PROFESSIONAL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
      await refresh();
      toast("Account created!");
      router.push(role === "CLIENT" ? "/jobs/new" : "/profile");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Create your DHIIL account</h1>
      <p className="mt-1 text-sm text-gray-500">Choose how you plan to use DHIIL.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("PROFESSIONAL")}
          className={`tap-target rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors ${
            role === "PROFESSIONAL" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-gray-200 text-gray-600"
          }`}
        >
          I&apos;m a Professional
        </button>
        <button
          type="button"
          onClick={() => setRole("CLIENT")}
          className={`tap-target rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors ${
            role === "CLIENT" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-gray-200 text-gray-600"
          }`}
        >
          I&apos;m a Client
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={8}
          hint="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-700">
          Log in
        </Link>
      </p>
    </div>
  );
}
