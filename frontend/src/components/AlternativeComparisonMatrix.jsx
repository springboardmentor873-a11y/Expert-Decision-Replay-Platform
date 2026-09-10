import React, { useState } from "react";
import {
  Check,
  X,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Award,
  Plus,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";

function AlternativeComparisonMatrix({
  decisionId,
  alternatives = [],
  selectedAlternativeId,
  onSelectAlternative,
  onAddAlternative,
  canEdit = true,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPros, setNewPros] = useState("");
  const [newCons, setNewCons] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newFeasibility, setNewFeasibility] = useState("");
  const [newFeasScore, setNewFeasScore] = useState(8);
  const [newRisk, setNewRisk] = useState("");
  const [newRiskLevel, setNewRiskLevel] = useState("Medium");
  const [newMitigation, setNewMitigation] = useState("");
  const [rationaleModal, setRationaleModal] = useState(null);
  const [rationaleText, setRationaleText] = useState("");

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddAlternative({
      title: newTitle,
      description: newDesc,
      pros: newPros.split("\n").map((p) => p.trim()).filter(Boolean),
      cons: newCons.split("\n").map((c) => c.trim()).filter(Boolean),
      cost_estimate: newCost,
      feasibility_analysis: newFeasibility,
      feasibility_score: Number(newFeasScore),
      risk_assessment: newRisk,
      risk_level: newRiskLevel,
      mitigation_plan: newMitigation,
    });

    setNewTitle("");
    setNewDesc("");
    setNewPros("");
    setNewCons("");
    setNewCost("");
    setNewFeasibility("");
    setNewRisk("");
    setNewMitigation("");
    setShowAddModal(false);
  };

  const confirmSelect = (altId) => {
    onSelectAlternative(altId, rationaleText);
    setRationaleModal(null);
    setRationaleText("");
  };

  const getRiskBadge = (level) => {
    switch (level?.toLowerCase()) {
      case "low":
        return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
      case "medium":
        return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
      case "high":
        return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
      case "critical":
        return { bg: "#450a0a", color: "#fca5a5", border: "#7f1d1d" };
      default:
        return { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Alternative Evaluation & Trade-off Matrix</h3>
          <p style={styles.subtitle}>
            Side-by-side analysis of architectural options, cost projections, feasibility, and risk profiles.
          </p>
        </div>
        {canEdit && (
          <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Add Option</span>
          </button>
        )}
      </div>

      {alternatives.length === 0 ? (
        <div style={styles.emptyState}>
          <Info size={32} color="#94a3b8" />
          <p style={{ margin: "8px 0 4px 0", fontWeight: "600", color: "#334155" }}>
            No alternatives documented yet
          </p>
          <p style={{ fontSize: "13px", color: "#64748b" }}>
            Add at least two competing approaches to compare feasibility and tradeoffs.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {alternatives.map((alt, index) => {
            const isChosen = alt.is_selected || alt.id === selectedAlternativeId;
            const pros = Array.isArray(alt.pros) ? alt.pros : (alt.pros ? [alt.pros] : []);
            const cons = Array.isArray(alt.cons) ? alt.cons : (alt.cons ? [alt.cons] : []);
            const riskStyle = getRiskBadge(alt.risk_level);

            return (
              <div
                key={alt.id || index}
                style={{
                  ...styles.altCard,
                  borderColor: isChosen ? "#2563eb" : "#e2e8f0",
                  backgroundColor: isChosen ? "#f8faff" : "#ffffff",
                  boxShadow: isChosen
                    ? "0 4px 12px -2px rgba(37, 99, 235, 0.15)"
                    : "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {isChosen && (
                  <div style={styles.chosenBanner}>
                    <Award size={14} />
                    <span>SELECTED OFFICIAL SOLUTION</span>
                  </div>
                )}

                <div style={styles.cardHeader}>
                  <div style={styles.optLetter}>Option {String.fromCharCode(65 + index)}</div>
                  <h4 style={styles.altTitle}>{alt.title}</h4>
                  {alt.description && <p style={styles.altDesc}>{alt.description}</p>}
                </div>

                {/* Pros Section */}
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <Check size={14} color="#10b981" />
                    <span>Key Advantages (Pros)</span>
                  </div>
                  <div style={styles.bulletList}>
                    {pros.length > 0 ? (
                      pros.map((p, i) => (
                        <div key={i} style={styles.proItem}>
                          <span style={styles.proBullet}>+</span>
                          <span>{p}</span>
                        </div>
                      ))
                    ) : (
                      <span style={styles.naText}>None listed</span>
                    )}
                  </div>
                </div>

                {/* Cons Section */}
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <X size={14} color="#ef4444" />
                    <span>Trade-offs & Constraints (Cons)</span>
                  </div>
                  <div style={styles.bulletList}>
                    {cons.length > 0 ? (
                      cons.map((c, i) => (
                        <div key={i} style={styles.conItem}>
                          <span style={styles.conBullet}>−</span>
                          <span>{c}</span>
                        </div>
                      ))
                    ) : (
                      <span style={styles.naText}>None listed</span>
                    )}
                  </div>
                </div>

                {/* Cost & Feasibility Metrics */}
                <div style={styles.metricsBox}>
                  <div style={styles.metricRow}>
                    <div style={styles.metricLabel}>
                      <DollarSign size={13} color="#64748b" />
                      <span>Cost Estimate:</span>
                    </div>
                    <span style={styles.metricVal}>{alt.cost_estimate || "TBD"}</span>
                  </div>

                  <div style={styles.metricRow}>
                    <div style={styles.metricLabel}>
                      <TrendingUp size={13} color="#64748b" />
                      <span>Feasibility Score:</span>
                    </div>
                    <div style={styles.feasibilityBarContainer}>
                      <div
                        style={{
                          ...styles.feasibilityBarFill,
                          width: `${(alt.feasibility_score || 5) * 10}%`,
                          backgroundColor:
                            alt.feasibility_score >= 8
                              ? "#10b981"
                              : alt.feasibility_score >= 5
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                      <span style={styles.feasibilityText}>{alt.feasibility_score || 5}/10</span>
                    </div>
                  </div>

                  <div style={styles.metricRow}>
                    <div style={styles.metricLabel}>
                      <AlertTriangle size={13} color="#64748b" />
                      <span>Risk Profile:</span>
                    </div>
                    <span
                      style={{
                        ...styles.riskBadge,
                        backgroundColor: riskStyle.bg,
                        color: riskStyle.color,
                        borderColor: riskStyle.border,
                      }}
                    >
                      {alt.risk_level || "Medium"} Risk
                    </span>
                  </div>

                  {alt.mitigation_plan && (
                    <div style={styles.mitigationRow}>
                      <ShieldCheck size={13} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={styles.mitigationText}>
                        <strong>Mitigation:</strong> {alt.mitigation_plan}
                      </span>
                    </div>
                  )}
                </div>

                {/* Selection Action */}
                {canEdit && (
                  <div style={styles.cardFooter}>
                    {isChosen ? (
                      <div style={styles.chosenIndicator}>
                        <Check size={16} />
                        <span>Chosen Alternative</span>
                      </div>
                    ) : (
                      <button
                        style={styles.selectBtn}
                        onClick={() => {
                          setRationaleModal(alt.id);
                          setRationaleText(`Selected ${alt.title} due to superior feasibility and risk mitigation.`);
                        }}
                      >
                        Select as Official Decision
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rationale Confirmation Modal */}
      {rationaleModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalBox} className="animate-fade-in">
            <h3 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>Confirm Decision Selection</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 14px 0" }}>
              Provide the executive rationale for selecting this alternative over the other candidates:
            </p>
            <textarea
              style={styles.textarea}
              rows={4}
              value={rationaleText}
              onChange={(e) => setRationaleText(e.target.value)}
              placeholder="Explain why this option best addresses the problem statement..."
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button style={styles.cancelBtn} onClick={() => setRationaleModal(null)}>
                Cancel
              </button>
              <button style={styles.primaryBtn} onClick={() => confirmSelect(rationaleModal)}>
                Confirm & Record Rationale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Alternative Modal */}
      {showAddModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalBox, maxWidth: "600px" }} className="animate-fade-in">
            <h3 style={{ margin: "0 0 6px 0", color: "#0f172a" }}>Add Competing Alternative</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
              Define another architectural or process alternative to evaluate.
            </p>

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={styles.inputLabel}>Alternative Title *</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="e.g. Serverless AWS Lambda with Aurora Serverless v2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={styles.inputLabel}>Description</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="Brief architectural overview"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.inputLabel}>Pros (one per line)</label>
                  <textarea
                    style={styles.textarea}
                    rows={3}
                    placeholder="Auto-scaling&#10;Zero idle cost&#10;Fast deployment"
                    value={newPros}
                    onChange={(e) => setNewPros(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.inputLabel}>Cons (one per line)</label>
                  <textarea
                    style={styles.textarea}
                    rows={3}
                    placeholder="Cold start latency&#10;Vendor lock-in"
                    value={newCons}
                    onChange={(e) => setNewCons(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.inputLabel}>Cost Estimate</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="e.g. $2,500 / month"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                  />
                </div>
                <div style={{ width: "120px" }}>
                  <label style={styles.inputLabel}>Feasibility (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    style={styles.input}
                    value={newFeasScore}
                    onChange={(e) => setNewFeasScore(e.target.value)}
                  />
                </div>
                <div style={{ width: "140px" }}>
                  <label style={styles.inputLabel}>Risk Level</label>
                  <select
                    style={styles.select}
                    value={newRiskLevel}
                    onChange={(e) => setNewRiskLevel(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.inputLabel}>Risk Mitigation Strategy</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="How will this risk be monitored or minimized?"
                  value={newMitigation}
                  onChange={(e) => setNewMitigation(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  Add Alternative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "3px 0 0 0",
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  emptyState: {
    padding: "36px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },
  altCard: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    position: "relative",
    transition: "all 0.2s ease",
  },
  chosenBanner: {
    position: "absolute",
    top: "-10px",
    right: "14px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    letterSpacing: "0.5px",
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  optLetter: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  altTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    lineHeight: 1.3,
  },
  altDesc: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#334155",
  },
  bulletList: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  proItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    fontSize: "12px",
    color: "#065f46",
    backgroundColor: "#f0fdf4",
    padding: "4px 8px",
    borderRadius: "6px",
    lineHeight: 1.4,
  },
  proBullet: {
    fontWeight: "bold",
    color: "#10b981",
  },
  conItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    fontSize: "12px",
    color: "#991b1b",
    backgroundColor: "#fef2f2",
    padding: "4px 8px",
    borderRadius: "6px",
    lineHeight: 1.4,
  },
  conBullet: {
    fontWeight: "bold",
    color: "#ef4444",
  },
  naText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  metricsBox: {
    backgroundColor: "#f8fafc",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
  },
  metricLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#64748b",
    fontWeight: "500",
  },
  metricVal: {
    fontWeight: "700",
    color: "#0f172a",
  },
  feasibilityBarContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    width: "110px",
  },
  feasibilityBarFill: {
    height: "6px",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  feasibilityText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#334155",
  },
  riskBadge: {
    padding: "2px 8px",
    borderRadius: "4px",
    border: "1px solid",
    fontSize: "11px",
    fontWeight: "600",
  },
  mitigationRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    fontSize: "11px",
    color: "#334155",
    backgroundColor: "#ffffff",
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    marginTop: "2px",
  },
  mitigationText: {
    lineHeight: 1.4,
  },
  cardFooter: {
    marginTop: "auto",
    paddingTop: "6px",
  },
  selectBtn: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    border: "1px solid #2563eb",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  chosenIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "20px",
  },
  modalBox: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "480px",
    padding: "24px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
  },
  inputLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "4px",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    boxSizing: "border-box",
    resize: "vertical",
  },
  cancelBtn: {
    padding: "8px 16px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: "8px 18px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default AlternativeComparisonMatrix;
