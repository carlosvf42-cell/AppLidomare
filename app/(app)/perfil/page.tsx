"use client";

import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";

export default function PerfilPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const name =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    "Miembro";

  const email =
    user?.primaryEmailAddress?.emailAddress || "";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#080808] px-6 pt-14 pb-8">

      {/* Header */}
      <p className="text-[10px] tracking-[0.25em] uppercase text-[#2abfbf] mb-8">
        Perfil
      </p>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-10">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt={name}
            className="w-16 h-16 rounded-full object-cover border border-[#222]"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-light shrink-0"
            style={{ background: "#141414", border: "1px solid #222", color: "#2abfbf" }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[#f0f0f0] text-lg font-light truncate">{name}</p>
          <p className="text-[#888] text-sm font-light truncate">{email}</p>
        </div>
      </div>

      {/* Info rows */}
      <div
        className="rounded-xl overflow-hidden mb-10"
        style={{ border: "1px solid #222", background: "#141414" }}
      >
        <div className="px-5 py-4 border-b border-[#222]">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#555] mb-1">Nombre</p>
          <p className="text-[#f0f0f0] text-sm font-light">{name}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#555] mb-1">Email</p>
          <p className="text-[#f0f0f0] text-sm font-light break-all">{email}</p>
        </div>
      </div>

      {/* Sign out */}
      <SignOutButton redirectUrl="/login">
        <button className="w-full border border-[#222] text-[#888] text-xs tracking-[0.2em] uppercase py-4 rounded-xl hover:border-[#f0a0a0] hover:text-[#f0a0a0] transition-colors">
          Cerrar sesión
        </button>
      </SignOutButton>
    </div>
  );
}
