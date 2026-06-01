"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import EntrenoBuilder from "@/components/antifragil/EntrenoBuilder";
import EntrenoLive from "@/components/antifragil/EntrenoLive";
import type { Block } from "@/components/antifragil/types";

import { isAdmin } from "@/lib/admin";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function NuevoEntrenoPage() {
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
  const [liveState, setLiveState] = useState<{ entrenoId: string; nombre: string | null; blocks: Block[] } | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session || !isAdmin(data.session.user.email)) {
          router.replace("/");
        } else {
          setToken(data.session.access_token);
          setChecking(false);
        }
      });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (liveState) {
    return (
      <EntrenoLive
        userId={userId}
        token={token!}
        entrenoId={liveState.entrenoId}
        nombre={liveState.nombre}
        blocks={liveState.blocks}
      />
    );
  }

  return (
    <EntrenoBuilder
      userId={userId}
      onTrainNow={(entrenoId, nombre, blocks) => setLiveState({ entrenoId, nombre, blocks })}
    />
  );
}
