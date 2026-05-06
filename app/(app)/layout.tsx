import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import AmbientBg from "@/components/design/AmbientBg";
import ReportBugButton from "@/components/ReportBugButton";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Gate de onboarding: si el usuario no tiene perfil mínimo (nombre +
  // fecha_nacimiento + peso + altura), redirige a /onboarding.
  // El proxy.ts ya garantiza que sólo usuarios autenticados llegan aquí.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("fecha_nacimiento, peso_kg, altura_cm")
      .eq("user_id", user.id)
      .maybeSingle();
    const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
    const isComplete =
      !!fullName &&
      !!profile?.fecha_nacimiento &&
      profile?.peso_kg != null &&
      profile?.altura_cm != null;
    if (!isComplete) redirect("/onboarding");
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "transparent" }}>

      {/* ── Ambient background ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <AmbientBg />
      </div>

      {/* ── Content ── */}
      <main
        className="flex-1"
        style={{
          position: "relative",
          zIndex: 1,
          paddingBottom: "calc(62px + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>

      <BottomNav />
      <ReportBugButton />
    </div>
  );
}
