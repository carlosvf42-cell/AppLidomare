import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "transparent" }}>

      {/* ── Fondo cinematic turquesa ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 0,
          background: "#080808",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Mancha turquesa superior izquierda — grande y difusa */}
        <div style={{
          position: "absolute", top: "-15%", left: "-20%",
          width: "65%", height: "65%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(42,191,191,0.13) 0%, transparent 70%)",
          filter: "blur(80px)",
        }} />
        {/* Mancha turquesa inferior derecha */}
        <div style={{
          position: "absolute", bottom: "5%", right: "-15%",
          width: "55%", height: "50%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(42,191,191,0.08) 0%, transparent 70%)",
          filter: "blur(100px)",
        }} />
        {/* Mancha turquesa central muy sutil */}
        <div style={{
          position: "absolute", top: "40%", left: "20%",
          width: "60%", height: "40%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(42,191,191,0.05) 0%, transparent 70%)",
          filter: "blur(120px)",
        }} />
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
