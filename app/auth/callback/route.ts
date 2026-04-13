import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "";

  if (token_hash && type) {
    // Build the redirect target BEFORE verifying — we'll set cookies on it.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      type === "invite" ? "/auth/set-password" : "/";
    redirectUrl.search = "";

    const response = NextResponse.redirect(redirectUrl);

    // Create a Supabase client that writes session cookies straight onto
    // the redirect response — no separate cookieStore needed.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return response;
    }
  }

  // Token missing or invalid → back to login with error flag
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "?error=invalid_token";
  return NextResponse.redirect(loginUrl);
}
