import { useState, useRef, useEffect } from "react";
import { api } from "../api";

export default function UploadDocumentModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Architecture");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teams, setTeams] = useState([]);
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.listTeams().then((data) => setTeams(data || [])).catch(() => {});
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a document title.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      // 1. Create document decision
      const created = await api.createDecision({
        title: title.trim(),
        category,
        problem_statement: rationale || `Uploaded document specification: ${file ? file.name : "Spec"}`,
        status: "Approved",
        team_id: selectedTeamId ? Number(selectedTeamId) : undefined,
      });

      // 2. Upload file attachment if present
      if (file && created && created.id) {
        await api.uploadAttachment(created.id, file);
      }

      if (onUploaded) onUploaded(created);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to upload document.");
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.35)",
          width: "100%",
          maxWidth: 580,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          animation: "modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            padding: "24px 28px",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>📁</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Upload Repository Document
              </h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0 0" }}>
                Add PDF blueprints, DOCX specs, or architecture diagrams to repository
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#94a3b8",
              width: 30,
              height: 30,
              borderRadius: "50%",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          
          {/* File Dropzone */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              Select Specification File
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #3b82f6",
                background: "#eff6ff",
                borderRadius: 14,
                padding: "24px 16px",
                textAlign: "center",
                cursor: "pointer"
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />

              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <span style={{ fontSize: 32 }}>📄</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, color: "#1e40af", fontSize: 14 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: "#3b82f6" }}>
                      {(file.size / 1024).toFixed(1)} KB · File selected
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    style={{ background: "#fee2e2", border: "none", color: "#ef4444", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: 36 }}>📄</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8", marginTop: 4 }}>
                    Click to browse files or drag & drop PDF / DOCX
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Architecture blueprints, meeting notes, or policy documents
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              Document Title <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AWS Cloud Architecture Specification v2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                fontWeight: 600,
                outline: "none"
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              Category / Domain
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                background: "#ffffff",
                outline: "none"
              }}
            >
              <option value="Architecture">🏗️ Architecture Spec</option>
              <option value="Infrastructure">⚙️ Infrastructure Blueprint</option>
              <option value="Security">🛡️ Security Policy</option>
              <option value="Process">🔄 Standard Operating Procedure</option>
            </select>
          </div>

          {/* Assign Team */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              Assign Team (Knowledge Graph Group)
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                background: "#ffffff",
                outline: "none"
              }}
            >
              <option value="">Default (My Primary Team)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>👥 {t.name}</option>
              ))}
            </select>
          </div>

          {/* Rationale / Summary */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              Summary & Abstract
            </label>
            <textarea
              rows={3}
              placeholder="Provide a brief summary of what this document covers..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, background: "#fef2f2", padding: "10px 14px", borderRadius: 8, border: "1px solid #fecaca" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
              }}
            >
              {busy ? "Uploading Document..." : "📁 Upload Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
