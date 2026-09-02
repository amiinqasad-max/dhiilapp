"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/Misc";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      await refresh();
      toast("Welcome back!");
      router.push(params.get("next") || "/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Log in to DHIIL</h1>
      <p className="mt-1 text-sm text-gray-500">Find work. Find talent. Connect on WhatsApp.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-brand-700">
          Sign up
        </Link>
      </p>
    </div>
  );
}
