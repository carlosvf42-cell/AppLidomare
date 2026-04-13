"use client";

/**
 * /auth/callback
 *
 * Supabase invite emails redirect here with tokens in the URL hash:
 *   https://app.example.com/auth/callback#access_token=...&refresh_token=...&type=invite
 *
 * Hash fragments are browser-only — they never reach the server — so this
 * must be a client component that reads window.location.hash on mount.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Parse tokens from the hash fragment (strip the leading "#")
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token  = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type          = params.get("type");

    if (!access_token || !refresh_token) {
      router.replace("/login?error=invalid_token");
      return;
    }

    const supabase = createClient();

    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          router.replace("/login?error=session_error");
          return;
        }
        // setSession() writes the session to cookies automatically.
        // For invites the user still needs to set their password.
        router.replace(type === "invite" ? "/auth/set-password" : "/");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
      <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#444] text-xs tracking-wider">Verificando acceso…</p>
    </div>
  );
}
