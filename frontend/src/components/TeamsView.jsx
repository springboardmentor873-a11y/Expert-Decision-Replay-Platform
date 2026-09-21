import React, { useState } from "react";
import {
  Users,
  Plus,
  Search,
  ChevronRight,
  MoreHorizontal,
  MessageSquare,
  FileText,
  UserPlus,
  CheckCircle2,
  X,
  ShieldCheck,
  Building2
} from "lucide-react";

export default function TeamsView({ user, apiBase = "http://127.0.0.1:8000", onSelectDecision }) {
  const [activeTab, setActiveTab] = useState("active"); // "active" | "archived"
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);
  const [joinTeamName, setJoinTeamName] = useState("Product Team");
  const [joinRole, setJoinRole] = useState("Contributor");
  const [joinSuccess, setJoinSuccess] = useState("");

  const teamsData = [
    {
      id: 5,
      name: "Product Team",
      description: "Driving product roadmaps, UX architecture, and customer workflow decisions.",
      status: "Active",
      membersCount: 6,
      avatarBg: "#7c3aed",
      lead: "Alex Vance",
      createdDate: "Aug 2025",
      recentDecisions: [
        { title: "Implement AI-based support bot", timeAgo: "2 days ago" },
        { title: "Frontend framework selection", timeAgo: "1 week ago" }
      ]
    },
    {
      id: 6,
      name: "AI Research Team",
      description: "Evaluating foundation models, vector embeddings, and RAG pipelines.",
      status: "Active",
      membersCount: 4,
      avatarBg: "#8b5cf6",
      lead: "Dr. Aris Vance",
      createdDate: "Jul 2025",
      recentDecisions: [
        { title: "Evaluate LLM providers & latency", timeAgo: "3 days ago" },
        { title: "Data privacy & zero-retention API", timeAgo: "1 week ago" }
      ]
    },
    {
      id: 7,
      name: "Engineering Team",
      description: "Building scalable backend services, microservices, and CI/CD pipelines.",
      status: "Active",
      membersCount: 5,
      avatarBg: "#6d28d9",
      lead: "Marcus Chen",
      createdDate: "May 2025",
      recentDecisions: [
        { title: "Adopt new cloud infrastructure", timeAgo: "4 days ago" },
        { title: "Database architecture migration", timeAgo: "1 week ago" }
      ]
    },
    {
      id: 8,
      name: "Data & Analytics Team",
      description: "Managing data warehousing, vector stores, and analytics pipelines.",
      status: "Active",
      membersCount: 4,
      avatarBg: "#9333ea",
      lead: "Sarah Jenkins",
      createdDate: "Jun 2025",
      recentDecisions: [
        { title: "Data retention policy update", timeAgo: "5 days ago" },
        { title: "Vector database indexing strategy", timeAgo: "1 week ago" }
      ]
    },
    {
      id: 9,
      name: "Compliance & Security",
      description: "Ensuring regulatory compliance, SOC2, GDPR, and security verification.",
      status: "Active",
      membersCount: 3,
      avatarBg: "#7e22ce",
      lead: "Elena Rostova",
      createdDate: "Mar 2025",
      recentDecisions: [
        { title: "Access control policy update", timeAgo: "6 days ago" },
        { title: "Cryptographic erasure workflow", timeAgo: "2 weeks ago" }
      ]
    }
  ];

  const filteredTeams = teamsData
    .filter((t) => {
      if (activeTab === "archived") return false;
      return (
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "members") return b.membersCount - a.membersCount;
      return 0;
    });

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setJoinSuccess(`Request to join "${joinTeamName}" submitted for approval.`);
    setTimeout(() => {
      setJoinSuccess("");
      setShowJoinModal(false);
    }, 1800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "700", color: "#1e1438" }}>
            Teams & Working Groups
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
            Cross-functional working groups governing decisions and technical standards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowJoinModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#7c3aed",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "7px 14px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(124, 58, 237, 0.2)",
            transition: "background 0.15s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6d28d9")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7c3aed")}
        >
          <Plus size={16} />
          <span>Join Team</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "#ffffff",
          border: "1px solid #ede7f6",
          borderRadius: "8px",
          padding: "10px 14px"
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              border: "none",
              fontSize: "12.5px",
              fontWeight: activeTab === "active" ? "600" : "500",
              backgroundColor: activeTab === "active" ? "#7c3aed" : "transparent",
              color: activeTab === "active" ? "#ffffff" : "#6b21a8",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            Active Teams ({teamsData.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              border: "none",
              fontSize: "12.5px",
              fontWeight: activeTab === "archived" ? "600" : "500",
              backgroundColor: activeTab === "archived" ? "#7c3aed" : "transparent",
              color: activeTab === "archived" ? "#ffffff" : "#6b21a8",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            Archived (0)
          </button>
        </div>

        {/* Search and Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#faf7fd",
              border: "1px solid #ede7f6",
              borderRadius: "6px",
              padding: "5px 10px",
              width: "220px"
            }}
          >
            <Search size={14} color="#7c3aed" />
            <input
              type="text"
              placeholder="Filter teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "12.5px",
                width: "100%",
                color: "#1e1438",
                backgroundColor: "transparent"
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#faf7fd",
              border: "1px solid #ede7f6",
              borderRadius: "6px",
              padding: "5px 10px",
              fontSize: "12.5px"
            }}
          >
            <span style={{ color: "#7c3aed", fontWeight: "500" }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                fontSize: "12.5px",
                fontWeight: "600",
                color: "#1e1438",
                cursor: "pointer"
              }}
            >
              <option value="name">Name</option>
              <option value="members">Members</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Clean Team Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "14px"
        }}
      >
        {activeTab === "active" ? (
          <>
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #ede7f6",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(124, 58, 237, 0.04)",
                  transition: "box-shadow 0.15s ease"
                }}
              >
                <div>
                  {/* Card Top: Avatar and Lead Info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: "#f5f0fb",
                          color: "#7c3aed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Users size={18} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e1438" }}>
                          {team.name}
                        </h3>
                        <span style={{ fontSize: "11.5px", color: "#6b7280" }}>
                          Lead: {team.lead}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#7c3aed",
                        padding: "2px"
                      }}
                      onClick={() => setSelectedTeamModal(team)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Description */}
                  <p style={{ margin: "0 0 12px 0", fontSize: "12.5px", color: "#4b5563", lineHeight: 1.45, minHeight: "36px" }}>
                    {team.description}
                  </p>

                  {/* Meta pill row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: "#ecfdf5",
                        color: "#059669",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11.5px",
                        fontWeight: "600"
                      }}
                    >
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                      Active
                    </span>
                    <span
                      style={{
                        backgroundColor: "#f5f0fb",
                        color: "#7c3aed",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11.5px",
                        fontWeight: "600"
                      }}
                    >
                      {team.membersCount} members
                    </span>
                  </div>

                  {/* Recent Decisions */}
                  <div style={{ borderTop: "1px solid #f5f0fb", paddingTop: "10px", marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#7c3aed", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.03em" }}>
                      Recent Decisions
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {team.recentDecisions.map((dec, idx) => (
                        <div
                          key={idx}
                          onClick={() => onSelectDecision && onSelectDecision(dec.title)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            color: "#374151",
                            padding: "4px 6px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            backgroundColor: "#faf7fd"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <FileText size={13} color="#7c3aed" style={{ flexShrink: 0 }} />
                            <span style={{ fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis" }}>{dec.title}</span>
                          </div>
                          <span style={{ fontSize: "11px", color: "#6b7280", flexShrink: 0 }}>{dec.timeAgo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* View Team Button */}
                <button
                  type="button"
                  onClick={() => setSelectedTeamModal(team)}
                  style={{
                    width: "100%",
                    padding: "6px 0",
                    backgroundColor: "#f5f0fb",
                    border: "1px solid #ddd6fe",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    color: "#7c3aed",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "center"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ede7f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f0fb";
                  }}
                >
                  View Team Details
                </button>
              </div>
            ))}
          </>
        ) : (
          <div style={{ gridColumn: "1 / -1", padding: "30px", textAlign: "center", color: "#6b7280" }}>
            No archived teams at this time. All 5 working groups are active.
          </div>
        )}
      </div>

      {/* Clean Bottom Overview Strip: Activity & Governance */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: "14px"
        }}
      >
        {/* Recent Team Updates */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #ede7f6",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 1px 3px rgba(124, 58, 237, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#1e1438" }}>
              Recent Team Activity
            </h3>
            <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#7c3aed" }}>
              Live updates
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: "#f5f0fb", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MessageSquare size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "600", color: "#1e1438" }}>Rahul Sharma</span> commented on "Cloud infrastructure upgrade"
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Product Team &bull; 2 hours ago</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle2 size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "600", color: "#1e1438" }}>Dr. Aris Vance</span> completed evaluation for "Evaluate LLM providers"
                <div style={{ fontSize: "11px", color: "#6b7280" }}>AI Research Team &bull; 1 day ago</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: "#f5f0fb", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <UserPlus size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "600", color: "#1e1438" }}>Elena Rostova</span> assigned reviewer roles in Compliance & Security
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Compliance & Security &bull; 2 days ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Governance Status */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #ede7f6",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(124, 58, 237, 0.04)"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <ShieldCheck size={16} color="#7c3aed" />
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e1438" }}>Governance Metrics</span>
            </div>
            <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#6b7280", lineHeight: 1.4 }}>
              Active departments maintain structured peer evaluations and cryptographic audit logs.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280" }}>Active Departments:</span>
              <span style={{ fontWeight: "700", color: "#1e1438" }}>5 Working Groups</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280" }}>Review Coverage:</span>
              <span style={{ fontWeight: "700", color: "#059669" }}>100% Policy Verified</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280" }}>Audit Ledger State:</span>
              <span style={{ fontWeight: "700", color: "#7c3aed" }}>Synchronized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Join Team Modal */}
      {showJoinModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(24, 17, 38, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "460px",
              padding: "22px",
              boxShadow: "0 12px 24px rgba(124, 58, 237, 0.12)",
              border: "1px solid #ede7f6"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#1e1438" }}>
                Join an Existing Team
              </h2>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed" }}
              >
                <X size={18} />
              </button>
            </div>

            {joinSuccess ? (
              <div style={{ padding: "14px", backgroundColor: "#ecfdf5", color: "#059669", borderRadius: "6px", fontSize: "13.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={16} />
                <span>{joinSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#4b5563", marginBottom: "5px" }}>
                    Select Team
                  </label>
                  <select
                    value={joinTeamName}
                    onChange={(e) => setJoinTeamName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #ddd6fe",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#faf7fd"
                    }}
                  >
                    <option value="Product Team">Product Team</option>
                    <option value="AI Research Team">AI Research Team</option>
                    <option value="Engineering Team">Engineering Team</option>
                    <option value="Data & Analytics Team">Data & Analytics Team</option>
                    <option value="Compliance & Security">Compliance & Security</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#4b5563", marginBottom: "5px" }}>
                    Your Role in Team
                  </label>
                  <select
                    value={joinRole}
                    onChange={(e) => setJoinRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #ddd6fe",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#faf7fd"
                    }}
                  >
                    <option value="Contributor">Contributor (Author decisions & proposals)</option>
                    <option value="Reviewer">Reviewer (Technical evaluations)</option>
                    <option value="Observer">Observer (Read-only access)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    style={{
                      padding: "7px 14px",
                      backgroundColor: "#f5f0fb",
                      border: "1px solid #ddd6fe",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#6b21a8",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "7px 16px",
                      backgroundColor: "#7c3aed",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#ffffff",
                      cursor: "pointer"
                    }}
                  >
                    Send Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View Team Modal */}
      {selectedTeamModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(24, 17, 38, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
          onClick={() => setSelectedTeamModal(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "500px",
              padding: "22px",
              boxShadow: "0 12px 24px rgba(124, 58, 237, 0.12)",
              border: "1px solid #ede7f6"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "#f5f0fb",
                    color: "#7c3aed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <h2 style={{ margin: "0 0 2px 0", fontSize: "17px", fontWeight: "700", color: "#1e1438" }}>
                    {selectedTeamModal.name}
                  </h2>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    Lead: {selectedTeamModal.lead} &bull; {selectedTeamModal.membersCount} Members
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTeamModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              {selectedTeamModal.description}
            </p>

            <div style={{ borderTop: "1px solid #f5f0fb", paddingTop: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#1e1438", marginBottom: "8px" }}>
                Decisions Governed by this Team
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedTeamModal.recentDecisions.map((dec, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedTeamModal(null);
                      onSelectDecision && onSelectDecision(dec.title);
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      backgroundColor: "#faf7fd",
                      borderRadius: "6px",
                      cursor: "pointer",
                      border: "1px solid #ede7f6"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={14} color="#7c3aed" />
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e1438" }}>{dec.title}</span>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#6b7280" }}>{dec.timeAgo}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSelectedTeamModal(null)}
                style={{
                  padding: "7px 16px",
                  backgroundColor: "#7c3aed",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#ffffff",
                  cursor: "pointer"
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
