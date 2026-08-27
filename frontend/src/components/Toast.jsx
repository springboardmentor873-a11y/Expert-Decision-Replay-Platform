export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.tone || "success"}`} role="status">
      {toast.message}
    </div>
  );
}
