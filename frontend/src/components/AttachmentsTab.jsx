import { useEffect, useRef, useState } from "react";
import { api, downloadFile } from "../api";
import { useToast } from "../ToastContext.jsx";
import DocumentViewerModal from "./DocumentViewerModal.jsx";

function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsTab({ decisionId }) {
  const { showToast } = useToast();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const inputRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      setAttachments(await api.listAttachments(decisionId));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadAttachment(decisionId, file);
      showToast("File uploaded.");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (loading) return <div className="loading-text">Loading files…</div>;

  return (
    <div>
      <div className="upload-drop">
        Attach supporting documents — meeting notes, cost sheets, diagrams.
        <div>
          <input ref={inputRef} type="file" onChange={handleFileChange} disabled={uploading} />
        </div>
        {uploading && <div style={{ marginTop: 8 }}>Uploading…</div>}
      </div>

      {attachments.length === 0 ? (
        <div className="empty-state">
          <h3>No files attached</h3>
          <p>Upload documents that support this decision.</p>
        </div>
      ) : (
        attachments.map((a) => (
          <div className="attachment-row" key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#ffffff", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 8 }}>
            <div>
              <div className="attachment-name" style={{ fontWeight: 700, color: "#0f172a" }}>📄 {a.filename}</div>
              <div className="attachment-meta" style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{formatSize(a.file_size)} · {a.content_type || "unknown type"}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {a.file_path && (
                <>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "5px 12px", fontSize: 12 }}
                    onClick={() => setPreviewAttachment(a)}
                  >
                    👁️ Retrieve & View
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "5px 12px", fontSize: 12 }}
                    onClick={async () => {
                      try {
                        await downloadFile(a.file_path, a.filename);
                        showToast(`Downloaded ${a.filename}`);
                      } catch (err) {
                        showToast(err.message, "error");
                      }
                    }}
                  >
                    📥 Download
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}

      {previewAttachment && (
        <DocumentViewerModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </div>
  );
}
