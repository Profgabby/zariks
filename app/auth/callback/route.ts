import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const supabase = await createServerSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        return NextResponse.redirect(new URL(next, url.origin));
      }
    }
  }

  return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent("Verification link could not be completed. Please request a new verification email.")}&next=${encodeURIComponent(next)}`, url.origin));
}
