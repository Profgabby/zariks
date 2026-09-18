"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function RecoveryPage() {
  const [message, setMessage] = useState("Securing your password-reset session...");

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const nextPath = safeNextPath(params.get("next"));

    const finish = () => {
      window.location.replace(`/auth/update-password?recovery=1&next=${encodeURIComponent(nextPath)}`);
    };

    let completed = false;
    const completeOnce = () => {
      if (completed) return;
      completed = true;
      finish();
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) completeOnce();
    });

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        completeOnce();
        return;
      }
      // Supabase may finish processing the recovery fragment asynchronously.
      window.setTimeout(async () => {
        const { data: { session: delayedSession } } = await supabase.auth.getSession();
        if (delayedSession) completeOnce();
        else setMessage("This reset link is invalid or has expired. Return to Sign in and request a new password-reset email.");
      }, 1200);
    })();

    return () => listener.subscription.unsubscribe();
  }, []);

  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] p-6"><div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg"><p className="text-sm font-bold tracking-wider text-[#006b3c]">ZARIKS</p><h1 className="mt-2 text-2xl font-bold">Password recovery</h1><p className="mt-3 text-sm text-gray-600">{message}</p><a href="/login" className="mt-6 inline-block text-sm font-semibold text-[#006b3c] hover:underline">Return to Sign in</a></div></main>;
}
