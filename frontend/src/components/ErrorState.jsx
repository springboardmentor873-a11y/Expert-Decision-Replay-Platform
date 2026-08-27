export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="state-block error-state">
      <p className="state-title">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
