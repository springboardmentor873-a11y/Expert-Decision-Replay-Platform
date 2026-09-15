/**
 * DonutChart — dependency-free SVG donut chart.
 * Draws stroke-dasharray arcs on a single <circle> element per slice.
 */

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
}

function pct(value: number, total: number) {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function DonutChart({ slices, size = 140, thickness = 26 }: DonutChartProps) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Build arcs: each slice is a <circle> with a stroke-dasharray offset
  let offset = 0; // starts at top (we rotate -90deg)
  const arcs = slices.map((sl) => {
    const fraction = total > 0 ? sl.value / total : 0;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const arc = { sl, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="donut-wrapper">
      <svg
        className="donut-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#edf1f7"
          strokeWidth={thickness}
        />
        {total === 0 ? (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#edf1f7"
            strokeWidth={thickness}
          />
        ) : (
          arcs.map(({ sl, dash, gap, offset: off }, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={sl.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-off}
              strokeLinecap="butt"
            />
          ))
        )}
      </svg>

      {/* Center total label — rendered outside the rotated SVG */}
      <div style={{ position: "absolute", left: size / 2, top: size / 2, transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
        {/* handled inline in Dashboard */}
      </div>

      <div className="donut-legend">
        {slices.map((sl) => (
          <div className="donut-legend-item" key={sl.label}>
            <div className="donut-legend-dot" style={{ background: sl.color }} />
            <span className="donut-legend-label">{sl.label}</span>
            <span className="donut-legend-count">{sl.value}</span>
            <span className="donut-legend-pct">({pct(sl.value, total).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Standalone centered donut with a number in the middle */
export function CenteredDonut({ slices, size = 160, thickness = 28 }: DonutChartProps) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices.map((sl) => {
    const fraction = total > 0 ? sl.value / total : 0;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const arc = { sl, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#edf1f7" strokeWidth={thickness} />
        {arcs.map(({ sl, dash, gap, offset: off }, i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={sl.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-off}
          />
        ))}
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: "1.8rem", fontWeight: 700, lineHeight: 1 }}>{total}</span>
        <span style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: 2 }}>Total</span>
      </div>
    </div>
  );
}
