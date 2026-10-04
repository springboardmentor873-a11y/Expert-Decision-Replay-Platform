interface Segment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 180,
  thickness = 24,
  centerLabel,
  centerSubLabel,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offsetSoFar = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--slate-100)"
        strokeWidth={thickness}
      />
      {total > 0 &&
        segments
          .filter((s) => s.value > 0)
          .map((s, idx) => {
            const fraction = s.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const rotation = (offsetSoFar / total) * 360 - 90;
            offsetSoFar += s.value;
            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="butt"
                transform={`rotate(${rotation} ${center} ${center})`}
              />
            );
          })}
      {centerLabel && (
        <text
          x={center}
          y={centerSubLabel ? center - 10 : center}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ font: "700 1.6rem var(--font-serif)", fill: "var(--ink)" }}
        >
          {centerLabel}
        </text>
      )}
      {centerSubLabel && (
        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ font: "600 0.72rem var(--font-sans)", fill: "var(--slate-500)" }}
        >
          {centerSubLabel}
        </text>
      )}
    </svg>
  );
}
