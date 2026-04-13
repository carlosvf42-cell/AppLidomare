"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const BG = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80";

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"checking" | "form">("checking");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // On mount: check if Supabase redirected here with invite tokens in the hash.
  // Supabase invite emails land on the Site URL with:
  //   /login#access_token=...&refresh_token=...&type=invite
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token  = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type          = params.get("type");

    if (access_token && refresh_token && type === "invite") {
      const supabase = createClient();
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            // Session failed — fall through to the normal login form
            setPhase("form");
          } else {
            router.replace("/auth/set-password");
          }
        });
      // Keep showing spinner while setSession resolves
      return;
    }

    // No invite hash — show the normal login form
    setPhase("form");
  }, [router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email    = (form.elements.namedItem("email")    as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Email o contraseña incorrectos.");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  // ── Spinner while checking the hash / calling setSession ──────────────────
  if (phase === "checking") {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Normal login form ─────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG})` }}
        aria-hidden="true"
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,8,8,0.1) 0%, rgba(8,8,8,0.5) 40%, rgba(8,8,8,0.92) 70%, #080808 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Logo */}
        <div className="flex-1 flex items-center justify-center px-8 pt-20 pb-8">
          <Logo className="w-full max-w-[280px]" />
        </div>

        {/* Form */}
        <div className="bg-[#080808] px-6 pt-8 pb-14">
          <p className="text-[#888] text-xs tracking-[0.2em] uppercase mb-6 text-center">
            Acceso para miembros
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-3.5 text-[#f0f0f0] placeholder-[#444] text-sm outline-none focus:border-[#2abfbf] transition-colors"
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              required
              autoComplete="current-password"
              className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-3.5 text-[#f0f0f0] placeholder-[#444] text-sm outline-none focus:border-[#2abfbf] transition-colors"
            />

            {error && (
              <p className="text-[#f0a0a0] text-xs text-center pt-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#2abfbf] text-[#080808] font-semibold text-sm tracking-widest uppercase py-4 rounded-lg mt-2 hover:bg-[#25aaaa] active:bg-[#20959e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Accediendo..." : "Acceder"}
            </button>
          </form>

          <p className="text-[#333] text-xs text-center mt-8 tracking-wider">
            Powered by Antifrágil®
          </p>
        </div>
      </div>
    </div>
  );
}
