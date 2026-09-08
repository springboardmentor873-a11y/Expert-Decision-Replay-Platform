import React, { useState } from "react";
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
  ShieldCheck
} from "lucide-react";
import KnowledgeRepository from "./components/KnowledgeRepository";
import DecisionsHub from "./components/DecisionsHub";
import DiscussionsView from "./components/DiscussionsView";

const API_BASE = "http://127.0.0.1:8000";

function Dashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("Knowledge Repository");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Decisions", icon: GitPullRequest },
    { name: "Discussions", icon: MessageSquare },
    { name: "Knowledge Repository", icon: BookOpen },
    { name: "Teams", icon: Users },
    { name: "Analytics", icon: BarChart3 },
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
    : "IP";

  return (
    <div style={styles.layout}>
      {/* Left Sidebar */}
      <aside style={styles.sidebar}>
        {/* Brand Header */}
        <div style={styles.brand}>
          <div style={styles.brandIconWrap}>
            <Brain size={26} color="#38bdf8" />
          </div>
          <div>
            <div style={styles.brandTitle}>DecisionIntel</div>
            <div style={styles.brandTagline}>Smarter Decisions Together</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.name;
            return (
              <button
                key={item.name}
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive ? "#1d4ed8" : "transparent",
                  color: isActive ? "#ffffff" : "#94a3b8",
                  fontWeight: isActive ? "600" : "500",
                }}
                onClick={() => setActiveNav(item.name)}
              >
                <Icon size={18} color={isActive ? "#ffffff" : "#94a3b8"} />
                <span>{item.name}</span>
                {isActive && <div style={styles.activeIndicator} />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Milestone Indicator */}
        <div style={styles.sidebarFooter}>
          <div style={styles.milestoneBadge}>
            <ShieldCheck size={14} color="#38bdf8" />
            <span>Milestone 2 Active</span>
          </div>
          <p style={styles.milestoneDesc}>
            Knowledge Graph & Alternative Replay enabled.
          </p>
        </div>
      </aside>

      {/* Main App Container */}
      <div style={styles.mainWrapper}>
        {/* Top Header Bar */}
        <header style={styles.header}>
          {/* Global Search */}
          <div style={styles.searchBar}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search documents, decisions, topics, people..."
              style={styles.searchInput}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          {/* Right Header Actions */}
          <div style={styles.headerRight}>
            {/* Notification Bell */}
            <div style={styles.notificationBtn} title="Notifications">
              <Bell size={18} color="#64748b" />
              <div style={styles.notificationDot} />
            </div>

            {/* User Profile Chip */}
            <div style={styles.profileWrapper}>
              <div
                style={styles.profileChip}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div style={styles.avatarCircle}>{initials}</div>
                <div style={styles.profileInfo}>
                  <span style={styles.profileName}>{user?.name || "Ipsita Priyadarshini"}</span>
                  <span style={styles.profileRole}>{user?.role_name || "Employee"}</span>
                </div>
                <ChevronDown size={14} color="#94a3b8" />
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div style={styles.dropdownMenu} className="animate-fade-in">
                  <div style={styles.dropdownHeader}>
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{user?.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{user?.email}</div>
                  </div>
                  <button
                    style={styles.dropdownItem}
                    onClick={() => {
                      setActiveNav("Profile");
                      setShowProfileMenu(false);
                    }}
                  >
                    <User size={15} />
                    <span>My Profile</span>
                  </button>
                  <button
                    style={{ ...styles.dropdownItem, color: "#dc2626" }}
                    onClick={onLogout}
                  >
                    <LogOut size={15} />
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

          {activeNav === "Discussions" && (
            <DiscussionsView
              onSelectDecision={() => setActiveNav("My Decisions")}
              apiBase={API_BASE}
            />
          )}

          {activeNav === "Dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={styles.overviewBanner}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={styles.avatarLarge}>{initials}</div>
                  <div>
                    <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#0f172a" }}>
                      Welcome back, {user?.name || "User"}!
                    </h1>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                      Expert Decision Intelligence Platform &bull; Organization Workspace
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    style={styles.actionBtnPrimary}
                    onClick={() => setActiveNav("Knowledge Repository")}
                  >
                    <BookOpen size={16} />
                    <span>Knowledge Repository</span>
                  </button>
                  <button
                    style={styles.actionBtnSecondary}
                    onClick={() => setActiveNav("My Decisions")}
                  >
                    <GitPullRequest size={16} />
                    <span>My Decisions</span>
                  </button>
                </div>
              </div>

              {/* Quick links & summary */}
              <div style={styles.dashboardGrid}>
                <div style={styles.dashCard}>
                  <h3 style={styles.dashCardTitle}>Decision Replay Engine</h3>
                  <p style={styles.dashCardText}>
                    Capture organizational decisions, evaluate competing alternatives, and retain complete audit history.
                  </p>
                  <button
                    style={styles.cardLinkBtn}
                    onClick={() => setActiveNav("My Decisions")}
                  >
                    Open Decision Manager &rarr;
                  </button>
                </div>

                <div style={styles.dashCard}>
                  <h3 style={styles.dashCardTitle}>Knowledge Graph Visualizer</h3>
                  <p style={styles.dashCardText}>
                    Explore node-link graphs connecting teams, documents, decisions, and outcomes across past projects.
                  </p>
                  <button
                    style={styles.cardLinkBtn}
                    onClick={() => setActiveNav("Knowledge Repository")}
                  >
                    View Knowledge Graph &rarr;
                  </button>
                </div>

                <div style={styles.dashCard}>
                  <h3 style={styles.dashCardTitle}>Collaboration & Meeting Notes</h3>
                  <p style={styles.dashCardText}>
                    Threaded discussions, stakeholder review logs, and executive rationale documentation.
                  </p>
                  <button
                    style={styles.cardLinkBtn}
                    onClick={() => setActiveNav("Discussions")}
                  >
                    Open Discussions &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeNav === "Teams" && (
            <div style={styles.dashCard}>
              <h2 style={{ margin: "0 0 8px 0" }}>Enterprise Teams & Departments</h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>
                Active organizational units contributing to expert decisions.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                {[
                  { name: "AI Team", lead: "Rahul Mehta", count: 8, decisions: 14 },
                  { name: "Architecture", lead: "Sarah Khan", count: 12, decisions: 26 },
                  { name: "Cloud Infrastructure", lead: "Vikram Singh", count: 15, decisions: 32 },
                  { name: "Security & Compliance", lead: "John Doe", count: 7, decisions: 19 },
                ].map((t, idx) => (
                  <div key={idx} style={{ padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#0f172a" }}>{t.name}</h3>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>Team Lead: {t.lead}</div>
                    <div style={{ fontSize: "12px", color: "#2563eb", marginTop: "8px", fontWeight: "600" }}>
                      {t.decisions} Decisions Captured &bull; {t.count} Members
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === "Analytics" && (
            <div style={styles.dashCard}>
              <h2 style={{ margin: "0 0 8px 0" }}>Decision Analytics & Velocity</h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>
                Key performance metrics across decision approval turnaround and stakeholder participation.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div style={styles.statBox}>
                  <div style={styles.statNum}>3.4 days</div>
                  <div style={styles.statSub}>Avg. Approval Turnaround</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statNum}>92.4%</div>
                  <div style={styles.statSub}>Consensus Rate</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statNum}>100%</div>
                  <div style={styles.statSub}>Audit Log Integrity</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statNum}>2.8</div>
                  <div style={styles.statSub}>Avg. Alternatives per Decision</div>
                </div>
              </div>
            </div>
          )}

          {activeNav === "Profile" && (
            <div style={{ ...styles.dashCard, maxWidth: "600px" }}>
              <h2 style={{ margin: "0 0 16px 0" }}>User Profile & Role</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={styles.avatarLarge}>{initials}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>{user?.name}</h3>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>{user?.email}</div>
                  <span style={styles.userRoleBadge}>{user?.role_name || "Employee"}</span>
                </div>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Account ID:</span>
                <span style={styles.profileValue}>#{user?.id}</span>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Assigned Team:</span>
                <span style={styles.profileValue}>{user?.team_name || "AI Team"}</span>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Role Level:</span>
                <span style={styles.profileValue}>{user?.role_name} (ID: {user?.role_id})</span>
              </div>
              <div style={{ marginTop: "24px" }}>
                <button style={styles.logoutBtn} onClick={onLogout}>
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {activeNav === "Settings" && (
            <div style={{ ...styles.dashCard, maxWidth: "600px" }}>
              <h2 style={{ margin: "0 0 8px 0" }}>Platform Settings</h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>
                System configuration, API endpoints, and knowledge graph preferences.
              </p>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>FastAPI Backend:</span>
                <span style={styles.profileValue}>{API_BASE}</span>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Milestone Version:</span>
                <span style={styles.profileValue}>Milestone 2 (Week 3-4 Complete)</span>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Local Storage Engine:</span>
                <span style={styles.profileValue}>Local Disk (uploads/)</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  sidebar: {
    width: "240px",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    borderRight: "1px solid #1e293b",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px 20px",
    borderBottom: "1px solid #1e293b",
  },
  brandIconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  brandTagline: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "1px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "16px 12px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 14px",
    border: "none",
    borderRadius: "8px",
    fontSize: "13.5px",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.15s ease",
    textAlign: "left",
    width: "100%",
  },
  activeIndicator: {
    position: "absolute",
    right: "0",
    width: "3px",
    height: "18px",
    backgroundColor: "#38bdf8",
    borderRadius: "2px 0 0 2px",
  },
  sidebarFooter: {
    padding: "16px",
    borderTop: "1px solid #1e293b",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  milestoneBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#38bdf8",
    marginBottom: "4px",
  },
  milestoneDesc: {
    fontSize: "11px",
    color: "#64748b",
    margin: 0,
    lineHeight: 1.3,
  },
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
  },
  header: {
    height: "64px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "8px 16px",
    width: "420px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "13px",
    width: "100%",
    color: "#0f172a",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  notificationBtn: {
    position: "relative",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "8px",
  },
  notificationDot: {
    position: "absolute",
    top: "5px",
    right: "6px",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
  },
  profileWrapper: {
    position: "relative",
  },
  profileChip: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "background 0.15s ease",
  },
  avatarCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "13px",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
  },
  profileName: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#0f172a",
  },
  profileRole: {
    fontSize: "11px",
    color: "#64748b",
  },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: "48px",
    width: "200px",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    padding: "6px",
    zIndex: 1000,
  },
  dropdownHeader: {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    marginBottom: "4px",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "8px 12px",
    border: "none",
    background: "none",
    fontSize: "13px",
    color: "#334155",
    cursor: "pointer",
    borderRadius: "6px",
    textAlign: "left",
  },
  contentArea: {
    padding: "28px 32px 60px 32px",
    flex: 1,
  },
  overviewBanner: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  avatarLarge: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "20px",
  },
  actionBtnPrimary: {
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
  actionBtnSecondary: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 18px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  dashCard: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  dashCardTitle: {
    margin: "0 0 6px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  dashCardText: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
    margin: "0 0 16px 0",
  },
  cardLinkBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    padding: 0,
  },
  statBox: {
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },
  statNum: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2563eb",
  },
  statSub: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  userRoleBadge: {
    display: "inline-block",
    padding: "2px 8px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
    marginTop: "4px",
  },
  profileRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
  },
  profileLabel: {
    color: "#64748b",
  },
  profileValue: {
    fontWeight: "600",
    color: "#0f172a",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default Dashboard;
