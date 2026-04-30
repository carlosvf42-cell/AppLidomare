"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import RutinaForm, { type DiaForm } from "@/components/rutinas/RutinaForm";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Loaded = {
  id: string;
  nombre: string;
  user_id: string;
  dias: DiaForm[];
};

export default function AdminEditarRutinaPage() {
  const router = useRouter();
  const rawParams = useParams();
  const userId =
    typeof rawParams?.userId === "string"
      ? rawParams.userId
      : Array.isArray(rawParams?.userId)
      ? rawParams.userId[0]
      : "";
  const rutinaId =
    typeof rawParams?.rutinaId === "string"
      ? rawParams.rutinaId
      : Array.isArray(rawParams?.rutinaId)
      ? rawParams.rutinaId[0]
      : "";

  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string>("");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session?.user?.email !== ADMIN_EMAIL) {
          router.replace("/");
        } else {
          setToken(data.session.access_token);
          setChecking(false);
        }
      });
  }, [router]);

  useEffect(() => {
    if (checking || !token || !userId || !rutinaId) return;
    const supabase = getSupabase();
    (async () => {
      const [clienteRes, rutinaRes, sesionesRes] = await Promise.all([
        fetch(`/api/admin/antifragil/${userId}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        supabase
          .from("rutinas")
          .select(
            "id, nombre, user_id, rutina_dias(id, nombre, orden, rutina_ejercicios(id, nombre, series, repeticiones, orden, ejercicio_id))"
          )
          .eq("id", rutinaId)
          .eq("user_id", userId)
          .single(),
        supabase.from("sesiones").select("dia_id").eq("user_id", userId),
      ]);

      if (clienteRes?.user) {
        setClienteNombre(clienteRes.user.full_name?.trim() || clienteRes.user.email?.split("@")[0] || "");
      }

      if (rutinaRes.error || !rutinaRes.data) {
        setError("Rutina no encontrada para este cliente");
        return;
      }

      const sesionDiaIds = new Set(
        ((sesionesRes.data ?? []) as Array<{ dia_id: string | null }>).map((s) => s.dia_id).filter(Boolean) as string[]
      );

      const r = rutinaRes.data as any;
      const dias: DiaForm[] = (r.rutina_dias ?? [])
        .sort((a: any, b: any) => a.orden - b.orden)
        .map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          tieneSesiones: sesionDiaIds.has(d.id),
          ejercicios: (d.rutina_ejercicios ?? [])
            .sort((a: any, b: any) => a.orden - b.orden)
            .map((ej: any) => ({
              id: ej.id,
              nombre: ej.nombre,
              ejercicio_id: ej.ejercicio_id ?? null,
              series: String(ej.series ?? 3),
              repeticiones: String(ej.repeticiones ?? 10),
            })),
        }));

      setLoaded({ id: r.id, nombre: r.nombre, user_id: r.user_id, dias });
    })().catch((err) => setError(err?.message ?? "Error cargando la rutina"));
  }, [checking, token, userId, rutinaId]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8" style={{ background: "#080808" }}>
        <p
          className="text-xs text-center"
          style={{ color: "#ff8080", fontFamily: "var(--font-serif)" }}
        >
          {error}
        </p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <RutinaForm
      targetUserId={userId}
      mode="edit"
      initial={{ id: loaded.id, nombre: loaded.nombre, dias: loaded.dias }}
      header={
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <Link
            href={`/admin/antifragil/${userId}`}
            className="shrink-0"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(42,191,191,0.7)",
                fontFamily: "var(--font-serif)",
              }}
            >
              Rutina · {clienteNombre || "cliente"}
            </p>
            <h1
              className="truncate"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.75rem",
                fontWeight: 300,
                lineHeight: 1.1,
                color: "rgba(255,255,255,0.95)",
              }}
            >
              {loaded.nombre || "Editar rutina"}
            </h1>
          </div>
        </div>
      }
      redirectAfterSave={() => `/admin/antifragil/${userId}`}
    />
  );
}
