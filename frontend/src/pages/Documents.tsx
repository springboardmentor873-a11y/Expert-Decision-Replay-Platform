import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { api, ApiError, type DocumentEntry } from "../lib/api";
import { formatFileSize, timeAgo } from "../lib/format";

export function Documents() {
  const [docs, setDocs] = useState<DocumentEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DocumentEntry[]>("/documents/mine")
      .then(setDocs)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load documents"))
      .finally(() => setLoading(false));
  }, []);

  const download = async (doc: DocumentEntry) => {
    try {
      const blob = await api.downloadBlob(`/documents/${doc.id}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    }
  };

  return (
    <AppLayout title="Documents">
      <div className="page-header">
        <div>
          <h2>Document archive</h2>
          <p>Every file attached to a decision you can access.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <h3>No documents yet</h3>
            <p>Attach a file to a decision's Documents tab to see it here.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Decision</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.filename}</td>
                  <td>
                    <Link to={`/decisions/${d.decision_id}`}>Decision #{d.decision_id}</Link>
                  </td>
                  <td>{formatFileSize(d.file_size)}</td>
                  <td>{timeAgo(d.created_at)}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => download(d)}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
