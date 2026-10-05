import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getAttachmentUrl } from "../api";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      setLoading(true);
      setError("");
      try {
        const decisions = await api.listDecisions();
        const results = await Promise.allSettled(
          decisions.map(async (decision) => {
            const attachments = await api.listAttachments(decision.id);
            return attachments.map((attachment) => ({
              ...attachment,
              decisionTitle: decision.title,
            }));
          })
        );
        const failedRequests = results.filter((result) => result.status === "rejected").length;
        const loadedDocuments = results
          .filter((result) => result.status === "fulfilled")
          .flatMap((result) => result.value)
          .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));

        if (active) {
          setDocuments(loadedDocuments);
          if (failedRequests) {
            setError(`${failedRequests} decision file list${failedRequests === 1 ? "" : "s"} could not be loaded.`);
          }
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDocuments();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p>Shared files and artifacts tied to decisions will appear here.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Loading documents…</div>
      ) : error && documents.length === 0 ? (
        <div className="empty-state"><h3>Documents could not be loaded</h3><p>{error}</p></div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <h3>No documents yet</h3>
          <p>Upload files from a decision detail page to see them listed here.</p>
        </div>
      ) : (
        <>
          {error && <div className="error-text" role="status">{error} Showing available documents.</div>}
          <div className="panel">
            <div className="table-scroll">
              <table className="decisions-table">
                <thead>
                  <tr><th>Document</th><th>Decision</th><th>Size / type</th><th>Uploaded</th><th>File</th></tr>
                </thead>
                <tbody>
                  {documents.map((document) => {
                    const downloadUrl = getAttachmentUrl(document.file_path);
                    return (
                      <tr key={document.id}>
                        <td>{document.filename}</td>
                        <td><Link to={`/decisions/${document.decision_id}`}>{document.decisionTitle}</Link></td>
                        <td>{formatSize(document.file_size)} · {document.content_type || "Unknown type"}</td>
                        <td>{formatDate(document.created_at)}</td>
                        <td>
                          {downloadUrl ? (
                            <a href={downloadUrl} target="_blank" rel="noreferrer">Open file</a>
                          ) : (
                            <span className="meta">Metadata only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
