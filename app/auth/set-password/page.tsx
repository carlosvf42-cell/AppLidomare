"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError("No se pudo guardar la contraseña. Inténtalo de nuevo.");
        return;
      }

      // Session is already active after verifyOtp — go straight home.
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#080808" }}
    >
      {/* Logo */}
      <div className="mb-10">
        <Logo className="w-[180px]" />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl px-6 py-8"
        style={{ background: "#141414", border: "1px solid #222" }}
      >
        <h1 className="text-[#f0f0f0] text-xl font-light mb-1">
          Crea tu contraseña
        </h1>
        <p className="text-[#555] text-xs tracking-wide mb-8">
          Elige una contraseña segura para acceder a la app.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[#555] mb-2">
              Nueva contraseña
            </label>
            <input
              type="password"
              name="password"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3.5 text-[#f0f0f0] placeholder-[#333] text-sm outline-none focus:border-[#2abfbf] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[#555] mb-2">
              Confirmar contraseña
            </label>
            <input
              type="password"
              name="confirm"
              placeholder="Repite la contraseña"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3.5 text-[#f0f0f0] placeholder-[#333] text-sm outline-none focus:border-[#2abfbf] transition-colors"
            />
          </div>

          {error && (
            <p className="text-[#f0a0a0] text-xs text-center pt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#2abfbf] text-[#080808] font-semibold text-sm tracking-widest uppercase py-4 rounded-lg mt-2 hover:bg-[#25aaaa] active:bg-[#20959e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Guardando..." : "Establecer contraseña"}
          </button>
        </form>
      </div>

      <p className="text-[#2a2a2a] text-[10px] text-center mt-8 tracking-wider">
        Powered by Antifrágil®
      </p>
    </div>
  );
}
