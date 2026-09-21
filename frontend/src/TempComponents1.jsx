import { useEffect, useState } from "react";
import { API_BASE_URL, AppSidebar, NotificationBell } from "./shared";

// ==========================================
// HOME ICONS (INLINE SVG)
// ==========================================

const IconDecisions = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconTeams = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconDiscussions = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconBook = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconSearch = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconInsights = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    className="home-ico-sm"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const IconClock = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCheck = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconBellCheck = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconEye = () => (
  <svg
    className="home-ico-sm"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconFolder = () => (
  <svg
    className="home-ico-sm"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
);

const IconFile = () => (
  <svg
    className="home-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

// ==========================================
// HOME PAGE (EMPLOYER)
// ==========================================

const HomePage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    handleLogout,
    formatDate,
    decisions,
    teams,
    discussionList,
    knowledgeArticles
  } = props;

  const [repoQuery, setRepoQuery] = useState("");

  const myId = Number(user?.user_id);
  const myTeamId = user?.team_id;
  const myTeamNum = myTeamId !== null && myTeamId !== undefined
    ? Number(myTeamId)
    : null;

  const myDecisionsCount = (decisions || []).filter(
    (d) => Number(d.expert_id) === myId
  ).length;

  const myTeams = (teams || []).filter(
    (t) =>
      Number(t.team_id) === myTeamNum ||
      Number(t.manager_user_id) === myId
  );

  const discussionCount = (discussionList || []).filter(
    (d) => Number(d.comment_count) > 0
  ).length;

  const knowledgeCount = (knowledgeArticles || []).length;

  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  const dashDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const hasTeamDecisions = (decisions || []).some(
    (d) => Number(d.team_id) === myTeamNum
  );

  const teamDecisions = (decisions || [])
    .filter((d) =>
      hasTeamDecisions
        ? Number(d.team_id) === myTeamNum
        : Number(d.expert_id) === myId
    )
    .sort(
      (a, b) =>
        (b.updated_at || b.created_at || "").localeCompare(
          a.updated_at || a.created_at || ""
        )
    )
    .slice(0, 6);

  const pending = (decisions || []).filter(
    (d) =>
      d.status === "Under Review" ||
      d.status === "Reviewer Approved"
  );

  const assignedToMe = (decisions || []).filter(
    (d) => Number(d.assigned_to) === myId
  );

  const upcoming = [];
  const seen = new Set();

  pending.forEach((d) => {
    if (!seen.has(d.decision_id)) {
      seen.add(d.decision_id);
      upcoming.push({
        decision_id: d.decision_id,
        title: d.title,
        label:
          d.status === "Reviewer Approved"
            ? "Awaiting manager approval"
            : "Awaiting review",
        tone: d.status === "Reviewer Approved" ? "approval" : "review"
      });
    }
  });

  assignedToMe.forEach((d) => {
    if (!seen.has(d.decision_id)) {
      seen.add(d.decision_id);
      upcoming.push({
        decision_id: d.decision_id,
        title: d.title,
        label: "Assigned to you",
        tone: "assigned"
      });
    }
  });

  const statusBadge = (status) =>
    `dash-badge dash-badge-${(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

  const openDecision = (d) =>
    navigateTo("decision-view", { decision_id: d.decision_id });

  const categoryCounts = {};
  (knowledgeArticles || []).forEach((a) => {
    const cat = a.category || "General";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const popularTopics = Object.keys(categoryCounts)
    .map((name) => ({
      name,
      count: categoryCounts[name]
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const handleRepoSearch = (e) => {
    e.preventDefault();
    navigateTo("knowledge");
  };

  const statCards = [
    {
      label: "My Decisions",
      caption: "Created by you",
      value: myDecisionsCount,
      icon: <IconDecisions />,
      bg: "#dbeafe",
      color: "#2563eb",
      page: "my-decisions"
    },
    {
      label: "My Teams",
      caption: "You belong to or manage",
      value: myTeams.length,
      icon: <IconTeams />,
      bg: "#fef3c7",
      color: "#d97706",
      page: "my-teams"
    },
    {
      label: "Discussions",
      caption: "Active conversation threads",
      value: discussionCount,
      icon: <IconDiscussions />,
      bg: "#d1fae5",
      color: "#059669",
      page: "discussions"
    },
    {
      label: "Knowledge Articles",
      caption: "Available in the repository",
      value: knowledgeCount,
      icon: <IconBook />,
      bg: "#ede9fe",
      color: "#7c3aed",
      page: "knowledge"
    }
  ];

  const exploreCards = [
    {
      icon: <IconBook />,
      title: "Knowledge Repository",
      desc: "Browse reusable decisions, documents, and topics",
      page: "knowledge",
      bg: "#eff6ff",
      color: "#2563eb"
    },
    {
      icon: <IconSearch />,
      title: "Search",
      desc: "Find decisions, teams, articles, and people",
      page: "search",
      bg: "#ecfdf5",
      color: "#059669"
    },
    {
      icon: <IconDiscussions />,
      title: "Discussions",
      desc: "Join conversations happening on decisions",
      page: "discussions",
      bg: "#fef3c7",
      color: "#d97706"
    },
    {
      icon: <IconInsights />,
      title: "Insights",
      desc: "Understand decision activity at a glance",
      page: "insights",
      bg: "#ede9fe",
      color: "#7c3aed"
    }
  ];

  const recentArticles = (knowledgeArticles || []).slice(0, 3);

  return (
    <div className="dash-layout">
      <AppSidebar
        activePage="home"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main home-dash-main">

        <header className="dash-header">
          <div>
            <h2 className="dash-header-title">Home</h2>
            <p className="dash-header-sub">
              Your decision workspace
            </p>
          </div>
          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <span className="dash-header-date">{dashDate}</span>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="home-hero">
          <div className="home-hero-content">
            <h3 className="home-greeting">
              {greeting}, {user?.name || "User"}
              <span className="home-wave">&#128075;</span>
            </h3>
            <p className="home-hero-sub">
              Welcome back. Here is what is happening across your decisions and teams today.
            </p>
          </div>
          <div className="home-hero-badge">
            <div className="home-hero-badge-icon">
              {upcoming.length > 0 ? <IconBellCheck /> : <IconCheck />}
            </div>
            <div>
              <strong>
                {upcoming.length > 0
                  ? `${upcoming.length} action${upcoming.length === 1 ? "" : "s"}`
                  : "All caught up"}
              </strong>
              <span className="home-hero-badge-text">
                {upcoming.length > 0
                  ? "need your attention"
                  : "no pending activities"}
              </span>
            </div>
          </div>
        </section>

        <section className="dash-stats home-stats">
          {statCards.map((c) => (
            <button
              key={c.label}
              className="dash-stat-card home-stat-card"
              onClick={() => navigateTo(c.page)}
              style={{ cursor: "pointer", width: "100%" }}
            >
              <div
                className="dash-stat-icon"
                style={{ background: c.bg, color: c.color }}
              >
                {c.icon}
              </div>
              <div className="dash-stat-body">
                <span className="dash-stat-value">{c.value}</span>
                <span className="dash-stat-label">{c.label}</span>
                <span className="home-stat-caption">{c.caption}</span>
              </div>
              <span className="home-stat-link">
                <IconArrowRight />
              </span>
            </button>
          ))}
        </section>

        <section className="dash-content-grid home-content-grid">

          <div className="dash-card home-table-card">
            <div className="dash-card-header">
              <div className="home-card-title">
                <div className="home-card-title-icon chip-blue">
                  <IconDecisions />
                </div>
                <div>
                  <h4>
                    {myTeamNum ? "Recent Team Decisions" : "My Recent Decisions"}
                  </h4>
                  <span>
                    {myTeamNum
                      ? "Latest decision activity in your team"
                      : "Your most recent decisions"}
                  </span>
                </div>
              </div>
              <button
                className="dash-link-btn"
                onClick={() =>
                  navigateTo(myTeamNum ? "team-decisions" : "my-decisions")
                }
              >
                View All
              </button>
            </div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Team</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamDecisions.map((d) => (
                    <tr key={d.decision_id}>
                      <td className="dash-td-title">{d.title}</td>
                      <td>{d.team_name || "\u2014"}</td>
                      <td>
                        <span className={statusBadge(d.status)}>
                          {d.status}
                        </span>
                      </td>
                      <td>{formatDate(d.updated_at || d.created_at)}</td>
                      <td>
                        <button
                          className="home-view-btn"
                          onClick={() => openDecision(d)}
                        >
                          <IconEye /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teamDecisions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="dash-empty-row">
                        No team decisions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dash-right-col">

            <div className="dash-card home-side-card">
              <div className="home-card-title">
                <div className="home-card-title-icon chip-green">
                  <IconTeams />
                </div>
                <div>
                  <h4>My Teams</h4>
                  <span>{myTeams.length} team(s) assigned to you</span>
                </div>
              </div>
              <div className="dash-teams-list home-teams-list">
                {myTeams.map((t) => (
                  <div className="home-team-item" key={t.team_id}>
                    <div className="home-team-item-top">
                      <div className="home-team-avatar">
                        {(t.team_name || "T").charAt(0).toUpperCase()}
                      </div>
                      <div className="home-team-meta">
                        <div className="home-team-name">{t.team_name}</div>
                        <div className="home-team-desc">
                          {t.member_count} member(s)
                          {t.manager_name ? ` \u00B7 ${t.manager_name}` : ""}
                        </div>
                      </div>
                    </div>
                    <button
                      className="home-view-btn"
                      onClick={() =>
                        navigateTo("team-view", { team_id: t.team_id })
                      }
                    >
                      <IconEye /> View
                    </button>
                  </div>
                ))}
                {myTeams.length === 0 && (
                  <div className="home-empty">
                    <div className="home-empty-icon">
                      <IconTeams />
                    </div>
                    <div className="home-empty-title">
                      No team assigned yet
                    </div>
                    <div className="home-empty-desc">
                      You are not assigned to a team yet. Once an administrator assigns you to a team, your teams and activities will appear here.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="dash-card home-side-card">
              <div className="home-card-title">
                <div className="home-card-title-icon chip-indigo">
                  <IconClock />
                </div>
                <div>
                  <h4>Upcoming Activities</h4>
                  <span>Decisions that need your attention</span>
                </div>
              </div>
              <div className="home-act-list">
                {upcoming.map((a) => (
                  <div
                    className="home-act-item"
                    key={a.decision_id}
                  >
                    <div
                      className="home-act-avatar"
                      style={{
                        background:
                          a.tone === "approval"
                            ? "#ede9fe"
                            : a.tone === "review"
                            ? "#fef3c7"
                            : "#dbeafe",
                        color:
                          a.tone === "approval"
                            ? "#7c3aed"
                            : a.tone === "review"
                            ? "#d97706"
                            : "#2563eb"
                      }}
                    >
                      {a.tone === "approval" ? (
                        <IconCheck />
                      ) : (
                        <IconClock />
                      )}
                    </div>
                    <div className="home-act-info">
                      <button
                        className="home-act-title"
                        onClick={() => openDecision(a)}
                      >
                        {a.title}
                      </button>
                      <div className="home-act-desc">{a.label}</div>
                    </div>
                    <button
                      className="home-view-btn home-upcoming-more"
                      onClick={() => openDecision(a)}
                    >
                      View
                    </button>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <div className="home-empty home-empty-compact">
                    <div className="home-empty-icon">
                      <IconClock />
                    </div>
                    <div className="home-empty-title">
                      No upcoming activities
                    </div>
                    <div className="home-empty-desc">
                      Nothing is waiting for your review or approval right now.
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </section>

        <section className="dash-card home-explore-card">
          <div className="home-card-title">
            <div className="home-card-title-icon chip-indigo">
              <IconInsights />
            </div>
            <div>
              <h4>Continue Exploring</h4>
              <span>Dive deeper into decision intelligence</span>
            </div>
          </div>
          <div className="explore-grid home-explore-grid">
            {exploreCards.map((c) => (
              <button
                key={c.page}
                className="explore-card home-explore-item"
                onClick={() => navigateTo(c.page)}
              >
                <div
                  className="explore-icon home-explore-icon"
                  style={{ background: c.bg, color: c.color }}
                >
                  {c.icon}
                </div>
                <div className="home-explore-body">
                  <div className="explore-title">{c.title}</div>
                  <div className="explore-desc">{c.desc}</div>
                </div>
                <span className="home-explore-arrow">
                  <IconArrowRight />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="dash-card home-repo-card">
          <div className="home-repo-head">
            <div className="home-card-title">
              <div className="home-card-title-icon chip-amber">
                <IconBook />
              </div>
              <div>
                <h4>Knowledge Repository</h4>
                <span>Reuse proven decisions, articles, and organizational topics</span>
              </div>
            </div>
            <button
              className="home-btn-primary"
              onClick={() => navigateTo("knowledge")}
            >
              <IconBook /> Open Repository <IconArrowRight />
            </button>
          </div>

          <div className="home-repo-grid">

            <div className="home-repo-search">
              <label className="home-repo-label" htmlFor="home-repo-search">
                Search repository
              </label>
              <form className="home-repo-searchbox" onSubmit={handleRepoSearch}>
                <IconSearch />
                <input
                  id="home-repo-search"
                  type="text"
                  value={repoQuery}
                  onChange={(e) => setRepoQuery(e.target.value)}
                  placeholder="Search articles, decisions, topics..."
                />
                <button type="submit">Search</button>
              </form>

              <div className="home-repo-topics">
                <span className="home-repo-label">Popular topics</span>
                <div className="home-topic-chips">
                  {popularTopics.map((t) => (
                    <button
                      key={t.name}
                      className="home-topic-chip"
                      onClick={() => navigateTo("knowledge")}
                    >
                      <IconFolder /> {t.name} <span>{t.count}</span>
                    </button>
                  ))}
                  {popularTopics.length === 0 && (
                    <span className="home-repo-none">
                      No topics published yet.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="home-repo-recents">
              <span className="home-repo-label">Recently updated</span>
              <div className="home-repo-articles">
                {recentArticles.map((a) => (
                  <button
                    key={a.article_id}
                    className="home-repo-article"
                    onClick={() => navigateTo("knowledge")}
                  >
                    <div className="home-repo-article-icon">
                      <IconFile />
                    </div>
                    <div className="home-repo-article-body">
                      <div className="home-repo-article-cat">
                        {a.category || "General"}
                      </div>
                      <div className="home-repo-article-title">{a.title}</div>
                      <div className="home-repo-article-meta">
                        Updated {formatDate(a.updated_at)}
                      </div>
                    </div>
                    <IconArrowRight />
                  </button>
                ))}
                {recentArticles.length === 0 && (
                  <div className="home-empty home-empty-compact">
                    <div className="home-empty-icon">
                      <IconBook />
                    </div>
                    <div className="home-empty-title">
                      No knowledge articles yet
                    </div>
                    <div className="home-empty-desc">
                      Articles shared with your organization will appear here.
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};

// ==========================================
// MY TEAMS PAGE
// ==========================================

const MyTeamsPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    handleLogout,
    formatDate,
    openViewDecision
  } = props;

  const [myTeamsAll, setMyTeamsAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [activeTab, setActiveTab] = useState("active");
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  const [showBrowse, setShowBrowse] = useState(false);
  const [browseTeams, setBrowseTeams] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseQuery, setBrowseQuery] = useState("");
  const [requestedTeams, setRequestedTeams] = useState([]);
  const [joinBusyId, setJoinBusyId] = useState(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinMessageType, setJoinMessageType] = useState("");

  const isManager = [3, 4].includes(Number(user?.role_id));
  const myUserId = Number(user?.user_id);

  const loadMine = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `${API_BASE_URL}/teams/?mine=true&include_archived=true`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) setMyTeamsAll(await res.json());
    } catch (error) {
      console.error("My teams error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTeams = myTeamsAll.filter((t) => !t.is_archived);
  const archivedTeams = myTeamsAll.filter((t) => !!t.is_archived);

  const visibleTeams = (activeTab === "archived" ? archivedTeams : activeTeams)
    .filter((t) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (t.team_name || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "members") {
        return (b.member_count || 0) - (a.member_count || 0);
      }
      if (sortBy === "activity") {
        const la = a.recent_decisions?.[0]?.created_at || a.created_at || "";
        const lb = b.recent_decisions?.[0]?.created_at || b.created_at || "";
        return String(lb).localeCompare(String(la));
      }
      return (a.team_name || "").localeCompare(b.team_name || "");
    });

  const hasNoTeams = !loading && myTeamsAll.length === 0;

  const activityFeed = activeTeams
    .flatMap((t) =>
      (t.recent_decisions || []).map((d) => ({
        decision_id: d.decision_id,
        title: d.title,
        status: d.status,
        category_name: d.category_name,
        expert_name: d.expert_name,
        priority: d.priority,
        decision_date: d.decision_date,
        created_at: d.created_at,
        team_name: t.team_name,
        team_id: t.team_id
      }))
    )
    .sort((a, b) => {
      const ta = a.created_at || a.decision_date || "";
      const tb = b.created_at || b.decision_date || "";
      return String(tb).localeCompare(String(ta));
    })
    .slice(0, 6);

  const openDecision = (d) => {
    if (openViewDecision) openViewDecision(d);
    else navigateTo("decision-view", { decision_id: d.decision_id });
  };

  const openTeam = (team) =>
    navigateTo("team-view", { team_id: team.team_id });

  const activityDate = (d) => {
    const value = d.decision_date || d.created_at;
    return value && formatDate ? formatDate(value) : "";
  };

  const alreadyMember = (team) =>
    Number(user?.team_id) === Number(team.team_id);

  const openBrowse = async () => {
    setJoinMessage("");
    setJoinMessageType("");
    setBrowseQuery("");
    setShowBrowse(true);
    setBrowseLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE_URL}/teams/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const available = data.filter(
          (t) => !t.is_archived && !alreadyMember(t)
        );
        setBrowseTeams(available);
        const requested = [];
        for (const team of available) {
          const rres = await fetch(
            `${API_BASE_URL}/teams/${team.team_id}/join-requests`,
            { headers: { "Authorization": `Bearer ${token}` } }
          );
          if (rres.ok) {
            const reqs = await rres.json();
            if (reqs.some((r) => Number(r.user_id) === myUserId)) {
              requested.push(team.team_id);
            }
          }
        }
        setRequestedTeams(requested);
      }
    } catch (error) {
      console.error("Browse teams error:", error);
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleJoinRequest = async (team) => {
    setJoinBusyId(team.team_id);
    setJoinMessage("");
    setJoinMessageType("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/teams/${team.team_id}/join-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ team_id: team.team_id })
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = String(data.detail || "Unable to submit request");
        if (response.status === 409 && /already/i.test(detail)) {
          setRequestedTeams((prev) =>
            prev.includes(team.team_id) ? prev : [...prev, team.team_id]
          );
          setJoinMessage(detail);
          setJoinMessageType("success");
        } else {
          setJoinMessage(detail || "Unable to submit request");
          setJoinMessageType("error");
        }
      } else {
        setRequestedTeams((prev) =>
          prev.includes(team.team_id) ? prev : [...prev, team.team_id]
        );
        setJoinMessage("Join request submitted");
        setJoinMessageType("success");
      }
    } catch (error) {
      console.error("Join request error:", error);
      setJoinMessage("Unable to submit request");
      setJoinMessageType("error");
    } finally {
      setJoinBusyId(null);
    }
  };

  const browseVisible = browseTeams.filter((t) => {
    const q = browseQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (t.team_name || "").toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="dash-layout">
      <AppSidebar
        activePage="my-teams"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h2 className="dash-header-title">My Teams</h2>
            <p className="dash-header-sub">
              Teams you are a part of. Collaborate, contribute and
              make better decisions together.
            </p>
          </div>
          <div className="dash-header-right mtp-header-actions">
            <NotificationBell navigateTo={navigateTo} />
            {isManager && (
              <button
                className="secondary-button"
                onClick={() => navigateTo("teams")}
              >
                &#9881; Manage Teams
              </button>
            )}
            <button className="primary-button" onClick={openBrowse}>
              + Join a Team
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="teams-toolbar">
          <input
            type="text"
            className="teams-search-input"
            placeholder="Search your teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="teams-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort: Name</option>
            <option value="members">Sort: Members</option>
            <option value="activity">Sort: Recent Activity</option>
          </select>
        </section>

        <div className="teams-tabs">
          <button
            className={`teams-tab ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Teams
            {activeTeams.length > 0 && (
              <span className="mtp-tab-count">{activeTeams.length}</span>
            )}
          </button>
          <button
            className={`teams-tab ${activeTab === "archived" ? "active" : ""}`}
            onClick={() => setActiveTab("archived")}
          >
            Archived Teams
            {archivedTeams.length > 0 && (
              <span className="mtp-tab-count">{archivedTeams.length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="mtp-loading">
            <div className="spin-loader" />
          </div>
        ) : visibleTeams.length === 0 ? (
          <div className="dash-card mtp-card-note">
            <div className="message" style={{ margin: 0 }}>
              {search.trim()
                ? "No teams match your search."
                : activeTab === "archived"
                  ? "You have no archived teams."
                  : "You have no teams in this tab."}
            </div>
          </div>
        ) : (
          <div className="teams-grid">
            {visibleTeams.map((team) => {
              const recent = team.recent_decisions || [];
              const menuOpen = menuOpenFor === team.team_id;
              return (
                <div className="team-card" key={team.team_id}>
                  <div className="team-card-top">
                    <div className="team-avatar">
                      {(team.team_name || "T").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="team-card-name">{team.team_name}</div>
                      <div className="team-card-meta">
                        {team.member_count || 0} member(s) &middot;{" "}
                        {team.manager_name
                          ? `Lead: ${team.manager_name}`
                          : "No lead assigned"}
                      </div>
                    </div>
                  </div>

                  <div className="team-card-body">
                    <p className="team-card-desc">
                      {team.description || "No description provided."}
                    </p>

                    <div className="team-card-badges">
                      <span
                        className={`status-badge ${team.is_archived ? "status-archived" : "status-active"}`}
                      >
                        {team.is_archived ? "Archived" : "Active"}
                      </span>
                    </div>

                    {recent.length > 0 ? (
                      <div className="team-recent-decisions">
                        <div className="team-recent-label">
                          Recent Decisions
                        </div>
                        {recent.slice(0, 3).map((d) => (
                          <button
                            key={d.decision_id}
                            className="team-recent-item"
                            onClick={() => openDecision(d)}
                            title={`Open ${d.title}`}
                          >
                            <span className="team-recent-dot" />
                            <span className="team-recent-title">
                              {d.title}
                            </span>
                            <span
                              className={`status-badge status-${(d.status || "").toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              {d.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="team-recent-empty">
                        No decisions made by this team yet.
                      </div>
                    )}
                  </div>

                  <div className="team-card-footer">
                    <button
                      className="secondary-button team-view-btn"
                      onClick={() => openTeam(team)}
                    >
                      View Team
                    </button>
                    <div className="team-dot-menu">
                      <button
                        className="team-dot-btn"
                        onClick={() =>
                          setMenuOpenFor(menuOpen ? null : team.team_id)
                        }
                        title="More options"
                      >
                        &#8942;
                      </button>
                      {menuOpen && (
                        <div className="team-dot-dropdown">
                          <button
                            className="team-dot-item"
                            onClick={() => {
                              setMenuOpenFor(null);
                              openTeam(team);
                            }}
                          >
                            View Team
                          </button>
                          {isManager && (
                            <button
                              className="team-dot-item"
                              onClick={() => {
                                setMenuOpenFor(null);
                                navigateTo("teams");
                              }}
                            >
                              Manage Teams
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasNoTeams && (
          <div className="mtp-empty-cta">
            <div className="mtp-empty-icon">
              <IconTeams />
            </div>
            <h3 className="mtp-empty-title">Request to Join a Team</h3>
            <p className="mtp-empty-sub">
              You are not part of any team yet. Browse available teams
              and send a join request to the team manager.
            </p>
            <button className="primary-button" onClick={openBrowse}>
              Browse Teams
            </button>
          </div>
        )}

        {myTeamsAll.length > 0 && (
          <section className="mtp-section">
            <div className="mtp-section-head">
              <div className="mtp-section-title">
                <IconClock /> My Team Activity
              </div>
              <span className="team-count-pill">{activityFeed.length}</span>
            </div>
            {activityFeed.length > 0 ? (
              <div className="mtp-activity-feed">
                {activityFeed.map((d) => (
                  <button
                    key={`${d.team_id}-${d.decision_id}`}
                    className="mtp-activity-item"
                    onClick={() => openDecision(d)}
                    title={`Open ${d.title}`}
                  >
                    <span className="mtp-activity-icon">
                      <IconDecisions />
                    </span>
                    <span className="mtp-activity-body">
                      <span className="mtp-activity-title">{d.title}</span>
                      <span className="mtp-activity-meta">
                        {d.team_name}
                        {d.expert_name ? ` \u00B7 ${d.expert_name}` : ""}
                        {activityDate(d)
                          ? ` \u00B7 ${activityDate(d)}`
                          : ""}
                      </span>
                    </span>
                    <span
                      className={`status-badge status-${(d.status || "").toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {d.status}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mtp-muted-note">
                No team activity yet. Once your team creates decisions,
                you will see them here.
              </div>
            )}
          </section>
        )}

        <section className="mtp-section">
          <div className="mtp-section-head">
            <div className="mtp-section-title">
              <IconBellCheck /> Upcoming Team Meetings
            </div>
            <span className="team-count-pill">0</span>
          </div>
          <div className="mtp-meetings-empty">
            <IconClock /> No upcoming meetings scheduled.
          </div>
        </section>
      </main>

      {showBrowse && (
        <div className="modal-overlay">
          <div className="modal-box mtp-browse-modal">
            <h3>Join a Team</h3>
            <p>Browse available teams and send a join request to the team manager.</p>
            <input
              type="text"
              className="teams-search-input"
              placeholder="Search teams..."
              value={browseQuery}
              onChange={(e) => setBrowseQuery(e.target.value)}
              style={{ width: "100%", marginTop: "6px" }}
            />
            {joinMessage && (
              <div
                className={`message ${joinMessageType === "error" ? "error" : ""} ${joinMessageType === "success" ? "success" : ""}`}
                style={{ margin: "10px 0 0" }}
              >
                {joinMessage}
              </div>
            )}
            {browseLoading ? (
              <div className="mtp-browse-loading">
                <div className="spin-loader" />
              </div>
            ) : browseVisible.length === 0 ? (
              <div className="mtp-browse-empty">
                {browseTeams.length === 0
                  ? "No teams available to join right now."
                  : "No teams match your search."}
              </div>
            ) : (
              <div className="join-team-list">
                {browseVisible.map((team) => {
                  const requested = requestedTeams.includes(team.team_id);
                  return (
                    <div className="join-team-row" key={team.team_id}>
                      <div className="mtp-join-info">
                        <div className="join-team-name">
                          {team.team_name}
                        </div>
                        <div className="join-team-meta">
                          {team.member_count || 0} member(s)
                          {team.manager_name
                            ? ` \u00B7 Lead: ${team.manager_name}`
                            : ""}
                        </div>
                        {team.description && (
                          <div className="mtp-browse-desc">
                            {team.description}
                          </div>
                        )}
                      </div>
                      <div className="mtp-join-action">
                        {requested ? (
                          <span className="mtp-requested-tag">
                            Requested <IconCheck />
                          </span>
                        ) : (
                          <button
                            className={`secondary-button ${joinBusyId === team.team_id ? "mtp-btn-busy" : ""}`}
                            onClick={() => handleJoinRequest(team)}
                            disabled={joinBusyId === team.team_id}
                          >
                            {joinBusyId === team.team_id
                              ? "Sending..."
                              : "Request to Join"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mtp-modal-footer">
              <button
                className="secondary-button"
                onClick={() => setShowBrowse(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MY DECISIONS PAGE
// ==========================================

const MyDecisionsPage = (props) => {
  const {
    user,
    getRoleName,
    getToken,
    navigateTo,
    handleLogout,
    formatDate
  } = props;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("mine", "true");
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);
      const res = await fetch(
        `${API_BASE_URL}/decisions/?${params.toString()}`,
        { headers: { "Authorization": `Bearer ${getToken()}` } }
      );
      if (res.ok) setList(await res.json());
    } catch (error) {
      console.error("My decisions error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const statusBadge = (s) =>
    `dash-badge dash-badge-${(s || "").toLowerCase().replace(/\s+/g, "-")}`;

  const filterRow = (
    <div className="filter-bar" style={{ marginBottom: "16px" }}>
      <div className="filter-field grow">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
        />
      </div>
      <div className="filter-field">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Draft</option>
          <option>Under Review</option>
          <option>Reviewer Approved</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Archived</option>
        </select>
      </div>
      <div className="filter-field">
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>
      <button className="primary-button" onClick={fetchData}>
        Apply
      </button>
    </div>
  );

  return (
    <div className="dash-layout">
      <AppSidebar
        activePage="my-decisions"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h2 className="dash-header-title">My Decisions</h2>
            <p className="dash-header-sub">
              Decisions you have created or own
            </p>
          </div>
          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button
              className="nav-button"
              onClick={() => navigateTo("decision-create")}
            >
              + Create Decision
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="dash-card">
          <div className="dash-card-header">
            <h4>
              My Decisions
              <span className="team-count-pill">{list.length} record(s)</span>
            </h4>
          </div>
          {filterRow}
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Owner</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d.decision_id}>
                    <td className="dash-td-title">{d.title}</td>
                    <td>{d.team_name || "\u2014"}</td>
                    <td>
                      <span className={statusBadge(d.status)}>{d.status}</span>
                    </td>
                    <td>{d.priority || "\u2014"}</td>
                    <td>{d.expert_name || "\u2014"}</td>
                    <td>{formatDate(d.updated_at || d.created_at)}</td>
                    <td>
                      <button
                        className="action-button view-button"
                        onClick={() =>
                          navigateTo("decision-view", {
                            decision_id: d.decision_id }
                          )
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && list.length === 0 && (
                  <tr>
                    <td colSpan="7" className="dash-empty-row">
                      No decisions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

// ==========================================
// TEAM DECISIONS PAGE
// ==========================================

const TeamDecisionsPage = (props) => {
  const {
    user,
    getRoleName,
    getToken,
    navigateTo,
    handleLogout,
    formatDate
  } = props;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const teamId = user?.team_id;

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (teamId) params.append("team", teamId);
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);
      const res = await fetch(
        `${API_BASE_URL}/decisions/?${params.toString()}`,
        { headers: { "Authorization": `Bearer ${getToken()}` } }
      );
      if (res.ok) setList(await res.json());
    } catch (error) {
      console.error("Team decisions error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const statusBadge = (s) =>
    `dash-badge dash-badge-${(s || "").toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="dash-layout">
      <AppSidebar
        activePage="team-decisions"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h2 className="dash-header-title">Team Decisions</h2>
            <p className="dash-header-sub">
              Decisions made by your team
            </p>
          </div>
          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="dash-card">
          <div className="dash-card-header">
            <h4>
              Team Decisions
              <span className="team-count-pill">{list.length} record(s)</span>
            </h4>
          </div>
          <div className="filter-bar" style={{ marginBottom: "16px" }}>
            <div className="filter-field grow">
              <input
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData()}
              />
            </div>
            <div className="filter-field">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option>Draft</option>
                <option>Under Review</option>
                <option>Reviewer Approved</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Archived</option>
              </select>
            </div>
            <div className="filter-field">
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">All Priorities</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <button className="primary-button" onClick={fetchData}>
              Apply
            </button>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Team</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d.decision_id}>
                    <td className="dash-td-title">{d.title}</td>
                    <td>{d.team_name || "\u2014"}</td>
                    <td>{d.expert_name || "\u2014"}</td>
                    <td>
                      <span className={statusBadge(d.status)}>{d.status}</span>
                    </td>
                    <td>{d.priority || "\u2014"}</td>
                    <td>{formatDate(d.updated_at || d.created_at)}</td>
                    <td>
                      <button
                        className="action-button view-button"
                        onClick={() =>
                          navigateTo("decision-view", {
                            decision_id: d.decision_id }
                          )
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && list.length === 0 && (
                  <tr>
                    <td colSpan="7" className="dash-empty-row">
                      No team decisions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export { HomePage, MyTeamsPage, MyDecisionsPage, TeamDecisionsPage };