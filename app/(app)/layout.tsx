import BottomNav from "@/components/BottomNav";
import AmbientBg from "@/components/design/AmbientBg";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
    </div>
  );
}
