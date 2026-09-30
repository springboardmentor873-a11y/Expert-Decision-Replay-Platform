import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE, getCurrentUser, logout } from "../api";
import { ThemeToggle } from "../theme";
import "./Workspace.css";

const CATEGORY_OPTIONS = [
  "Technology",
  "Finance",
  "Hiring",
  "Product",
  "Operations",
  "Strategy",
  "Other",
];

function DecisionForm() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [category, setCategory] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const role = (user?.role || "employee").toLowerCase();

  const isManager =
    role === "manager" ||
    role === "admin" ||
    role === "administrator";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      setError("User session not found. Please login again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/decisions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          problem: problem.trim(),
          reasoning: reasoning.trim(),
          category: category || null,
          user_id: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail || "Could not create decision."
        );
        setSubmitting(false);
        return;
      }

      navigate(`/decisions/${data.id}`);
    } catch (err) {
      console.error(err);

      setError(
        "Cannot connect to backend. Please make sure the server is running."
      );

      setSubmitting(false);
    }
  };

  return (
    <div className="workspace dashboard-workspace">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="app-sidebar">

        {/* LOGO */}

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            ED
          </div>

          <div className="sidebar-brand-text">

            <strong>
              Expert Decision
            </strong>

            <span>
              Replay Platform
            </span>

          </div>

        </div>


        <div className="sidebar-divider"></div>


        {/* WORKSPACE */}

        <div className="sidebar-section-title">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">

          <Link
            to="/dashboard"
            className="sidebar-link"
          >
            <span className="sidebar-icon">
              ◈
            </span>

            <span>
              Dashboard
            </span>
          </Link>


          <Link
            to="/dashboard"
            className="sidebar-link"
          >
            <span className="sidebar-icon">
              ▣
            </span>

            <span>
              My Decisions
            </span>
          </Link>


          <Link
            to="/decisions/new"
            className="sidebar-link active"
          >
            <span className="sidebar-icon">
              ＋
            </span>

            <span>
              New Decision
            </span>
          </Link>


          <Link
            to="/teams"
            className="sidebar-link"
          >
            <span className="sidebar-icon">
              ♧
            </span>

            <span>
              Teams
            </span>
          </Link>


          <Link
            to="/discussions"
            className="sidebar-link"
          >
            <span className="sidebar-icon">
              ◌
            </span>

            <span>
              Discussions
            </span>
          </Link>

          <Link to="/approvals" className="sidebar-link">
            <span className="sidebar-icon">✓</span>
            <span>Approvals</span>
          </Link>

        </nav>


        {/* KNOWLEDGE */}

        <div className="sidebar-section-title second-section">
          KNOWLEDGE
        </div>

        <nav className="sidebar-nav">

          <Link
            to="/documents"
            className="sidebar-link"
          >
            <span className="sidebar-icon">
              ▤
            </span>

            <span>
              Documents
            </span>
          </Link>

          <Link to="/knowledge-graph" className="sidebar-link">
            <span className="sidebar-icon">?</span>
            <span>Knowledge Graph</span>
          </Link>


          <Link
            to="/analytics"
            className="sidebar-link"
          >
            <span className="sidebar-icon">
              ◒
            </span>

            <span>
              Analytics
            </span>
          </Link>

          <Link to="/audit-logs" className="sidebar-link">
            <span className="sidebar-icon">📜</span>
            <span>Audit Logs</span>
          </Link>


          <Link
            to="/profile"
            className="sidebar-link"
          >
            <span className="sidebar-icon">
              ◎
            </span>

            <span>
              Profile
            </span>
          </Link>


          <Link
            to="/settings"
            className="sidebar-link"
          >
            <span className="sidebar-icon">
              ⚙
            </span>

            <span>
              Settings
            </span>
          </Link>

        </nav>


        {/* USER */}

        <div className="sidebar-bottom">

          <div className="sidebar-role-card">

            <div className="sidebar-role-avatar">

              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}

            </div>


            <div>

              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {isManager
                  ? "Manager"
                  : "Employee"}
              </span>

            </div>

          </div>


          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>
              ↪
            </span>

            Logout

          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN AREA
          ===================================================== */}

      <div className="dashboard-main">

        {/* TOPBAR */}

        <header className="dashboard-topbar">

          <div className="dashboard-topbar-left">

            <div className="mobile-logo">
              ED
            </div>

            <div>

              <strong>
                Decision Intelligence
              </strong>

              <span>
                Organizational knowledge workspace
              </span>

            </div>

          </div>


          <div className="dashboard-topbar-right">
            <ThemeToggle />

            <div className="topbar-user">

              <div className="user-avatar">

                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}

              </div>


              <div className="user-info">

                <strong>
                  {user?.name || "User"}
                </strong>

                <span>
                  {isManager
                    ? "Manager"
                    : "Employee"}
                </span>

              </div>

            </div>

          </div>

        </header>


        {/* =====================================================
            CONTENT
            ===================================================== */}

        <main className="dashboard-content">

          <div className="new-decision-page">

            {/* BACK */}

            <Link
              to="/dashboard"
              className="modern-back"
            >
              ← Back to Dashboard
            </Link>


            {/* HEADER */}

            <div className="new-decision-header">

              <span className="eyebrow">
                DECISION MANAGEMENT
              </span>

              <h1>
                Create New Decision
              </h1>

              <p>
                Capture the problem, reasoning and context
                behind an important organizational decision.
              </p>

            </div>


            {/* STEPS */}

            <div className="decision-steps">

              <div className="decision-step active">

                <div className="step-number">
                  1
                </div>

                <div>

                  <strong>
                    Basic Information
                  </strong>

                  <span>
                    Decision details
                  </span>

                </div>

              </div>


              <div className="step-line"></div>


              <div className="decision-step">

                <div className="step-number">
                  2
                </div>

                <div>

                  <strong>
                    Alternatives
                  </strong>

                  <span>
                    Compare options
                  </span>

                </div>

              </div>


              <div className="step-line"></div>


              <div className="decision-step">

                <div className="step-number">
                  3
                </div>

                <div>

                  <strong>
                    Review
                  </strong>

                  <span>
                    Finalize decision
                  </span>

                </div>

              </div>

            </div>


            {/* FORM CARD */}

            <div className="new-decision-card">

              <div className="new-decision-card-header">

                <div className="form-card-icon">
                  ◈
                </div>

                <div>

                  <h2>
                    Decision Information
                  </h2>

                  <p>
                    Start by describing what decision needs
                    to be made and why it matters.
                  </p>

                </div>

              </div>


              <form
                onSubmit={handleSubmit}
                className="new-decision-form"
              >

                {/* TITLE */}

                <div className="form-group">

                  <label>
                    Decision Title
                    <span className="required">
                      *
                    </span>
                  </label>

                  <p className="field-help">
                    Give your decision a short, meaningful name.
                  </p>

                  <input
                    type="text"
                    placeholder="e.g. Choosing a cloud provider for Q3 migration"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    required
                  />

                </div>


                {/* CATEGORY */}

                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <p className="field-help">
                    Select the area this decision belongs to.
                  </p>

                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value)
                    }
                  >

                    <option value="">
                      Select a category
                    </option>

                    {CATEGORY_OPTIONS.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* PROBLEM */}

                <div className="form-group">

                  <label>
                    Problem Statement
                    <span className="required">
                      *
                    </span>
                  </label>

                  <p className="field-help">
                    Explain the situation or problem that requires a decision.
                  </p>

                  <textarea
                    placeholder="Describe the situation, challenge or opportunity that needs a decision..."
                    value={problem}
                    onChange={(e) =>
                      setProblem(e.target.value)
                    }
                    rows={6}
                    required
                  />

                </div>


                {/* REASONING */}

                <div className="form-group">

                  <label>
                    Reasoning / Important Factors
                    <span className="required">
                      *
                    </span>
                  </label>

                  <p className="field-help">
                    What factors matter here? What is driving this decision?
                  </p>

                  <textarea
                    placeholder="Describe the important factors, constraints, risks, goals and reasoning behind the decision..."
                    value={reasoning}
                    onChange={(e) =>
                      setReasoning(e.target.value)
                    }
                    rows={6}
                    required
                  />

                </div>


                {/* ERROR */}

                {error && (

                  <div className="form-error">

                    <span>
                      !
                    </span>

                    <div>

                      <strong>
                        Unable to create decision
                      </strong>

                      <p>
                        {error}
                      </p>

                    </div>

                  </div>

                )}


                {/* ACTIONS */}

                <div className="new-decision-actions">

                  <Link
                    to="/dashboard"
                    className="secondary-btn"
                  >
                    Cancel
                  </Link>


                  <button
                    type="submit"
                    className="primary-btn create-decision-btn"
                    disabled={submitting}
                  >

                    {submitting
                      ? "Creating Decision..."
                      : "Create Decision →"}

                  </button>

                </div>

              </form>

            </div>


            {/* BOTTOM INFORMATION */}

            <div className="decision-info-strip">

              <div className="info-strip-icon">
                🔒
              </div>

              <div>

                <strong>
                  Decision security
                </strong>

                <p>
                  Your decision is associated with your account.
                  Managers can review organizational decisions.
                </p>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}

export default DecisionForm;