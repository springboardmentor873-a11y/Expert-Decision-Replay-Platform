import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  Archive,
  ChevronRight,
  ArrowRight,
  Layers,
  History,
  MessageSquare,
  Users,
  Calendar,
  X,
  Send,
  Eye,
  Check,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import AlternativeComparisonMatrix from "./AlternativeComparisonMatrix";

function DecisionsHub({ user, apiBase = "http://127.0.0.1:8000" }) {
  const [decisions, setDecisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("overview"); // overview | alternatives | discussion | versions | documents | approvals

  // Milestone 3 Approval & Export state
  const [approvalHistory, setApprovalHistory] = useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalActionType, setApprovalActionType] = useState("approve");
  const [approvalComments, setApprovalComments] = useState("");
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState(null);

  // Create Decision Wizard state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    problem_statement: "",
    objective: "",
    context: "",
    category: "AI",
    priority: "Medium",
    team_id: "",
    initial_alternatives: [
      {
        title: "Option A: Primary Candidate",
        description: "",
        pros: "",
        cons: "",
        cost_estimate: "",
        feasibility_score: 8,
        risk_level: "Low",
        mitigation_plan: "",
      },
      {
        title: "Option B: Secondary Candidate",
        description: "",
        pros: "",
        cons: "",
        cost_estimate: "",
        feasibility_score: 6,
        risk_level: "Medium",
        mitigation_plan: "",
      },
    ],
  });

  // Comment & Meeting note state
  const [newComment, setNewComment] = useState("");
  const [newMeetingNote, setNewMeetingNote] = useState({
    attendees: "",
    content: "",
  });
  const [isAddingMeetingNote, setIsAddingMeetingNote] = useState(false);

  useEffect(() => {
    fetchDecisions();
    fetchTeams();
  }, []);

  const fetchDecisions = async () => {
    try {
      const res = await fetch(`${apiBase}/decisions`);
      if (res.ok) {
        const data = await res.json();
        setDecisions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${apiBase}/teams`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadDecisionDetail = async (id) => {
    try {
      const res = await fetch(`${apiBase}/decisions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDecision(data);
      }
      fetchApprovalHistory(id);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApprovalHistory = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/decisions/${id}/approval-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApprovalHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecuteApproval = async () => {
    if (!selectedDecision) return;
    setApprovalSubmitting(true);
    setApprovalMessage(null);
    const token = localStorage.getItem("token");

    let endpoint = "";
    let body = { action: "Approved", comments: approvalComments };

    if (approvalActionType === "submit") {
      endpoint = `${apiBase}/decisions/${selectedDecision.id}/submit-for-approval`;
      body = { action: "Submitted", comments: approvalComments || "Submitted for Stage 1 review." };
    } else if (approvalActionType === "approve") {
      endpoint = `${apiBase}/decisions/${selectedDecision.id}/approve-stage`;
      body = { action: "Approved", comments: approvalComments || "Stage requirements satisfied." };
    } else if (approvalActionType === "reject") {
      endpoint = `${apiBase}/decisions/${selectedDecision.id}/reject-stage`;
      body = { action: "Rejected", comments: approvalComments || "Decision rejected during review." };
    } else if (approvalActionType === "request_changes") {
      endpoint = `${apiBase}/decisions/${selectedDecision.id}/request-changes`;
      body = { action: "Changes Requested", comments: approvalComments || "Revisions requested." };
    } else if (approvalActionType === "escalate") {
      endpoint = `${apiBase}/decisions/${selectedDecision.id}/escalate`;
      body = { escalation_reason: approvalComments || "Turnaround threshold exceeded." };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setApprovalMessage({ text: data.detail || "Action failed", isError: true });
        return;
      }
      setApprovalMessage({ text: data.message || "Action executed successfully!", isError: false });
      setTimeout(async () => {
        setIsApprovalModalOpen(false);
        await loadDecisionDetail(selectedDecision.id);
        fetchDecisions();
      }, 900);
    } catch (e) {
      setApprovalMessage({ text: "Network error occurred", isError: true });
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedDecision) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/decisions/${selectedDecision.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadDecisionDetail(selectedDecision.id);
        fetchDecisions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectAlternative = async (altId, rationale) => {
    if (!selectedDecision) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/decisions/${selectedDecision.id}/select-alternative`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selected_alternative_id: altId,
          decision_rationale: rationale,
        }),
      });
      if (res.ok) {
        await loadDecisionDetail(selectedDecision.id);
        fetchDecisions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAlternative = async (altData) => {
    if (!selectedDecision) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/decisions/${selectedDecision.id}/alternatives`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(altData),
      });
      if (res.ok) {
        await loadDecisionDetail(selectedDecision.id);
        fetchDecisions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedDecision) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/decisions/${selectedDecision.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        loadDecisionDetail(selectedDecision.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostMeetingNote = async (e) => {
    e.preventDefault();
    if (!newMeetingNote.content.trim() || !selectedDecision) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/decisions/${selectedDecision.id}/meeting-notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMeetingNote.content,
          meeting_attendees: newMeetingNote.attendees,
        }),
      });
      if (res.ok) {
        setNewMeetingNote({ attendees: "", content: "" });
        setIsAddingMeetingNote(false);
        loadDecisionDetail(selectedDecision.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: formData.title,
        problem_statement: formData.problem_statement,
        objective: formData.objective,
        context: formData.context,
        category: formData.category,
        priority: formData.priority,
        team_id: formData.team_id ? Number(formData.team_id) : null,
        initial_alternatives: formData.initial_alternatives.map((a) => ({
          title: a.title,
          description: a.description,
          pros: a.pros ? a.pros.split("\n").filter(Boolean) : [],
          cons: a.cons ? a.cons.split("\n").filter(Boolean) : [],
          cost_estimate: a.cost_estimate,
          feasibility_score: Number(a.feasibility_score),
          risk_level: a.risk_level,
          mitigation_plan: a.mitigation_plan,
        })),
      };

      const res = await fetch(`${apiBase}/decisions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setCreateStep(1);
        fetchDecisions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0", icon: CheckCircle };
      case "Under Review":
        return { bg: "#f3e8ff", color: "#7c3aed", border: "#ddd6fe", icon: Clock };
      case "Draft":
        return { bg: "#fef3c7", color: "#d97706", border: "#fde68a", icon: FileText };
      case "Rejected":
        return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", icon: AlertCircle };
      case "Archived":
        return { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0", icon: Archive };
      default:
        return { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0", icon: FileText };
    }
  };

  const filteredDecisions = decisions.filter((d) => {
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || d.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.problem_statement.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Decisions Management & Replay</h1>
          <p style={styles.subtitle}>
            Capture problem statements, evaluate tradeoffs across alternatives, and preserve institutional knowledge.
          </p>
        </div>
        <button style={styles.createBtn} onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          <span>Create Decision</span>
        </button>
      </div>

      {/* Filter and Status Ribbon */}
      <div style={styles.toolbar}>
        <div style={styles.statusPills}>
          {["All", "Draft", "Under Review", "Approved", "Rejected", "Archived"].map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                style={{
                  ...styles.statusBtn,
                  backgroundColor: isActive ? "var(--primary)" : "var(--bg-surface-container)",
                  color: isActive ? "var(--on-primary)" : "var(--text-secondary)",
                  borderColor: isActive ? "var(--primary)" : "var(--border-subtle)",
                  boxShadow: isActive ? "0 2px 8px rgba(103, 80, 164, 0.28)" : "none",
                }}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "10px", flex: 1, justifyContent: "flex-end" }}>
          <div style={styles.searchBox}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search decisions..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            style={styles.select}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="AI">AI & Machine Learning</option>
            <option value="Database">Database</option>
            <option value="Cloud">Cloud Infrastructure</option>
            <option value="Security">Security & Compliance</option>
            <option value="Architecture">System Architecture</option>
          </select>
        </div>
      </div>

      {/* Decisions Cards List */}
      <div style={styles.decisionsList}>
        {filteredDecisions.length === 0 ? (
          <div style={styles.emptyCard}>
            <FileText size={48} color="var(--primary)" style={{ opacity: 0.5 }} />
            <h3 style={{ margin: "12px 0 4px 0", color: "var(--text-primary)" }}>No Decisions Found</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Try adjusting your filters or create a new decision record.
            </p>
          </div>
        ) : (
          filteredDecisions.map((d) => {
            const badge = getStatusBadge(d.status);
            const Icon = badge.icon;
            return (
              <div
                key={d.id}
                style={styles.decisionCard}
                onClick={() => {
                  loadDecisionDetail(d.id);
                  setActiveDetailTab("overview");
                }}
              >
                <div style={styles.cardTop}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        borderColor: badge.border,
                      }}
                    >
                      <Icon size={12} />
                      <span>{d.status}</span>
                    </span>
                    <span style={styles.categoryBadge}>{d.category}</span>
                    <span style={styles.versionBadge}>v{d.current_version}</span>
                  </div>
                  <span style={styles.priorityBadge}>Priority: {d.priority}</span>
                </div>

                <h3 style={styles.decisionTitle}>{d.title}</h3>
                <p style={styles.decisionProblem}>{d.problem_statement}</p>

                {d.decision_rationale && (
                  <div style={styles.rationaleSnippet}>
                    <strong>Rationale:</strong> {d.decision_rationale}
                  </div>
                )}

                <div style={styles.cardBottom}>
                  <div style={styles.authorMeta}>
                    <span>Created by <strong>{d.author_name}</strong></span>
                    <span>&bull;</span>
                    <span>Team: {d.team_name}</span>
                  </div>

                  <div style={styles.cardStats}>
                    <span title="Alternatives evaluated">
                      <Layers size={13} /> {d.alternatives_count} Alternatives
                    </span>
                    <span title="Attached documents">
                      <FileText size={13} /> {d.documents_count} Docs
                    </span>
                    <span title="Discussion threads">
                      <MessageSquare size={13} /> {d.comments_count} Discussions
                    </span>
                    <button style={styles.replayBtn}>
                      <span>Replay / Inspect</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decision Detail & Replay Drawer / Modal */}
      {selectedDecision && (
        <div style={styles.modalBackdrop}>
          <div style={styles.detailModal} className="animate-fade-in">
            {/* Modal Header */}
            <div style={styles.detailHeader}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusBadge(selectedDecision.status),
                    }}
                  >
                    {selectedDecision.status}
                  </span>
                  <span style={styles.categoryBadge}>{selectedDecision.category}</span>
                  <span style={styles.versionBadge}>Version {selectedDecision.current_version}</span>
                  <span style={styles.teamTag}>{selectedDecision.team_name}</span>
                </div>
                <h2 style={styles.detailTitle}>{selectedDecision.title}</h2>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedDecision(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Multi-Stage Stepper */}
            <div style={styles.stepperContainer}>
              {[
                { step: 1, label: "Draft", desc: "Alternatives Formulation", active: selectedDecision.status === "Draft" || selectedDecision.status === "Changes Requested", done: selectedDecision.status === "Under Review" || selectedDecision.status === "Approved" },
                { step: 2, label: "Stage 1: Reviewer", desc: "Technical Verification", active: selectedDecision.status === "Under Review" && (!approvalHistory?.workflow || approvalHistory.workflow.stage === 1), done: (selectedDecision.status === "Under Review" && approvalHistory?.workflow?.stage === 2) || selectedDecision.status === "Approved" },
                { step: 3, label: "Stage 2: Manager", desc: "Executive Signoff", active: selectedDecision.status === "Under Review" && approvalHistory?.workflow?.stage === 2, done: selectedDecision.status === "Approved" },
                { step: 4, label: "Approved", desc: "Knowledge Replay Active", active: selectedDecision.status === "Approved", done: selectedDecision.status === "Approved" }
              ].map((s, idx) => (
                <div key={s.step} style={styles.stepperItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      ...styles.stepCircle,
                      backgroundColor: s.done ? "var(--accent-emerald)" : s.active ? "var(--primary)" : "var(--bg-surface-container-high)",
                      color: s.done || s.active ? "#ffffff" : "var(--text-secondary)",
                      border: s.active ? "2px solid var(--primary)" : "none"
                    }}>
                      {s.done ? "✓" : s.step}
                    </div>
                    <div>
                      <div style={{ fontSize: "11.5px", fontWeight: s.active ? "700" : "600", color: s.active ? "var(--primary)" : "var(--text-primary)" }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                  {idx < 3 && <div style={{ ...styles.stepperLine, backgroundColor: s.done ? "var(--accent-emerald)" : "var(--border-outline-variant)" }} />}
                </div>
              ))}
            </div>

            {/* Workflow Action Bar */}
            <div style={styles.workflowBar}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                  Actions:
                </span>
                {selectedDecision.status === "Draft" && (
                  <button
                    style={{ ...styles.wfActionBtn, backgroundColor: "var(--secondary-container)", color: "var(--on-secondary-container)" }}
                    onClick={() => {
                      setApprovalActionType("submit");
                      setApprovalComments("");
                      setApprovalMessage(null);
                      setIsApprovalModalOpen(true);
                    }}
                  >
                    <Send size={13} /> Submit for Review
                  </button>
                )}
                {selectedDecision.status === "Under Review" && (
                  <>
                    <button
                      style={{ ...styles.wfActionBtn, backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.3)" }}
                      onClick={() => {
                        setApprovalActionType("approve");
                        setApprovalComments("");
                        setApprovalMessage(null);
                        setIsApprovalModalOpen(true);
                      }}
                    >
                      <CheckCircle size={13} /> {approvalHistory?.workflow?.stage === 2 ? "Final Executive Approval" : "Approve Stage 1"}
                    </button>
                    <button
                      style={{ ...styles.wfActionBtn, backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#d97706", borderColor: "rgba(245, 158, 11, 0.3)" }}
                      onClick={() => {
                        setApprovalActionType("request_changes");
                        setApprovalComments("");
                        setApprovalMessage(null);
                        setIsApprovalModalOpen(true);
                      }}
                    >
                      <RotateCcw size={13} /> Request Changes
                    </button>
                    <button
                      style={{ ...styles.wfActionBtn, backgroundColor: "rgba(220, 38, 38, 0.12)", color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.3)" }}
                      onClick={() => {
                        setApprovalActionType("reject");
                        setApprovalComments("");
                        setApprovalMessage(null);
                        setIsApprovalModalOpen(true);
                      }}
                    >
                      <AlertCircle size={13} /> Reject Decision
                    </button>
                    {!approvalHistory?.workflow?.is_escalated && (
                      <button
                        style={{ ...styles.wfActionBtn, backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
                        onClick={() => {
                          setApprovalActionType("escalate");
                          setApprovalComments("");
                          setApprovalMessage(null);
                          setIsApprovalModalOpen(true);
                        }}
                      >
                        <AlertTriangle size={13} /> Escalate Review
                      </button>
                    )}
                  </>
                )}

                <button
                  style={{ ...styles.wfActionBtn, backgroundColor: "var(--bg-surface-container-high)", color: "var(--text-secondary)", borderColor: "var(--border-outline-variant)" }}
                  onClick={() => window.open(`${apiBase}/reports/export/pdf?decision_id=${selectedDecision.id}`, "_blank")}
                >
                  <FileText size={13} /> Export Executive PDF
                </button>
              </div>
            </div>

            {/* Detail Tabs */}
            <div style={styles.detailTabs}>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "overview" ? "3px solid var(--primary)" : "none",
                  color: activeDetailTab === "overview" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: activeDetailTab === "overview" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("overview")}
              >
                Overview & Context
              </button>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "alternatives" ? "3px solid var(--primary)" : "none",
                  color: activeDetailTab === "alternatives" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: activeDetailTab === "alternatives" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("alternatives")}
              >
                Alternative Comparison ({selectedDecision.alternatives?.length || 0})
              </button>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "discussion" ? "3px solid var(--primary)" : "none",
                  color: activeDetailTab === "discussion" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: activeDetailTab === "discussion" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("discussion")}
              >
                Discussions & Notes ({selectedDecision.comments?.length || 0})
              </button>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "versions" ? "3px solid var(--primary)" : "none",
                  color: activeDetailTab === "versions" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: activeDetailTab === "versions" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("versions")}
              >
                Version History ({selectedDecision.versions?.length || 0})
              </button>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "documents" ? "3px solid var(--primary)" : "none",
                  color: activeDetailTab === "documents" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: activeDetailTab === "documents" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("documents")}
              >
                Documents ({selectedDecision.documents?.length || 0})
              </button>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "approvals" ? "3px solid var(--primary)" : "none",
                  color: activeDetailTab === "approvals" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: activeDetailTab === "approvals" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("approvals")}
              >
                Approval & Audit ({approvalHistory?.actions?.length || 0})
              </button>
            </div>

            {/* Tab Body */}
            <div style={styles.detailBody}>
              {/* 1. Overview */}
              {activeDetailTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div>
                    <h4 style={styles.sectionHeader}>Problem Statement</h4>
                    <p style={styles.paragraph}>{selectedDecision.problem_statement}</p>
                  </div>

                  {selectedDecision.objective && (
                    <div>
                      <h4 style={styles.sectionHeader}>Objectives & Success Criteria</h4>
                      <p style={styles.paragraph}>{selectedDecision.objective}</p>
                    </div>
                  )}

                  {selectedDecision.context && (
                    <div>
                      <h4 style={styles.sectionHeader}>Background Context</h4>
                      <p style={styles.paragraph}>{selectedDecision.context}</p>
                    </div>
                  )}

                  {selectedDecision.decision_rationale && (
                    <div style={styles.rationaleCard}>
                      <h4 style={{ ...styles.sectionHeader, color: "var(--on-primary-container)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle size={16} /> Official Decision Rationale
                      </h4>
                      <p style={{ ...styles.paragraph, color: "var(--on-primary-container)" }}>
                        {selectedDecision.decision_rationale}
                      </p>
                    </div>
                  )}

                  <div style={styles.metadataGrid}>
                    <div>
                      <span style={styles.metaLabel}>Author:</span>
                      <span style={styles.metaVal}>{selectedDecision.author_name}</span>
                    </div>
                    <div>
                      <span style={styles.metaLabel}>Assigned Team:</span>
                      <span style={styles.metaVal}>{selectedDecision.team_name}</span>
                    </div>
                    <div>
                      <span style={styles.metaLabel}>Priority Level:</span>
                      <span style={styles.metaVal}>{selectedDecision.priority}</span>
                    </div>
                    <div>
                      <span style={styles.metaLabel}>Current Version:</span>
                      <span style={styles.metaVal}>v{selectedDecision.current_version}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Alternatives Matrix */}
              {activeDetailTab === "alternatives" && (
                <AlternativeComparisonMatrix
                  decisionId={selectedDecision.id}
                  alternatives={selectedDecision.alternatives || []}
                  selectedAlternativeId={selectedDecision.selected_alternative_id}
                  onSelectAlternative={handleSelectAlternative}
                  onAddAlternative={handleAddAlternative}
                  canEdit={true}
                />
              )}

              {/* 3. Discussions & Meeting Notes */}
              {activeDetailTab === "discussion" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>Stakeholder Discussion & Minutes</h4>
                    <button
                      style={styles.toggleMeetingBtn}
                      onClick={() => setIsAddingMeetingNote(!isAddingMeetingNote)}
                    >
                      <Calendar size={14} />
                      <span>{isAddingMeetingNote ? "Cancel Meeting Note" : "+ Record Meeting Note"}</span>
                    </button>
                  </div>

                  {/* Form for Meeting Note */}
                  {isAddingMeetingNote && (
                    <form onSubmit={handlePostMeetingNote} style={styles.meetingForm} className="animate-fade-in">
                      <h5 style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>Record Formal Meeting Note</h5>
                      <div>
                        <label style={styles.inputLabel}>Attendees (e.g. Sarah Khan, Vikram Singh)</label>
                        <input
                          type="text"
                          style={styles.input}
                          placeholder="Attendee names separated by comma"
                          value={newMeetingNote.attendees}
                          onChange={(e) => setNewMeetingNote({ ...newMeetingNote, attendees: e.target.value })}
                          required
                        />
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <label style={styles.inputLabel}>Meeting Notes & Discussion Summary</label>
                        <textarea
                          style={styles.textarea}
                          rows={3}
                          placeholder="Key takeaways, agreements, action items..."
                          value={newMeetingNote.content}
                          onChange={(e) => setNewMeetingNote({ ...newMeetingNote, content: e.target.value })}
                          required
                        />
                      </div>
                      <button type="submit" style={{ ...styles.primaryBtn, marginTop: "10px" }}>
                        Save Meeting Note
                      </button>
                    </form>
                  )}

                  {/* Comments Feed */}
                  <div style={styles.commentsList}>
                    {selectedDecision.comments?.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: "13px" }}>No comments or notes recorded yet.</p>
                    ) : (
                      selectedDecision.comments?.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            ...styles.commentCard,
                            backgroundColor: c.is_meeting_note ? "#f0fdf4" : "#ffffff",
                            borderColor: c.is_meeting_note ? "#bbf7d0" : "#e2e8f0",
                          }}
                        >
                          <div style={styles.commentHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={styles.commentAuthor}>{c.user_name}</span>
                              {c.is_meeting_note && (
                                <span style={styles.meetingBadge}>
                                  <Calendar size={11} /> Meeting Minutes
                                </span>
                              )}
                            </div>
                            <span style={styles.commentDate}>
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          </div>

                          {c.meeting_attendees && (
                            <div style={styles.attendeesRow}>
                              <Users size={12} color="#059669" />
                              <span><strong>Attendees:</strong> {c.meeting_attendees}</span>
                            </div>
                          )}

                          <p style={styles.commentContent}>{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handlePostComment} style={styles.commentInputRow}>
                    <input
                      type="text"
                      placeholder="Add a comment or perspective to this decision..."
                      style={styles.commentInput}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" style={styles.commentSendBtn}>
                      <Send size={15} />
                      <span>Post</span>
                    </button>
                  </form>
                </div>
              )}

              {/* 4. Versions Timeline */}
              {activeDetailTab === "versions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>Audit History & Decision Replay</h4>
                  <div style={styles.timeline}>
                    {selectedDecision.versions?.map((v, i) => (
                      <div key={v.id || i} style={styles.timelineItem}>
                        <div style={styles.timelineDot}>v{v.version_number}</div>
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineHeader}>
                            <span style={styles.timelineTitle}>Version {v.version_number}</span>
                            <span style={styles.timelineDate}>{new Date(v.created_at).toLocaleString()}</span>
                          </div>
                          <p style={styles.timelineSummary}>
                            {v.change_summary || "Decision updated."}
                          </p>
                          <div style={styles.timelineAuthor}>
                            Modified by: <strong>{v.author_name}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Supporting Documents */}
              {activeDetailTab === "documents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>Attached Technical Files</h4>
                  {selectedDecision.documents?.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No documents linked to this decision.</p>
                  ) : (
                    selectedDecision.documents?.map((doc) => (
                      <div key={doc.id} style={styles.docItemRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={20} color="var(--primary)" />
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "14px", color: "var(--text-primary)" }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {doc.category} &bull; Uploaded by {doc.uploader_name}
                            </div>
                          </div>
                        </div>
                        <a
                          href={`${apiBase}/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.downloadDocBtn}
                        >
                          Download File
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 6. Approval & Audit */}
              {activeDetailTab === "approvals" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={styles.workflowSummaryCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                          Governance & Multi-Stage Approval Status
                        </h4>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)" }}>
                          Two-tier verification protocol: Stage 1 (Peer Reviewer) &rarr; Stage 2 (Engineering Manager signoff).
                        </p>
                      </div>
                      <span style={{
                        ...styles.statusBadge,
                        ...getStatusBadge(selectedDecision.status)
                      }}>
                        {selectedDecision.status}
                      </span>
                    </div>

                    {approvalHistory?.workflow ? (
                      <div style={styles.workflowDetailsGrid}>
                        <div>
                          <span style={styles.metaLabel}>Current Stage</span>
                          <span style={styles.metaVal}>
                            Stage {approvalHistory.workflow.stage} ({approvalHistory.workflow.stage === 1 ? "Technical Reviewer" : "Manager Approval"})
                          </span>
                        </div>
                        <div>
                          <span style={styles.metaLabel}>Assigned Reviewer</span>
                          <span style={styles.metaVal}>
                            {approvalHistory.workflow.reviewer_name || "Unassigned"}
                          </span>
                        </div>
                        <div>
                          <span style={styles.metaLabel}>Assigned Manager</span>
                          <span style={styles.metaVal}>
                            {approvalHistory.workflow.manager_name || "Unassigned"}
                          </span>
                        </div>
                        <div>
                          <span style={styles.metaLabel}>Escalation Status</span>
                          <span style={{
                            ...styles.metaVal,
                            color: approvalHistory.workflow.is_escalated ? "#ef4444" : "var(--text-primary)"
                          }}>
                            {approvalHistory.workflow.is_escalated ? "Escalated" : "Standard SLA"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        No active workflow initiated. Click "Submit for Review" to begin the approval pipeline.
                      </div>
                    )}
                  </div>

                  {/* Actions History Timeline */}
                  <h4 style={styles.sectionHeader}>Approval Audit Trail</h4>
                  {(!approvalHistory?.actions || approvalHistory.actions.length === 0) ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: "13.5px" }}>
                      No approval actions recorded yet.
                    </div>
                  ) : (
                    <div style={styles.timeline}>
                      {approvalHistory.actions.map((act) => {
                        const isApprove = act.action.toLowerCase().includes("approve");
                        const isReject = act.action.toLowerCase().includes("reject");
                        const isEscalate = act.action.toLowerCase().includes("escalat");
                        const isChanges = act.action.toLowerCase().includes("change");
                        const iconColor = isApprove ? "var(--accent-emerald)" : isReject ? "#dc2626" : isEscalate ? "#ef4444" : isChanges ? "#d97706" : "var(--primary)";

                        return (
                          <div key={act.id} style={styles.timelineItem}>
                            <div style={{ ...styles.timelineDot, backgroundColor: iconColor }}>
                              {isApprove ? "✓" : isReject ? "✕" : "•"}
                            </div>
                            <div style={styles.timelineContent}>
                              <div style={styles.timelineHeader}>
                                <span style={styles.timelineTitle}>
                                  {act.action} (Stage {act.stage})
                                </span>
                                <span style={styles.timelineDate}>
                                  {new Date(act.created_at).toLocaleString()}
                                </span>
                              </div>
                              {act.comments && (
                                <p style={styles.timelineSummary}>"{act.comments}"</p>
                              )}
                              <div style={styles.timelineAuthor}>
                                Actioned by: <strong>{act.actor_name}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Action Modal Dialog */}
      {isApprovalModalOpen && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.detailModal, maxWidth: "520px" }} className="animate-fade-in">
            <div style={styles.detailHeader}>
              <div>
                <h2 style={styles.detailTitle}>
                  {approvalActionType === "submit" && "Submit Decision for Review"}
                  {approvalActionType === "approve" && "Execute Approval"}
                  {approvalActionType === "reject" && "Reject Decision"}
                  {approvalActionType === "request_changes" && "Request Revisions / Changes"}
                  {approvalActionType === "escalate" && "Escalate Approval SLA"}
                </h2>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  Target: {selectedDecision?.title}
                </p>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsApprovalModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {approvalMessage && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: approvalMessage.isError ? "rgba(220, 38, 38, 0.1)" : "rgba(16, 185, 129, 0.1)",
                  color: approvalMessage.isError ? "#dc2626" : "#059669",
                  fontSize: "13px",
                  fontWeight: "600",
                }}>
                  {approvalMessage.text}
                </div>
              )}

              <div>
                <label style={styles.inputLabel}>
                  {approvalActionType === "submit" ? "Submission Notes" :
                   approvalActionType === "approve" ? "Approval Endorsement / Rationale" :
                   approvalActionType === "reject" ? "Rejection Reason (Required)" :
                   approvalActionType === "request_changes" ? "Required Revisions & Feedback (Required)" :
                   "Escalation Rationale (Required)"}
                </label>
                <textarea
                  style={styles.textarea}
                  rows={4}
                  placeholder="Enter comments, audit feedback, or compliance notes..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setIsApprovalModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={approvalSubmitting}
                  style={{
                    ...styles.primaryBtn,
                    backgroundColor:
                      approvalActionType === "reject" ? "#dc2626" :
                      approvalActionType === "escalate" ? "#ef4444" :
                      approvalActionType === "request_changes" ? "#d97706" :
                      approvalActionType === "approve" ? "#059669" : "var(--primary)"
                  }}
                  onClick={handleExecuteApproval}
                >
                  {approvalSubmitting ? "Executing..." : "Confirm & Dispatch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Create Decision Modal */}
      {isCreateOpen && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.detailModal, maxWidth: "700px" }} className="animate-fade-in">
            <div style={styles.detailHeader}>
              <div>
                <h2 style={styles.detailTitle}>Create Strategic Decision Record</h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                  Step {createStep} of 2: {createStep === 1 ? "Problem Definition & Context" : "Alternatives & Options"}
                </p>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} style={{ padding: "24px" }}>
              {createStep === 1 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={styles.inputLabel}>Decision Title *</label>
                    <input
                      type="text"
                      style={styles.input}
                      placeholder="e.g. Choose Enterprise AI Model Platform"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.inputLabel}>Category</label>
                      <select
                        style={styles.select}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="AI">AI & Machine Learning</option>
                        <option value="Database">Database & Storage</option>
                        <option value="Cloud">Cloud Infrastructure</option>
                        <option value="Security">Security & Compliance</option>
                        <option value="Architecture">System Architecture</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={styles.inputLabel}>Priority</label>
                      <select
                        style={styles.select}
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={styles.inputLabel}>Assign Team</label>
                      <select
                        style={styles.select}
                        value={formData.team_id}
                        onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                      >
                        <option value="">-- Select Team --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={styles.inputLabel}>Problem Statement *</label>
                    <textarea
                      style={styles.textarea}
                      rows={3}
                      placeholder="What specific architectural or business dilemma is being solved?"
                      value={formData.problem_statement}
                      onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={styles.inputLabel}>Objectives & Success Criteria</label>
                    <textarea
                      style={styles.textarea}
                      rows={2}
                      placeholder="e.g. Sub-300ms latency, ISO27001 compliance, under $5k/mo"
                      value={formData.objective}
                      onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                    <button
                      type="button"
                      style={styles.primaryBtn}
                      onClick={() => {
                        if (!formData.title || !formData.problem_statement) {
                          alert("Please fill in Title and Problem Statement");
                          return;
                        }
                        setCreateStep(2);
                      }}
                    >
                      Next: Define Alternatives &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                    Define the initial alternative candidates for evaluation:
                  </p>

                  {formData.initial_alternatives.map((alt, idx) => (
                    <div key={idx} style={styles.wizardAltCard}>
                      <div style={{ fontWeight: "700", fontSize: "13px", color: "#7c3aed", marginBottom: "6px" }}>
                        Alternative {idx + 1}
                      </div>
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="Option Title"
                        value={alt.title}
                        onChange={(e) => {
                          const updated = [...formData.initial_alternatives];
                          updated[idx].title = e.target.value;
                          setFormData({ ...formData, initial_alternatives: updated });
                        }}
                        required
                      />
                      <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        <textarea
                          style={{ ...styles.textarea, flex: 1 }}
                          rows={2}
                          placeholder="Pros (one per line)"
                          value={alt.pros}
                          onChange={(e) => {
                            const updated = [...formData.initial_alternatives];
                            updated[idx].pros = e.target.value;
                            setFormData({ ...formData, initial_alternatives: updated });
                          }}
                        />
                        <textarea
                          style={{ ...styles.textarea, flex: 1 }}
                          rows={2}
                          placeholder="Cons (one per line)"
                          value={alt.cons}
                          onChange={(e) => {
                            const updated = [...formData.initial_alternatives];
                            updated[idx].cons = e.target.value;
                            setFormData({ ...formData, initial_alternatives: updated });
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        <input
                          type="text"
                          style={{ ...styles.input, flex: 1 }}
                          placeholder="Cost Estimate (e.g. $4,000/mo)"
                          value={alt.cost_estimate}
                          onChange={(e) => {
                            const updated = [...formData.initial_alternatives];
                            updated[idx].cost_estimate = e.target.value;
                            setFormData({ ...formData, initial_alternatives: updated });
                          }}
                        />
                        <select
                          style={{ ...styles.select, width: "130px" }}
                          value={alt.risk_level}
                          onChange={(e) => {
                            const updated = [...formData.initial_alternatives];
                            updated[idx].risk_level = e.target.value;
                            setFormData({ ...formData, initial_alternatives: updated });
                          }}
                        >
                          <option value="Low">Low Risk</option>
                          <option value="Medium">Medium Risk</option>
                          <option value="High">High Risk</option>
                          <option value="Critical">Critical Risk</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                    <button
                      type="button"
                      style={styles.cancelBtn}
                      onClick={() => setCreateStep(1)}
                    >
                      &larr; Back
                    </button>
                    <button type="submit" style={styles.primaryBtn}>
                      Create Decision
                    </button>
                  </div>
                </div>
              )}
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
    gap: "22px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
    letterSpacing: "-0.4px",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: "4px 0 0 0",
    lineHeight: "1.5",
  },
  createBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "var(--primary)",
    color: "var(--on-primary)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontWeight: "600",
    fontSize: "13.5px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(103, 80, 164, 0.28)",
    transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    backgroundColor: "var(--bg-surface)",
    padding: "14px 20px",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-card)",
  },
  statusPills: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  statusBtn: {
    padding: "8px 16px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--border-subtle)",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
    fontFamily: "var(--font-sans)",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 16px",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--bg-surface-container)",
    width: "240px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "13.5px",
    width: "100%",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
  },
  select: {
    padding: "8px 16px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--border-subtle)",
    fontSize: "13px",
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-surface-container)",
    outline: "none",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  decisionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  decisionCard: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    padding: "22px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    cursor: "pointer",
    transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
    boxShadow: "var(--shadow-card)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: "var(--radius-full)",
    border: "1px solid",
    fontSize: "11.5px",
    fontWeight: "600",
  },
  categoryBadge: {
    padding: "3px 10px",
    backgroundColor: "var(--secondary-container)",
    color: "var(--on-secondary-container)",
    borderRadius: "var(--radius-full)",
    fontSize: "11.5px",
    fontWeight: "600",
  },
  versionBadge: {
    padding: "3px 9px",
    backgroundColor: "var(--tertiary-container)",
    color: "var(--on-tertiary-container)",
    borderRadius: "var(--radius-full)",
    fontSize: "11.5px",
    fontWeight: "600",
  },
  priorityBadge: {
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--text-muted)",
  },
  decisionTitle: {
    fontSize: "17px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
    letterSpacing: "-0.2px",
  },
  decisionProblem: {
    fontSize: "13.5px",
    color: "var(--text-secondary)",
    lineHeight: 1.55,
    margin: 0,
  },
  rationaleSnippet: {
    fontSize: "12.5px",
    color: "var(--on-primary-container)",
    backgroundColor: "var(--primary-container)",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    borderLeft: "3px solid var(--primary)",
  },
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid var(--border-subtle)",
    paddingTop: "14px",
    marginTop: "4px",
    flexWrap: "wrap",
    gap: "10px",
  },
  authorMeta: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12.5px",
    color: "var(--text-secondary)",
  },
  cardStats: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    fontSize: "12.5px",
    color: "var(--text-secondary)",
  },
  replayBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "var(--primary-container)",
    border: "none",
    color: "var(--on-primary-container)",
    fontWeight: "600",
    fontSize: "12.5px",
    cursor: "pointer",
    padding: "6px 14px",
    borderRadius: "var(--radius-full)",
    transition: "all 0.15s ease",
  },
  emptyCard: {
    padding: "64px 24px",
    textAlign: "center",
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-xl)",
    border: "1px dashed var(--border-subtle)",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  detailModal: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-2xl)",
    width: "100%",
    maxWidth: "960px",
    maxHeight: "90vh",
    boxShadow: "var(--shadow-xl)",
    border: "1px solid var(--border-subtle)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface)",
  },
  detailTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
  },
  teamTag: {
    fontSize: "11.5px",
    color: "var(--on-secondary-container)",
    backgroundColor: "var(--secondary-container)",
    padding: "3px 10px",
    borderRadius: "var(--radius-full)",
    border: "none",
    fontWeight: "600",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    padding: "6px",
    borderRadius: "var(--radius-full)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  workflowBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    backgroundColor: "var(--bg-surface-container-low)",
    borderBottom: "1px solid var(--border-subtle)",
  },
  wfActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--border-subtle)",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
  },
  detailTabs: {
    display: "flex",
    gap: "20px",
    padding: "0 24px",
    borderBottom: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface)",
  },
  detailTabBtn: {
    background: "none",
    border: "none",
    padding: "14px 4px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  detailBody: {
    padding: "24px",
    overflowY: "auto",
    flex: 1,
    backgroundColor: "var(--bg-surface)",
  },
  sectionHeader: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 6px 0",
  },
  paragraph: {
    fontSize: "14px",
    color: "var(--text-primary)",
    lineHeight: 1.6,
    margin: 0,
  },
  rationaleCard: {
    backgroundColor: "var(--primary-container)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    padding: "16px 20px",
  },
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    backgroundColor: "var(--bg-surface-container)",
    padding: "16px",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    marginTop: "8px",
  },
  metaLabel: {
    display: "block",
    fontSize: "11.5px",
    color: "var(--text-muted)",
  },
  metaVal: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  toggleMeetingBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    backgroundColor: "rgba(22, 163, 74, 0.12)",
    color: "#15803D",
    border: "1px solid rgba(22, 163, 74, 0.25)",
    borderRadius: "var(--radius-full)",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  meetingForm: {
    backgroundColor: "var(--bg-surface-container)",
    padding: "18px",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
  },
  commentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  commentCard: {
    padding: "16px 18px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface-container)",
  },
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  commentAuthor: {
    fontWeight: "600",
    fontSize: "14px",
    color: "var(--text-primary)",
  },
  meetingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    backgroundColor: "rgba(22, 163, 74, 0.12)",
    color: "#15803D",
    borderRadius: "var(--radius-full)",
    fontSize: "11px",
    fontWeight: "600",
  },
  commentDate: {
    fontSize: "11.5px",
    color: "var(--text-muted)",
  },
  attendeesRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12.5px",
    color: "#15803D",
    marginBottom: "6px",
  },
  commentContent: {
    fontSize: "13.5px",
    color: "var(--text-primary)",
    lineHeight: 1.5,
    margin: 0,
  },
  commentInputRow: {
    display: "flex",
    gap: "10px",
  },
  commentInput: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface-container)",
    color: "var(--text-primary)",
    fontSize: "13.5px",
    outline: "none",
    fontFamily: "var(--font-sans)",
  },
  commentSendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 20px",
    backgroundColor: "var(--primary)",
    color: "var(--on-primary)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(103, 80, 164, 0.28)",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "relative",
    paddingLeft: "10px",
  },
  timelineItem: {
    display: "flex",
    gap: "16px",
  },
  timelineDot: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--primary)",
    color: "var(--on-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: "var(--bg-surface-container)",
    padding: "16px",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
  },
  timelineHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  timelineTitle: {
    fontWeight: "600",
    fontSize: "14px",
    color: "var(--text-primary)",
  },
  timelineDate: {
    fontSize: "11.5px",
    color: "var(--text-muted)",
  },
  timelineSummary: {
    fontSize: "13.5px",
    color: "var(--text-primary)",
    margin: "4px 0",
  },
  timelineAuthor: {
    fontSize: "11.5px",
    color: "var(--text-secondary)",
  },
  docItemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    backgroundColor: "var(--bg-surface-container)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
  },
  downloadDocBtn: {
    padding: "6px 14px",
    backgroundColor: "var(--primary-container)",
    color: "var(--on-primary-container)",
    borderRadius: "var(--radius-full)",
    fontSize: "12.5px",
    fontWeight: "600",
    textDecoration: "none",
    border: "none",
  },
  inputLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    marginBottom: "6px",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface-container)",
    color: "var(--text-primary)",
    fontSize: "13.5px",
    boxSizing: "border-box",
    fontFamily: "var(--font-sans)",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface-container)",
    color: "var(--text-primary)",
    fontSize: "13.5px",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "var(--font-sans)",
  },
  cancelBtn: {
    padding: "8px 18px",
    backgroundColor: "var(--bg-surface-container)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-full)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: "9px 20px",
    backgroundColor: "var(--primary)",
    color: "var(--on-primary)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(103, 80, 164, 0.28)",
  },
  wizardAltCard: {
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    padding: "16px",
  },
  stepperContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    backgroundColor: "var(--bg-surface-container)",
    borderBottom: "1px solid var(--border-outline-variant)",
    gap: "12px",
    overflowX: "auto",
  },
  stepperItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: "150px",
  },
  stepCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    flexShrink: 0,
  },
  stepperLine: {
    flex: 1,
    height: "2px",
    borderRadius: "1px",
    marginLeft: "8px",
  },
  workflowBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    backgroundColor: "var(--bg-surface-container-low)",
    borderBottom: "1px solid var(--border-outline-variant)",
    flexWrap: "wrap",
    gap: "10px",
  },
  wfActionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    borderRadius: "var(--radius-full)",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "all 0.15s ease",
  },
  workflowSummaryCard: {
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    padding: "18px 20px",
  },
  workflowDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid var(--border-subtle)",
  },
};

export default DecisionsHub;
