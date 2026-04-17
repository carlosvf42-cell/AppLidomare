import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  const supabase = await createClient();

  if (token_hash && type) {
    // Flujo con token_hash (invitación y recovery)
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error) {
      if (type === "invite") {
        return NextResponse.redirect(new URL("/auth/set-password", requestUrl.origin));
      }
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/auth/update-password", requestUrl.origin));
      }
      return NextResponse.redirect(new URL("/", requestUrl.origin));
    }
  }

  if (code) {
    // Flujo con code (OAuth y otros)
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/auth/update-password", requestUrl.origin));
      }
      return NextResponse.redirect(new URL("/", requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
