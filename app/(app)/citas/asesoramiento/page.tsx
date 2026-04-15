"use client";

import Link from "next/link";

export default function AsesoramientoPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Back button */}
      <div className="px-6 pt-14 pb-2">
        <Link href="/citas" className="inline-flex items-center gap-2 transition-colors" style={{ color: "#444" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs tracking-wider uppercase">Volver</span>
        </Link>
      </div>

      <div className="px-6 pt-8 pb-10 flex flex-col items-center text-center">
        {/* WhatsApp icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
          style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
              fill="#25D366"
            />
            <path
              d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.985-1.406A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
              stroke="#25D366"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title */}
        <h1
          className="text-[#f0f0f0] mb-6 leading-snug"
          style={{ fontSize: 22, fontWeight: 300, maxWidth: 300 }}
        >
          ¿Necesitas asesoramiento personalizado?
        </h1>

        {/* Body text */}
        <p
          className="text-[#666] leading-relaxed mb-10"
          style={{ fontSize: 14, fontWeight: 300, maxWidth: 340 }}
        >
          Tanto si tienes una lesión y no sabes cómo entrenar con ella, como si buscas orientación
          nutricional o simplemente no sabes por dónde empezar, nuestro equipo de profesionales está
          aquí para ayudarte.
          <br /><br />
          Escríbenos y te respondemos lo antes posible.
        </p>

        {/* WhatsApp button */}
        <a
          href="https://wa.me/34611057973?text=Hola,%20necesito%20asesoramiento%20en%20Lidomare"
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-colors active:opacity-80"
          style={{
            background: "#25D366",
            color: "#080808",
            fontSize: 15,
            letterSpacing: "0.05em",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
              fill="#080808"
            />
            <path
              d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.985-1.406A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
              stroke="#080808"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Escribirnos por WhatsApp
        </a>
      </div>
    </div>
  );
}
