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
    const form     = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm  = (form.elements.namedItem("confirm")  as HTMLInputElement).value;

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
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

      router.push("/");
      router.refresh();
    });
  }

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: "#080808" }}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Logo — upper half */}
        <div className="flex-1 flex items-center justify-center px-8 pt-20 pb-8">
          <Logo className="w-full max-w-[280px]" />
        </div>

        {/* Form — lower half */}
        <div className="bg-[#080808] px-6 pt-8 pb-14">
          <h1 className="text-[#f0f0f0] text-xl font-light text-center mb-1">
            Bienvenido a Lidomare
          </h1>
          <p className="text-[#888] text-xs tracking-[0.15em] text-center mb-8">
            Crea tu contraseña para acceder
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto">
            <input
              type="password"
              name="password"
              placeholder="Nueva contraseña"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-3.5 text-[#f0f0f0] placeholder-[#444] text-sm outline-none focus:border-[#2abfbf] transition-colors"
            />
            <input
              type="password"
              name="confirm"
              placeholder="Confirmar contraseña"
              required
              minLength={6}
              autoComplete="new-password"
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
              {isPending ? "Guardando..." : "Establecer contraseña"}
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
