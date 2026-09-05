import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";

export default function VersionsTab({ decisionId }) {
  const { showToast } = useToast();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setVersions(await api.listVersions(decisionId));
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId]);

  if (loading) return <div className="loading-text">Loading version history…</div>;

  return (
    <div>
      <div className="section-title">{versions.length} snapshot{versions.length === 1 ? "" : "s"}</div>
      {[...versions].reverse().map((v) => (
        <div className="version-item" key={v.id}>
          <div className="version-num">v{v.version}</div>
          <div>
            <div className="version-summary">{v.change_summary || "Updated"} — status set to {v.status}</div>
            <div className="version-time">{new Date(v.created_at).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
