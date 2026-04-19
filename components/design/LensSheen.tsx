interface Props {
  angle?: number;
}

export default function LensSheen({ angle = 150 }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderRadius: "inherit",
        background: `linear-gradient(${angle}deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 35%)`,
        mixBlendMode: "screen",
      }}
    />
  );
}
