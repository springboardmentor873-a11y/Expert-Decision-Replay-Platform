const STATUS_CLASS = {
  Draft: "status-draft",
  "Under Review": "status-under-review",
  Approved: "status-approved",
  Rejected: "status-rejected",
  Archived: "status-archived",
};

export default function StatusBadge({ status }) {
  const cls = STATUS_CLASS[status] || "status-draft";
  return <span className={`status-badge ${cls}`}>{status}</span>;
}
