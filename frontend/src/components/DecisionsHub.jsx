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
  RotateCcw
} from "lucide-react";
import AlternativeComparisonMatrix from "./AlternativeComparisonMatrix";

function DecisionsHub({ user, apiBase = "http://127.0.0.1:8000" }) {
  const [decisions, setDecisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("overview"); // overview | alternatives | discussion | versions | documents

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
    } catch (e) {
      console.error(e);
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
        return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", icon: Clock };
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
                  backgroundColor: isActive ? "#2563eb" : "#ffffff",
                  color: isActive ? "#ffffff" : "#475569",
                  borderColor: isActive ? "#2563eb" : "#e2e8f0",
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
            <FileText size={48} color="#cbd5e1" />
            <h3 style={{ margin: "12px 0 4px 0", color: "#334155" }}>No Decisions Found</h3>
            <p style={{ color: "#64748b", fontSize: "13px" }}>
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

            {/* Workflow Action Bar */}
            <div style={styles.workflowBar}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                  Status Workflow:
                </span>
                {selectedDecision.status === "Draft" && (
                  <button
                    style={{ ...styles.wfActionBtn, backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
                    onClick={() => handleStatusUpdate("Under Review")}
                  >
                    <Clock size={13} /> Submit for Review
                  </button>
                )}
                {selectedDecision.status === "Under Review" && (
                  <>
                    <button
                      style={{ ...styles.wfActionBtn, backgroundColor: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}
                      onClick={() => handleStatusUpdate("Approved")}
                    >
                      <CheckCircle size={13} /> Approve Decision
                    </button>
                    <button
                      style={{ ...styles.wfActionBtn, backgroundColor: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }}
                      onClick={() => handleStatusUpdate("Rejected")}
                    >
                      <AlertCircle size={13} /> Reject Decision
                    </button>
                  </>
                )}
                {selectedDecision.status !== "Archived" && (
                  <button
                    style={{ ...styles.wfActionBtn, backgroundColor: "#f8fafc", color: "#64748b", borderColor: "#cbd5e1" }}
                    onClick={() => handleStatusUpdate("Archived")}
                  >
                    <Archive size={13} /> Archive
                  </button>
                )}
                {selectedDecision.status === "Archived" && (
                  <button
                    style={{ ...styles.wfActionBtn, backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
                    onClick={() => handleStatusUpdate("Draft")}
                  >
                    <RotateCcw size={13} /> Re-open Draft
                  </button>
                )}
              </div>
            </div>

            {/* Detail Tabs */}
            <div style={styles.detailTabs}>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "overview" ? "2px solid #2563eb" : "none",
                  color: activeDetailTab === "overview" ? "#2563eb" : "#64748b",
                  fontWeight: activeDetailTab === "overview" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("overview")}
              >
                Overview & Context
              </button>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "alternatives" ? "2px solid #2563eb" : "none",
                  color: activeDetailTab === "alternatives" ? "#2563eb" : "#64748b",
                  fontWeight: activeDetailTab === "alternatives" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("alternatives")}
              >
                Alternative Comparison ({selectedDecision.alternatives?.length || 0})
              </button>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "discussion" ? "2px solid #2563eb" : "none",
                  color: activeDetailTab === "discussion" ? "#2563eb" : "#64748b",
                  fontWeight: activeDetailTab === "discussion" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("discussion")}
              >
                Discussions & Meeting Notes ({selectedDecision.comments?.length || 0})
              </button>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "versions" ? "2px solid #2563eb" : "none",
                  color: activeDetailTab === "versions" ? "#2563eb" : "#64748b",
                  fontWeight: activeDetailTab === "versions" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("versions")}
              >
                Version History ({selectedDecision.versions?.length || 0})
              </button>
              <button
                style={{
                  ...styles.detailTabBtn,
                  borderBottom: activeDetailTab === "documents" ? "2px solid #2563eb" : "none",
                  color: activeDetailTab === "documents" ? "#2563eb" : "#64748b",
                  fontWeight: activeDetailTab === "documents" ? "600" : "500",
                }}
                onClick={() => setActiveDetailTab("documents")}
              >
                Supporting Documents ({selectedDecision.documents?.length || 0})
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
                      <h4 style={{ ...styles.sectionHeader, color: "#1e40af", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle size={16} /> Official Decision Rationale
                      </h4>
                      <p style={{ ...styles.paragraph, color: "#1e3a8a" }}>
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
                    <h4 style={{ margin: 0, fontSize: "15px", color: "#0f172a" }}>Stakeholder Discussion & Minutes</h4>
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
                      <h5 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>Record Formal Meeting Note</h5>
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
                  <h4 style={{ margin: 0, fontSize: "15px", color: "#0f172a" }}>Audit History & Decision Replay</h4>
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
                  <h4 style={{ margin: 0, fontSize: "15px", color: "#0f172a" }}>Attached Technical Files</h4>
                  {selectedDecision.documents?.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "13px" }}>No documents linked to this decision.</p>
                  ) : (
                    selectedDecision.documents?.map((doc) => (
                      <div key={doc.id} style={styles.docItemRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={20} color="#2563eb" />
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
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
                      <div style={{ fontWeight: "700", fontSize: "13px", color: "#2563eb", marginBottom: "6px" }}>
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
    gap: "20px",
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
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  createBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(37, 99, 235, 0.3)",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    backgroundColor: "#ffffff",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  statusPills: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  statusBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#f8fafc",
    width: "220px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "13px",
    width: "100%",
  },
  select: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#334155",
    backgroundColor: "#ffffff",
    outline: "none",
  },
  decisionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  decisionCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    borderRadius: "4px",
    border: "1px solid",
    fontSize: "11px",
    fontWeight: "700",
  },
  categoryBadge: {
    padding: "3px 8px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
  },
  versionBadge: {
    padding: "3px 7px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
  },
  priorityBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
  },
  decisionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  decisionProblem: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: 1.5,
    margin: 0,
  },
  rationaleSnippet: {
    fontSize: "12px",
    color: "#1e40af",
    backgroundColor: "#eff6ff",
    padding: "8px 12px",
    borderRadius: "6px",
    borderLeft: "3px solid #2563eb",
  },
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px",
    marginTop: "4px",
    flexWrap: "wrap",
    gap: "10px",
  },
  authorMeta: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748b",
  },
  cardStats: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    fontSize: "12px",
    color: "#64748b",
  },
  replayBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "none",
    border: "none",
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  emptyCard: {
    padding: "60px",
    textAlign: "center",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  detailModal: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "960px",
    maxHeight: "90vh",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: "1px solid #f1f5f9",
  },
  detailTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  teamTag: {
    fontSize: "11px",
    color: "#64748b",
    backgroundColor: "#f8fafc",
    padding: "2px 8px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "4px",
    display: "flex",
  },
  workflowBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 24px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  wfActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  detailTabs: {
    display: "flex",
    gap: "20px",
    padding: "0 24px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  detailTabBtn: {
    background: "none",
    border: "none",
    padding: "14px 4px",
    fontSize: "13px",
    cursor: "pointer",
  },
  detailBody: {
    padding: "24px",
    overflowY: "auto",
    flex: 1,
  },
  sectionHeader: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 6px 0",
  },
  paragraph: {
    fontSize: "14px",
    color: "#334155",
    lineHeight: 1.6,
    margin: 0,
  },
  rationaleCard: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "16px",
  },
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    backgroundColor: "#f8fafc",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    marginTop: "8px",
  },
  metaLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
  },
  metaVal: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  toggleMeetingBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 12px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  meetingForm: {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  commentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  commentCard: {
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid",
  },
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  commentAuthor: {
    fontWeight: "700",
    fontSize: "13px",
    color: "#0f172a",
  },
  meetingBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 6px",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
  },
  commentDate: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  attendeesRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#065f46",
    marginBottom: "6px",
  },
  commentContent: {
    fontSize: "13px",
    color: "#334155",
    lineHeight: 1.4,
    margin: 0,
  },
  commentInputRow: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  commentInput: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    outline: "none",
  },
  commentSendBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 18px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
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
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  timelineHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  timelineTitle: {
    fontWeight: "700",
    fontSize: "13px",
    color: "#0f172a",
  },
  timelineDate: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  timelineSummary: {
    fontSize: "13px",
    color: "#334155",
    margin: "4px 0",
  },
  timelineAuthor: {
    fontSize: "11px",
    color: "#64748b",
  },
  docItemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  downloadDocBtn: {
    padding: "6px 12px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    textDecoration: "none",
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
    padding: "9px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "9px 12px",
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
  wizardAltCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "14px",
  },
};

export default DecisionsHub;
