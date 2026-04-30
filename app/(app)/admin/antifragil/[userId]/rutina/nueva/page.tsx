"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import RutinaForm from "@/components/rutinas/RutinaForm";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function AdminNuevaRutinaPage() {
  const router = useRouter();
  const rawParams = useParams();
  const userId =
    typeof rawParams?.userId === "string"
      ? rawParams.userId
      : Array.isArray(rawParams?.userId)
      ? rawParams.userId[0]
      : "";

  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string>("");

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
    if (!token || !userId) return;
    fetch(`/api/admin/antifragil/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res?.user) {
          setClienteNombre(res.user.full_name?.trim() || res.user.email?.split("@")[0] || "");
        }
      })
      .catch(() => {});
  }, [token, userId]);

  if (checking || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <RutinaForm
      targetUserId={userId}
      mode="new"
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
                fontFamily: "Cormorant Garamond, serif",
              }}
            >
              Rutina · {clienteNombre || "cliente"}
            </p>
            <h1
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "1.75rem",
                fontWeight: 300,
                lineHeight: 1.1,
                color: "rgba(255,255,255,0.95)",
              }}
            >
              Nueva rutina
            </h1>
          </div>
        </div>
      }
      redirectAfterSave={(rutinaId) => `/admin/antifragil/${userId}/rutina/${rutinaId}`}
    />
  );
}
