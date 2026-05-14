"use client";

import Link from "next/link";

export default function AsesoramientoPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080808", maxWidth: 430, margin: "0 auto" }}>

      {/* Back button */}
      <div style={{ padding: "56px 24px 0" }}>
        <Link
          href="/citas"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#666",
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </Link>
      </div>

      {/* WhatsApp icon */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 48 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "rgba(37,211,102,0.1)",
            border: "1px solid rgba(37,211,102,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 2C8.268 2 2 8.268 2 16c0 2.496.65 4.84 1.786 6.876L2 30l7.34-1.916A13.934 13.934 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
              fill="#25D366"
            />
            <path
              d="M23.01 19.61c-.355-.178-2.1-1.037-2.425-1.155-.324-.118-.56-.177-.797.178-.236.355-.916 1.155-1.123 1.39-.207.237-.414.266-.768.089-.355-.177-1.499-.553-2.856-1.763-1.055-.941-1.768-2.102-1.974-2.457-.207-.355-.022-.547.155-.724.16-.158.355-.414.532-.621.178-.207.237-.355.355-.592.119-.237.06-.444-.03-.621-.088-.178-.796-1.925-1.091-2.635-.288-.692-.581-.598-.797-.61-.207-.01-.443-.012-.68-.012-.236 0-.62.089-.945.444-.325.355-1.242 1.213-1.242 2.96 0 1.748 1.272 3.436 1.45 3.672.177.237 2.504 3.824 6.067 5.362.848.366 1.509.585 2.025.748.851.271 1.626.233 2.238.141.683-.102 2.1-.858 2.397-1.689.296-.83.296-1.542.207-1.689-.088-.148-.325-.237-.68-.414z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1
        style={{
          color: "#f0f0f0",
          fontWeight: 300,
          fontSize: 22,
          textAlign: "center",
          margin: "24px 24px 0",
          lineHeight: 1.35,
        }}
      >
        ¿Necesitas asesoramiento personalizado?
      </h1>

      {/* Body */}
      <p
        style={{
          color: "#888",
          fontSize: 15,
          lineHeight: 1.7,
          textAlign: "center",
          padding: "0 24px",
          margin: "20px 0 0",
        }}
      >
        Ya sea que tengas una lesión y no sepas cómo entrenar, busques orientación nutricional o
        simplemente no sepas por dónde empezar, nuestro equipo de profesionales está aquí para
        acompañarte en cada paso.
      </p>

      {/* WhatsApp button */}
      <div style={{ padding: "32px 24px" }}>
        <a
          href="https://wa.me/34611057973?text=Hola,%20necesito%20asesoramiento%20en%20Lidomare"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "#25D366",
            color: "#000",
            fontWeight: 500,
            fontSize: 15,
            borderRadius: 12,
            padding: 16,
            textDecoration: "none",
            width: "100%",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 2C8.268 2 2 8.268 2 16c0 2.496.65 4.84 1.786 6.876L2 30l7.34-1.916A13.934 13.934 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
              fill="#000"
            />
            <path
              d="M23.01 19.61c-.355-.178-2.1-1.037-2.425-1.155-.324-.118-.56-.177-.797.178-.236.355-.916 1.155-1.123 1.39-.207.237-.414.266-.768.089-.355-.177-1.499-.553-2.856-1.763-1.055-.941-1.768-2.102-1.974-2.457-.207-.355-.022-.547.155-.724.16-.158.355-.414.532-.621.178-.207.237-.355.355-.592.119-.237.06-.444-.03-.621-.088-.178-.796-1.925-1.091-2.635-.288-.692-.581-.598-.797-.61-.207-.01-.443-.012-.68-.012-.236 0-.62.089-.945.444-.325.355-1.242 1.213-1.242 2.96 0 1.748 1.272 3.436 1.45 3.672.177.237 2.504 3.824 6.067 5.362.848.366 1.509.585 2.025.748.851.271 1.626.233 2.238.141.683-.102 2.1-.858 2.397-1.689.296-.83.296-1.542.207-1.689-.088-.148-.325-.237-.68-.414z"
              fill="white"
            />
          </svg>
          Escribirnos por WhatsApp
        </a>
      </div>

    </div>
  );
}
