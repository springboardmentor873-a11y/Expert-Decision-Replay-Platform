import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  GitPullRequest,
  MessageSquare,
  BookOpen,
  Users,
  BarChart3,
  User,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Brain,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Activity,
  Check,
  CheckSquare,
  ShieldAlert,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  ExternalLink,
  Filter,
  Layers,
  Award
} from "lucide-react";
import KnowledgeRepository from "./components/KnowledgeRepository";
import DecisionsHub from "./components/DecisionsHub";
import DiscussionsView from "./components/DiscussionsView";
import ApprovalWorkflowView from "./components/ApprovalWorkflowView";
import AuditComplianceView from "./components/AuditComplianceView";
import ReportsAnalyticsView from "./components/ReportsAnalyticsView";
import NotificationCenter from "./components/NotificationCenter";
import MD3Button from "./components/md3/MD3Button";
import MD3Card from "./components/md3/MD3Card";

const API_BASE = "http://127.0.0.1:8000";

function Dashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Milestone 3: Notifications, Approvals, Role Perspective & Governance State
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [rolePerspective, setRolePerspective] = useState(user?.role_name || "Employee");
  const [roleMetrics, setRoleMetrics] = useState(null);

  useEffect(() => {
    fetchNotificationCount();
    fetchPendingApprovalsCount();
    fetchRoleMetrics(rolePerspective);

    const interval = setInterval(() => {
      fetchNotificationCount();
      fetchPendingApprovalsCount();
    }, 15000);
    return () => clearInterval(interval);
  }, [rolePerspective]);

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const notifs = await res.json();
        const unread = notifs.filter((n) => !n.is_read).length;
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
        setPendingApprovalsCount(data.length);
      }
    } catch (e) {
      console.error("Error fetching pending approvals:", e);
    }
  };

  const fetchRoleMetrics = async (role) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/dashboard/role-metrics?role_name=${encodeURIComponent(role)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoleMetrics(data);
      }
    } catch (e) {
      console.error("Error fetching role metrics:", e);
    }
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Decisions", icon: GitPullRequest },
    { name: "Approvals", icon: CheckSquare, badge: pendingApprovalsCount },
    { name: "Audit & Compliance", icon: ShieldCheck },
    { name: "Analytics & Reports", icon: BarChart3 },
    { name: "Knowledge Repository", icon: BookOpen },
    { name: "Discussions", icon: MessageSquare },
    { name: "Teams", icon: Users },
    { name: "Profile", icon: User },
    { name: "Settings", icon: Settings },
  ];

  // User initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AU";

  return (
    <div style={styles.layout}>
      {/* =========================================================================
          MATERIAL YOU (MD3) NAVIGATION DRAWER
          ========================================================================= */}
      <aside style={styles.sidebar}>
        {/* Brand Header */}
        <div style={styles.brand}>
          <div style={styles.brandIconWrap}>
            <Brain size={22} color="var(--primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={styles.brandTitle}>DecisionIntel</span>
              <span style={styles.versionBadge}>MD3</span>
            </div>
            <div style={styles.brandTagline}>Expert Decision Platform</div>
          </div>
        </div>

        {/* Navigation Items (Full Pill MD3 Chips) */}
        <nav style={styles.nav}>
          <div style={styles.navSectionLabel}>PLATFORM</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.name;
            return (
              <button
                key={item.name}
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive
                    ? "var(--secondary-container)"
                    : "transparent",
                  color: isActive
                    ? "var(--on-secondary-container)"
                    : "var(--text-secondary)",
                  fontWeight: isActive ? "600" : "500",
                }}
                onClick={() => setActiveNav(item.name)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(103, 80, 164, 0.08)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <div style={styles.navIconBox}>
                  <Icon
                    size={18}
                    color={isActive ? "var(--primary)" : "var(--text-secondary)"}
                  />
                </div>
                <span style={{ flex: 1, textAlign: "left" }}>{item.name}</span>
                {item.badge > 0 && (
                  <span style={styles.navBadgePill}>{item.badge}</span>
                )}
                {isActive && <div style={styles.activeGlowPip} />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Material You Tonal Telemetry Card) */}
        <div style={styles.sidebarFooter}>
          <div style={styles.milestoneCard}>
            <div style={styles.milestoneBadge}>
              <div style={styles.statusDotLive} />
              <span>Cluster Synced</span>
              <span style={styles.latencyTag}>12ms</span>
            </div>
            <p style={styles.milestoneDesc}>
              Material You runtime & Replay Engine active.
            </p>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN APPLICATION SHELL
          ========================================================================= */}
      <div style={styles.mainWrapper}>
        {/* Top App Bar with Frosted Tonal Glass & Pill Controls */}
        <header style={styles.header}>
          {/* Material You Pill Search Field */}
          <div style={styles.searchBar}>
            <Search size={17} color="var(--primary)" />
            <input
              type="text"
              placeholder="Search documents, decisions, topics, or audit logs..."
              style={styles.searchInput}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            <div style={styles.shortcutKbd}>
              <span style={{ fontSize: "10.5px", fontWeight: "600" }}>Ctrl</span>
              <span style={{ fontSize: "10.5px", fontWeight: "600" }}>K</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div style={styles.headerRight}>
            {/* Role Perspective Quick-Switcher */}
            <div style={styles.roleSwitcherWrap} title="Switch active dashboard role perspective">
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Role:
              </span>
              <select
                value={rolePerspective}
                onChange={(e) => {
                  setRolePerspective(e.target.value);
                  fetchRoleMetrics(e.target.value);
                }}
                style={styles.roleSelectPill}
              >
                <option value="Employee">Employee (Author)</option>
                <option value="Reviewer">Reviewer (Stage 1)</option>
                <option value="Manager">Manager (Stage 2)</option>
                <option value="Administrator">Administrator (Audit/Sec)</option>
              </select>
            </div>

            {/* Circular Notification Button */}
            <button
              type="button"
              style={styles.notificationBtn}
              title="Notifications Center"
              onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--secondary-container)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-surface-container-high)";
              }}
            >
              <Bell size={18} color={unreadNotifsCount > 0 ? "var(--primary)" : "var(--text-secondary)"} />
              {unreadNotifsCount > 0 && (
                <div style={styles.notificationBadgePill}>
                  {unreadNotifsCount > 9 ? "9+" : unreadNotifsCount}
                </div>
              )}
            </button>

            {/* User Profile Pill Chip */}
            <div style={styles.profileWrapper}>
              <div
                style={styles.profileChip}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--secondary-container)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-surface-container-high)";
                }}
              >
                <div style={styles.avatarCircle}>{initials}</div>
                <div style={styles.profileInfo}>
                  <span style={styles.profileName}>
                    {user?.name || "Admin User"}
                  </span>
                  <span style={styles.profileRole}>
                    {user?.role_name || "Employee"}
                  </span>
                </div>
                <ChevronDown size={15} color="var(--text-secondary)" />
              </div>

              {/* Profile Dropdown Sheet with MD3 Organic Radius */}
              {showProfileMenu && (
                <div style={styles.dropdownMenu} className="animate-fade-in">
                  <div style={styles.dropdownHeader}>
                    <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      {user?.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        marginTop: "2px",
                      }}
                    >
                      {user?.email}
                    </div>
                  </div>
                  <button
                    style={styles.dropdownItem}
                    onClick={() => {
                      setActiveNav("Profile");
                      setShowProfileMenu(false);
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-surface-container)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <User size={16} color="var(--primary)" />
                    <span>My Profile</span>
                  </button>
                  <button
                    style={styles.dropdownItem}
                    onClick={() => {
                      setActiveNav("Settings");
                      setShowProfileMenu(false);
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-surface-container)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <Settings size={16} color="var(--primary)" />
                    <span>Settings & Config</span>
                  </button>
                  <div style={styles.dropdownDivider} />
                  <button
                    style={{
                      ...styles.dropdownItem,
                      color: "var(--accent-rose)",
                    }}
                    onClick={onLogout}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--accent-rose-subtle)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic View Area */}
        <main style={styles.contentArea}>
          {activeNav === "Knowledge Repository" && (
            <KnowledgeRepository
              user={user}
              onNavigate={(dest) => setActiveNav(dest)}
              apiBase={API_BASE}
            />
          )}

          {activeNav === "My Decisions" && (
            <DecisionsHub user={user} apiBase={API_BASE} />
          )}

          {activeNav === "Approvals" && (
            <ApprovalWorkflowView
              user={user}
              apiBase={API_BASE}
              onNavigateDecision={() => setActiveNav("My Decisions")}
            />
          )}

          {activeNav === "Audit & Compliance" && (
            <AuditComplianceView apiBase={API_BASE} />
          )}

          {(activeNav === "Analytics & Reports" || activeNav === "Analytics") && (
            <ReportsAnalyticsView apiBase={API_BASE} />
          )}

          {activeNav === "Discussions" && (
            <DiscussionsView
              onSelectDecision={() => setActiveNav("My Decisions")}
              apiBase={API_BASE}
            />
          )}

          {/* =====================================================================
              DASHBOARD OVERVIEW HOME (ROLE-BASED GOVERNANCE & METRICS)
              ===================================================================== */}
          {activeNav === "Dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* Material You 36px Hero Banner with Role Perspective Selection */}
              <div style={styles.overviewBanner}>
                <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
                  <div style={styles.avatarLarge}>{initials}</div>
                  <div>
                    <div style={styles.bannerBadge}>
                      <Sparkles size={13} color="var(--primary)" />
                      <span>EXPERT DECISION REPLAY PLATFORM &bull; GOVERNANCE SUITE</span>
                    </div>
                    <h1 style={styles.bannerTitle}>
                      Welcome back, {user?.name || "User"}!
                    </h1>
                    <p style={styles.bannerSubtitle}>
                      Viewing dynamic dashboard perspective as <strong>{rolePerspective}</strong>. Replay strategic alternatives, manage two-stage approvals, and monitor immutable compliance trails.
                    </p>

                    {/* Role Selector Chips */}
                    <div style={styles.roleChipsRow}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Perspective:
                      </span>
                      {["Employee", "Reviewer", "Manager", "Administrator"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          style={{
                            ...styles.roleChipBtn,
                            backgroundColor: rolePerspective === r ? "var(--primary)" : "var(--bg-surface-container-high)",
                            color: rolePerspective === r ? "#ffffff" : "var(--text-secondary)",
                            boxShadow: rolePerspective === r ? "0 2px 8px rgba(103, 80, 164, 0.3)" : "none",
                          }}
                          onClick={() => {
                            setRolePerspective(r);
                            fetchRoleMetrics(r);
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignSelf: "flex-start" }}>
                  {rolePerspective === "Reviewer" ? (
                    <MD3Button
                      variant="filled"
                      size="md"
                      onClick={() => setActiveNav("Approvals")}
                      icon={<CheckSquare size={17} />}
                    >
                      Stage 1 Review Queue ({pendingApprovalsCount})
                    </MD3Button>
                  ) : rolePerspective === "Manager" ? (
                    <MD3Button
                      variant="filled"
                      size="md"
                      onClick={() => setActiveNav("Approvals")}
                      icon={<CheckCircle2 size={17} />}
                    >
                      Stage 2 Sign-off Queue ({pendingApprovalsCount})
                    </MD3Button>
                  ) : rolePerspective === "Administrator" ? (
                    <MD3Button
                      variant="filled"
                      size="md"
                      onClick={() => setActiveNav("Audit & Compliance")}
                      icon={<ShieldCheck size={17} />}
                    >
                      Audit & Security Logs
                    </MD3Button>
                  ) : (
                    <MD3Button
                      variant="filled"
                      size="md"
                      onClick={() => setActiveNav("My Decisions")}
                      icon={<GitPullRequest size={17} />}
                    >
                      My Decisions Hub
                    </MD3Button>
                  )}

                  <MD3Button
                    variant="tonal"
                    size="md"
                    onClick={() => setActiveNav("Analytics & Reports")}
                    icon={<BarChart3 size={17} />}
                  >
                    Reports & Analytics
                  </MD3Button>
                </div>
              </div>

              {/* Dynamic Role-Based KPI Metrics Grid */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={styles.sectionHeader}>
                    {rolePerspective} Operational Indicators
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Real-time governance telemetry
                  </span>
                </div>

                <div style={styles.roleKpiGrid}>
                  {rolePerspective === "Employee" && (
                    <>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>My Authored Decisions</span>
                          <div style={styles.statIconBadgeIndigo}><GitPullRequest size={16} color="var(--primary)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.my_decisions_total ?? 8}</div>
                        <div style={styles.statSub}>Total records formulated</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Pending Tasks / In Review</span>
                          <div style={styles.statIconBadgeCyan}><Clock size={16} color="var(--secondary)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.pending_tasks ?? 4}</div>
                        <div style={styles.statSub}>Drafts & awaiting verification</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Approved & Live</span>
                          <div style={styles.statIconBadgeEmerald}><CheckCircle2 size={16} color="var(--accent-emerald)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.my_approved ?? 2}</div>
                        <div style={styles.statSub}>Replay knowledge preserved</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Review Pipeline</span>
                          <div style={styles.statIconBadgeIndigo}><Activity size={16} color="var(--primary)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.my_in_review ?? 2}</div>
                        <div style={styles.statSub}>Active in two-stage approval</div>
                      </div>
                    </>
                  )}

                  {rolePerspective === "Reviewer" && (
                    <>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Stage 1 Pending Reviews</span>
                          <div style={{ ...styles.statIconBadgeIndigo, backgroundColor: "rgba(239, 68, 68, 0.12)" }}>
                            <Clock size={16} color="#ef4444" />
                          </div>
                        </div>
                        <div style={{ ...styles.statNum, color: (roleMetrics?.kpis?.pending_stage1_reviews || 0) > 0 ? "#ef4444" : "var(--text-primary)" }}>
                          {roleMetrics?.kpis?.pending_stage1_reviews ?? pendingApprovalsCount}
                        </div>
                        <div style={styles.statSub}>Awaiting technical sign-off</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Completed Reviews</span>
                          <div style={styles.statIconBadgeEmerald}><CheckCircle2 size={16} color="var(--accent-emerald)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.completed_reviews ?? 3}</div>
                        <div style={styles.statSub}>Peer assessments dispatched</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Escalated Warnings</span>
                          <div style={{ ...styles.statIconBadgeIndigo, backgroundColor: "rgba(245, 158, 11, 0.12)" }}>
                            <AlertTriangle size={16} color="#d97706" />
                          </div>
                        </div>
                        <div style={{ ...styles.statNum, color: "#d97706" }}>
                          {roleMetrics?.kpis?.escalated_reviews ?? 1}
                        </div>
                        <div style={styles.statSub}>SLA threshold flagged</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Review Velocity</span>
                          <div style={styles.statIconBadgeIndigo}><TrendingUp size={16} color="var(--primary)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.review_velocity ?? "1.4 days"}</div>
                        <div style={styles.statSub}>Stage 1 turnaround benchmark</div>
                      </div>
                    </>
                  )}

                  {rolePerspective === "Manager" && (
                    <>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Stage 2 Executive Approvals</span>
                          <div style={{ ...styles.statIconBadgeIndigo, backgroundColor: "rgba(239, 68, 68, 0.12)" }}>
                            <CheckSquare size={16} color="#ef4444" />
                          </div>
                        </div>
                        <div style={{ ...styles.statNum, color: (roleMetrics?.kpis?.pending_approvals || 0) > 0 ? "#ef4444" : "var(--text-primary)" }}>
                          {roleMetrics?.kpis?.pending_approvals ?? 2}
                        </div>
                        <div style={styles.statSub}>Awaiting final signoff</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Team Decisions Active</span>
                          <div style={styles.statIconBadgeCyan}><Users size={16} color="var(--secondary)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.team_decisions_count ?? 8}</div>
                        <div style={styles.statSub}>Departmental scope</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Team Consensus Rate</span>
                          <div style={styles.statIconBadgeEmerald}><CheckCircle2 size={16} color="var(--accent-emerald)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.team_consensus_rate ?? "92.4%"}</div>
                        <div style={styles.statSub}>Multi-alternative alignment</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Average Turnaround</span>
                          <div style={styles.statIconBadgeIndigo}><TrendingUp size={16} color="var(--primary)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.avg_turnaround_days ?? 2.6}d</div>
                        <div style={styles.statSub}>Workflow cycle speed</div>
                      </div>
                    </>
                  )}

                  {rolePerspective === "Administrator" && (
                    <>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Active Platform Users</span>
                          <div style={styles.statIconBadgeIndigo}><Users size={16} color="var(--primary)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.total_users ?? 4}</div>
                        <div style={styles.statSub}>Employees, Reviewers, Managers</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Immutable Audit Logs</span>
                          <div style={styles.statIconBadgeCyan}><ShieldCheck size={16} color="var(--secondary)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.audit_logs_recorded ?? 16}</div>
                        <div style={styles.statSub}>100% Traceability across actions</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Security Events</span>
                          <div style={styles.statIconBadgeEmerald}><ShieldAlert size={16} color="var(--accent-emerald)" /></div>
                        </div>
                        <div style={styles.statNum}>{roleMetrics?.kpis?.security_alerts ?? 4}</div>
                        <div style={styles.statSub}>Auth & credential tracking</div>
                      </div>
                      <div style={styles.roleKpiCard}>
                        <div style={styles.statTopRow}>
                          <span style={styles.statLabel}>Governance Engine Health</span>
                          <div style={styles.statIconBadgeEmerald}><Activity size={16} color="var(--accent-emerald)" /></div>
                        </div>
                        <div style={{ ...styles.statNum, fontSize: "19px", color: "var(--accent-emerald)" }}>Operational</div>
                        <div style={styles.statSub}>FastAPI & SQLite cluster synchronized</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Material You Feature Cards Grid (24px Organic Cards) */}
              <div style={styles.dashboardGrid}>
                <div
                  style={styles.dashCard}
                  onClick={() => setActiveNav("My Decisions")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <div style={styles.cardIconWrapIndigo}>
                    <GitPullRequest size={22} color="var(--primary)" />
                  </div>
                  <h3 style={styles.dashCardTitle}>Decision Replay Engine</h3>
                  <p style={styles.dashCardText}>
                    Capture organizational decisions, evaluate competing alternatives with trade-off matrices, and preserve decision rationale.
                  </p>
                  <div style={styles.cardActionLinkIndigo}>
                    <span>Open Decisions Hub</span>
                    <ArrowRight size={15} />
                  </div>
                </div>

                <div
                  style={styles.dashCard}
                  onClick={() => setActiveNav("Approvals")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <div style={styles.cardIconWrapEmerald}>
                    <CheckSquare size={22} color="var(--accent-emerald)" />
                  </div>
                  <h3 style={styles.dashCardTitle}>Multi-Stage Approvals</h3>
                  <p style={styles.dashCardText}>
                    Two-tier governance pipeline: Stage 1 Peer Technical Review &rarr; Stage 2 Engineering Manager signoff with SLA escalations.
                  </p>
                  <div style={styles.cardActionLinkEmerald}>
                    <span>Manage Approvals</span>
                    <ArrowRight size={15} />
                  </div>
                </div>

                <div
                  style={styles.dashCard}
                  onClick={() => setActiveNav("Audit & Compliance")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <div style={styles.cardIconWrapCyan}>
                    <ShieldCheck size={22} color="var(--secondary)" />
                  </div>
                  <h3 style={styles.dashCardTitle}>Audit & Compliance</h3>
                  <p style={styles.dashCardText}>
                    Immutable event ledger tracking Activity, Security logins, Access downloads, and Decision state transitions.
                  </p>
                  <div style={styles.cardActionLinkCyan}>
                    <span>Inspect Compliance Logs</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>

              {/* Platform Vital Stats (Tonal Metric Cards) */}
              <div style={{ marginTop: "6px" }}>
                <h3 style={styles.sectionHeader}>Platform Vital Stats</h3>
                <div style={styles.statsGrid}>
                  <div style={styles.statBox}>
                    <div style={styles.statTopRow}>
                      <span style={styles.statLabel}>Consensus Rate</span>
                      <div style={styles.statIconBadgeEmerald}>
                        <CheckCircle2 size={16} color="var(--accent-emerald)" />
                      </div>
                    </div>
                    <div style={styles.statNum}>92.4%</div>
                    <div style={styles.statSub}>
                      <span style={styles.trendUp}>+4.2%</span> cross-functional alignment
                    </div>
                  </div>

                  <div style={styles.statBox}>
                    <div style={styles.statTopRow}>
                      <span style={styles.statLabel}>Avg. Turnaround</span>
                      <div style={styles.statIconBadgeIndigo}>
                        <TrendingUp size={16} color="var(--primary)" />
                      </div>
                    </div>
                    <div style={styles.statNum}>3.4 Days</div>
                    <div style={styles.statSub}>
                      <span style={styles.trendUp}>-1.2d</span> fast approval velocity
                    </div>
                  </div>

                  <div style={styles.statBox}>
                    <div style={styles.statTopRow}>
                      <span style={styles.statLabel}>Audit Traceability</span>
                      <div style={styles.statIconBadgeEmerald}>
                        <ShieldCheck size={16} color="var(--accent-emerald)" />
                      </div>
                    </div>
                    <div style={styles.statNum}>100%</div>
                    <div style={styles.statSub}>
                      Immutable event ledger active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TEAMS VIEW (MATERIAL YOU)
              ===================================================================== */}
          {activeNav === "Teams" && (
            <div style={styles.subviewCard}>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "500", color: "var(--text-primary)" }}>
                  Enterprise Teams & Working Groups
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
                  Active organizational departments contributing to expert knowledge bases.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
                {[
                  { name: "AI Team", lead: "Employee User", count: 8, decisions: 14, tag: "Machine Learning" },
                  { name: "Architecture", lead: "Admin User", count: 12, decisions: 26, tag: "System Design" },
                  { name: "Cloud Infrastructure", lead: "Employee User", count: 15, decisions: 32, tag: "DevOps & SRE" },
                  { name: "Security & Compliance", lead: "Admin User", count: 7, decisions: 19, tag: "InfoSec" },
                ].map((t, idx) => (
                  <div
                    key={idx}
                    style={styles.teamCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <span style={styles.teamTagPill}>{t.tag}</span>
                      <Users size={18} color="var(--primary)" />
                    </div>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "600", color: "var(--text-primary)" }}>
                      {t.name}
                    </h3>
                    <div style={{ fontSize: "13.5px", color: "var(--text-secondary)" }}>
                      Lead: <strong style={{ color: "var(--text-primary)" }}>{t.lead}</strong>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--primary)", marginTop: "14px", fontWeight: "600" }}>
                      {t.decisions} Decisions Documented &bull; {t.count} Members
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================================
              ANALYTICS VIEW (MATERIAL YOU)
              ===================================================================== */}
          {activeNav === "Analytics" && (
            <div style={styles.subviewCard}>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "500", color: "var(--text-primary)" }}>
                  Decision Analytics & Performance
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
                  Key governance indicators across approval velocity, alternatives consideration, and compliance.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
                <div style={styles.analyticsBox}>
                  <div style={styles.statNum}>3.4 days</div>
                  <div style={styles.statSub}>Avg. Turnaround Time</div>
                </div>
                <div style={styles.analyticsBox}>
                  <div style={styles.statNum}>92.4%</div>
                  <div style={styles.statSub}>Consensus Rate</div>
                </div>
                <div style={styles.analyticsBox}>
                  <div style={styles.statNum}>100%</div>
                  <div style={styles.statSub}>Audit Traceability</div>
                </div>
                <div style={styles.analyticsBox}>
                  <div style={styles.statNum}>2.8</div>
                  <div style={styles.statSub}>Avg. Alternatives per Decision</div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              PROFILE VIEW (MATERIAL YOU)
              ===================================================================== */}
          {activeNav === "Profile" && (
            <div style={{ ...styles.subviewCard, maxWidth: "660px" }}>
              <h2 style={{ margin: "0 0 22px 0", fontSize: "22px", fontWeight: "500", color: "var(--text-primary)" }}>
                User Profile & Account
              </h2>

              <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "26px" }}>
                <div style={styles.avatarLarge}>{initials}</div>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "19px", fontWeight: "600", color: "var(--text-primary)" }}>
                    {user?.name}
                  </h3>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    {user?.email}
                  </div>
                  <span style={styles.userRoleBadge}>{user?.role_name || "Employee"}</span>
                </div>
              </div>

              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>User ID:</span>
                <span style={styles.profileValue}>#{user?.id}</span>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Department Team:</span>
                <span style={styles.profileValue}>{user?.team_name || "AI Team"}</span>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Role Level:</span>
                <span style={styles.profileValue}>{user?.role_name} (Role ID: {user?.role_id})</span>
              </div>

              <div style={{ marginTop: "28px" }}>
                <MD3Button
                  variant="outlined"
                  size="md"
                  onClick={onLogout}
                  icon={<LogOut size={16} />}
                  style={{ color: "var(--accent-rose)", borderColor: "var(--accent-rose-subtle)" }}
                >
                  Sign Out
                </MD3Button>
              </div>
            </div>
          )}

          {/* =====================================================================
              SETTINGS VIEW (MATERIAL YOU)
              ===================================================================== */}
          {activeNav === "Settings" && (
            <div style={{ ...styles.subviewCard, maxWidth: "660px" }}>
              <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "500", color: "var(--text-primary)" }}>
                System Configuration
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 24px 0" }}>
                Active backend services, design tokens, and runtime environments.
              </p>

              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>FastAPI REST Endpoint:</span>
                <span style={styles.profileValue}>{API_BASE}</span>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Active Design System:</span>
                <span style={styles.profileValue}>Material You (MD3 Purple Seed #6750A4)</span>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Platform Milestone:</span>
                <span style={styles.profileValue}>Milestone 2 (Alternative Replay Active)</span>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Storage Engine:</span>
                <span style={styles.profileValue}>SQLite Database & Local Disk</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Material You Notification Center Modal / Drawer */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => {
          setIsNotificationCenterOpen(false);
          fetchNotificationCount();
        }}
        user={user}
        apiBase={API_BASE}
        onSelectNotification={(notif) => {
          setIsNotificationCenterOpen(false);
          if (notif.target_type === "approval" || notif.title?.toLowerCase().includes("approval") || notif.title?.toLowerCase().includes("review")) {
            setActiveNav("Approvals");
          } else {
            setActiveNav("My Decisions");
          }
        }}
      />
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "var(--bg-canvas)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
  },
  sidebar: {
    width: "270px",
    backgroundColor: "var(--bg-surface-container-low)",
    borderRight: "1px solid var(--border-subtle)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "24px 20px",
    borderBottom: "1px solid var(--border-subtle)",
  },
  brandIconWrap: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    backgroundColor: "var(--primary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "var(--shadow-sm)",
  },
  brandTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "var(--text-primary)",
    letterSpacing: "-0.2px",
  },
  versionBadge: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--secondary-container)",
    color: "var(--on-secondary-container)",
  },
  brandTagline: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginTop: "2px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "20px 14px",
    flex: 1,
  },
  navSectionLabel: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.6px",
    color: "var(--text-muted)",
    padding: "0 16px 8px 16px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "11px 18px",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all var(--md3-duration-short) var(--md3-easing)",
    textAlign: "left",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "var(--font-sans)",
  },
  navIconBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
  },
  activeGlowPip: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "var(--primary)",
  },
  sidebarFooter: {
    padding: "18px 14px",
    borderTop: "1px solid var(--border-subtle)",
  },
  milestoneCard: {
    padding: "14px 16px",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-subtle)",
  },
  milestoneBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: "4px",
  },
  statusDotLive: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-emerald)",
  },
  latencyTag: {
    marginLeft: "auto",
    fontSize: "11px",
    color: "var(--primary)",
    fontWeight: "600",
  },
  milestoneDesc: {
    fontSize: "11.5px",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.4,
  },
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
    backgroundColor: "var(--bg-canvas)",
  },
  header: {
    height: "70px",
    backgroundColor: "var(--bg-surface-glass)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid var(--border-subtle)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 36px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxSizing: "border-box",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "var(--bg-surface-container-high)",
    borderRadius: "var(--radius-full)",
    padding: "9px 18px",
    width: "420px",
    transition: "all var(--md3-duration-short) var(--md3-easing)",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    width: "100%",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
  },
  shortcutKbd: {
    display: "flex",
    gap: "3px",
    padding: "2px 7px",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-muted)",
    boxShadow: "var(--shadow-sm)",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  notificationBtn: {
    position: "relative",
    cursor: "pointer",
    width: "42px",
    height: "42px",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--bg-surface-container-high)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all var(--md3-duration-short) var(--md3-easing)",
    outline: "none",
  },
  notificationDot: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-rose)",
  },
  notificationBadgePill: {
    position: "absolute",
    top: "-3px",
    right: "-3px",
    backgroundColor: "var(--accent-rose)",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 5px",
    borderRadius: "var(--radius-full)",
    lineHeight: "1",
    boxShadow: "0 2px 5px rgba(220, 38, 38, 0.4)",
  },
  roleSwitcherWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--bg-surface-container)",
    padding: "5px 14px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--border-subtle)",
  },
  roleSelectPill: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  navBadgePill: {
    backgroundColor: "var(--accent-rose)",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    lineHeight: "1",
  },
  profileWrapper: {
    position: "relative",
  },
  profileChip: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    padding: "6px 14px 6px 6px",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--bg-surface-container-high)",
    transition: "all var(--md3-duration-short) var(--md3-easing)",
    userSelect: "none",
  },
  avatarCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--primary)",
    color: "var(--on-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "13px",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
  },
  profileName: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  profileRole: {
    fontSize: "11.5px",
    color: "var(--text-muted)",
  },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: "48px",
    width: "230px",
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    padding: "8px",
    zIndex: 1000,
    border: "1px solid var(--border-subtle)",
  },
  dropdownHeader: {
    padding: "12px 14px",
  },
  dropdownDivider: {
    height: "1px",
    backgroundColor: "var(--border-subtle)",
    margin: "6px 0",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "10px 14px",
    border: "none",
    background: "none",
    fontSize: "13.5px",
    color: "var(--text-primary)",
    cursor: "pointer",
    borderRadius: "var(--radius-full)",
    textAlign: "left",
    transition: "background-color var(--md3-duration-short) var(--md3-easing)",
    fontFamily: "var(--font-sans)",
  },
  contentArea: {
    padding: "36px 40px 60px 40px",
    flex: 1,
    boxSizing: "border-box",
  },
  overviewBanner: {
    padding: "32px 36px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "24px",
    borderRadius: "var(--radius-2xl)",
    backgroundColor: "var(--bg-surface-container)",
    boxShadow: "var(--shadow-sm)",
  },
  avatarLarge: {
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    backgroundColor: "var(--primary-container)",
    color: "var(--on-primary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "22px",
    boxShadow: "var(--shadow-sm)",
  },
  bannerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11.5px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    color: "var(--primary)",
    backgroundColor: "var(--primary-container)",
    padding: "3px 12px",
    borderRadius: "var(--radius-full)",
    marginBottom: "8px",
  },
  bannerTitle: {
    margin: "0 0 4px 0",
    fontSize: "26px",
    fontWeight: "600",
    color: "var(--text-primary)",
    letterSpacing: "-0.3px",
  },
  bannerSubtitle: {
    margin: 0,
    color: "var(--text-secondary)",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "22px",
  },
  dashCard: {
    padding: "26px",
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-card)",
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
    transition: "all var(--md3-duration-normal) var(--md3-easing)",
    border: "1px solid var(--border-subtle)",
  },
  cardIconWrapIndigo: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    backgroundColor: "var(--primary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "18px",
  },
  cardIconWrapCyan: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    backgroundColor: "var(--secondary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "18px",
  },
  cardIconWrapEmerald: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    backgroundColor: "var(--tertiary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "18px",
  },
  dashCardTitle: {
    margin: "0 0 8px 0",
    fontSize: "17.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  dashCardText: {
    fontSize: "13.5px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    margin: "0 0 20px 0",
    flex: 1,
  },
  cardActionLinkIndigo: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "var(--primary)",
    fontWeight: "600",
    fontSize: "13.5px",
  },
  cardActionLinkCyan: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "var(--secondary)",
    fontWeight: "600",
    fontSize: "13.5px",
  },
  cardActionLinkEmerald: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "var(--tertiary)",
    fontWeight: "600",
    fontSize: "13.5px",
  },
  sectionHeader: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: "0 0 16px 0",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "18px",
  },
  statBox: {
    padding: "22px",
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-card)",
  },
  statTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--text-secondary)",
  },
  statIconBadgeEmerald: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "rgba(22, 163, 74, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statIconBadgeIndigo: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statIconBadgeCyan: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--secondary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  statSub: {
    fontSize: "12.5px",
    color: "var(--text-muted)",
    marginTop: "4px",
  },
  trendUp: {
    color: "var(--accent-emerald)",
    fontWeight: "600",
  },
  subviewCard: {
    padding: "32px",
    borderRadius: "var(--radius-2xl)",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-card)",
  },
  teamCard: {
    padding: "22px",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-subtle)",
    transition: "all var(--md3-duration-normal) var(--md3-easing)",
  },
  teamTagPill: {
    fontSize: "11.5px",
    fontWeight: "600",
    backgroundColor: "var(--primary-container)",
    color: "var(--on-primary-container)",
    padding: "3px 10px",
    borderRadius: "var(--radius-full)",
  },
  analyticsBox: {
    padding: "24px",
    backgroundColor: "var(--bg-surface-container)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    textAlign: "center",
  },
  userRoleBadge: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "var(--primary-container)",
    color: "var(--on-primary-container)",
    borderRadius: "var(--radius-full)",
    fontSize: "12.5px",
    fontWeight: "600",
    marginTop: "8px",
  },
  profileRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px 0",
    borderBottom: "1px solid var(--border-subtle)",
    fontSize: "14px",
  },
  profileLabel: {
    color: "var(--text-secondary)",
  },
  profileValue: {
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  roleChipsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "14px",
    alignItems: "center",
  },
  roleChipBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 14px",
    borderRadius: "var(--radius-full)",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    transition: "all 0.15s ease",
  },
  roleKpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  roleKpiCard: {
    backgroundColor: "var(--bg-surface-container)",
    borderRadius: "var(--radius-xl)",
    padding: "20px 22px",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-sm)",
    transition: "all 0.2s ease",
  },
};

export default Dashboard;
