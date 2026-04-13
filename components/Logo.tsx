export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Lidomare Health & Fitness Club"
    >
      <rect width="420" height="200" fill="#080808" />
      <rect x="16" y="16" width="388" height="168" fill="none" stroke="#222" strokeWidth="1" />
      <text
        x="210" y="100"
        textAnchor="middle"
        fontFamily="Arial Black, Impact, sans-serif"
        fontWeight="900"
        fontSize="58"
        letterSpacing="4"
        fill="white"
      >
        LID<tspan fill="#2abfbf">O</tspan>MARE
      </text>
      <line x1="50" y1="112" x2="370" y2="112" stroke="#222" strokeWidth="0.8" />
      <text
        x="210" y="134"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="12"
        letterSpacing="5"
        fill="#999"
      >
        HEALTH <tspan fill="#2abfbf">✦</tspan> FITNESS CLUB
      </text>
      <line x1="50" y1="148" x2="370" y2="148" stroke="#222" strokeWidth="0.8" />
      <text
        x="210" y="168"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="9"
        letterSpacing="4"
        fill="#444"
      >
        PLAYAMAR  ·  TORREMOLINOS
      </text>
    </svg>
  );
}
