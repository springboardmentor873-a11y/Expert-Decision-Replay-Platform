import "./App.css";

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">DecisionVault</div>

        <nav>
          <a className="active">Overview</a>
          <a>Decisions</a>
          <a>Reviews</a>
          <a>Knowledge</a>
        </nav>

        <div className="bottom-nav">
          <a>Settings</a>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>Overview</h1>
          </div>

          <div className="user">
            <div className="user-avatar">A</div>
            <span>Alex Morgan</span>
          </div>
        </header>

        <section className="intro">
          <div>
            <h2>Good evening, Alex.</h2>
            <p>
              Keep track of decisions, reviews and organizational knowledge.
            </p>
          </div>

          <button className="primary-btn">New decision</button>
        </section>

        <section className="stats">
          <div>
            <span>Total decisions</span>
            <strong>12</strong>
          </div>

          <div>
            <span>Under review</span>
            <strong>3</strong>
          </div>

          <div>
            <span>Approved</span>
            <strong>8</strong>
          </div>
        </section>

        <section className="decisions">
          <div className="section-title">
            <h2>Recent decisions</h2>
            <button className="text-btn">View all →</button>
          </div>

          <div className="decision-row">
            <div>
              <h3>Database architecture</h3>
              <p>Engineering · Updated 2 hours ago</p>
            </div>

            <span>Draft</span>
          </div>

          <div className="decision-row">
            <div>
              <h3>Cloud infrastructure</h3>
              <p>Engineering · Updated yesterday</p>
            </div>

            <span className="review-status">Under review</span>
          </div>

          <div className="decision-row">
            <div>
              <h3>Authentication strategy</h3>
              <p>Security · Updated 3 days ago</p>
            </div>

            <span className="approved-status">Approved</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
