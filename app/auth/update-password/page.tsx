"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [leaving,setLeaving]=useState(false);
  const [message,setMessage]=useState("");
  const [nextPath,setNextPath]=useState("/");
  const [forced,setForced]=useState(false);

  useEffect(()=>{const params=new URLSearchParams(window.location.search);setNextPath(safeNextPath(params.get("next")));setForced(params.get("forced")==="1");},[]);

  async function updatePassword(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setMessage("");
    if(password.length<8){setMessage("Use a password with at least 8 characters.");return;}
    if(password!==confirmPassword){setMessage("The passwords do not match.");return;}
    setLoading(true);
    const supabase=createClient();
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user){setMessage("Your secure session has expired. Sign out and sign in again.");setLoading(false);return;}

    const metadata={...user.user_metadata,password_changed:true,password_changed_at:new Date().toISOString()};
    const {data,error}=await supabase.auth.updateUser({password,data:metadata});
    if(error){setMessage(error.message);setLoading(false);return;}
    if(!data.user){setMessage("Password was not confirmed by the authentication service. Please try again.");setLoading(false);return;}

    // Refresh the browser session after the password/metadata mutation before
    // navigating to a server-rendered protected page.
    const {error:refreshError}=await supabase.auth.refreshSession();
    if(refreshError){setMessage("Password changed, but the secure session could not refresh. Sign in again with your new password.");setLoading(false);return;}

    window.location.assign(nextPath);
  }

  async function switchAccount(){
    setLeaving(true); setMessage("");
    const supabase=createClient();
    await supabase.auth.signOut();
    window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] p-6"><form onSubmit={updatePassword} className="w-full max-w-md space-y-5 rounded-2xl border bg-white p-8 shadow-lg"><div><p className="text-sm font-bold tracking-wider text-[#006b3c]">ZARIKS</p><h1 className="mt-1 text-2xl font-bold">{forced?"Change temporary password":"Change password"}</h1><p className="mt-2 text-sm text-gray-500">{forced?"For security, this account must replace its temporary password before entering ZARIKS Finance.":"Choose a new password for your ZARIKS account."} Use at least 8 characters.</p></div><label className="block"><span className="mb-2 block text-sm font-semibold">New password</span><input className="w-full rounded-lg border border-gray-300 px-4 py-3" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Confirm new password</span><input className="w-full rounded-lg border border-gray-300 px-4 py-3" type="password" minLength={8} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" /></label>{message&&<div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{message}</div>}<button disabled={loading||leaving} className="w-full rounded-lg bg-[#006b3c] px-5 py-3 font-semibold text-white disabled:opacity-60">{loading?"Updating & securing session...":forced?"Set new password & continue":"Save new password"}</button>{forced&&<div className="border-t pt-4 text-center"><p className="mb-3 text-sm text-gray-500">Not your account? You do not need to change this person's password.</p><button type="button" onClick={switchAccount} disabled={loading||leaving} className="w-full rounded-lg border border-[#006b3c] px-5 py-3 font-semibold text-[#006b3c] transition hover:bg-green-50 disabled:opacity-60">{leaving?"Signing out...":"Sign out & use another account"}</button></div>}</form></main>;
}
