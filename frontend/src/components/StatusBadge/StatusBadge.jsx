import "./StatusBadge.css";

const LABELS = {
  draft: "Draft",
  under_review: "Under Review",
  pending_manager_review: "Pending Manager Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-badge--${status}`}>{LABELS[status] || status}</span>;
}
