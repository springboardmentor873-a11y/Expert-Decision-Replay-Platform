import { useState, useEffect, useRef } from "react";
import { api } from "../api";

const CATEGORIES = [
  {
    id: "Architecture",
    label: "Architecture",
    icon: "🏗️",
    desc: "System design, microservices, frameworks & API topology",
    color: "#2563eb",
    bg: "#eff6ff"
  },
  {
    id: "Infrastructure",
    label: "Infrastructure",
    icon: "⚙️",
    desc: "Cloud, Kubernetes, CI/CD pipelines & databases",
    color: "#d97706",
    bg: "#fff7ed"
  },
  {
    id: "Security",
    label: "Security",
    icon: "🛡️",
    desc: "Authentication, OAuth2, RBAC, encryption & compliance",
    color: "#16a34a",
    bg: "#f0fdf4"
  },
  {
    id: "Process",
    label: "Process",
    icon: "🔄",
    desc: "Agile workflows, code review guidelines & QA strategy",
    color: "#9333ea",
    bg: "#faf5ff"
  }
];

const SUGGESTED_TAGS = ["Architecture", "Security", "PostgreSQL", "React", "AWS", "API", "Microservices"];

export default function NewDecisionModal({ onClose, onCreate, onCreated }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Architecture");
  const [teamId, setTeamId] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [rationale, setRationale] = useState("");
  const [status, setStatus] = useState("Draft");
  const [tags, setTags] = useState(["Architecture"]);
  const [tagInput, setTagInput] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  
  const [teams, setTeams] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const list = await api.listTeams();
        setTeams(list || []);
        if (list && list.length > 0) {
          setTeamId(list[0].id);
        }
      } catch {
        // ignore
      }
    }
    fetchTeams();
  }, []);

  const handleAddTag = (tagToAdd) => {
    const clean = tagToAdd.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachedFile(e.dataTransfer.files[0]);
    }
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a decision title.");
      setStep(1);
      return;
    }

    setError("");
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        problem_statement: problemStatement || undefined,
        rationale: rationale || undefined,
        status,
        tags: tags.join(","),
        ...(teamId ? { team_id: Number(teamId) } : {})
      };

      let created;
      if (onCreate) {
        created = await onCreate(payload);
      } else {
        created = await api.createDecision(payload);
      }

      // If a file attachment was selected, upload it immediately!
      if (created && created.id && attachedFile) {
        try {
          await api.uploadAttachment(created.id, attachedFile);
        } catch {
          // attachment error fallback
        }
      }

      if (onCreated) onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create decision.");
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
          maxWidth: 680,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          animation: "modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            padding: "24px 28px",
            color: "#ffffff",
            position: "relative"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)"
                }}
              >
                ✨
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  Document Architectural Decision
                </h3>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0 0" }}>
                  Record technical specs, trade-offs, team tags, and supporting documents
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "#94a3b8",
                width: 32,
                height: 32,
                borderRadius: "50%",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.color = "#94a3b8";
              }}
            >
              ✕
            </button>
          </div>

          {/* Stepper Indicator */}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            {[
              { num: 1, title: "1. Core Details" },
              { num: 2, title: "2. Rationale & Trade-offs" },
              { num: 3, title: "3. Attach Specs & Tags" }
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: step === s.num ? "#2563eb" : "rgba(255, 255, 255, 0.1)",
                  color: step === s.num ? "#ffffff" : "#94a3b8",
                  transition: "all 0.2s"
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>
          
          {/* STEP 1: Core Details */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  Decision Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Migrate Auth System to OAuth2 JWT & Redis Cache"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (title.trim()) setStep(2);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 15,
                    fontWeight: 600,
                    outline: "none",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                  }}
                />
              </div>

              {/* Category Visual Cards Selection Grid */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                  Select Category <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: isSelected ? `2px solid ${cat.color}` : "1px solid #e2e8f0",
                          background: isSelected ? cat.bg : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? cat.color : "#0f172a" }}>
                            {cat.label} {isSelected && "✓"}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.3 }}>
                            {cat.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team Selector & Initial Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                    Associated Engineering Team
                  </label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
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
                    <option value="">No Specific Team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        👥 {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                    Workflow Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
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
                    <option value="Draft">📝 Draft</option>
                    <option value="Under Review">⌛ Under Review</option>
                    <option value="Approved">✅ Approved</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Rationale & Alternatives */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  Context & Problem Statement
                </label>
                <textarea
                  rows={4}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Describe current architecture bottlenecks, security requirements, or scalability goals..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  Alternatives Considered & Expected Outcomes
                </label>
                <textarea
                  rows={4}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Detail rejected options, trade-offs evaluated (latency, cost, maintenance), and expected results..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Attach File & Tags */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Drag and Drop File Zone */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  Attach Supporting Document (PDF / DOCX / PPTX / Spec)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed #93c5fd",
                    background: "#eff6ff",
                    borderRadius: 14,
                    padding: "24px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && setAttachedFile(e.target.files[0])}
                    style={{ display: "none" }}
                  />

                  {attachedFile ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                      <span style={{ fontSize: 32 }}>📄</span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, color: "#1e40af", fontSize: 14 }}>
                          {attachedFile.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#3b82f6" }}>
                          {(attachedFile.size / 1024).toFixed(1)} KB · Ready to upload
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachedFile(null);
                        }}
                        style={{
                          background: "#fee2e2",
                          border: "none",
                          color: "#ef4444",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          marginLeft: 12
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: 36 }}>📤</span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8", marginTop: 6 }}>
                        Click to browse or drag & drop specification files
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        Supports PDF blueprints, DOCX proposals, PPTX decks, or images
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags Selector */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  Document Tags
                </label>
                
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Add custom tag (e.g. #security)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer"
                    }}
                  >
                    + Add Tag
                  </button>
                </div>

                {/* Tag Pills Display */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      #{t}
                      <span
                        onClick={() => handleRemoveTag(t)}
                        style={{ cursor: "pointer", fontSize: 13, opacity: 0.7 }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>

                {/* Suggested Tags */}
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Suggested:{" "}
                  {SUGGESTED_TAGS.filter((st) => !tags.includes(st)).map((st) => (
                    <span
                      key={st}
                      onClick={() => handleAddTag(st)}
                      style={{
                        color: "#2563eb",
                        cursor: "pointer",
                        marginRight: 8,
                        textDecoration: "underline"
                      }}
                    >
                      +#{st}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {error && (
            <div
              style={{
                color: "#ef4444",
                fontSize: 13,
                background: "#fef2f2",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #fecaca",
                marginTop: 16
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Modal Footer Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid #f1f5f9"
            }}
          >
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  ← Previous Step
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
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

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!title.trim()) {
                      setError("Please provide a decision title.");
                      return;
                    }
                    setError("");
                    setStep(step + 1);
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                  }}
                >
                  Next: {step === 1 ? "Rationale" : "Attachments & Tags"} →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  {busy ? "Publishing..." : "✨ Publish Decision & Specs"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
