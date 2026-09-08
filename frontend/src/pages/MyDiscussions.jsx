export default function MyDiscussions() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>My Discussions</h1>
          <p>Your recent decision conversations and replies will appear here.</p>
        </div>
      </div>

      <div className="empty-state">
        <h3>No discussions yet</h3>
        <p>Start a conversation on a decision detail page to see it listed here.</p>
      </div>
    </div>
  );
}
