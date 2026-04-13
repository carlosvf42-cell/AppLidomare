import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#080808]">
      {/* Main content — padded above the fixed nav */}
      <main className="flex-1" style={{ paddingBottom: "calc(62px + env(safe-area-inset-bottom))" }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
