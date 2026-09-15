import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { api, humanFileSize, relativeTime, type Document } from "../lib/api";
import { useAuth } from "../lib/auth";

function fileIcon(contentType: string): string {
  if (contentType.includes("pdf")) return "📄";
  if (contentType.includes("image")) return "🖼️";
  if (contentType.includes("sheet") || contentType.includes("csv")) return "📊";
  if (contentType.includes("word") || contentType.includes("text")) return "📝";
  if (contentType.includes("presentation")) return "📑";
  return "📎";
}

export function DocumentsPage() {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<Array<{ id: number; title: string }>>([]);
  const [docsByDecision, setDocsByDecision] = useState<Record<number, Document[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Array<{ id: number; title: string }>>("/decisions")
      .then(async (decs) => {
        setDecisions(decs);
        const entries: Record<number, Document[]> = {};
        await Promise.all(
          decs.map(async (d) => {
            try {
              const docs = await api.get<Document[]>(`/decisions/${d.id}/documents`);
              if (docs.length > 0) entries[d.id] = docs;
            } catch { /* skip unauthorized */ }
          })
        );
        setDocsByDecision(entries);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const allDocs = Object.entries(docsByDecision).flatMap(([decId, docs]) =>
    docs.map((doc) => ({ ...doc, decisionId: Number(decId) }))
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await api.downloadBlob(`/documents/${doc.id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = doc.filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async (doc: Document & { decisionId: number }) => {
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      setDocsByDecision((prev) => ({
        ...prev,
        [doc.decisionId]: (prev[doc.decisionId] ?? []).filter((d) => d.id !== doc.id),
      }));
    } catch (e: any) { setError(e.message); }
  };

  return (
    <AppLayout title="Documents">
      <div className="page-header">
        <div>
          <h2>Documents</h2>
          <p>All uploaded files across decisions you can access.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading-row"><div className="spinner" /></div>}

      {!loading && allDocs.length === 0 && (
        <div className="empty-state">
          <h3>No documents found</h3>
          <p>Upload documents from within a decision's Documents tab.</p>
        </div>
      )}

      {allDocs.map((doc) => {
        const dec = decisions.find((d) => d.id === doc.decisionId);
        return (
          <div className="file-list-item" key={doc.id}>
            <div className="file-icon">{fileIcon(doc.content_type)}</div>
            <div className="file-info">
              <div className="file-name">{doc.filename}</div>
              <div className="file-meta">
                {humanFileSize(doc.file_size)} · {relativeTime(doc.created_at)} ·{" "}
                <Link to={`/decisions/${doc.decisionId}`} style={{ color: "var(--brand)" }}>
                  {dec?.title ?? `Decision #${doc.decisionId}`}
                </Link>
              </div>
            </div>
            <div className="file-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(doc)}>⬇ Download</button>
              {(doc.uploaded_by === user?.id || user?.role === "Administrator" || user?.role === "Manager") && (
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc)}>🗑</button>
              )}
            </div>
          </div>
        );
      })}
    </AppLayout>
  );
}
