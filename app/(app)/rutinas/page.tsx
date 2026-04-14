"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Rutina = {
  id: string;
  nombre: string;
  fecha: string;
  ejercicios_rutina: { id: string }[];
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatFecha(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function RutinasPage() {
  const router = useRouter();
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    supabase
      .from("rutinas")
      .select("id, nombre, fecha, ejercicios_rutina(id)")
      .order("fecha", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setRutinas((data as Rutina[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">entrenamiento</p>
          <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight">Mis rutinas</h1>
        </div>
        <Link
          href="/rutinas/nueva"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(42,191,191,0.12)", border: "1px solid rgba(42,191,191,0.3)" }}
          aria-label="Nueva rutina"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#2abfbf" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {/* Content */}
      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rutinas.length === 0 ? (
          <div className="text-center pt-20 px-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#141414", border: "1px solid #222" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="10.5" width="3.5" height="3" rx="0.8" stroke="#444" strokeWidth="1.4"/>
                <rect x="18.5" y="10.5" width="3.5" height="3" rx="0.8" stroke="#444" strokeWidth="1.4"/>
                <rect x="4.5" y="8.5" width="3" height="7" rx="0.8" stroke="#444" strokeWidth="1.4"/>
                <rect x="16.5" y="8.5" width="3" height="7" rx="0.8" stroke="#444" strokeWidth="1.4"/>
                <path d="M7.5 12h9" stroke="#444" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[#555] text-sm font-light mb-1">Aún no tienes rutinas</p>
            <p className="text-[#333] text-xs">Pulsa el + para crear tu primera rutina</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rutinas.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/rutinas/${r.id}`)}
                className="w-full text-left rounded-xl px-4 py-4 transition-colors"
                style={{ background: "#141414", border: "1px solid #222" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[#f0f0f0] text-sm font-light leading-snug">{r.nombre}</p>
                    <p className="text-[#555] text-xs mt-0.5">{formatFecha(r.fecha)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-light"
                      style={{ background: "#1a1a1a", color: "#666", border: "1px solid #2a2a2a" }}
                    >
                      {r.ejercicios_rutina.length} ejerc.
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 6l6 6-6 6" stroke="#333" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
