import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, getCurrentUser, logout } from "../api";
import "./dashboard.css";

function statusClass(status) {
  return `status-badge status-${(status || "Draft").replace(/\s+/g, "-")}`;
}

function Dashboard() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadDecisions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/decisions`);

        if (!response.ok) {
          throw new Error("Failed to load decisions");
        }

        const data = await response.json();

        setDecisions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Cannot connect to backend");
      } finally {
        setLoading(false);
      }
    };

    loadDecisions();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredDecisions = decisions.filter((decision) => {
    const searchText = `
      ${decision.title || ""}
      ${decision.problem || ""}
      ${decision.category || ""}
    `.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" ||
      decision.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalDecisions = decisions.length;

  const draftCount = decisions.filter(
    (d) => d.status === "Draft"
  ).length;

  const reviewCount = decisions.filter(
    (d) => d.status === "Under Review"
  ).length;

  const approvedCount = decisions.filter(
    (d) => d.status === "Approved"
  ).length;

  const rejectedCount = decisions.filter(
    (d) => d.status === "Rejected"
  ).length;

  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="dashboard-sidebar">

        {/* BRAND */}

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            ED
          </div>

          <div>
            <h2>Expert Decision</h2>
            <p>Replay Platform</p>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          <Link
            to="/dashboard"
            className="sidebar-nav-item active"
          >
            <span className="sidebar-icon">⌂</span>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/dashboard"
            className="sidebar-nav-item"
          >
            <span className="sidebar-icon">✓</span>
            <span>Decisions</span>
          </Link>

          <Link
            to="/decisions/new"
            className="sidebar-nav-item"
          >
            <span className="sidebar-icon">＋</span>
            <span>Create Decision</span>
          </Link>

          <Link
            to="/teams"
            className="sidebar-nav-item"
          >
            <span className="sidebar-icon">♧</span>
            <span>Teams</span>
          </Link>

          <Link
            to="/discussions"
            className="sidebar-nav-item"
          >
            <span className="sidebar-icon">☷</span>
            <span>My Discussions</span>
          </Link>

          <Link
            to="/documents"
            className="sidebar-nav-item"
          >
            <span className="sidebar-icon">▤</span>
            <span>Documents</span>
          </Link>

          <Link
            to="/analytics"
            className="sidebar-nav-item"
          >
            <span className="sidebar-icon">▥</span>
            <span>Analytics</span>
          </Link>

          <Link
            to="/profile"
            className="sidebar-nav-item"
          >
            <span className="sidebar-icon">♙</span>
            <span>Profile</span>
          </Link>

          <Link
            to="/settings"
            className="sidebar-nav-item"
          >
            <span className="sidebar-icon">⚙</span>
            <span>Settings</span>
          </Link>

        </nav>

      </aside>

      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <main className="dashboard-main">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <header className="dashboard-header">

          <div className="header-left">

            <div className="mobile-logo">
              ED
            </div>

            <div>
              <h2>Expert Decision Replay</h2>

              <p>
                Knowledge &amp; Decision Intelligence Platform
              </p>
            </div>

          </div>

          <div className="header-right">

            <button
              className="notification-btn"
              type="button"
              title="Notifications"
            >
              🔔
            </button>

            <div className="header-user">

              <div className="header-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="header-user-info">
                <strong>
                  {user?.name || "User"}
                </strong>

                <span>
                  {user?.role || "Employee"}
                </span>
              </div>

              <span className="user-chevron">
                ▾
              </span>

            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Log out
            </button>

          </div>

        </header>

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <div className="dashboard-content">

          {/* WELCOME */}

          <section className="welcome-section">

            <div>

              <span className="eyebrow">
                DECISION WORKSPACE
              </span>

              <h1>
                Welcome back, {user?.name || "User"}!
              </h1>

              <p>
                Here's an overview of your decisions and team activity.
              </p>

            </div>

            <Link
              to="/decisions/new"
              className="new-decision-btn"
            >
              + Create Decision
            </Link>

          </section>

          {/* =================================================
              STATISTICS
          ================================================== */}

          <section className="stats-grid">

            {/* TOTAL */}

            <div className="stat-card">

              <div className="stat-icon blue">
                ▤
              </div>

              <div>
                <span>Total Decisions</span>
                <strong>{totalDecisions}</strong>
              </div>

            </div>

            {/* DRAFT */}

            <div className="stat-card">

              <div className="stat-icon orange">
                ✎
              </div>

              <div>
                <span>Draft</span>
                <strong>{draftCount}</strong>
              </div>

            </div>

            {/* UNDER REVIEW */}

            <div className="stat-card">

              <div className="stat-icon blue">
                ◷
              </div>

              <div>
                <span>Under Review</span>
                <strong>{reviewCount}</strong>
              </div>

            </div>

            {/* APPROVED */}

            <div className="stat-card">

              <div className="stat-icon green">
                ✓
              </div>

              <div>
                <span>Approved</span>
                <strong>{approvedCount}</strong>
              </div>

            </div>

          </section>

          {/* =================================================
              DECISION MANAGEMENT
          ================================================== */}

          <section className="management-section">

            <div className="section-heading">

              <div>

                <span className="eyebrow">
                  DECISION MANAGEMENT
                </span>

                <h2>
                  Your Decisions
                </h2>

                <p>
                  Manage, compare and review your organization's decisions.
                </p>

              </div>

              <div className="filters">

                {/* SEARCH */}

                <div className="search-box">

                  <span>
                    🔍
                  </span>

                  <input
                    type="text"
                    placeholder="Search decisions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {search && (
                    <button
                      className="clear-search"
                      type="button"
                      onClick={() => setSearch("")}
                    >
                      ×
                    </button>
                  )}

                </div>

                {/* STATUS */}

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option>All Status</option>
                  <option>Draft</option>
                  <option>Under Review</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>Completed</option>
                </select>

              </div>

            </div>

            {/* LOADING */}

            {loading && (
              <div className="message-box">

                <div className="loading-spinner"></div>

                <p>
                  Loading decisions...
                </p>

              </div>
            )}

            {/* ERROR */}

            {!loading && error && (
              <div className="message-box error">

                <h3>
                  Unable to load decisions
                </h3>

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>

              </div>
            )}

            {/* NO RESULTS */}

            {!loading &&
              !error &&
              filteredDecisions.length === 0 && (

                <div className="empty-results">

                  <div className="empty-icon">
                    ▤
                  </div>

                  <h3>
                    No decisions found
                  </h3>

                  <p>
                    {decisions.length === 0
                      ? "Create your first organizational decision."
                      : "Try another search or status filter."}
                  </p>

                  {decisions.length === 0 && (
                    <Link
                      to="/decisions/new"
                      className="new-decision-btn"
                    >
                      + Create Decision
                    </Link>
                  )}

                </div>

              )}

            {/* DECISION CARDS */}

            {!loading &&
              !error &&
              filteredDecisions.length > 0 && (

                <div className="decision-grid">

                  {filteredDecisions.map((decision) => (

                    <Link
                      key={decision.id}
                      to={`/decisions/${decision.id}`}
                      className="modern-decision-card"
                    >

                      {/* CARD TOP */}

                      <div className="card-top">

                        <span
                          className={statusClass(
                            decision.status
                          )}
                        >
                          {decision.status || "Draft"}
                        </span>

                        <span className="arrow">
                          →
                        </span>

                      </div>

                      {/* CARD BODY */}

                      <div className="card-body">

                        <h3>
                          {decision.title}
                        </h3>

                        <p>
                          {decision.problem ||
                            "No problem statement available."}
                        </p>

                      </div>

                      {/* CARD BOTTOM */}

                      <div className="card-bottom">

                        <span>
                          Decision #{decision.id}
                        </span>

                        <span>
                          {decision.category || "General"}
                        </span>

                      </div>

                    </Link>

                  ))}

                </div>

              )}

          </section>

          {/* =================================================
              DECISION INSIGHTS
          ================================================== */}

          <section className="milestone-section">

            <div className="milestone-heading">

              <div>

                <span className="eyebrow">
                  MILESTONE 2
                </span>

                <h2>
                  Decision Intelligence
                </h2>

              </div>

              <span className="progress-badge">
                IN PROGRESS
              </span>

            </div>

            <div className="feature-grid">

              {/* ALTERNATIVE COMPARISON */}

              <div className="feature-card active">

                <div className="feature-icon">
                  ⇄
                </div>

                <h3>
                  Alternative Comparison
                </h3>

                <p>
                  Compare different options with pros,
                  cons and decision notes.
                </p>

                <Link to="/decisions/new">
                  Explore →
                </Link>

              </div>

              {/* FILE UPLOADS */}

              <div className="feature-card">

                <div className="feature-icon">
                  ↑
                </div>

                <h3>
                  File Uploads
                </h3>

                <p>
                  Attach supporting documents and
                  evidence to important decisions.
                </p>

                <Link to="/documents">
                  Open →
                </Link>

              </div>

              {/* DISCUSSION */}

              <div className="feature-card">

                <div className="feature-icon">
                  ◌
                </div>

                <h3>
                  Discussion
                </h3>

                <p>
                  Collaborate with team members around
                  important organizational decisions.
                </p>

                <Link to="/discussions">
                  Open →
                </Link>

              </div>

              {/* VERSION TRACKING */}

              <div className="feature-card">

                <div className="feature-icon">
                  ⟳
                </div>

                <h3>
                  Version Tracking
                </h3>

                <p>
                  Track changes and maintain the history
                  of important decisions.
                </p>

                <Link to="/analytics">
                  Open →
                </Link>

              </div>

            </div>

          </section>

          {/* =================================================
              QUICK SUMMARY
          ================================================== */}

          <section className="dashboard-summary">

            <div className="summary-card">

              <div className="summary-icon green">
                ✓
              </div>

              <div>
                <strong>
                  {approvedCount} Approved
                </strong>

                <p>
                  Decisions successfully approved
                </p>
              </div>

            </div>

            <div className="summary-card">

              <div className="summary-icon orange">
                !
              </div>

              <div>
                <strong>
                  {reviewCount} Under Review
                </strong>

                <p>
                  Decisions waiting for review
                </p>
              </div>

            </div>

            <div className="summary-card">

              <div className="summary-icon red">
                ×
              </div>

              <div>
                <strong>
                  {rejectedCount} Rejected
                </strong>

                <p>
                  Decisions that were rejected
                </p>
              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;