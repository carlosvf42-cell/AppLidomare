import Link from "next/link";

export function LoadingState() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
      <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#444] text-xs tracking-wider">Cargando contenido…</p>
    </div>
  );
}

export function ErrorState({ href = "/contenido" }: { href?: string }) {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-[#f0a0a0] text-sm font-light">
        No se pudo cargar el contenido.
      </p>
      <p className="text-[#444] text-xs">
        Comprueba tu conexión o inténtalo más tarde.
      </p>
      <Link
        href={href}
        className="mt-2 text-[#2abfbf] text-xs tracking-widest uppercase"
      >
        ← Volver
      </Link>
    </div>
  );
}
