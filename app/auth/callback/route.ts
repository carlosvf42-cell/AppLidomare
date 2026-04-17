import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Password recovery → let user set a new password
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/auth/update-password", requestUrl.origin));
  }

  // Invite → user still needs to set their password
  if (type === "invite") {
    return NextResponse.redirect(new URL("/auth/set-password", requestUrl.origin));
  }

  // Default: go home
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
