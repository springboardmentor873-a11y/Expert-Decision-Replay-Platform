import React, { useState } from "react";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  UserPlus,
  CheckCircle2,
  X,
  ShieldCheck,
  Building2
} from "lucide-react";

const AVATAR_COLORS = ["#7c3aed", "#9333ea", "#6d28d9", "#8b5cf6", "#a855f7", "#7e22ce", "#5b21b6", "#0891b2"];

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function MemberAvatar({ name, size = 26, overlap = true, ringed = true }) {
  return (
    <div
      title={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: avatarColor(name),
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.max(10, size * 0.38)}px`,
        fontWeight: "700",
        flexShrink: 0,
        border: ringed ? "2px solid #ffffff" : "none",
        marginLeft: overlap ? "-8px" : 0,
        boxShadow: "0 0 0 1px rgba(124, 58, 237, 0.08)"
      }}
    >
      {getInitials(name)}
    </div>
  );
}

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
      lead: "Alex Vance",
      createdDate: "Aug 2025",
      members: [
        { name: "Alex Vance", role: "Product Manager" },
        { name: "Priya Nair", role: "Product Designer" },
        { name: "Rahul Sharma", role: "Frontend Engineer" },
        { name: "Wei Zhang", role: "Backend Engineer" },
        { name: "Sofia Martins", role: "UX Researcher" },
        { name: "Tom Baker", role: "QA Engineer" }
      ],
      recentDecisions: [
        { title: "Implement AI-based support bot", timeAgo: "2 days ago" },
        { title: "Frontend framework selection", timeAgo: "1 week ago" }
      ]
    },
    {
      id: 6,
      name: "AI Research Team",
      description: "Evaluating foundation models, vector embeddings, and RAG pipelines.",
      lead: "Dr. Aris Vance",
      createdDate: "Jul 2025",
      members: [
        { name: "Dr. Aris Vance", role: "Research Scientist" },
        { name: "Mei Lin", role: "ML Engineer" },
        { name: "Daniel Osei", role: "NLP Researcher" },
        { name: "Ana Petrova", role: "Data Scientist" }
      ],
      recentDecisions: [
        { title: "Evaluate LLM providers & latency", timeAgo: "3 days ago" },
        { title: "Data privacy & zero-retention API", timeAgo: "1 week ago" }
      ]
    },
    {
      id: 7,
      name: "Engineering Team",
      description: "Building scalable backend services, microservices, and CI/CD pipelines.",
      lead: "Marcus Chen",
      createdDate: "May 2025",
      members: [
        { name: "Marcus Chen", role: "Engineering Manager" },
        { name: "Liam O'Connor", role: "Backend Engineer" },
        { name: "Yuki Tanaka", role: "DevOps Engineer" },
        { name: "Grace Kim", role: "Backend Engineer" },
        { name: "Noah Fischer", role: "Platform Engineer" }
      ],
      recentDecisions: [
        { title: "Adopt new cloud infrastructure", timeAgo: "4 days ago" },
        { title: "Database architecture migration", timeAgo: "1 week ago" }
      ]
    },
    {
      id: 8,
      name: "Data & Analytics Team",
      description: "Managing data warehousing, vector stores, and analytics pipelines.",
      lead: "Sarah Jenkins",
      createdDate: "Jun 2025",
      members: [
        { name: "Sarah Jenkins", role: "Analytics Manager" },
        { name: "Omar Haddad", role: "Data Engineer" },
        { name: "Chloe Dubois", role: "BI Analyst" },
        { name: "Ivan Petrov", role: "Data Engineer" }
      ],
      recentDecisions: [
        { title: "Data retention policy update", timeAgo: "5 days ago" },
        { title: "Vector database indexing strategy", timeAgo: "1 week ago" }
      ]
    },
    {
      id: 9,
      name: "Compliance & Security",
      description: "Ensuring regulatory compliance, SOC2, GDPR, and security verification.",
      lead: "Elena Rostova",
      createdDate: "Mar 2025",
      members: [
        { name: "Elena Rostova", role: "Compliance Officer" },
        { name: "James Whitfield", role: "Security Engineer" },
        { name: "Nadia Rahman", role: "Risk Analyst" }
      ],
      recentDecisions: [
        { title: "Access control policy update", timeAgo: "6 days ago" },
        { title: "Cryptographic erasure workflow", timeAgo: "2 weeks ago" }
      ]
    }
  ];

  const totalMembers = teamsData.reduce((sum, t) => sum + t.members.length, 0);

  const filteredTeams = teamsData
    .filter((t) => {
      if (activeTab === "archived") return false;
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.members.some((m) => m.name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "members") return b.members.length - a.members.length;
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

      {/* Summary strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px"
        }}
      >
        {[
          { icon: Building2, label: "Active Teams", value: teamsData.length },
          { icon: Users, label: "Total Members", value: totalMembers },
          { icon: ShieldCheck, label: "Review Coverage", value: "100%" },
          { icon: CheckCircle2, label: "Audit Ledger", value: "Synced" }
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#ffffff",
              border: "1px solid #ede7f6",
              borderRadius: "8px",
              padding: "12px 14px"
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "7px",
                backgroundColor: "#f5f0fb",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <stat.icon size={16} />
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#1e1438", lineHeight: 1.2 }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>{stat.label}</div>
            </div>
          </div>
        ))}
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
              placeholder="Search teams or members..."
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

      {/* Grid of Team Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "14px"
        }}
      >
        {activeTab === "active" ? (
          filteredTeams.length ? (
            filteredTeams.map((team) => {
              const visibleMembers = team.members.slice(0, 5);
              const overflowCount = team.members.length - visibleMembers.length;
              return (
                <div
                  key={team.id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #ede7f6",
                    borderRadius: "10px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 3px rgba(124, 58, 237, 0.04)",
                    transition: "box-shadow 0.15s ease"
                  }}
                >
                  <div>
                    {/* Card Top: Avatar and Name */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            backgroundColor: "#f5f0fb",
                            color: "#7c3aed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          <Users size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e1438", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {team.name}
                          </h3>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "#059669"
                            }}
                          >
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                            Active
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
                          padding: "2px",
                          flexShrink: 0
                        }}
                        onClick={() => setSelectedTeamModal(team)}
                        aria-label={`Open ${team.name} details`}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    {/* Description */}
                    <p style={{ margin: "0 0 14px 0", fontSize: "12.5px", color: "#4b5563", lineHeight: 1.45, minHeight: "36px" }}>
                      {team.description}
                    </p>

                    {/* Members */}
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#7c3aed", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.03em" }}>
                        Team Members
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {visibleMembers.map((m) => (
                          <MemberAvatar key={m.name} name={m.name} />
                        ))}
                        {overflowCount > 0 && (
                          <div
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              backgroundColor: "#ede7f6",
                              color: "#6b21a8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10.5px",
                              fontWeight: "700",
                              border: "2px solid #ffffff",
                              marginLeft: "-8px"
                            }}
                          >
                            +{overflowCount}
                          </div>
                        )}
                        <span style={{ marginLeft: "10px", fontSize: "11.5px", color: "#6b7280" }}>
                          {team.members.length} total &bull; led by {team.lead}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Team Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedTeamModal(team)}
                    style={{
                      width: "100%",
                      padding: "7px 0",
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
              );
            })
          ) : (
            <div style={{ gridColumn: "1 / -1", padding: "30px", textAlign: "center", color: "#6b7280" }}>
              No teams match "{searchQuery}".
            </div>
          )
        ) : (
          <div style={{ gridColumn: "1 / -1", padding: "30px", textAlign: "center", color: "#6b7280" }}>
            No archived teams at this time. All {teamsData.length} working groups are active.
          </div>
        )}
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
                    {teamsData.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
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
              maxWidth: "520px",
              maxHeight: "85vh",
              overflowY: "auto",
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
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <h2 style={{ margin: "0 0 2px 0", fontSize: "17px", fontWeight: "700", color: "#1e1438" }}>
                    {selectedTeamModal.name}
                  </h2>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {selectedTeamModal.members.length} Members &bull; Est. {selectedTeamModal.createdDate}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTeamModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              {selectedTeamModal.description}
            </p>

            {/* Members List */}
            <div style={{ borderTop: "1px solid #f5f0fb", paddingTop: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#1e1438", marginBottom: "8px" }}>
                Members
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedTeamModal.members.map((m) => {
                  const isLead = m.name === selectedTeamModal.lead;
                  return (
                    <div
                      key={m.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        backgroundColor: "#faf7fd",
                        borderRadius: "6px",
                        border: "1px solid #ede7f6"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <MemberAvatar name={m.name} size={30} overlap={false} ringed={false} />
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e1438" }}>{m.name}</div>
                          <div style={{ fontSize: "11.5px", color: "#6b7280" }}>{m.role}</div>
                        </div>
                      </div>
                      {isLead && (
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: "700",
                            color: "#7c3aed",
                            backgroundColor: "#f5f0fb",
                            border: "1px solid #ddd6fe",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em"
                          }}
                        >
                          Lead
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Decisions */}
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setJoinTeamName(selectedTeamModal.name);
                  setSelectedTeamModal(null);
                  setShowJoinModal(true);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  backgroundColor: "#f5f0fb",
                  border: "1px solid #ddd6fe",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#7c3aed",
                  cursor: "pointer"
                }}
              >
                <UserPlus size={14} />
                Join Team
              </button>
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
