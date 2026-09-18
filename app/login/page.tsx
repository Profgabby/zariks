"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
function currentNextPath() {
  if (typeof window === "undefined") return "/";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}
function currentMessage() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("message") ?? "";
}
function destinationForUser(user: { user_metadata?: Record<string, unknown> } | null, nextPath: string) {
  return user?.user_metadata?.password_changed === true
    ? nextPath
    : `/auth/update-password?forced=1&next=${encodeURIComponent(nextPath)}`;
}

export default function LoginPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false); const [resetLoading,setResetLoading]=useState(false);
  const [setupMode,setSetupMode]=useState(false); const [message,setMessage]=useState("");
  const [success,setSuccess]=useState(false);

  async function confirmFinanceAccess(supabase: ReturnType<typeof createClient>, userId: string) {
    const { data, error } = await supabase.from("procurement_members").select("user_id,active,workflow_role").eq("user_id",userId).maybeSingle();
    return !error && data?.active === true;
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(""); setSuccess(false);
    try {
      const supabase=createClient(), cleanEmail=email.trim().toLowerCase(), nextPath=currentNextPath();
      if(setupMode){
        if(password.length<8){setMessage("Use a password with at least 8 characters.");setLoading(false);return;}
        const {data,error}=await supabase.auth.signUp({email:cleanEmail,password});
        if(error){setMessage(error.message);setLoading(false);return;}
        if(data.session&&data.user){
          if(!(await confirmFinanceAccess(supabase,data.user.id))){await supabase.auth.signOut();setMessage("This account is not active for ZARIKS Finance.");setLoading(false);return;}
          window.location.replace(destinationForUser(data.user,nextPath)); return;
        }
        setMessage("Account setup received. Sign in with the password you just created.");setSetupMode(false);setPassword("");setLoading(false);return;
      }
      const {data,error}=await supabase.auth.signInWithPassword({email:cleanEmail,password});
      if(error){setMessage(error.message);setLoading(false);return;}
      if(!data.user||!data.session){setMessage("Login succeeded but no active session was created.");setLoading(false);return;}
      if(!(await confirmFinanceAccess(supabase,data.user.id))){await supabase.auth.signOut();setMessage("This account is not active for ZARIKS Finance. Contact the system administrator.");setLoading(false);return;}
      // Verify the browser client can read the session after cookies are written, then make a full request.
      const {data:{session}}=await supabase.auth.getSession();
      if(!session){setMessage("Your session could not be persisted. Please try again.");setLoading(false);return;}
      window.location.replace(destinationForUser(data.user,nextPath));
    } catch(e){setMessage(e instanceof Error?e.message:"Unable to continue.");setLoading(false);}
  }

  async function handleForgotPassword(){
    const cleanEmail=email.trim().toLowerCase();setMessage("");setSuccess(false);
    if(!cleanEmail){setMessage("Enter your ZARIKS email address first.");return;}
    setResetLoading(true);const supabase=createClient(),nextPath=currentNextPath();
    const {error}=await supabase.auth.resetPasswordForEmail(cleanEmail,{redirectTo:`${window.location.origin}/auth/update-password?next=${encodeURIComponent(nextPath)}`});
    if(error)setMessage(error.message);else{setSuccess(true);setMessage("If this email has an active ZARIKS Finance account, a secure password-reset link has been sent. Check the inbox and spam folder.");}
    setResetLoading(false);
  }

  const initialMessage=currentMessage();
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] p-6"><div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"><div className="bg-[#063d28] px-8 py-8 text-white"><div className="mb-5"><Image src="/zariks-logo.png" alt="ZARIKS Logo" width={72} height={72} priority className="h-[72px] w-[72px] rounded-2xl object-cover shadow-sm"/></div><h1 className="text-3xl font-bold tracking-wide">ZARIKS</h1><p className="mt-1 text-sm text-green-100">Transfer Control &amp; Accountability</p></div><form onSubmit={handleLogin} className="space-y-5 p-8"><div><h2 className="text-2xl font-bold">{setupMode?"Set up authorized account":"Sign in"}</h2><p className="mt-1 text-sm text-gray-500">{setupMode?"Only personnel already authorized in ZARIKS Finance can activate an account.":"Access the ZARIKS financial control system."}</p></div><label className="block"><span className="mb-2 block text-sm font-semibold">Email address</span><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3"/></label><label className="block"><span className="mb-2 block text-sm font-semibold">Password</span><input type="password" required autoComplete={setupMode?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3"/></label>{!setupMode&&<button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="text-sm font-semibold text-[#006b3c] hover:underline">{resetLoading?"Sending reset link...":"Forgot password?"}</button>}{(message||initialMessage)&&<div className={`rounded-lg border p-3 text-sm ${success?"border-green-100 bg-green-50 text-green-800":"border-red-100 bg-red-50 text-red-700"}`}>{message||initialMessage}</div>}<button type="submit" disabled={loading} className="w-full rounded-lg bg-[#006b3c] px-5 py-3 font-semibold text-white disabled:opacity-60">{loading?"Signing in...":setupMode?"Activate account & continue":"Sign in"}</button><button type="button" onClick={()=>{setSetupMode(v=>!v);setMessage("");setSuccess(false);setPassword("");}} className="w-full text-center text-sm font-semibold text-[#006b3c] hover:underline">{setupMode?"Already have an account? Sign in":"Authorized personnel: activate account"}</button></form></div></main>;
}