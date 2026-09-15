const CLASS_MAP: Record<string, string> = {
  Draft: "badge-draft",
  "Under Review": "badge-review",
  Approved: "badge-approved",
  Rejected: "badge-rejected",
  Archived: "badge-archived",
  Pending: "badge-review",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = CLASS_MAP[status] || "badge-draft";
  return <span className={`badge ${cls}`}>{status}</span>;
}
