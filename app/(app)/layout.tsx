import BottomNav from "@/components/BottomNav";
import AmbientBg from "@/components/design/AmbientBg";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "transparent" }}>

      {/* ── Ambient background ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <AmbientBg />
      </div>

      {/* ── Content ──
          NO se establece zIndex en main: si crea un stacking context
          atrapa los z-index de los modales/sheets internos (p. ej.
          AddBlockSheet z-[100]) y el BottomNav (z-50, fuera de main)
          acaba pintando por encima. AmbientBg está a position:fixed,
          z-0 y se ve igualmente por orden de pintado. */}
      <main
        className="flex-1"
        style={{
          paddingBottom: "calc(62px + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
