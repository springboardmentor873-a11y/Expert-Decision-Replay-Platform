export default function Toast({ message, type = "info", onClose }) {
  if (!message) return null;
  return (
    <div className={`toast ${type === "error" ? "error" : ""}`} onClick={onClose} role="status">
      {message}
    </div>
  );
}
