/**
 * Título pintado como el letrero de una trajinera (DESIGN.md §4):
 * letras en arco sobre un tablero de color con borde de tinta.
 */
export default function TrajineraTitle({ className = "" }: { className?: string }) {
  return (
    <h1 className={`m-0 w-full ${className}`}>
      <svg
        viewBox="0 0 360 170"
        role="img"
        aria-label="Ajolotes en Producción"
        className="block h-auto w-full"
      >
        <defs>
          <path id="trajinera-arc-1" d="M50 118 A 200 200 0 0 1 310 118" fill="none" />
          <path id="trajinera-arc-2" d="M40 158 A 260 260 0 0 1 320 158" fill="none" />
        </defs>

        {/* Tablero */}
        <path
          d="M14 160 L14 100 A 220 220 0 0 1 346 100 L346 160 Q346 166 340 166 L20 166 Q14 166 14 160 Z"
          fill="#FFC83D"
          stroke="#2A1F2D"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Borde interior pintado */}
        <path
          d="M24 156 L24 103 A 210 210 0 0 1 336 103 L336 156 Z"
          fill="none"
          stroke="#2A1F2D"
          strokeWidth="2"
          strokeDasharray="6 5"
          opacity="0.6"
        />
        {/* Flores de las esquinas */}
        <g fill="#EAF4EF" stroke="#2A1F2D" strokeWidth="2">
          <circle cx="36" cy="146" r="6" />
          <circle cx="324" cy="146" r="6" />
        </g>
        <g fill="#C81E3A">
          <circle cx="36" cy="146" r="2.2" />
          <circle cx="324" cy="146" r="2.2" />
        </g>

        <text className="font-sans font-semibold" fill="#2A1F2D" fontSize="46" textAnchor="middle">
          <textPath href="#trajinera-arc-1" startOffset="50%">
            Ajolotes
          </textPath>
        </text>
        <text className="font-sans font-semibold" fill="#2A1F2D" fontSize="27" textAnchor="middle">
          <textPath href="#trajinera-arc-2" startOffset="50%">
            en Producción
          </textPath>
        </text>
      </svg>
    </h1>
  );
}
