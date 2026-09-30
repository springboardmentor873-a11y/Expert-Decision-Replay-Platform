import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  downloadRepositoryDocument,
  getRepositoryDocument,
} from "../../services/knowledge";
import "./KnowledgeDocumentDetail.css";

const FILE_BADGES = {
  pdf: "PDF",
  docx: "DOCX",
  pptx: "PPTX",
};

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeDocumentDetail() {
  const { documentId } = useParams();
  const { tokens } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getRepositoryDocument(documentId, tokens.access_token);
        if (!cancelled) setDocument(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [documentId, tokens]);

  async function handleDownload() {
    if (!document) return;
    setDownloading(true);
    setError("");
    try {
      await downloadRepositoryDocument(document.id, document.title, tokens.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="knowledge-detail">
          <p className="knowledge-detail__loading">Loading…</p>
        </main>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="page">
        <Navbar />
        <main className="knowledge-detail">
          <Link to="/knowledge" className="knowledge-detail__back">
            ← Knowledge Repository
          </Link>
          <div className="knowledge-detail__error">
            {error || "Document not found."}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <main className="knowledge-detail">
        <Link to="/knowledge" className="knowledge-detail__back">
          ← Knowledge Repository
        </Link>

        <div className="knowledge-detail__panel">
          <div className="knowledge-detail__row">
            <span
              className={`knowledge-detail__type knowledge-detail__type--${document.file_type || "other"}`}
            >
              {FILE_BADGES[document.file_type] ||
                (document.file_type || "FILE").toUpperCase()}
            </span>
            <h1 className="knowledge-detail__title">{document.title}</h1>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="knowledge-detail__tags">
              {document.tags.map((tag) => (
                <span key={tag} className="knowledge-detail__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="knowledge-detail__description">
            {document.description || "No description provided."}
          </p>

          <dl className="knowledge-detail__meta">
            <div>
              <dt>Team</dt>
              <dd>{document.team_name || "—"}</dd>
            </div>
            <div>
              <dt>Uploaded by</dt>
              <dd>
                {document.uploader_name || "—"}
                {document.uploader_email && (
                  <span className="knowledge-detail__muted">
                    {" "}
                    · {document.uploader_email}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>File type</dt>
              <dd>{(document.file_type || "—").toUpperCase()}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(document.file_size_bytes)}</dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{new Date(document.created_at).toLocaleString()}</dd>
            </div>
          </dl>

          {document.has_content ? (
            <button
              className="knowledge-detail__download"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? "Downloading…" : "Download demo copy"}
            </button>
          ) : (
            <p className="knowledge-detail__no-content">
              No downloadable copy is stored for this document.
            </p>
          )}
        </div>

        {document.decision_id && (
          <div className="knowledge-detail__decision">
            <h2 className="knowledge-detail__section-title">
              Associated decision
            </h2>
            <div className="knowledge-detail__decision-card">
              <div>
                <Link
                  to={`/decisions/${document.decision_id}`}
                  className="knowledge-detail__decision-title"
                >
                  {document.decision_title || "Open decision"}
                </Link>
                <div className="knowledge-detail__decision-meta">
                  {document.team_name && <span>{document.team_name}</span>}
                </div>
              </div>
              <Link
                to={`/decisions/${document.decision_id}`}
                className="knowledge-detail__decision-open"
              >
                Open →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}