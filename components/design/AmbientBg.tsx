interface Props {
  variant?: "home" | "default";
  showPhoto?: boolean;
  photoSrc?: string;
}

export default function AmbientBg({ variant = "default", showPhoto = true, photoSrc }: Props) {
  if (variant === "home" && showPhoto && photoSrc) {
    return (
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${photoSrc})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(30px) saturate(120%)",
          opacity: 0.32, transform: "scale(1.15)",
        }} />
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.88) 55%, #000 100%)" }} />
        <div style={{ position: "absolute", top: "-5%", right: "-15%", width: "65%", height: "55%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(42,191,191,0.22) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", top: "45%", left: "-20%", width: "55%", height: "45%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(123,140,255,0.13) 0%, transparent 65%)", filter: "blur(80px)" }} />
      </div>
    );
  }

  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "#020407" }} />
      <div style={{ position: "absolute", top: "-10%", right: "-20%", width: "75%", height: "60%", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(42,191,191,0.26) 0%, transparent 65%)", filter: "blur(70px)" }} />
      <div style={{ position: "absolute", top: "30%", left: "-25%", width: "65%", height: "55%", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(123,140,255,0.18) 0%, transparent 65%)", filter: "blur(90px)" }} />
      <div style={{ position: "absolute", bottom: "0%", right: "10%", width: "55%", height: "40%", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(42,191,191,0.14) 0%, transparent 65%)", filter: "blur(80px)" }} />
    </div>
  );
}
