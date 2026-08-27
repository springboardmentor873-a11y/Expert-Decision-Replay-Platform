export default function EmptyState({ title = "Nothing here yet", description }) {
  return (
    <div className="state-block empty-state">
      <p className="state-title">{title}</p>
      {description && <p className="state-desc">{description}</p>}
    </div>
  );
}
