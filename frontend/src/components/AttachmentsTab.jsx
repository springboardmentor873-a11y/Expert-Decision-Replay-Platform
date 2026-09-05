import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsTab({ decisionId }) {
  const { showToast } = useToast();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
          <div className="attachment-row" key={a.id}>
            <div>
              <div className="attachment-name">{a.filename}</div>
              <div className="attachment-meta">{formatSize(a.file_size)} · {a.content_type || "unknown type"}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
