"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import RutinaForm from "@/components/rutinas/RutinaForm";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function NuevaRutinaPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (!data.user) {
          router.push("/login");
        } else {
          setUserId(data.user.id);
        }
      });
  }, [router]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div
          className="w-5 h-5 rounded-full animate-spin"
          style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "#2abfbf" }}
        />
      </div>
    );
  }

  return (
    <RutinaForm
      targetUserId={userId}
      mode="new"
      header={
        <div className="px-6 pt-14 pb-4 flex items-center gap-3">
          <Link href="/rutinas" className="transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
              entrenamiento
            </p>
            <h1 className="text-xl font-light tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
              Nueva rutina
            </h1>
          </div>
        </div>
      }
      redirectAfterSave={() => "/rutinas"}
    />
  );
}
