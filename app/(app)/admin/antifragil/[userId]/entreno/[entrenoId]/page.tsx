"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import EntrenoBuilder from "@/components/antifragil/EntrenoBuilder";
import EntrenoLive from "@/components/antifragil/EntrenoLive";
import { fromApiBlocks, type Block } from "@/components/antifragil/types";

import { isAdmin } from "@/lib/admin";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function EntrenoExistentePage() {
  const router = useRouter();
  const rawParams = useParams();
  const userId =
    typeof rawParams?.userId === "string"
      ? rawParams.userId
      : Array.isArray(rawParams?.userId)
      ? rawParams.userId[0]
      : "";
  const entrenoId =
    typeof rawParams?.entrenoId === "string"
      ? rawParams.entrenoId
      : Array.isArray(rawParams?.entrenoId)
      ? rawParams.entrenoId[0]
      : "";

  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
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

  useEffect(() => {
    if (checking || !token || !userId || !entrenoId) return;
    fetch(`/api/admin/antifragil/${userId}/entrenos/${entrenoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setNombre(res.entreno?.nombre ?? null);
          setBlocks(fromApiBlocks(res.bloques ?? []));
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [checking, token, userId, entrenoId]);

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8" style={{ background: "#080808" }}>
        <p className="text-xs text-center" style={{ color: "#ff8080", fontFamily: "var(--font-ui)" }}>
          {error}
        </p>
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
      entrenoId={entrenoId}
      initialNombre={nombre}
      initialBlocks={blocks}
      onTrainNow={(id, n, b) => setLiveState({ entrenoId: id, nombre: n, blocks: b })}
    />
  );
}
