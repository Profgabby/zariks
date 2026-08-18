"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data.user || !data.session) {
        setMessage(
          "Login succeeded but no active session was created."
        );
        setLoading(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] p-6">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">

        {/* ZARIKS HEADER */}
        <div className="bg-[#063d28] px-8 py-8 text-white">

          <div className="mb-5">
            <Image
              src="/zariks-logo.png"
              alt="ZARIKS Logo"
              width={72}
              height={72}
              priority
              className="h-[72px] w-[72px] rounded-2xl object-cover shadow-sm"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-wide">
            ZARIKS
          </h1>

          <p className="mt-1 text-sm text-green-100">
            Transfer Control & Accountability
          </p>
        </div>

        {/* LOGIN FORM */}
        <form
          onSubmit={handleLogin}
          className="space-y-5 p-8"
        >
          <div>
            <h2 className="text-2xl font-bold">
              Sign in
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Access the ZARIKS financial control system.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Email address
            </span>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="name@company.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#006b3c] focus:ring-1 focus:ring-[#006b3c]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Password
            </span>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#006b3c] focus:ring-1 focus:ring-[#006b3c]"
            />
          </label>

          {message && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#006b3c] px-5 py-3 font-semibold text-white transition hover:bg-[#005b33] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

          <p className="pt-2 text-center text-xs text-gray-400">
            Secure Fund Transfer & Accountability System
          </p>
        </form>
      </div>
    </main>
  );
}