import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  GitPullRequest,
  FolderKanban,
  BookOpen,
  MessageSquare,
  Search,
  BarChart3,
  HelpCircle,
  LogOut,
  Bell,
  ChevronDown,
  ChevronRight,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  User,
  X,
  Plus,
  Network,
  Filter
} from "lucide-react";
import KnowledgeRepository from "./components/KnowledgeRepository";
import DecisionsHub from "./components/DecisionsHub";
import DiscussionsView from "./components/DiscussionsView";
import ApprovalWorkflowView from "./components/ApprovalWorkflowView";
import AuditComplianceView from "./components/AuditComplianceView";
import ReportsAnalyticsView from "./components/ReportsAnalyticsView";
import NotificationCenter from "./components/NotificationCenter";
import TeamsView from "./components/TeamsView";

const API_BASE = "http://127.0.0.1:8000";

export default function Dashboard({ user, onLogout }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [activeNav, setActiveNav] = useState("Home");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(3);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(6);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [rolePerspective, setRolePerspective] = useState(user?.role_name || "Manager");
  const [selectedDecisionForReplay, setSelectedDecisionForReplay] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("All");
  const [inspectingDecision, setInspectingDecision] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    fetchNotificationCount();
    fetchPendingApprovalsCount();
  }, [rolePerspective, currentUser]);

  const handleRoleSwitch = async (newRole) => {
    setRolePerspective(newRole);
    let targetEmail = "manager@company.com";
    if (newRole === "Employee") targetEmail = "emp@company.com";
    else if (newRole === "Reviewer") targetEmail = "reviewer@company.com";
    else if (newRole === "Administrator") targetEmail = "admin@company.com";

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: "password123" }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        const meRes = await fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData);
        }
        fetchNotificationCount();
        fetchPendingApprovalsCount();
      }
    } catch (e) {
      console.error("Error switching role session:", e);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const unread = typeof data.unread_count === "number"
          ? data.unread_count
          : (Array.isArray(data) ? data.filter((n) => !n.is_read).length : (data.notifications ? data.notifications.filter(n => !n.is_read).length : 3));
        setUnreadNotifsCount(unread);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  const fetchPendingApprovalsCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/approvals/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingApprovalsCount(data.length || 0);
      }
    } catch (e) {
      console.error("Error fetching pending approvals:", e);
    }
  };

  // Nav Items with Purple highlights (Includes Milestone 3: Approvals and Audit Logs)
  const navItems = [
    { id: "Home", label: "Dashboard", icon: LayoutDashboard },
    { id: "My Decisions", label: "Decisions", icon: GitPullRequest },
    { id: "Approvals", label: "Approvals", icon: CheckSquare },
    { id: "Audit & Compliance", label: "Audit Logs", icon: ShieldCheck },
    { id: "Insights", label: "Analytics & Reports", icon: BarChart3 },
    { id: "My Teams", label: "Teams", icon: Users },
    { id: "Knowledge Repository", label: "Knowledge Base", icon: BookOpen },
    { id: "Discussions", label: "Discussions", icon: MessageSquare },
  ];

  const displayName = currentUser?.name || user?.name || "Manager User";
  const displayRole = currentUser?.role_name || rolePerspective || "Manager";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Clean, focused decisions dataset
  const decisionsData = [
    {
      id: 1,
      code: "RFC-101",
      title: "Adopt new cloud infrastructure",
      problem: "Evaluate multi-cloud vs single-cloud strategy to scale workloads and optimize monthly operational cost.",
      category: "Cloud",
      team: "Cloud Team",
      status: "In Review",
      date: "10 Sep 2025",
      selectedAlternative: "Multi-Cloud Kubernetes (AWS + GCP)",
      competingAlternative: "Single-Cloud AWS Consolidation",
      cost: "$12,000/mo vs $9,500/mo",
      rationale: "Multi-cloud architecture prevents single-vendor dependency and provides seamless disaster recovery across regions.",
      reviewerStatus: "Approved by Technical Reviewer",
      managerStatus: "Awaiting final manager sign-off"
    },
    {
      id: 2,
      code: "AI-204",
      title: "Implement AI-based support bot",
      problem: "Automate tier-1 customer inquiries while preserving enterprise privacy standards and fast response latency.",
      category: "AI",
      team: "Product Team",
      status: "Discussion",
      date: "9 Sep 2025",
      selectedAlternative: "Hybrid RAG with Private VPC Gateway",
      competingAlternative: "Self-Hosted Llama 3 70B GPU Cluster",
      cost: "$3,000/mo vs $8,500/mo",
      rationale: "Hybrid enterprise endpoint avoids upfront GPU capital expenditures while guaranteeing zero-data-retention compliance.",
      reviewerStatus: "Under review by AI Safety Guild",
      managerStatus: "Queued"
    },
    {
      id: 3,
      code: "SEC-019",
      title: "Data retention policy update",
      problem: "Automate cryptographic shredding and database purge lifecycles to comply with GDPR and SOC2 standards.",
      category: "Compliance",
      team: "Compliance Team",
      status: "Approved",
      date: "7 Sep 2025",
      selectedAlternative: "Automated Lifecycle Tiering & Cryptographic Erasure",
      competingAlternative: "Manual Periodic Partition Dropping",
      cost: "$500/mo automated",
      rationale: "Eliminates human errors, guarantees 90-day PII purging criteria, and produces audit-ready compliance logs.",
      reviewerStatus: "Approved by InfoSec",
      managerStatus: "Executive Sign-Off Completed"
    },
    {
      id: 4,
      code: "ENG-088",
      title: "Frontend framework selection",
      problem: "Standardize client web technology stack across enterprise platforms to minimize maintenance overhead.",
      category: "Engineering",
      team: "Engineering Team",
      status: "Discussion",
      date: "6 Sep 2025",
      selectedAlternative: "React 19 with Vite & Modular Components",
      competingAlternative: "Angular Enterprise Framework",
      cost: "Open Source ($0)",
      rationale: "React 19 offers immediate developer availability, sub-second development cycles, and deep component library compatibility.",
      reviewerStatus: "Consensus vote active",
      managerStatus: "Queued"
    },
    {
      id: 5,
      code: "DB-014",
      title: "Database architecture migration",
      problem: "Migrate legacy relational database to modern PostgreSQL Aurora with vector extensions for semantic knowledge search.",
      category: "Architecture",
      team: "Architecture",
      status: "Approved",
      date: "3 Sep 2025",
      selectedAlternative: "Managed PostgreSQL Aurora with pgvector",
      competingAlternative: "Self-Hosted PostgreSQL on Kubernetes",
      cost: "$1,800/mo cloud",
      rationale: "High availability multi-AZ failover and native vector search capabilities out of the box without DBA maintenance burden.",
      reviewerStatus: "Architecture Board Approved",
      managerStatus: "Executive Sign-Off Completed"
    }
  ];

  const filteredDecisions = decisionsData.filter((d) => {
    const matchesCat = activeCategoryFilter === "All" || d.category === activeCategoryFilter;
    const matchesSearch = !globalSearch ||
      d.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(globalSearch.toLowerCase()) ||
      d.team.toLowerCase().includes(globalSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={styles.layout}>
      {/* =====================================================================
          PURPLE THEMED SIDEBAR (Sleek Dark Violet #181126)
          ===================================================================== */}
      <aside style={styles.sidebar}>
        {/* Brand */}
        <div style={styles.brand} onClick={() => setActiveNav("Home")}>
          <div style={styles.brandIconWrap}>
            <Brain size={20} color="#ffffff" />
          </div>
          <div>
            <div style={styles.brandTitle}>DecisioHub</div>
            <div style={styles.brandTagline}>Decision Intelligence</div>
          </div>
        </div>

        {/* Navigation items */}
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive ? "#7c3aed" : "transparent",
                  color: isActive ? "#ffffff" : "#c4b5fd",
                  fontWeight: isActive ? "600" : "500",
                }}
                onClick={() => setActiveNav(item.id)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(124, 58, 237, 0.15)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#c4b5fd";
                  }
                }}
              >
                <Icon size={17} color={isActive ? "#ffffff" : "#a78bfa"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div style={styles.sidebarFooter}>
          <button
            type="button"
            style={styles.navItemFooter}
            onClick={() => setShowHelpModal(true)}
          >
            <HelpCircle size={16} />
            <span>Support & Help</span>
          </button>
          <button
            type="button"
            style={{ ...styles.navItemFooter, marginTop: "4px", color: "#fca5a5" }}
            onClick={onLogout}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =====================================================================
          MAIN APP SHELL (Warm Lilac-Tinted Canvas #fbf9fe)
          ===================================================================== */}
      <div style={styles.mainWrapper}>
        {/* Top Header */}
        <header style={styles.header}>
          {/* Clean Search Input */}
          <div style={styles.searchBar}>
            <Search size={16} color="#7c3aed" />
            <input
              type="text"
              placeholder="Search decisions, RFC codes, teams..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Right Header Actions */}
          <div style={styles.headerRight}>
            {/* Role Switcher */}
            <div style={styles.roleSwitcherWrap} title="Switch active role perspective">
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#7c3aed", textTransform: "uppercase" }}>
                Role:
              </span>
              <select
                value={rolePerspective}
                onChange={(e) => handleRoleSwitch(e.target.value)}
                style={styles.roleSelectPill}
              >
                <option value="Manager">Manager</option>
                <option value="Reviewer">Reviewer</option>
                <option value="Employee">Employee</option>
                <option value="Administrator">Admin</option>
              </select>
            </div>

            {(rolePerspective === "Reviewer" || rolePerspective === "Manager") && (
              <button
                type="button"
                onClick={() => setActiveNav("Approvals")}
                style={styles.approvalsBtn}
              >
                <CheckSquare size={13} />
                <span>Approvals ({pendingApprovalsCount})</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              style={styles.notificationBtn}
              onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
              title="Notifications"
            >
              <Bell size={17} color="#6b21a8" />
              {unreadNotifsCount > 0 && <span style={styles.notifDot} />}
            </button>

            {/* Profile Chip */}
            <div style={{ position: "relative" }}>
              <div
                style={styles.profileChip}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div style={styles.avatarCircle}>{initials}</div>
                <div style={styles.profileText}>
                  <div style={styles.profileName}>{displayName}</div>
                  <div style={styles.profileRole}>{displayRole}</div>
                </div>
                <ChevronDown size={14} color="#7c3aed" />
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownHeader}>
                    <div style={{ fontWeight: "700", color: "#1e1438" }}>{displayName}</div>
                    <div style={{ fontSize: "12px", color: "#7c3aed" }}>
                      {user?.email || "employee@company.com"}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={styles.dropdownItem}
                    onClick={() => {
                      setActiveNav("My Teams");
                      setShowProfileMenu(false);
                    }}
                  >
                    <Users size={14} color="#7c3aed" />
                    <span>Teams</span>
                  </button>
                  <button
                    type="button"
                    style={styles.dropdownItem}
                    onClick={() => {
                      setActiveNav("My Decisions");
                      setShowProfileMenu(false);
                    }}
                  >
                    <GitPullRequest size={14} color="#7c3aed" />
                    <span>My Decisions</span>
                  </button>
                  <div style={{ height: "1px", backgroundColor: "#f3e8ff", margin: "4px 0" }} />
                  <button
                    type="button"
                    style={{ ...styles.dropdownItem, color: "#dc2626" }}
                    onClick={onLogout}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* =====================================================================
            MAIN CONTENT AREA
            ===================================================================== */}
        <main style={styles.contentArea}>
          {/* ==================== 1. DASHBOARD VIEW (CLEAN & UNCLUTTERED) ==================== */}
          {activeNav === "Home" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Clean Header Bar */}
              <div style={styles.overviewHeader}>
                <div>
                  <h1 style={styles.overviewTitle}>Decision Intelligence</h1>
                  <p style={styles.overviewSubtitle}>
                    Structured decision records, competing alternatives, and approval verification.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveNav("My Decisions")}
                  style={styles.newDecisionBtn}
                >
                  <Plus size={16} />
                  <span>New Decision</span>
                </button>
              </div>

              {/* 4 Clean, Uncluttered Stat Cards */}
              <div style={styles.statsGrid}>
                <div
                  style={styles.statCard}
                  onClick={() => setActiveNav("My Decisions")}
                >
                  <div style={{ ...styles.statIconBox, backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
                    <GitPullRequest size={18} />
                  </div>
                  <div>
                    <div style={styles.statValue}>22</div>
                    <div style={styles.statLabel}>Total Decisions</div>
                  </div>
                </div>

                <div
                  style={styles.statCard}
                  onClick={() => {
                    setActiveCategoryFilter("All");
                  }}
                >
                  <div style={{ ...styles.statIconBox, backgroundColor: "#fef3c7", color: "#b45309" }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <div style={styles.statValue}>4</div>
                    <div style={styles.statLabel}>In Review</div>
                  </div>
                </div>

                <div
                  style={styles.statCard}
                  onClick={() => {
                    setActiveCategoryFilter("All");
                  }}
                >
                  <div style={{ ...styles.statIconBox, backgroundColor: "#dcfce7", color: "#15803d" }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div style={styles.statValue}>16</div>
                    <div style={styles.statLabel}>Approved & Live</div>
                  </div>
                </div>

                <div
                  style={styles.statCard}
                  onClick={() => setActiveNav("My Teams")}
                >
                  <div style={{ ...styles.statIconBox, backgroundColor: "#e0e7ff", color: "#4338ca" }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <div style={styles.statValue}>5</div>
                    <div style={styles.statLabel}>Active Teams</div>
                  </div>
                </div>
              </div>

              {/* Two-Column Section: Clean Decision Table (Left) & Focused Quick Panel (Right) */}
              <div style={styles.twoColumnLayout}>
                {/* LEFT: DECISIONS TABLE (CLEAN & CLEAR) */}
                <div style={styles.tableCard}>
                  {/* Table Filter Tabs */}
                  <div style={styles.tableHeaderRow}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {["All", "Cloud", "AI", "Compliance", "Engineering", "Architecture"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategoryFilter(cat)}
                          style={{
                            ...styles.categoryTab,
                            backgroundColor: activeCategoryFilter === cat ? "#7c3aed" : "transparent",
                            color: activeCategoryFilter === cat ? "#ffffff" : "#6b21a8",
                            fontWeight: activeCategoryFilter === cat ? "600" : "500",
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <span style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "600" }}>
                      {filteredDecisions.length} decisions
                    </span>
                  </div>

                  {/* Clean Table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={styles.cleanTable}>
                      <thead>
                        <tr>
                          <th style={{ ...styles.th, width: "14%" }}>ID</th>
                          <th style={{ ...styles.th, width: "46%" }}>Decision Title</th>
                          <th style={{ ...styles.th, width: "18%" }}>Team</th>
                          <th style={{ ...styles.th, width: "14%" }}>Status</th>
                          <th style={{ ...styles.th, width: "8%", textAlign: "right" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDecisions.map((item) => (
                          <tr
                            key={item.id}
                            style={styles.tr}
                            onClick={() => setInspectingDecision(item)}
                          >
                            <td style={styles.td}>
                              <span style={styles.codeBadge}>{item.code}</span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ fontWeight: "600", color: "#1e1438", fontSize: "13.5px" }}>
                                {item.title}
                              </div>
                              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px", lineHeight: 1.35 }}>
                                {item.problem}
                              </div>
                            </td>
                            <td style={styles.td}>
                              <span style={{ fontSize: "12.5px", color: "#374151", fontWeight: "500" }}>
                                {item.team}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.statusPill,
                                  backgroundColor:
                                    item.status === "Approved"
                                      ? "#ecfdf5"
                                      : item.status === "In Review"
                                      ? "#fef3c7"
                                      : "#f3e8ff",
                                  color:
                                    item.status === "Approved"
                                      ? "#047857"
                                      : item.status === "In Review"
                                      ? "#92400e"
                                      : "#7c3aed",
                                }}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              <button
                                type="button"
                                style={styles.replayActionBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectingDecision(item);
                                }}
                              >
                                <span>Replay</span>
                                <ChevronRight size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT: CLEAN FOCUSED OPERATIONAL WIDGETS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Action Queue */}
                  <div style={styles.sideCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h3 style={styles.sideCardTitle}>Pending Action</h3>
                      <button
                        type="button"
                        onClick={() => setActiveNav("Approvals")}
                        style={styles.linkText}
                      >
                        Approvals &rarr;
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div
                        style={styles.pendingItem}
                        onClick={() => {
                          setSelectedDecisionForReplay("Adopt new cloud infrastructure");
                          setActiveNav("My Decisions");
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={styles.purpleTag}>RFC-101</span>
                          <span style={{ fontSize: "11px", color: "#b45309", fontWeight: "600" }}>Review Due</span>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e1438", marginTop: "4px" }}>
                          Adopt new cloud infrastructure
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#6b7280", marginTop: "2px" }}>
                          Stage 1 technical review
                        </div>
                      </div>

                      <div
                        style={styles.pendingItem}
                        onClick={() => {
                          setSelectedDecisionForReplay("Implement AI-based support bot");
                          setActiveNav("My Decisions");
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={styles.purpleTag}>AI-204</span>
                          <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "600" }}>Discussion</span>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e1438", marginTop: "4px" }}>
                          Implement AI-based support bot
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#6b7280", marginTop: "2px" }}>
                          3 comments awaiting feedback
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Knowledge Base Fast Filter */}
                  <div style={styles.sideCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h3 style={styles.sideCardTitle}>Popular Topics</h3>
                      <button
                        type="button"
                        onClick={() => setActiveNav("Knowledge Repository")}
                        style={styles.linkText}
                      >
                        Explore &rarr;
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {["AI Models", "Cloud", "Security", "Compliance", "PostgreSQL", "React 19"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setActiveNav("Knowledge Repository");
                          }}
                          style={styles.topicPill}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. MY DECISIONS VIEW ==================== */}
          {activeNav === "My Decisions" && (
            <DecisionsHub
              user={user}
              apiBase={API_BASE}
              initialDecisionTitle={selectedDecisionForReplay}
            />
          )}

          {/* ==================== 3. PIPELINE VIEW ==================== */}
          {activeNav === "Team Decisions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h1 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "700", color: "#1e1438" }}>
                  Team Pipeline
                </h1>
                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                  Active decisions across organization working groups.
                </p>
              </div>
              <DecisionsHub user={user} apiBase={API_BASE} />
            </div>
          )}

          {/* ==================== 4. TEAMS VIEW ==================== */}
          {activeNav === "My Teams" && (
            <TeamsView
              user={user}
              apiBase={API_BASE}
              onSelectDecision={(decTitle) => {
                setSelectedDecisionForReplay(decTitle);
                setActiveNav("My Decisions");
              }}
            />
          )}

          {/* ==================== 5. KNOWLEDGE REPOSITORY ==================== */}
          {activeNav === "Knowledge Repository" && (
            <KnowledgeRepository
              user={user}
              onNavigate={(dest) => setActiveNav(dest)}
              apiBase={API_BASE}
            />
          )}

          {/* ==================== 6. DISCUSSIONS ==================== */}
          {activeNav === "Discussions" && (
            <DiscussionsView
              onSelectDecision={() => setActiveNav("My Decisions")}
              apiBase={API_BASE}
            />
          )}

          {/* ==================== 7. INSIGHTS / ANALYTICS ==================== */}
          {activeNav === "Insights" && (
            <ReportsAnalyticsView apiBase={API_BASE} />
          )}

          {/* ==================== 8. APPROVALS ==================== */}
          {activeNav === "Approvals" && (
            <ApprovalWorkflowView
              user={currentUser}
              apiBase={API_BASE}
              onNavigateDecision={() => setActiveNav("My Decisions")}
            />
          )}

          {/* ==================== 9. AUDIT & COMPLIANCE ==================== */}
          {activeNav === "Audit & Compliance" && (
            <AuditComplianceView apiBase={API_BASE} />
          )}
        </main>
      </div>

      {/* =====================================================================
          PURPLE THEMED REPLAY DRAWER (CLEAN & MINIMALIST)
          ===================================================================== */}
      {inspectingDecision && (
        <div
          style={styles.drawerOverlay}
          onClick={() => setInspectingDecision(null)}
        >
          <div
            style={styles.drawerContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={styles.drawerHeader}>
              <div>
                <span style={styles.purpleTag}>{inspectingDecision.code}</span>
                <h2 style={{ margin: "6px 0 2px 0", fontSize: "17px", fontWeight: "700", color: "#1e1438" }}>
                  {inspectingDecision.title}
                </h2>
                <div style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "500" }}>{inspectingDecision.team}</div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDecision(null)}
                style={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={styles.drawerBody}>
              <div>
                <div style={styles.drawerSectionLabel}>Problem Statement</div>
                <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>
                  {inspectingDecision.problem}
                </p>
              </div>

              <div>
                <div style={styles.drawerSectionLabel}>Selected Solution</div>
                <div style={styles.selectedBox}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#047857" }}>
                    {inspectingDecision.selectedAlternative}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                    Cost: {inspectingDecision.cost}
                  </div>
                </div>
              </div>

              <div>
                <div style={styles.drawerSectionLabel}>Alternative Evaluated</div>
                <div style={styles.rejectedBox}>
                  <div style={{ fontSize: "12.5px", color: "#4b5563" }}>
                    {inspectingDecision.competingAlternative}
                  </div>
                </div>
              </div>

              <div>
                <div style={styles.drawerSectionLabel}>Decision Rationale</div>
                <div style={styles.rationaleBox}>
                  "{inspectingDecision.rationale}"
                </div>
              </div>

              <div>
                <div style={styles.drawerSectionLabel}>Approval Verification</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={styles.statusRow}>
                    <span style={{ fontSize: "12.5px", fontWeight: "500", color: "#1e1438" }}>Stage 1 (Reviewer)</span>
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: "600" }}>{inspectingDecision.reviewerStatus}</span>
                  </div>
                  <div style={styles.statusRow}>
                    <span style={{ fontSize: "12.5px", fontWeight: "500", color: "#1e1438" }}>Stage 2 (Manager)</span>
                    <span style={{ fontSize: "12px", color: inspectingDecision.status === "Approved" ? "#059669" : "#b45309", fontWeight: "600" }}>
                      {inspectingDecision.managerStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action */}
            <div style={styles.drawerFooter}>
              <button
                type="button"
                onClick={() => {
                  const title = inspectingDecision.title;
                  setInspectingDecision(null);
                  setSelectedDecisionForReplay(title);
                  setActiveNav("My Decisions");
                }}
                style={styles.drawerBtn}
              >
                <span>Open Full Decision Hub</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Center Popover */}
      {isNotificationCenterOpen && (
        <NotificationCenter
          apiBase={API_BASE}
          onClose={() => setIsNotificationCenterOpen(false)}
          onNavigate={(dest) => {
            setIsNotificationCenterOpen(false);
            setActiveNav(dest);
          }}
          onCountUpdate={(count) => setUnreadNotifsCount(count)}
        />
      )}

      {/* Clean Support Modal */}
      {showHelpModal && (
        <div
          style={styles.drawerOverlay}
          onClick={() => setShowHelpModal(false)}
        >
          <div
            style={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain size={18} color="#7c3aed" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e1438" }}>
                  DecisioHub Overview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={styles.closeBtn}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              Centralized platform for recording and replaying strategic decisions with multi-alternative evaluations and two-stage governance.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={styles.modalCloseBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#fbf9fe", // Warm Lilac-Tinted Canvas
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif",
  },
  sidebar: {
    width: "220px",
    backgroundColor: "#181126", // Deep Dark Purple
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    borderRight: "1px solid rgba(124, 58, 237, 0.15)",
  },
  brand: {
    padding: "18px 16px 14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  brandIconWrap: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    backgroundColor: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: "-0.01em",
  },
  brandTagline: {
    fontSize: "11px",
    color: "#c4b5fd",
    marginTop: "1px",
  },
  nav: {
    flex: 1,
    padding: "6px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "left",
    width: "100%",
  },
  sidebarFooter: {
    padding: "12px 10px 16px 10px",
    borderTop: "1px solid rgba(124, 58, 237, 0.15)",
  },
  navItemFooter: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    background: "none",
    border: "none",
    color: "#c4b5fd",
    fontSize: "12.5px",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  header: {
    height: "58px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #ede7f6",
    padding: "0 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#faf7fd",
    border: "1px solid #ede7f6",
    borderRadius: "6px",
    padding: "6px 12px",
    width: "360px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: "13px",
    color: "#1e1438",
    width: "100%",
    backgroundColor: "transparent",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  roleSwitcherWrap: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#f5f0fb",
    borderRadius: "6px",
    padding: "3px 8px",
    border: "1px solid #ede7f6",
  },
  roleSelectPill: {
    border: "none",
    backgroundColor: "transparent",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b21a8",
    cursor: "pointer",
    outline: "none",
  },
  approvalsBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#f5f0fb",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
    cursor: "pointer",
  },
  notificationBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "6px",
    border: "1px solid #ede7f6",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: "6px",
    right: "6px",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#7c3aed",
  },
  profileChip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    padding: "3px 6px",
    borderRadius: "6px",
  },
  avatarCircle: {
    width: "30px",
    height: "30px",
    borderRadius: "6px",
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11.5px",
    fontWeight: "700",
  },
  profileText: {
    display: "flex",
    flexDirection: "column",
  },
  profileName: {
    fontSize: "12.5px",
    fontWeight: "600",
    color: "#1e1438",
    lineHeight: 1.2,
  },
  profileRole: {
    fontSize: "11px",
    color: "#7c3aed",
  },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: "42px",
    backgroundColor: "#ffffff",
    border: "1px solid #ede7f6",
    borderRadius: "8px",
    padding: "6px",
    boxShadow: "0 8px 16px rgba(124, 58, 237, 0.08)",
    width: "180px",
    zIndex: 50,
  },
  dropdownHeader: {
    padding: "6px 8px",
    borderBottom: "1px solid #ede7f6",
    marginBottom: "4px",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "6px 8px",
    background: "none",
    border: "none",
    borderRadius: "4px",
    fontSize: "12.5px",
    color: "#374151",
    cursor: "pointer",
    textAlign: "left",
  },
  contentArea: {
    flex: 1,
    padding: "20px 24px",
    overflowY: "auto",
  },
  overviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  overviewTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e1438",
  },
  overviewSubtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
  },
  newDecisionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
  },
  statCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #ede7f6",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 1px 3px rgba(124, 58, 237, 0.04)",
    cursor: "pointer",
  },
  statIconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e1438",
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#6b7280",
    marginTop: "2px",
  },
  twoColumnLayout: {
    display: "grid",
    gridTemplateColumns: "2.4fr 1fr",
    gap: "18px",
  },
  tableCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #ede7f6",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 1px 3px rgba(124, 58, 237, 0.04)",
  },
  tableHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "12px",
    borderBottom: "1px solid #ede7f6",
    marginBottom: "8px",
  },
  categoryTab: {
    padding: "4px 10px",
    borderRadius: "6px",
    border: "none",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  cleanTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    fontSize: "11.5px",
    fontWeight: "600",
    color: "#6b7280",
    borderBottom: "1px solid #ede7f6",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  tr: {
    cursor: "pointer",
    borderBottom: "1px solid #faf7fd",
    transition: "background 0.15s",
  },
  td: {
    padding: "10px",
    verticalAlign: "middle",
  },
  codeBadge: {
    fontFamily: "ui-monospace, monospace",
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b21a8",
    backgroundColor: "#f5f0fb",
    padding: "2px 6px",
    borderRadius: "4px",
    border: "1px solid #ddd6fe",
  },
  statusPill: {
    display: "inline-block",
    padding: "2px 7px",
    borderRadius: "4px",
    fontSize: "11.5px",
    fontWeight: "600",
  },
  replayActionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    backgroundColor: "#f5f0fb",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
    borderRadius: "4px",
    fontSize: "11.5px",
    fontWeight: "600",
    cursor: "pointer",
  },
  sideCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #ede7f6",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 1px 3px rgba(124, 58, 237, 0.04)",
  },
  sideCardTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e1438",
  },
  linkText: {
    background: "none",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    color: "#7c3aed",
    cursor: "pointer",
    padding: 0,
  },
  pendingItem: {
    padding: "10px",
    backgroundColor: "#faf7fd",
    borderRadius: "6px",
    border: "1px solid #ede7f6",
    cursor: "pointer",
  },
  purpleTag: {
    fontFamily: "ui-monospace, monospace",
    fontSize: "10.5px",
    fontWeight: "700",
    color: "#7c3aed",
    backgroundColor: "#f3e8ff",
    padding: "1px 5px",
    borderRadius: "3px",
  },
  topicPill: {
    padding: "4px 10px",
    backgroundColor: "#faf7fd",
    border: "1px solid #ede7f6",
    borderRadius: "16px",
    fontSize: "11.5px",
    color: "#6b21a8",
    fontWeight: "500",
    cursor: "pointer",
  },
  drawerOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(24, 17, 38, 0.4)",
    backdropFilter: "blur(2px)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "flex-end",
  },
  drawerContent: {
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "#ffffff",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-8px 0 24px rgba(124, 58, 237, 0.12)",
  },
  drawerHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #ede7f6",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    padding: "4px",
  },
  drawerBody: {
    flex: 1,
    overflowY: "auto",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  drawerSectionLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#7c3aed",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  selectedBox: {
    padding: "10px 12px",
    backgroundColor: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "6px",
  },
  rejectedBox: {
    padding: "8px 10px",
    backgroundColor: "#faf7fd",
    border: "1px solid #ede7f6",
    borderRadius: "6px",
  },
  rationaleBox: {
    padding: "10px 12px",
    backgroundColor: "#faf7fd",
    borderLeft: "3px solid #7c3aed",
    fontSize: "12.5px",
    color: "#374151",
    lineHeight: 1.45,
  },
  statusRow: {
    padding: "6px 8px",
    backgroundColor: "#faf7fd",
    borderRadius: "4px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  drawerFooter: {
    padding: "12px 20px",
    borderTop: "1px solid #ede7f6",
  },
  drawerBtn: {
    width: "100%",
    padding: "8px 0",
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    cursor: "pointer",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    width: "100%",
    maxWidth: "420px",
    padding: "20px",
    margin: "auto",
    boxShadow: "0 16px 32px rgba(124, 58, 237, 0.12)",
  },
  modalCloseBtn: {
    padding: "6px 14px",
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
