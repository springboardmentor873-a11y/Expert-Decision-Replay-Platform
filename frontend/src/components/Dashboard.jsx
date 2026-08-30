import { useState } from "react";
import {
  BarChart3,
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
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import "../styles/Dashboard.css";

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const decisions = [
    {
      name: "Database architecture",
      status: "Draft",
      icon: Database,
    },
    {
      name: "Cloud infrastructure",
      status: "Review",
      icon: GitBranch,
    },
    {
      name: "Authentication strategy",
      status: "Approved",
      icon: ShieldCheck,
    },
  ];

  const navigation = [
    {
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      label: "Decisions",
      icon: FileText,
    },
    {
      label: "Reviews",
      icon: Clock3,
    },
    {
      label: "Knowledge",
      icon: BookOpen,
    },
  ];

  const handlePageChange = (page) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  return (
    <div className="dashboard">
      {/* Background */}
      <div className="dashboard-grid" />
      <div className="dashboard-glow dashboard-glow-1" />
      <div className="dashboard-glow dashboard-glow-2" />

      {/* =========================================
          MOBILE HEADER
      ========================================= */}

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

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div>
          {/* Logo */}
          <div className="sidebar-brand">
            <div className="brand-mark">
              <LockKeyhole size={16} strokeWidth={2.2} />
            </div>

            <span>
              Decision<span>Vault</span>
            </span>
          </div>

          {/* Navigation */}
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

        {/* Sidebar bottom */}
        <div className="sidebar-bottom">
          <button
            className={
              activePage === "Settings" ? "nav-item active" : "nav-item"
            }
            onClick={() => handlePageChange("Settings")}
          >
            <Settings size={17} />

            <span>Settings</span>

            {activePage === "Settings" && <span className="nav-indicator" />}
          </button>

          <div className="sidebar-profile">
            <div className="profile-avatar">K</div>

            <div className="profile-info">
              <strong>Decision Workspace</strong>
              <span>Personal space</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================
          MAIN CONTENT
      ========================================= */}

      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* =====================================
              WELCOME
          ===================================== */}

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

            <button className="new-decision-button">
              <span>+</span>
              New decision
            </button>
          </section>

          {/* =====================================
              STATISTICS
          ===================================== */}

          <section className="stats-grid">
            {/* Total */}
            <div className="stat-card">
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
            </div>

            {/* Review */}
            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-icon warning-icon">
                  <Clock3 size={18} />
                </div>

                <span className="stat-period">Active</span>
              </div>

              <p>Under review</p>

              <div className="stat-value">4</div>

              <div className="stat-footer">
                <span>Needs attention</span>
              </div>
            </div>

            {/* Approved */}
            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-icon success-icon">
                  <CheckCircle2 size={18} />
                </div>

                <span className="stat-period">Completed</span>
              </div>

              <p>Approved</p>

              <div className="stat-value">8</div>

              <div className="stat-footer">
                <span className="positive">66%</span>

                <span>approval rate</span>
              </div>
            </div>
          </section>

          {/* =====================================
              RECENT DECISIONS
          ===================================== */}

          <section className="recent-section">
            <div className="recent-header">
              <div>
                <span className="section-label">DECISION LOG</span>

                <h2>Recent decisions</h2>
              </div>

              <button className="view-all">
                View all
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="decision-list">
              {decisions.map((decision, index) => {
                const Icon = decision.icon;

                return (
                  <div className="decision-row" key={index}>
                    <div className="decision-left">
                      <div className="decision-icon">
                        <Icon size={17} />
                      </div>

                      <div className="decision-info">
                        <strong>{decision.name}</strong>

                        <span>
                          Decision #{String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    <div className="decision-right">
                      <span
                        className={`status status-${decision.status.toLowerCase()}`}
                      >
                        <span />
                        {decision.status}
                      </span>

                      <ChevronRight size={16} className="decision-arrow" />
                    </div>
                  </div>
                );
              })}
            </div>
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
                <button className="view-all">
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

          {/* =====================================
              INSIGHT
          ===================================== */}

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

            <button className="insight-button">
              Explore knowledge
              <ChevronRight size={16} />
            </button>
          </section>

          {/* Small footer */}
          <footer className="dashboard-footer">
            <span>DecisionVault</span>
            <span>Decisions, preserved.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
