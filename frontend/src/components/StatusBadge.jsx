const STATUS_CONFIG = {
  Draft: { bg: "#f1f5f9", color: "#64748b", label: "Draft" },
  "Under Review": { bg: "#fef3c7", color: "#d97706", label: "Under Review" },
  Approved: { bg: "#dcfce7", color: "#15803d", label: "Approved" },
  Rejected: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
  Archived: { bg: "#f1f5f9", color: "#94a3b8", label: "Archived" },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        backgroundColor: cfg.bg,
        color: cfg.color
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "currentColor"
        }}
      ></span>
      {cfg.label}
    </span>
  );
}
