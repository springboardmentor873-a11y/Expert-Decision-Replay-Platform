import React, { useMemo, useState } from "react";
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  ArrowRight,
  CalendarDays,
  Activity,
  Archive,
  UserPlus,
  CheckCircle2,
  Clock3,
  MessageSquare,
} from "lucide-react";

const Teams = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [activeTab, setActiveTab] = useState("active");
  const [showJoinModal, setShowJoinModal] = useState(false);

  const teams = [
    {
      id: 1,
      name: "Product Team",
      description:
        "Coordinates product decisions, roadmap planning, and feature priorities.",
      members: 8,
      decisions: 12,
      status: "Active",
      color: "#2563eb",
      recentDecision: "Customer Feedback Prioritization",
    },
    {
      id: 2,
      name: "AI Research Team",
      description:
        "Researches AI technologies and evaluates decisions related to intelligent systems.",
      members: 6,
      decisions: 9,
      status: "Active",
      color: "#7c3aed",
      recentDecision: "AI Model Selection",
    },
    {
      id: 3,
      name: "Engineering Team",
      description:
        "Handles technical architecture, development practices, and engineering decisions.",
      members: 11,
      decisions: 18,
      status: "Active",
      color: "#059669",
      recentDecision: "Backend Architecture Decision",
    },
    {
      id: 4,
      name: "Data & Analytics Team",
      description:
        "Works on data strategy, analytics, reporting, and data-driven decision making.",
      members: 7,
      decisions: 10,
      status: "Active",
      color: "#d97706",
      recentDecision: "Analytics Platform Selection",
    },
    {
      id: 5,
      name: "Compliance Team",
      description:
        "Reviews organizational policies, risks, compliance requirements, and governance decisions.",
      members: 5,
      decisions: 7,
      status: "Archived",
      color: "#64748b",
      recentDecision: "Compliance Review Process",
    },
  ];

  const filteredTeams = useMemo(() => {
    let result = teams.filter((team) => {
      const matchesTab =
        activeTab === "active"
          ? team.status === "Active"
          : team.status === "Archived";

      const matchesSearch =
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTab && matchesSearch;
    });

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === "members") {
      result.sort((a, b) => b.members - a.members);
    }

    if (sortBy === "decisions") {
      result.sort((a, b) => b.decisions - a.decisions);
    }

    return result;
  }, [searchTerm, sortBy, activeTab]);

  const handleJoinTeam = () => {
    setShowJoinModal(true);
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.breadcrumb}>Workspace / Teams</div>

          <h1 style={styles.title}>My Teams</h1>

          <p style={styles.subtitle}>
            Collaborate with your teams and manage shared decision-making
            activities.
          </p>
        </div>

        <button style={styles.joinButton} onClick={handleJoinTeam}>
          <Plus size={18} />
          Join a Team
        </button>
      </div>

      {/* TABS */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            ...styles.tab,
            ...(activeTab === "active" ? styles.activeTab : {}),
          }}
        >
          <Users size={17} />
          Active Teams
          <span style={styles.tabCount}>
            {teams.filter((team) => team.status === "Active").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("archived")}
          style={{
            ...styles.tab,
            ...(activeTab === "archived" ? styles.activeTab : {}),
          }}
        >
          <Archive size={17} />
          Archived Teams
          <span style={styles.tabCount}>
            {teams.filter((team) => team.status === "Archived").length}
          </span>
        </button>
      </div>

      {/* SEARCH + SORT */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" />

          <input
            type="text"
            placeholder="Search Teams"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.sortWrapper}>
          <span style={styles.sortLabel}>Sort by</span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="name">Name</option>
            <option value="members">Members</option>
            <option value="decisions">Decisions</option>
          </select>
        </div>
      </div>

      {/* TEAM CARDS */}
      {filteredTeams.length > 0 ? (
        <div style={styles.teamGrid}>
          {filteredTeams.map((team) => (
            <div key={team.id} style={styles.teamCard}>
              <div style={styles.cardTop}>
                <div
                  style={{
                    ...styles.teamIcon,
                    backgroundColor: team.color,
                  }}
                >
                  <Users size={22} color="#ffffff" />
                </div>

                <button style={styles.moreButton}>
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div style={styles.teamNameRow}>
                <h2 style={styles.teamName}>{team.name}</h2>

                <span
                  style={{
                    ...styles.statusBadge,
                    ...(team.status === "Active"
                      ? styles.activeStatus
                      : styles.archivedStatus),
                  }}
                >
                  <span
                    style={{
                      ...styles.statusDot,
                      backgroundColor:
                        team.status === "Active" ? "#16a34a" : "#64748b",
                    }}
                  />
                  {team.status}
                </span>
              </div>

              <p style={styles.teamDescription}>{team.description}</p>

              <div style={styles.teamStats}>
                <div style={styles.statItem}>
                  <Users size={16} color="#64748b" />

                  <div>
                    <strong style={styles.statNumber}>{team.members}</strong>
                    <span style={styles.statText}> Members</span>
                  </div>
                </div>

                <div style={styles.statItem}>
                  <CheckCircle2 size={16} color="#64748b" />

                  <div>
                    <strong style={styles.statNumber}>{team.decisions}</strong>
                    <span style={styles.statText}> Decisions</span>
                  </div>
                </div>
              </div>

              <div style={styles.recentDecision}>
                <span style={styles.recentLabel}>Recent Decision</span>

                <span style={styles.recentTitle}>
                  {team.recentDecision}
                </span>
              </div>

              <button style={styles.viewTeamButton}>
                View Team
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Users size={42} color="#94a3b8" />

          <h3 style={styles.emptyTitle}>No teams found</h3>

          <p style={styles.emptyText}>
            Try changing your search or switching between active and archived
            teams.
          </p>
        </div>
      )}

      {/* LOWER SECTION */}
      <div style={styles.bottomGrid}>
        {/* REQUEST TO JOIN */}
        <div style={styles.infoCard}>
          <div style={styles.infoIcon}>
            <UserPlus size={22} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={styles.infoTitle}>Request to Join a Team</h3>

            <p style={styles.infoText}>
              Browse available teams and request access to collaborate on
              organizational decisions.
            </p>

            <button
              style={styles.secondaryButton}
              onClick={handleJoinTeam}
            >
              Browse Teams
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ACTIVITY */}
        <div style={styles.activityCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.sectionTitle}>My Team Activity</h3>
              <p style={styles.sectionSubtitle}>
                Your latest team collaboration activity
              </p>
            </div>

            <Activity size={21} color="#64748b" />
          </div>

          <div style={styles.activityItem}>
            <div style={styles.activityIcon}>
              <MessageSquare size={16} />
            </div>

            <div>
              <p style={styles.activityText}>
                Commented on{" "}
                <strong>Customer Feedback Prioritization</strong>
              </p>
              <span style={styles.activityTime}>2 hours ago</span>
            </div>
          </div>

          <div style={styles.activityItem}>
            <div style={styles.activityIcon}>
              <CheckCircle2 size={16} />
            </div>

            <div>
              <p style={styles.activityText}>
                Reviewed a decision in <strong>Engineering Team</strong>
              </p>
              <span style={styles.activityTime}>Yesterday</span>
            </div>
          </div>

          <div style={styles.activityItem}>
            <div style={styles.activityIcon}>
              <UserPlus size={16} />
            </div>

            <div>
              <p style={styles.activityText}>
                Joined <strong>AI Research Team</strong>
              </p>
              <span style={styles.activityTime}>3 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* UPCOMING MEETINGS */}
      <div style={styles.meetingCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.sectionTitle}>Upcoming Team Meetings</h3>
            <p style={styles.sectionSubtitle}>
              Keep track of your team's upcoming discussions.
            </p>
          </div>

          <CalendarDays size={22} color="#64748b" />
        </div>

        <div style={styles.meetingList}>
          <div style={styles.meetingItem}>
            <div style={styles.dateBox}>
              <span style={styles.dateMonth}>SEP</span>
              <strong style={styles.dateDay}>18</strong>
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={styles.meetingTitle}>
                Product Roadmap Discussion
              </h4>

              <p style={styles.meetingDetails}>
                Product Team • 10:00 AM
              </p>
            </div>

            <span style={styles.meetingStatus}>
              <Clock3 size={14} />
              Upcoming
            </span>
          </div>

          <div style={styles.meetingItem}>
            <div style={styles.dateBox}>
              <span style={styles.dateMonth}>SEP</span>
              <strong style={styles.dateDay}>21</strong>
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={styles.meetingTitle}>
                Architecture Review
              </h4>

              <p style={styles.meetingDetails}>
                Engineering Team • 2:00 PM
              </p>
            </div>

            <span style={styles.meetingStatus}>
              <Clock3 size={14} />
              Upcoming
            </span>
          </div>
        </div>
      </div>

      {/* QUOTE */}
      <div style={styles.quoteCard}>
        <Users size={28} color="#64748b" />

        <div>
          <p style={styles.quote}>
            "Great decisions are built through collaboration, discussion, and
            shared knowledge."
          </p>

          <span style={styles.quoteSubtext}>
            Expert Decision Replay Platform
          </span>
        </div>
      </div>

      {/* JOIN MODAL */}
      {showJoinModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button
              style={styles.closeButton}
              onClick={() => setShowJoinModal(false)}
            >
              ×
            </button>

            <div style={styles.modalIcon}>
              <UserPlus size={24} />
            </div>

            <h2 style={styles.modalTitle}>Join a Team</h2>

            <p style={styles.modalText}>
              Team discovery and join-request functionality can be connected
              to your backend when the Team model and API are added.
            </p>

            <button
              style={styles.modalButton}
              onClick={() => setShowJoinModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "32px",
    color: "#0f172a",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "24px",
    marginBottom: "28px",
  },

  breadcrumb: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  joinButton: {
    border: "none",
    background: "#0f766e",
    color: "#ffffff",
    borderRadius: "9px",
    padding: "11px 17px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  tabsContainer: {
    display: "flex",
    gap: "8px",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: "20px",
  },

  tab: {
    border: "none",
    background: "transparent",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },

  activeTab: {
    color: "#0f766e",
    borderBottom: "2px solid #0f766e",
  },

  tabCount: {
    background: "#e2e8f0",
    color: "#475569",
    borderRadius: "999px",
    minWidth: "22px",
    height: "22px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "22px",
  },

  searchWrapper: {
    width: "min(420px, 100%)",
    height: "42px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 13px",
  },

  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "14px",
    background: "transparent",
    color: "#0f172a",
  },

  sortWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  sortLabel: {
    fontSize: "13px",
    color: "#64748b",
  },

  sortSelect: {
    height: "42px",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    padding: "0 12px",
    background: "#ffffff",
    color: "#334155",
    outline: "none",
    fontSize: "14px",
  },

  teamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "18px",
  },

  teamCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    padding: "20px",
    boxShadow: "0 2px 7px rgba(15, 23, 42, 0.04)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "17px",
  },

  teamIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  moreButton: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    padding: "5px",
  },

  teamNameRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "10px",
  },

  teamName: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  activeStatus: {
    background: "#ecfdf5",
    color: "#15803d",
  },

  archivedStatus: {
    background: "#f1f5f9",
    color: "#64748b",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  teamDescription: {
    minHeight: "58px",
    margin: 0,
    fontSize: "13px",
    lineHeight: "1.55",
    color: "#64748b",
  },

  teamStats: {
    display: "flex",
    gap: "26px",
    padding: "17px 0",
    marginTop: "10px",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
  },

  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  statNumber: {
    fontSize: "14px",
    color: "#334155",
  },

  statText: {
    fontSize: "12px",
    color: "#64748b",
  },

  recentDecision: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "15px 0",
  },

  recentLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#94a3b8",
    fontWeight: "600",
  },

  recentTitle: {
    fontSize: "13px",
    color: "#334155",
    fontWeight: "500",
  },

  viewTeamButton: {
    width: "100%",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    borderRadius: "8px",
    padding: "9px 12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "7px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  emptyState: {
    background: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: "13px",
    padding: "60px 20px",
    textAlign: "center",
  },

  emptyTitle: {
    margin: "12px 0 5px",
    fontSize: "17px",
  },

  emptyText: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 0.9fr) minmax(350px, 1.5fr)",
    gap: "18px",
    marginTop: "22px",
  },

  infoCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    padding: "22px",
    display: "flex",
    gap: "15px",
  },

  infoIcon: {
    width: "43px",
    height: "43px",
    flexShrink: 0,
    borderRadius: "10px",
    background: "#f0fdfa",
    color: "#0f766e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  infoTitle: {
    margin: "0 0 7px",
    fontSize: "17px",
  },

  infoText: {
    margin: "0 0 15px",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.55",
  },

  secondaryButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: "#0f766e",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },

  activityCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    padding: "22px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "15px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "700",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  activityItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    padding: "12px 0",
    borderTop: "1px solid #f1f5f9",
  },

  activityIcon: {
    width: "31px",
    height: "31px",
    borderRadius: "8px",
    background: "#f1f5f9",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  activityText: {
    margin: 0,
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.45",
  },

  activityTime: {
    display: "block",
    marginTop: "3px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  meetingCard: {
    marginTop: "18px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    padding: "22px",
  },

  meetingList: {
    display: "flex",
    flexDirection: "column",
  },

  meetingItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "13px 0",
    borderTop: "1px solid #f1f5f9",
  },

  dateBox: {
    width: "48px",
    height: "53px",
    borderRadius: "9px",
    background: "#f0fdfa",
    color: "#0f766e",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  dateMonth: {
    fontSize: "9px",
    fontWeight: "700",
  },

  dateDay: {
    fontSize: "20px",
    lineHeight: "21px",
  },

  meetingTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },

  meetingDetails: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#64748b",
  },

  meetingStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    color: "#64748b",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "5px 8px",
    borderRadius: "999px",
  },

  quoteCard: {
    marginTop: "18px",
    padding: "25px",
    borderRadius: "13px",
    background: "#eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
    textAlign: "center",
  },

  quote: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    fontStyle: "italic",
    lineHeight: "1.5",
  },

  quoteSubtext: {
    display: "block",
    marginTop: "7px",
    fontSize: "11px",
    color: "#94a3b8",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },

  modal: {
    position: "relative",
    width: "min(430px, 100%)",
    background: "#ffffff",
    borderRadius: "15px",
    padding: "30px",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
  },

  closeButton: {
    position: "absolute",
    top: "12px",
    right: "15px",
    border: "none",
    background: "transparent",
    fontSize: "25px",
    color: "#64748b",
    cursor: "pointer",
  },

  modalIcon: {
    width: "50px",
    height: "50px",
    margin: "0 auto 15px",
    borderRadius: "12px",
    background: "#f0fdfa",
    color: "#0f766e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    margin: 0,
    fontSize: "21px",
  },

  modalText: {
    margin: "10px 0 22px",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  modalButton: {
    border: "none",
    background: "#0f766e",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 22px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Teams;