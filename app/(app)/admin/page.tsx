"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
const ADMIN_EMAIL = "carlosvf42@gmail.com";

type UsuarioRow = {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  full_name: string | null;
  is_antifragil: boolean;
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

function AntifragilBadge() {
  return (
    <span
      className="shrink-0 text-[9px] tracking-[0.2em] uppercase font-semibold px-2 py-0.5 rounded"
      style={{
        background: "rgba(42,191,191,0.12)",
        border: "0.5px solid rgba(42,191,191,0.4)",
        color: "#2abfbf",
        fontFamily: "var(--font-serif)",
      }}
    >
      Antifrágil
    </span>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Invite state
  const [email, setEmail] = useState("");
  const [inviteAntifragil, setInviteAntifragil] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "ok" | "error">("idle");
  const [inviteMsg, setInviteMsg] = useState("");
  const [isSending, startSend] = useTransition();

  // Users state
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [deletingUser, setDeletingUser] = useState<UsuarioRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Auth check + capture token for API calls
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

  // Load users
  useEffect(() => {
    if (checking || !token) return;
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
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
  }, [checking, token]);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteStatus("idle");
    setInviteMsg("");

    startSend(async () => {
      try {
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          // If marked antifragil, set the flag on the new user (returned id)
          const newUserId = data.user?.id ?? data.id;
          if (inviteAntifragil && newUserId) {
            await fetch("/api/users", {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ id: newUserId, is_antifragil: true }),
            });
          }
          setInviteStatus("ok");
          setInviteMsg("Invitación enviada correctamente.");
          setEmail("");
          setInviteAntifragil(false);
          // Refresh users list
          fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => {
              if (Array.isArray(d.users)) {
                const sorted = (d.users as UsuarioRow[]).sort(
                  (a, b) =>
                    new Date(b.last_sign_in_at ?? b.created_at).getTime() -
                    new Date(a.last_sign_in_at ?? a.created_at).getTime()
                );
                setUsuarios(sorted);
              }
            });
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

  async function handleDeleteUser(user: UsuarioRow) {
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: user.id }),
      });
      if (res.ok) {
        setUsuarios((prev) => prev.filter((u) => u.id !== user.id));
      }
    } catch {}
    setDeleting(false);
    setDeletingUser(null);
  }

  async function toggleAntifragil(user: UsuarioRow) {
    if (!token || togglingId) return;
    const next = !user.is_antifragil;
    setTogglingId(user.id);
    // Optimistic update
    setUsuarios((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_antifragil: next } : u))
    );
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: user.id, is_antifragil: next }),
      });
      if (!res.ok) {
        // Revert
        setUsuarios((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_antifragil: !next } : u))
        );
      }
    } catch {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_antifragil: !next } : u))
      );
    } finally {
      setTogglingId(null);
    }
  }

  const filteredUsers = userSearch.trim()
    ? usuarios.filter((u) => u.email?.toLowerCase().includes(userSearch.toLowerCase()))
    : usuarios;

  const antifragilCount = usuarios.filter((u) => u.is_antifragil).length;

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
      <div className="px-5 pt-14 pb-6">
        <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(42,191,191,0.7)", fontFamily: "var(--font-serif)" }}>
          Gestión de usuarios
        </p>
        <h1
          className="mt-0.5"
          style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}
        >
          Alumnos
        </h1>
      </div>

      <div className="px-4 pb-10 space-y-6">
        {/* ── Antifrágil section link ── */}
        <section>
          <Link
            href="/admin/antifragil"
            className="block rounded-xl px-4 py-4 transition-colors active:scale-[0.98]"
            style={{
              background: "rgba(42,191,191,0.06)",
              border: "0.5px solid rgba(42,191,191,0.25)",
              textDecoration: "none",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#2abfbf] mb-1">Antifrágil</p>
                <p className="text-sm text-[#f0f0f0] font-light">Clientes Antifrágil</p>
                <p className="text-[11px] text-[#666] mt-0.5">
                  {antifragilCount} {antifragilCount === 1 ? "cliente" : "clientes"} activos
                </p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M9 6l6 6-6 6" stroke="#2abfbf" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        </section>

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

              {/* Antifrágil toggle */}
              <label className="flex items-center justify-between gap-3 px-1 cursor-pointer">
                <div>
                  <span className="text-xs text-[#ccc] font-light">Cliente Antifrágil</span>
                  <p className="text-[10px] text-[#555] mt-0.5">Marca a este alumno como cliente Antifrágil</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={inviteAntifragil}
                  onClick={() => setInviteAntifragil((v) => !v)}
                  className="relative shrink-0 transition-colors"
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 999,
                    background: inviteAntifragil ? "#2abfbf" : "#1e1e1e",
                    border: `0.5px solid ${inviteAntifragil ? "#2abfbf" : "#333"}`,
                  }}
                >
                  <span
                    className="absolute top-1/2 transition-all"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: inviteAntifragil ? "#080808" : "#666",
                      transform: `translate(${inviteAntifragil ? 18 : 2}px, -50%)`,
                    }}
                  />
                </button>
              </label>

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

          {!usersLoading && !usersError && usuarios.length > 0 && (
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar por email…"
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] transition-colors mb-3"
            />
          )}

          {usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : usersError ? (
            <p className="text-[#f0a0a0] text-xs text-center py-4">{usersError}</p>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-xl px-4 py-3.5 flex items-center justify-between gap-3"
                  style={{ background: "#141414", border: "1px solid #222" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="truncate"
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 17,
                          fontWeight: 300,
                          letterSpacing: "0.01em",
                          color: "rgba(255,255,255,0.95)",
                        }}
                      >
                        {u.email}
                      </p>
                      {u.is_antifragil && <AntifragilBadge />}
                    </div>
                    <p className="text-[#555] text-xs mt-0.5">
                      Último acceso: {formatDate(u.last_sign_in_at)}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {/* Antifragil toggle (per row) */}
                    {u.email !== ADMIN_EMAIL && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={u.is_antifragil}
                        aria-label={u.is_antifragil ? "Quitar marca Antifrágil" : "Marcar como Antifrágil"}
                        disabled={togglingId === u.id}
                        onClick={() => toggleAntifragil(u)}
                        className="relative transition-colors disabled:opacity-50"
                        style={{
                          width: 34,
                          height: 20,
                          borderRadius: 999,
                          background: u.is_antifragil ? "#2abfbf" : "#1e1e1e",
                          border: `0.5px solid ${u.is_antifragil ? "#2abfbf" : "#333"}`,
                        }}
                      >
                        <span
                          className="absolute top-1/2 transition-all"
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            background: u.is_antifragil ? "#080808" : "#666",
                            transform: `translate(${u.is_antifragil ? 16 : 2}px, -50%)`,
                          }}
                        />
                      </button>
                    )}

                    {u.email !== ADMIN_EMAIL && (
                      <button
                        type="button"
                        onClick={() => setDeletingUser(u)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[#1e1e1e]"
                        style={{ color: "#555" }}
                        aria-label="Eliminar usuario"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-[#444] text-xs text-center py-4">Sin resultados</p>
              )}
            </div>
          )}
        </section>

      </div>

      {/* ── Confirm delete user ── */}
      {deletingUser && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.8)" }}
        >
          <div
            className="w-full max-w-[340px] rounded-2xl px-5 py-6 space-y-4"
            style={{ background: "#141414", border: "1px solid #333" }}
          >
            <p className="text-sm font-light text-[#f0f0f0] text-center">
              ¿Eliminar este usuario?
            </p>
            <p className="text-xs text-[#888] text-center font-mono truncate">
              {deletingUser.email}
            </p>
            <p className="text-xs text-[#555] text-center">
              Se eliminará permanentemente de la base de datos.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ background: "#1e1e1e", color: "#888" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deletingUser)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                style={{ background: "rgba(240,80,80,0.15)", border: "1px solid rgba(240,80,80,0.3)", color: "#f05050" }}
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
