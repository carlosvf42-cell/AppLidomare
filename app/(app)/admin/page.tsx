"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

type UsuarioRow = {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Nunca";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Invite state
  const [email, setEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "ok" | "error">("idle");
  const [inviteMsg, setInviteMsg] = useState("");
  const [isSending, startSend] = useTransition();

  // Users state
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user?.email !== ADMIN_EMAIL) {
          router.replace("/");
        } else {
          setChecking(false);
        }
      });
  }, [router]);

  // Load users
  useEffect(() => {
    if (checking) return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setUsersError(data.error);
        } else {
          const sorted = (data.users as UsuarioRow[]).sort(
            (a, b) =>
              new Date(b.last_sign_in_at ?? b.created_at).getTime() -
              new Date(a.last_sign_in_at ?? a.created_at).getTime()
          );
          setUsuarios(sorted);
        }
        setUsersLoading(false);
      })
      .catch((err) => {
        setUsersError(err.message);
        setUsersLoading(false);
      });
  }, [checking]);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteStatus("idle");
    setInviteMsg("");

    startSend(async () => {
      try {
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          setInviteStatus("ok");
          setInviteMsg("Invitación enviada correctamente.");
          setEmail("");
        } else {
          setInviteStatus("error");
          setInviteMsg(data.details ?? data.error ?? "Error al enviar la invitación.");
        }
      } catch (err: any) {
        setInviteStatus("error");
        setInviteMsg(err.message ?? "Error de red.");
      }
    });
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#2abfbf] mb-1">Admin</p>
        <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight">Panel de administración</h1>
      </div>

      <div className="px-4 pb-10 space-y-6">
        {/* ── Invitar alumno ── */}
        <section>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-3 px-1">Invitar alumno</p>
          <div className="rounded-xl px-4 py-4 space-y-3" style={{ background: "#141414", border: "1px solid #222" }}>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[#555] mb-2">
                  Email del alumno
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setInviteStatus("idle");
                  }}
                  placeholder="alumno@email.com"
                  required
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3 text-[#f0f0f0] placeholder-[#333] text-sm outline-none focus:border-[#2abfbf] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-widest uppercase transition-colors disabled:opacity-50"
                style={{ background: "#2abfbf", color: "#080808" }}
              >
                {isSending ? "Enviando…" : "Enviar invitación"}
              </button>
            </form>

            {inviteStatus === "ok" && (
              <p className="text-xs text-center" style={{ color: "#4caf7d" }}>
                {inviteMsg}
              </p>
            )}
            {inviteStatus === "error" && (
              <p className="text-xs text-center text-[#f0a0a0]">{inviteMsg}</p>
            )}
          </div>
        </section>

        {/* ── Alumnos registrados ── */}
        <section>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-3 px-1">
            Alumnos registrados
            {!usersLoading && !usersError && (
              <span className="ml-2 normal-case text-[#333]">({usuarios.length})</span>
            )}
          </p>

          {usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : usersError ? (
            <p className="text-[#f0a0a0] text-xs text-center py-4">{usersError}</p>
          ) : (
            <div className="space-y-2">
              {usuarios.map((u) => (
                <div
                  key={u.id}
                  className="rounded-xl px-4 py-3.5"
                  style={{ background: "#141414", border: "1px solid #222" }}
                >
                  <p className="text-[#f0f0f0] text-sm font-light truncate">{u.email}</p>
                  <p className="text-[#555] text-xs mt-0.5">
                    Último acceso: {formatDate(u.last_sign_in_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
