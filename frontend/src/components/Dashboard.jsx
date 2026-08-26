import { useState } from "react";
import "../styles/Dashboard.css";

function App() {
  const [activePage, setActivePage] = useState("Overview");

  const decisions = [
    {
      name: "Database architecture",
      status: "Draft",
    },
    {
      name: "Cloud infrastructure",
      status: "Review",
    },
    {
      name: "Authentication strategy",
      status: "Approved",
    },
  ];

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">DecisionVault</h2>

        <nav>
          <button
            className={activePage === "Overview" ? "active" : ""}
            onClick={() => setActivePage("Overview")}
          >
            Overview
          </button>

          <button
            className={activePage === "Decisions" ? "active" : ""}
            onClick={() => setActivePage("Decisions")}
          >
            Decisions
          </button>

          <button
            className={activePage === "Reviews" ? "active" : ""}
            onClick={() => setActivePage("Reviews")}
          >
            Reviews
          </button>

          <button
            className={activePage === "Knowledge" ? "active" : ""}
            onClick={() => setActivePage("Knowledge")}
          >
            Knowledge
          </button>
        </nav>

        <button
          className={`settings ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => setActivePage("Settings")}
        >
          Settings
        </button>
      </aside>

      {/* Main Content */}
      <main className="main">
        {/* Top bar */}
        <header className="header">
          <span>{activePage}</span>
        </header>

        <div className="content">
          <h1>Welcome back</h1>

          <p className="description">
            Manage decisions and reviews from one workspace.
          </p>

          {/* Statistics */}
          <div className="stats">
            <div className="stat-card">
              <p>Total</p>
              <h2>12</h2>
            </div>

            <div className="stat-card">
              <p>Under Review</p>
              <h2>4</h2>
            </div>

            <div className="stat-card">
              <p>Approved</p>
              <h2>8</h2>
            </div>
          </div>

          {/* Recent Decisions */}
          <div className="recent">
            <h2>Recent Decisions</h2>

            {decisions.map((decision, index) => (
              <div className="decision" key={index}>
                <span> {decision.name}</span>

                <span className={`status ${decision.status.toLowerCase()}`}>
                  {decision.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
