import React, { useState, useEffect } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

function UploadModal({ isOpen, onClose, onUploadSuccess, decisions = [], apiBase = "http://127.0.0.1:8000" }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("AI");
  const [tags, setTags] = useState("AI, Evaluation");
  const [description, setDescription] = useState("");
  const [decisionId, setDecisionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);
      formData.append("category", category);
      formData.append("tags", JSON.stringify(tags.split(",").map((t) => t.trim()).filter(Boolean)));
      formData.append("description", description);
      if (decisionId) {
        formData.append("decision_id", decisionId);
      }

      const res = await fetch(`${apiBase}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed");
      }

      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal} className="animate-fade-in">
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={styles.iconCircle}>
              <Upload size={20} color="#2563eb" />
            </div>
            <div>
              <h2 style={styles.title}>Upload Knowledge Document</h2>
              <p style={styles.subtitle}>Add technical reports, architecture specs, or evaluation sheets.</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.dropZone}>
            <input
              type="file"
              id="file-upload"
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.pptx,.xlsx,.txt,.png,.jpg"
            />
            <label htmlFor="file-upload" style={styles.dropZoneLabel}>
              <div style={styles.uploadIcon}>
                <FileText size={32} color="#3b82f6" />
              </div>
              {file ? (
                <div>
                  <div style={styles.fileName}>{file.name}</div>
                  <div style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <span style={styles.dropPrompt}>Click to browse</span> or drag and drop document
                  <div style={styles.allowedFormats}>PDF, DOCX, PPTX, XLSX, TXT up to 25MB</div>
                </div>
              )}
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Document Title</label>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g. AI Model Evaluation Report.pdf"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Category</label>
              <select
                style={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="AI">AI & Machine Learning</option>
                <option value="Database">Database & Storage</option>
                <option value="Cloud">Cloud Infrastructure</option>
                <option value="Security">Security & Compliance</option>
                <option value="Architecture">System Architecture</option>
                <option value="Requirements">Requirements & Planning</option>
                <option value="General">General</option>
              </select>
            </div>

            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Tags (comma-separated)</label>
              <input
                type="text"
                style={styles.input}
                placeholder="AI, Evaluation, Research"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Link to Decision (Optional)</label>
            <select
              style={styles.select}
              value={decisionId}
              onChange={(e) => setDecisionId(e.target.value)}
            >
              <option value="">-- No direct decision link --</option>
              {decisions.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id} - {d.title} ({d.status})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description / Executive Summary</label>
            <textarea
              style={styles.textarea}
              placeholder="Brief summary of findings or contents..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(28, 27, 31, 0.5)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modal: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-xl)",
    width: "100%",
    maxWidth: "580px",
    boxShadow: "var(--shadow-xl)",
    border: "1px solid var(--border-subtle)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 26px",
    borderBottom: "1px solid var(--border-subtle)",
  },
  iconCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    backgroundColor: "var(--primary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "19px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
  },
  subtitle: {
    fontSize: "13.5px",
    color: "var(--text-secondary)",
    margin: "2px 0 0 0",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    padding: "6px",
    borderRadius: "var(--radius-full)",
    display: "flex",
  },
  errorBanner: {
    backgroundColor: "var(--accent-rose-subtle)",
    color: "var(--accent-rose)",
    padding: "10px 24px",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderBottom: "1px solid var(--border-subtle)",
  },
  form: {
    padding: "26px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  dropZone: {
    border: "2px dashed var(--border-muted)",
    borderRadius: "var(--radius-lg)",
    backgroundColor: "var(--bg-surface-container-low)",
    padding: "26px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all var(--md3-duration-normal) var(--md3-easing)",
  },
  dropZoneLabel: {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  uploadIcon: {
    marginBottom: "4px",
  },
  dropPrompt: {
    color: "var(--primary)",
    fontWeight: "600",
  },
  fileName: {
    fontWeight: "600",
    color: "var(--text-primary)",
    fontSize: "15px",
  },
  fileSize: {
    fontSize: "12px",
    color: "var(--text-secondary)",
  },
  allowedFormats: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "4px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  row: {
    display: "flex",
    gap: "14px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-secondary)",
  },
  input: {
    padding: "11px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface-container-high)",
    fontSize: "14px",
    color: "var(--text-primary)",
    outline: "none",
    fontFamily: "var(--font-sans)",
  },
  select: {
    padding: "11px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    fontSize: "14px",
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-surface-container-high)",
    outline: "none",
    fontFamily: "var(--font-sans)",
  },
  textarea: {
    padding: "11px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface-container-high)",
    fontSize: "14px",
    color: "var(--text-primary)",
    outline: "none",
    resize: "vertical",
    fontFamily: "var(--font-sans)",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "10px",
  },
  cancelBtn: {
    padding: "10px 20px",
    backgroundColor: "var(--bg-surface-container-high)",
    color: "var(--text-primary)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  submitBtn: {
    padding: "10px 24px",
    backgroundColor: "var(--primary)",
    border: "none",
    color: "var(--on-primary)",
    borderRadius: "var(--radius-full)",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
    fontFamily: "var(--font-sans)",
  },
};

export default UploadModal;
