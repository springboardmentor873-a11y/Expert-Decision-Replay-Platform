import "./App.css";

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Decivault</h2>

        <nav>
          <a className="active">Dashboard</a>
          <a>Decisions</a>
          <a>Approvals</a>
          <a>Discussions</a>
          <a>Reports</a>
        </nav>

        <div className="sidebar-bottom">
          <a>Settings</a>
          <a>Logout</a>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back!</p>
          </div>

          <div className="profile">
            <span>Employee</span>
            <div className="avatar">E</div>
          </div>
        </header>

        <section className="stats">
          <div className="stat-card">
            <h3>12</h3>
            <p>My Decisions</p>
          </div>

          <div className="stat-card">
            <h3>3</h3>
            <p>Pending Reviews</p>
          </div>

          <div className="stat-card">
            <h3>8</h3>
            <p>Approved</p>
          </div>
        </section>

        <section className="recent">
          <div className="section-header">
            <h2>Recent Decisions</h2>
            <button>+ New Decision</button>
          </div>

          <div className="decision">
            <div>
              <h3>Database Migration</h3>
              <p>Choosing a database for the new platform</p>
            </div>
            <span className="status draft">Draft</span>
          </div>

          <div className="decision">
            <div>
              <h3>Cloud Provider Selection</h3>
              <p>Evaluating AWS and Azure</p>
            </div>
            <span className="status review">Under Review</span>
          </div>

          <div className="decision">
            <div>
              <h3>Authentication System</h3>
              <p>Selecting the authentication approach</p>
            </div>
            <span className="status approved">Approved</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
