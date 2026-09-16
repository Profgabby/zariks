"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { isApprovedZariksEmail } from "@/lib/zariks-users";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function destinationForUser(user: any, nextPath: string) {
  return user?.user_metadata?.password_changed === true
    ? nextPath
    : `/auth/update-password?forced=1&next=${encodeURIComponent(nextPath)}`;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => safeNextPath(searchParams.get("next")), [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(""); setSuccess(false);
    try {
      const supabase = createClient();
      const cleanEmail = email.trim().toLowerCase();
      if (!isApprovedZariksEmail(cleanEmail)) { setMessage("This email is not authorized for the ZARIKS financial control system."); setLoading(false); return; }

      if (setupMode) {
        if (password.length < 8) { setMessage("Use a password with at least 8 characters."); setLoading(false); return; }
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (signUpError) { setMessage(signUpError.message); setLoading(false); return; }
        if (signUpData.session && signUpData.user) { router.replace(destinationForUser(signUpData.user, nextPath)); router.refresh(); return; }
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!loginError && loginData.session && loginData.user) { router.replace(destinationForUser(loginData.user, nextPath)); router.refresh(); return; }
        setMessage("Your account was created. Sign in with the password you just created."); setSetupMode(false); setPassword(""); setLoading(false); return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) { setMessage(error.message); setLoading(false); return; }
      if (!data.user || !data.session) { setMessage("Login succeeded but no active session was created."); setLoading(false); return; }
      router.replace(destinationForUser(data.user, nextPath)); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to continue."); setLoading(false); }
  }

  async function handleForgotPassword() {
    const cleanEmail = email.trim().toLowerCase(); setMessage(""); setSuccess(false);
    if (!cleanEmail) { setMessage("Enter your ZARIKS email address first."); return; }
    if (!isApprovedZariksEmail(cleanEmail)) { setMessage("This email is not authorized for the ZARIKS financial control system."); return; }
    setResetLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: `${window.location.origin}/auth/update-password?next=${encodeURIComponent(nextPath)}` });
    if (error) setMessage(error.message); else { setSuccess(true); setMessage("If this email has an active ZARIKS login, a secure password-reset link has been sent. Check your inbox and spam folder."); }
    setResetLoading(false);
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] p-6"><div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"><div className="bg-[#063d28] px-8 py-8 text-white"><div className="mb-5"><Image src="/zariks-logo.png" alt="ZARIKS Logo" width={72} height={72} priority className="h-[72px] w-[72px] rounded-2xl object-cover shadow-sm" /></div><h1 className="text-3xl font-bold tracking-wide">ZARIKS</h1><p className="mt-1 text-sm text-green-100">Transfer Control &amp; Accountability</p></div><form onSubmit={handleLogin} className="space-y-5 p-8"><div><h2 className="text-2xl font-bold">{setupMode ? "Set up authorized account" : "Sign in"}</h2><p className="mt-1 text-sm text-gray-500">{setupMode ? "Only approved ZARIKS personnel can create an account. Choose your temporary password to activate access." : "Access the ZARIKS financial control system."}</p></div><label className="block"><span className="mb-2 block text-sm font-semibold">Email address</span><input type="email" required autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@company.com" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#006b3c] focus:ring-1 focus:ring-[#006b3c]" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">{setupMode ? "Temporary password" : "Password"}</span><input type="password" required minLength={setupMode ? 8 : undefined} autoComplete={setupMode ? "new-password" : "current-password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#006b3c] focus:ring-1 focus:ring-[#006b3c]" /></label>{!setupMode && <button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="text-sm font-semibold text-[#006b3c] hover:underline disabled:opacity-60">{resetLoading ? "Sending reset link..." : "Forgot password?"}</button>}{message && <div className={`rounded-lg border p-3 text-sm ${success ? "border-green-100 bg-green-50 text-green-800" : "border-red-100 bg-red-50 text-red-700"}`}>{message}</div>}<button type="submit" disabled={loading} className="w-full rounded-lg bg-[#006b3c] px-5 py-3 font-semibold text-white transition hover:bg-[#005b33] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait..." : setupMode ? "Create account & continue" : "Sign in"}</button><button type="button" onClick={()=>{setSetupMode(v=>!v);setMessage("");setSuccess(false);setPassword("");}} className="w-full text-center text-sm font-semibold text-[#006b3c] hover:underline">{setupMode ? "Already have an account? Sign in" : "Authorized ZARIKS personnel: set up account"}</button><p className="pt-2 text-center text-xs text-gray-400">Secure Fund Transfer &amp; Accountability System</p></form></div></main>;
}
