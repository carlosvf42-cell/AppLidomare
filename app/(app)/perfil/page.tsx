"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import ProgresoSection from "@/components/ProgresoSection";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-[calc(80px+env(safe-area-inset-bottom))]">

      {/* Header */}
      <p className="text-[10px] tracking-[0.25em] uppercase text-[#2abfbf] mb-8 px-6">
        Perfil
      </p>

      {/* Avatar + email */}
      <div className="flex items-center gap-4 mb-10 px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-light shrink-0"
          style={{ background: "#141414", border: "1px solid #222", color: "#2abfbf" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-[#f0f0f0] text-sm font-light truncate">{email}</p>
          <p className="text-[#555] text-xs font-light mt-0.5">Miembro activo</p>
        </div>
      </div>

      {/* Info row */}
      <div
        className="rounded-xl overflow-hidden mb-6 mx-6"
        style={{ border: "1px solid #222", background: "#141414" }}
      >
        <div className="px-5 py-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#555] mb-1">Email</p>
          <p className="text-[#f0f0f0] text-sm font-light break-all">{email}</p>
        </div>
      </div>

      {/* Admin link — only for admin */}
      {email === ADMIN_EMAIL && (
        <Link
          href="/admin"
          className="flex items-center justify-between w-full border border-[#222] px-5 py-4 rounded-xl mb-3 mx-6 transition-colors hover:border-[#2abfbf]"
          style={{ width: "calc(100% - 3rem)" }}
        >
          <span className="text-xs tracking-[0.2em] uppercase text-[#555]">Panel de administración</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="#333" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="border border-[#222] text-[#888] text-xs tracking-[0.2em] uppercase py-4 rounded-xl hover:border-[#f0a0a0] hover:text-[#f0a0a0] transition-colors mb-8 mx-6"
        style={{ width: "calc(100% - 3rem)" }}
      >
        Cerrar sesión
      </button>

      {/* ── Mi Progreso ── */}
      <ProgresoSection />
    </div>
  );
}
