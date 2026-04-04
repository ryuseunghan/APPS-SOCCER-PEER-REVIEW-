"use client";

interface DataPoint {
  label: string;
  value: number;
}

export default function GrowthChart({ data }: { data: DataPoint[] }) {
  const min = 1;
  const max = 5;
  const width = 300;
  const height = 100;
  const padX = 20;
  const padY = 12;

  const pts = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (width - padX * 2);
    const y = padY + ((max - d.value) / (max - min)) * (height - padY * 2);
    return { x, y, ...d };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="w-full" aria-label="성장 그래프">
      <svg
        viewBox={`0 0 ${width} ${height + 20}`}
        className="w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid lines */}
        {[2, 3, 4, 5].map((v) => {
          const y = padY + ((max - v) / (max - min)) * (height - padY * 2);
          return (
            <g key={v}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="#243570"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={padX - 4} y={y + 4} fontSize="8" fill="#7B9DD4" textAnchor="end">
                {v}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#22C55E"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Fill area */}
        <polygon
          points={`${pts[0].x},${height - padY} ${polyline} ${pts[pts.length - 1].x},${height - padY}`}
          fill="url(#greenGrad)"
          opacity="0.25"
        />

        <defs>
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dots + labels */}
        {pts.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="4" fill="#22C55E" />
            <text
              x={p.x}
              y={height + 10}
              fontSize="9"
              fill="#7B9DD4"
              textAnchor="middle"
            >
              {p.label}
            </text>
          </g>
        ))}

        {/* Last value label */}
        {pts.length > 0 && (
          <text
            x={pts[pts.length - 1].x + 6}
            y={pts[pts.length - 1].y - 4}
            fontSize="10"
            fill="#22C55E"
            fontWeight="bold"
          >
            {pts[pts.length - 1].value}
          </text>
        )}
      </svg>
    </div>
  );
}
