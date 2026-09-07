import React from 'react';
import { PieChart } from 'lucide-react';

export const DecisionsStatusChart = ({ stats }) => {
  const { total = 0, drafts = 0, submitted = 0, underReview = 0, approved = 0, rejected = 0 } = stats || {};

  // Combine Submitted and Under Review if separated, or calculate individually
  const reviewCount = (submitted || 0) + (underReview || 0);

  const segments = [
    { key: 'approved', label: 'Approved', count: approved, color: '#10b981', bgClass: 'dot-approved' },
    { key: 'review', label: 'Under Review', count: reviewCount, color: '#f59e0b', bgClass: 'dot-review' },
    { key: 'draft', label: 'Draft', count: drafts, color: '#64748b', bgClass: 'dot-draft' },
    { key: 'rejected', label: 'Rejected', count: rejected, color: '#ef4444', bgClass: 'dot-rejected' },
  ];

  // SVG parameters
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  return (
    <div className="card decisions-chart-card">
      <div className="card-header-clean">
        <div className="chart-header-title">
          <PieChart size={18} className="chart-header-icon" />
          <h3>Decisions by Status</h3>
        </div>
        <span className="badge-pill-count">{total} Total</span>
      </div>

      <div className="donut-chart-wrapper">
        <div className="donut-svg-container">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="donut-svg"
          >
            {/* Background Muted Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
            />

            {/* Segment Arcs */}
            {total > 0 &&
              segments.map((seg) => {
                if (seg.count <= 0) return null;
                const percent = seg.count / total;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativeAngle;
                cumulativeAngle += percent * circumference;

                return (
                  <circle
                    key={seg.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className="donut-segment"
                  >
                    <title>{`${seg.label}: ${seg.count} (${Math.round(percent * 100)}%)`}</title>
                  </circle>
                );
              })}
          </svg>

          {/* Donut Center Cutout Text */}
          <div className="donut-center-info">
            <span className="donut-center-number">{total}</span>
            <span className="donut-center-label">Decisions</span>
          </div>
        </div>

        {/* Status Legend Breakdown */}
        <div className="donut-legend-list">
          {segments.map((seg) => {
            const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
            return (
              <div key={seg.key} className="donut-legend-item">
                <div className="legend-label-cluster">
                  <span className={`legend-dot ${seg.bgClass}`} />
                  <span className="legend-name">{seg.label}</span>
                </div>
                <div className="legend-val-cluster">
                  <span className="legend-count">{seg.count}</span>
                  <span className="legend-pct">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
