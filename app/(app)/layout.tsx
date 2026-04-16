import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "transparent" }}>

      {/* ── Liquid glass ambient background ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 0,
          background: "#000",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Cyan glow — top right */}
        <div style={{
          position: "absolute", top: "-5%", right: "-15%",
          width: "65%", height: "55%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(42,191,191,0.28) 0%, transparent 65%)",
          filter: "blur(70px)",
        }} />
        {/* Indigo glow — center left */}
        <div style={{
          position: "absolute", top: "25%", left: "-20%",
          width: "55%", height: "55%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)",
          filter: "blur(90px)",
        }} />
        {/* Teal glow — bottom */}
        <div style={{
          position: "absolute", bottom: "5%", right: "15%",
          width: "50%", height: "40%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(42,191,191,0.15) 0%, transparent 65%)",
          filter: "blur(80px)",
        }} />
        {/* Soft white center shimmer */}
        <div style={{
          position: "absolute", top: "40%", left: "20%",
          width: "60%", height: "30%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)",
          filter: "blur(60px)",
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
