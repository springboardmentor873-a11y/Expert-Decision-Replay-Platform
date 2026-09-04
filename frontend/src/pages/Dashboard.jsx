import { useState } from "react";
import {
  BarChart3,
  Bell,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";

import "../styles/Dashboard.css";

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [moreMenu, setMoreMenu] = useState(null);

  const decisions = [
    {
      name: "Choose Project Architecture",
      team: "AI Team",
      status: "Under Review",
      created: "24 Mar 2026",
      icon: GitBranch,
    },
    {
      name: "Select Database for Platform",
      team: "Backend Team",
      status: "Draft",
      created: "20 Mar 2026",
      icon: Database,
    },
    {
      name: "AI Model Selection",
      team: "Research Team",
      status: "Approved",
      created: "18 Mar 2026",
      icon: Sparkles,
    },
    {
      name: "Cloud Deployment Strategy",
      team: "DevOps Team",
      status: "Draft",
      created: "15 Mar 2026",
      icon: Zap,
    },
    {
      name: "Data Privacy Compliance",
      team: "Security Team",
      status: "Rejected",
      created: "10 Mar 2026",
      icon: ShieldCheck,
    },
  ];

  const navigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Decisions", icon: FileText },
    { label: "Reviews", icon: Clock3 },
    { label: "Knowledge", icon: BookOpen },
    { label: "Teams", icon: Users },
    { label: "Discussions", icon: MessageCircle },
    { label: "Documents", icon: FileText },
    { label: "Analytics", icon: BarChart3 },
  ];

  const teamActivity = [
    {
      initials: "SP",
      name: "Sarah posted a new discussion",
      context: "Choose Project Architecture",
      time: "2 hours ago",
    },
    {
      initials: "RK",
      name: "Rahul uploaded a document",
      context: "Select Database for Platform",
      time: "5 hours ago",
    },
    {
      initials: "AP",
      name: "Anita commented on a decision",
      context: "AI Model Selection",
      time: "1 day ago",
    },
    {
      initials: "VM",
      name: "Vikram submitted a decision for review",
      context: "Cloud Deployment Strategy",
      time: "1 day ago",
    },
  ];

  const discussions = [
    {
      title: "Choosing the right AI framework",
      decision: "AI Model Selection",
      time: "2 hours ago",
    },
    {
      title: "Database performance comparison",
      decision: "Select Database for Platform",
      time: "5 hours ago",
    },
    {
      title: "Security considerations",
      decision: "Data Privacy Compliance",
      time: "1 day ago",
    },
  ];

  const teams = [
    { name: "AI Team", members: 5 },
    { name: "Backend Team", members: 4 },
    { name: "Research Team", members: 6 },
    { name: "Security Team", members: 4 },
  ];

  const filteredDecisions = decisions.filter((decision) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [decision.name, decision.team, decision.status, decision.created]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const handlePageChange = (page) => {
    setActivePage(page);
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
    setMoreMenu(null);
  };

  const showOverview = activePage === "Overview";

  const openCreateDecision = () => {
    setModal({
      title: "Create a new decision",
      eyebrow: "DECISION WORKSPACE",
      body: "Your decision composer will open here. Capture the question, reasoning, alternatives and supporting evidence in one place.",
      action: "Start decision",
    });
  };

  const openDecision = (decision) => {
    setMoreMenu(null);
    setModal({
      title: decision.name,
      eyebrow: decision.status.toUpperCase(),
      body: `Team: ${decision.team}. Created ${decision.created}. This detail view is ready for the full decision timeline, context, evidence and outcome.`,
      action: "Open decision",
    });
  };

  const openList = (title, body) => {
    setModal({ title, eyebrow: "WORKSPACE", body, action: "Continue" });
  };

  const openTeam = (team) => {
    setModal({
      title: team.name,
      eyebrow: "TEAM WORKSPACE",
      body: `${team.name} has ${team.members} members. Team activity, shared decisions and discussions can be managed from this workspace.`,
      action: "Open team",
    });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-grid" />
      <div className="dashboard-glow dashboard-glow-1" />
      <div className="dashboard-glow dashboard-glow-2" />

      <header className="mobile-header">
        <div className="dashboard-brand">
          <div className="brand-mark">
            <LockKeyhole size={16} strokeWidth={2.2} />
          </div>

          <span>
            Decision<span>Vault</span>
          </span>
        </div>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div>
          <div className="sidebar-brand">
            <div className="brand-mark">
              <LockKeyhole size={16} strokeWidth={2.2} />
            </div>

            <span>
              Decision<span>Vault</span>
            </span>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-label">Workspace</span>

            <nav className="dashboard-nav">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    className={
                      activePage === item.label ? "nav-item active" : "nav-item"
                    }
                    onClick={() => handlePageChange(item.label)}
                    type="button"
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                    {activePage === item.label && (
                      <span className="nav-indicator" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="sidebar-bottom">
          <button
            className={
              activePage === "Settings" ? "nav-item active" : "nav-item"
            }
            onClick={() => handlePageChange("Settings")}
            type="button"
          >
            <Settings size={17} />
            <span>Settings</span>
            {activePage === "Settings" && <span className="nav-indicator" />}
          </button>

          <button
            className="sidebar-profile"
            type="button"
            onClick={() =>
              openList(
                "Decision Workspace",
                "Workspace profile and settings can be managed here.",
              )
            }
          >
            <div className="profile-avatar">K</div>
            <div className="profile-info">
              <strong>Decision Workspace</strong>
              <span>Personal space</span>
            </div>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <header className="dashboard-topbar">
            <div className="dashboard-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search decisions, teams, documents..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search decisions, teams, documents"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="topbar-actions">
              <button
                className="icon-button"
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileOpen(false);
                }}
              >
                <Bell size={17} />
                <span className="notification-dot" />
              </button>

              <button
                className="topbar-profile"
                type="button"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
              >
                <span className="topbar-avatar">K</span>
                <span className="topbar-profile-copy">
                  <strong>John Doe</strong>
                  <small>Employee</small>
                </span>
                <ChevronRight size={15} className="profile-chevron" />
              </button>
            </div>

            {notificationsOpen && (
              <div className="topbar-popover notification-popover">
                <span className="popover-label">NOTIFICATIONS</span>
                <strong>3 items need your attention</strong>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    handlePageChange("Reviews");
                  }}
                >
                  Review pending decisions <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    handlePageChange("Discussions");
                  }}
                >
                  Open recent activity <ArrowUpRight size={13} />
                </button>
              </div>
            )}

            {profileOpen && (
              <div className="topbar-popover profile-popover">
                <span className="popover-label">ACCOUNT</span>
                <strong>John Doe</strong>
                <button
                  type="button"
                  onClick={() =>
                    openList(
                      "Profile",
                      "Profile details and workspace preferences can be managed here.",
                    )
                  }
                >
                  Profile <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange("Settings")}
                >
                  Settings <ArrowUpRight size={13} />
                </button>
              </div>
            )}
          </header>

          {showOverview ? (
            <>
              <section className="welcome-section">
                <div>
                  <div className="welcome-eyebrow">
                    <Sparkles size={13} />
                    Decision intelligence
                  </div>

                  <h1>Welcome back.</h1>

                  <p>
                    Manage decisions and reviews from one intelligent workspace.
                  </p>
                </div>

                <div className="welcome-actions">
                  <span className="dashboard-date">
                    Friday, 4 September 2026
                  </span>
                  <button
                    className="new-decision-button"
                    type="button"
                    onClick={openCreateDecision}
                  >
                    <span>+</span>
                    New decision
                  </button>
                </div>
              </section>

              <section className="stats-grid stats-grid-five">
                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() =>
                    openList(
                      "Total decisions",
                      "12 decisions are currently tracked in this workspace.",
                    )
                  }
                >
                  <div className="stat-top">
                    <div className="stat-icon">
                      <BarChart3 size={18} />
                    </div>
                    <span className="stat-period">All time</span>
                  </div>
                  <p>Total decisions</p>
                  <div className="stat-value">12</div>
                  <div className="stat-footer">
                    <span className="positive">+3</span>
                    <span>this month</span>
                  </div>
                </button>

                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() =>
                    openList(
                      "Draft decisions",
                      "4 decisions are still being developed.",
                    )
                  }
                >
                  <div className="stat-top">
                    <div className="stat-icon draft-stat-icon">
                      <FileText size={18} />
                    </div>
                    <span className="stat-period">Active</span>
                  </div>
                  <p>Draft</p>
                  <div className="stat-value">4</div>
                  <div className="stat-footer">
                    <span>Needs attention</span>
                  </div>
                </button>

                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() =>
                    openList(
                      "Decisions under review",
                      "3 decisions are currently waiting for review.",
                    )
                  }
                >
                  <div className="stat-top">
                    <div className="stat-icon review-stat-icon">
                      <Clock3 size={18} />
                    </div>
                    <span className="stat-period">Active</span>
                  </div>
                  <p>Under review</p>
                  <div className="stat-value">3</div>
                  <div className="stat-footer">
                    <span>In progress</span>
                  </div>
                </button>

                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() =>
                    openList(
                      "Approved decisions",
                      "4 decisions have been approved.",
                    )
                  }
                >
                  <div className="stat-top">
                    <div className="stat-icon success-icon">
                      <CheckCircle2 size={18} />
                    </div>
                    <span className="stat-period">Completed</span>
                  </div>
                  <p>Approved</p>
                  <div className="stat-value">4</div>
                  <div className="stat-footer">
                    <span className="positive">66%</span>
                    <span>approval rate</span>
                  </div>
                </button>

                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() =>
                    openList(
                      "Rejected decisions",
                      "1 decision requires changes before it can be approved.",
                    )
                  }
                >
                  <div className="stat-top">
                    <div className="stat-icon rejected-stat-icon">
                      <X size={18} />
                    </div>
                    <span className="stat-period">Action</span>
                  </div>
                  <p>Rejected</p>
                  <div className="stat-value">1</div>
                  <div className="stat-footer">
                    <span>Requires changes</span>
                  </div>
                </button>
              </section>

              <section className="dashboard-primary-grid">
                <section className="recent-section">
                  <div className="recent-header">
                    <div>
                      <span className="section-label">DECISION LOG</span>
                      <h2>Recent decisions</h2>
                    </div>

                    <div className="recent-actions">
                      <button
                        className="view-all"
                        type="button"
                        onClick={() => handlePageChange("Decisions")}
                      >
                        View all
                        <ChevronRight size={15} />
                      </button>

                      <button
                        className="compact-action"
                        type="button"
                        onClick={openCreateDecision}
                      >
                        <span>+</span>
                        Create decision
                      </button>
                    </div>
                  </div>

                  <div className="decision-table-head">
                    <span>Title</span>
                    <span>Team</span>
                    <span>Status</span>
                    <span>Created on</span>
                    <span>Actions</span>
                  </div>

                  <div className="decision-list">
                    {filteredDecisions.length > 0 ? (
                      filteredDecisions.map((decision) => {
                        const Icon = decision.icon;
                        const statusClass = decision.status
                          .toLowerCase()
                          .replaceAll(" ", "-");

                        return (
                          <div
                            className="decision-row decision-table-row"
                            key={decision.name}
                          >
                            <div className="decision-left">
                              <div className="decision-icon">
                                <Icon size={17} />
                              </div>

                              <div className="decision-info">
                                <strong>{decision.name}</strong>
                                <span>{decision.team}</span>
                              </div>
                            </div>

                            <span className="decision-team">
                              {decision.team}
                            </span>

                            <span className={`status status-${statusClass}`}>
                              <span />
                              {decision.status}
                            </span>

                            <span className="decision-date">
                              {decision.created}
                            </span>

                            <div className="decision-actions">
                              <button
                                className="decision-view-button"
                                type="button"
                                onClick={() => openDecision(decision)}
                                aria-label={`View ${decision.name}`}
                              >
                                View
                              </button>
                              <button
                                className="decision-more"
                                type="button"
                                onClick={() =>
                                  setMoreMenu(
                                    moreMenu === decision.name
                                      ? null
                                      : decision.name,
                                  )
                                }
                                aria-label={`More options for ${decision.name}`}
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              {moreMenu === decision.name && (
                                <div className="decision-more-menu">
                                  <button
                                    type="button"
                                    onClick={() => openDecision(decision)}
                                  >
                                    Open
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openList(
                                        "Edit decision",
                                        `Editing ${decision.name} will open the decision composer.`,
                                      )
                                    }
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMoreMenu(null)}
                                  >
                                    Close menu
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-search-state">
                        <Search size={18} />
                        <strong>No decisions found</strong>
                        <span>Try a different search term.</span>
                      </div>
                    )}
                  </div>

                  <button
                    className="decision-list-footer"
                    type="button"
                    onClick={() => handlePageChange("Decisions")}
                  >
                    View all decisions
                    <ChevronRight size={15} />
                  </button>
                </section>

                <section className="activity-column team-activity-column">
                  <div className="activity-heading">
                    <div>
                      <span className="section-label">TEAM ACTIVITY</span>
                      <h2>What’s happening</h2>
                    </div>
                    <button
                      className="view-all"
                      type="button"
                      onClick={() => handlePageChange("Discussions")}
                    >
                      View all
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="team-activity-list">
                    {teamActivity.map((item, index) => (
                      <div
                        className="team-activity-row"
                        key={`${item.initials}-${index}`}
                      >
                        <div className={`activity-avatar avatar-${index + 1}`}>
                          {item.initials}
                        </div>

                        <div className="team-activity-info">
                          <strong>{item.name}</strong>
                          <span>{item.context}</span>
                        </div>

                        <span className="activity-time">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </section>

              <section className="dashboard-lower-grid">
                <section className="status-card-panel">
                  <div className="lower-card-header">
                    <div>
                      <span className="section-label">OVERVIEW</span>
                      <h2>Decisions by status</h2>
                    </div>
                  </div>

                  <div className="status-chart-layout">
                    <div className="decision-donut">
                      <div className="decision-donut-center">
                        <strong>12</strong>
                        <span>Total</span>
                      </div>
                    </div>

                    <div className="status-legend">
                      <div>
                        <span className="legend-dot legend-draft" />
                        <span>Draft</span>
                        <strong>4 (33%)</strong>
                      </div>
                      <div>
                        <span className="legend-dot legend-review" />
                        <span>Under review</span>
                        <strong>3 (25%)</strong>
                      </div>
                      <div>
                        <span className="legend-dot legend-approved" />
                        <span>Approved</span>
                        <strong>4 (33%)</strong>
                      </div>
                      <div>
                        <span className="legend-dot legend-rejected" />
                        <span>Rejected</span>
                        <strong>1 (8%)</strong>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="lower-panel">
                  <div className="lower-card-header">
                    <div>
                      <span className="section-label">TEAM CONVERSATIONS</span>
                      <h2>Recent discussions</h2>
                    </div>
                    <button
                      className="view-all"
                      type="button"
                      onClick={() => handlePageChange("Discussions")}
                    >
                      View all
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="discussion-list">
                    {discussions.map((discussion) => (
                      <div className="discussion-row" key={discussion.title}>
                        <div className="discussion-icon">
                          <MessageCircle size={15} />
                        </div>
                        <div className="discussion-info">
                          <strong>{discussion.title}</strong>
                          <span>{discussion.decision}</span>
                        </div>
                        <span className="discussion-time">
                          {discussion.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="lower-panel">
                  <div className="lower-card-header">
                    <div>
                      <span className="section-label">WORKSPACES</span>
                      <h2>My teams</h2>
                    </div>
                    <button
                      className="view-all"
                      type="button"
                      onClick={() => handlePageChange("Teams")}
                    >
                      View all
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="team-list">
                    {teams.map((team) => (
                      <button
                        className="team-row"
                        key={team.name}
                        type="button"
                        onClick={() => openTeam(team)}
                      >
                        <div className="team-icon">
                          <Users size={16} />
                        </div>
                        <div className="team-info">
                          <strong>{team.name}</strong>
                          <span>{team.members} members</span>
                        </div>
                        <ChevronRight size={14} className="team-row-arrow" />
                      </button>
                    ))}
                  </div>
                </section>
              </section>

              <section className="activity-section">
                <div className="activity-column">
                  <div className="activity-heading">
                    <div>
                      <span className="section-label">NEEDS ATTENTION</span>
                      <h2>Decision activity</h2>
                    </div>
                    <span className="activity-count">3 items</span>
                  </div>

                  <div className="activity-list">
                    <div className="activity-row">
                      <div className="activity-status review" />
                      <div className="activity-info">
                        <strong>Cloud infrastructure</strong>
                        <span>Review required</span>
                      </div>
                      <span className="activity-time">Today</span>
                    </div>

                    <div className="activity-row">
                      <div className="activity-status draft" />
                      <div className="activity-info">
                        <strong>Database architecture</strong>
                        <span>Still in draft</span>
                      </div>
                      <span className="activity-time">2 days</span>
                    </div>
                  </div>
                </div>

                <div className="activity-column">
                  <div className="activity-heading">
                    <div>
                      <span className="section-label">UPCOMING</span>
                      <h2>Reviews</h2>
                    </div>
                    <button
                      className="view-all"
                      type="button"
                      onClick={() => handlePageChange("Reviews")}
                    >
                      View all
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="activity-list">
                    <div className="activity-row">
                      <div className="review-date">
                        <strong>02</strong>
                        <span>SEP</span>
                      </div>
                      <div className="activity-info">
                        <strong>Authentication strategy</strong>
                        <span>Decision review</span>
                      </div>
                      <span className="activity-time">10:30 AM</span>
                    </div>

                    <div className="activity-row">
                      <div className="review-date">
                        <strong>03</strong>
                        <span>SEP</span>
                      </div>
                      <div className="activity-info">
                        <strong>API architecture</strong>
                        <span>Team review</span>
                      </div>
                      <span className="activity-time">2:00 PM</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="insight-card">
                <div className="insight-icon">
                  <Sparkles size={20} />
                </div>

                <div className="insight-content">
                  <span>DECISIONVAULT INSIGHT</span>
                  <h3>Your decisions are becoming a knowledge graph.</h3>
                  <p>
                    Connect assumptions, evidence and outcomes to make future
                    decisions easier to understand.
                  </p>
                </div>

                <button
                  className="insight-button"
                  type="button"
                  onClick={() => handlePageChange("Knowledge")}
                >
                  Explore knowledge
                  <ChevronRight size={16} />
                </button>
              </section>
            </>
          ) : (
            <section className="placeholder-page">
              <span className="section-label">WORKSPACE</span>
              <h1>{activePage}</h1>
              <p>
                This workspace area is ready for the next DecisionVault module.
              </p>
            </section>
          )}

          <footer className="dashboard-footer">
            <span>DecisionVault</span>
            <span>Decisions, preserved.</span>
          </footer>
        </div>
      </main>

      {modal && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setModal(null)}
        >
          <div
            className="dashboard-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="dashboard-modal-close"
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <X size={17} />
            </button>
            <span className="modal-eyebrow">{modal.eyebrow}</span>
            <h2>{modal.title}</h2>
            <p>{modal.body}</p>
            <div className="modal-actions">
              <button
                className="modal-secondary"
                type="button"
                onClick={() => setModal(null)}
              >
                Close
              </button>
              <button
                className="modal-primary"
                type="button"
                onClick={() => {
                  setModal(null);
                  if (
                    modal.title.toLowerCase().includes("decision") ||
                    modal.action === "Start decision"
                  )
                    setActivePage("Decisions");
                }}
              >
                {modal.action}
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
