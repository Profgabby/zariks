"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    if (password.length < 8) { setMessage("Use a password with at least 8 characters."); return; }
    if (password !== confirmPassword) { setMessage("The passwords do not match."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage(error.message); setLoading(false); return; }
    router.replace("/"); router.refresh();
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] p-6"><form onSubmit={updatePassword} className="w-full max-w-md space-y-5 rounded-2xl border bg-white p-8 shadow-lg"><div><p className="text-sm font-bold tracking-wider text-[#006b3c]">ZARIKS</p><h1 className="mt-1 text-2xl font-bold">Choose a new password</h1><p className="mt-2 text-sm text-gray-500">Set a new password for your ZARIKS account.</p></div><label className="block"><span className="mb-2 block text-sm font-semibold">New password</span><input className="w-full rounded-lg border border-gray-300 px-4 py-3" type="password" minLength={8} required value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Confirm new password</span><input className="w-full rounded-lg border border-gray-300 px-4 py-3" type="password" minLength={8} required value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} autoComplete="new-password" /></label>{message && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{message}</div>}<button disabled={loading} className="w-full rounded-lg bg-[#006b3c] px-5 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Updating..." : "Set new password"}</button></form></main>;
}
