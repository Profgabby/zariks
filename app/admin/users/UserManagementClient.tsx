"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

type FinanceUser={user_id:string;email:string;full_name:string|null;workflow_role:string;active:boolean};

export default function UserManagementClient({currentUserId,users}:{currentUserId:string;users:FinanceUser[]}) {
 const [selected,setSelected]=useState<FinanceUser|null>(null);
 const [confirm,setConfirm]=useState(false); const [busy,setBusy]=useState(false);
 const [temp,setTemp]=useState(""); const [error,setError]=useState("");
 async function reset(){
   if(!selected)return; setBusy(true);setError("");setTemp("");
   const supabase=createClient();
   const {data,error}=await supabase.functions.invoke("admin-reset-finance-password",{body:{user_id:selected.user_id}});
   if(error||data?.error){setError(data?.error??error?.message??"Reset failed");setBusy(false);return;}
   setTemp(data.temporary_password);setConfirm(false);setBusy(false);
 }
 return <main className="min-h-screen bg-[#f5f7f5] text-[#152019]">
  <header className="bg-[#063d28] text-white"><div className="mx-auto max-w-5xl px-6 py-6"><p className="text-xs font-bold uppercase tracking-wider text-green-100">Super Admin</p><h1 className="text-2xl font-bold">Finance User Management</h1><p className="mt-1 text-sm text-green-100">Controlled account recovery for authorized ZARIKS Finance personnel.</p></div></header>
  <section className="mx-auto max-w-5xl px-6 py-8">
   <Link href="/" className="font-semibold text-[#006b3c]">← Back to Finance Dashboard</Link>
   <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
    <div className="border-b px-6 py-5"><h2 className="font-bold">Active Finance users</h2><p className="text-sm text-gray-500">Reset creates a one-time temporary password. Existing passwords are never displayed or stored here.</p></div>
    {users.map(u=><div key={u.user_id} className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{u.full_name||u.email}</p><p className="text-sm text-gray-500">{u.email} · {u.workflow_role.replaceAll("_"," ")}</p></div>{u.user_id===currentUserId?<span className="text-xs font-semibold text-gray-400">Current Super Admin</span>:<button onClick={()=>{setSelected(u);setConfirm(true);setTemp("");setError("");}} className="rounded-lg border border-[#006b3c] px-4 py-2 text-sm font-bold text-[#006b3c]">Reset password</button>}</div>)}
   </div>
   {error&&<div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
   {temp&&selected&&<div className="mt-5 rounded-xl border-2 border-amber-300 bg-amber-50 p-5"><h3 className="font-bold text-amber-950">Temporary password created for {selected.full_name||selected.email}</h3><p className="mt-2 text-sm text-amber-900">Copy this now and deliver it securely. It is shown only in this response and should be changed immediately after sign-in.</p><div className="mt-3 flex gap-3"><code className="flex-1 rounded-lg bg-white p-3 font-bold">{temp}</code><button onClick={()=>navigator.clipboard.writeText(temp)} className="rounded-lg bg-[#006b3c] px-4 py-2 font-bold text-white">Copy</button></div></div>}
  </section>
  {confirm&&selected&&<div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h3 className="text-xl font-bold">Confirm password reset</h3><p className="mt-2 text-sm text-gray-600">Reset access for <b>{selected.full_name||selected.email}</b>? Their current password will stop working immediately.</p><div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={()=>setConfirm(false)} className="rounded-lg border px-4 py-2 font-semibold">Cancel</button><button disabled={busy} onClick={reset} className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white">{busy?"Resetting…":"Reset & generate temporary password"}</button></div></div></div>}
 </main>
}