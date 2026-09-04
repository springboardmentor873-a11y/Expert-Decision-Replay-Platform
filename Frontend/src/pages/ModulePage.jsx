import { Link, useLocation } from "react-router-dom";
import { getCurrentUser } from "../api";
import "./ModulePage.css";

const MODULE_DATA = {
  "/teams": {
    eyebrow: "COLLABORATION",
    title: "Teams",
    description: "Manage teams and collaborate with people involved in organizational decisions.",
    cards: [
      {
        icon: "👥",
        title: "My Teams",
        description: "View and manage the teams you are part of.",
        link: "/teams",
      },
      {
        icon: "➕",
        title: "Create Team",
        description: "Create a new team for your project or department.",
        link: "/teams/create",
      },
      {
        icon: "👤",
        title: "Team Members",
        description: "View team members and their roles.",
        link: "/teams/members",
      },
    ],
  },

  "/discussions": {
    eyebrow: "COLLABORATION",
    title: "My Discussions",
    description: "Discuss important decisions and collaborate with your team.",
    cards: [
      {
        icon: "💬",
        title: "Active Discussions",
        description: "View discussions currently happening around decisions.",
        link: "/discussions",
      },
      {
        icon: "📝",
        title: "Start Discussion",
        description: "Start a discussion about an important organizational decision.",
        link: "/discussions/new",
      },
      {
        icon: "🔔",
        title: "Recent Activity",
        description: "See the latest discussion and collaboration activity.",
        link: "/discussions/activity",
      },
    ],
  },

  "/documents": {
    eyebrow: "DECISION DOCUMENTS",
    title: "Documents",
    description: "Store and manage supporting documents and decision evidence.",
    cards: [
      {
        icon: "📄",
        title: "Decision Evidence",
        description: "Upload and manage documents supporting organizational decisions.",
        link: "/documents/evidence",
      },
      {
        icon: "📁",
        title: "Project Documents",
        description: "Manage important project-related documents.",
        link: "/documents/projects",
      },
      {
        icon: "📚",
        title: "Reference Materials",
        description: "Store useful reference documents and supporting information.",
        link: "/documents/reference",
      },
    ],
  },

  "/analytics": {
    eyebrow: "DECISION INTELLIGENCE",
    title: "Analytics",
    description: "Understand decision patterns, outcomes and organizational activity.",
    cards: [
      {
        icon: "📊",
        title: "Decision Analytics",
        description: "View decision statistics and performance information.",
        link: "/analytics",
      },
      {
        icon: "📈",
        title: "Decision Trends",
        description: "Explore trends across organizational decisions.",
        link: "/analytics/trends",
      },
      {
        icon: "🎯",
        title: "Decision Outcomes",
        description: "Review outcomes and approval patterns.",
        link: "/analytics/outcomes",
      },
    ],
  },

  "/profile": {
    eyebrow: "ACCOUNT",
    title: "Profile",
    description: "Manage your personal information and account details.",
    cards: [
      {
        icon: "👤",
        title: "My Profile",
        description: "View your name, role and account information.",
        link: "/profile",
      },
      {
        icon: "✏️",
        title: "Edit Profile",
        description: "Update your personal profile information.",
        link: "/profile/edit",
      },
      {
        icon: "🔐",
        title: "Security",
        description: "Manage your account security settings.",
        link: "/profile/security",
      },
    ],
  },

  "/settings": {
    eyebrow: "SYSTEM SETTINGS",
    title: "Settings",
    description: "Manage your platform preferences and account settings.",
    cards: [
      {
        icon: "⚙️",
        title: "Account Settings",
        description: "Manage account preferences and information.",
        link: "/settings/account",
      },
      {
        icon: "🔔",
        title: "Notifications",
        description: "Configure your notification preferences.",
        link: "/settings/notifications",
      },
      {
        icon: "🛠️",
        title: "Platform Preferences",
        description: "Manage application preferences and behaviour.",
        link: "/settings/preferences",
      },
    ],
  },
};

function ModulePage() {
  const location = useLocation();
  const user = getCurrentUser();

  const basePath =
    Object.keys(MODULE_DATA).find((path) =>
      location.pathname.startsWith(path)
    ) || "/documents";

  const module = MODULE_DATA[basePath];

  return (
    <div className="module-page">

      {/* TOP BAR */}
      <header className="module-topbar">

        <Link to="/dashboard" className="module-brand">
          <div className="module-logo">ED</div>

          <div>
            <div className="module-brand-title">
              Expert Decision Replay
            </div>

            <div className="module-brand-subtitle">
              Knowledge & Decision Intelligence Platform
            </div>
          </div>
        </Link>

        <div className="module-user">

          <div className="module-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>
            <strong>{user?.name || "User"}</strong>
            <span>{user?.role || "Employee"}</span>
          </div>

        </div>

      </header>

      {/* CONTENT */}
      <main className="module-content">

        <Link to="/dashboard" className="module-back">
          ← Dashboard
        </Link>

        <section className="module-heading">

          <div className="module-eyebrow">
            {module.eyebrow}
          </div>

          <h1>{module.title}</h1>

          <p>{module.description}</p>

        </section>

        {/* CARDS */}
        <section className="module-card-grid">

          {module.cards.map((card) => (

            <Link
              key={card.title}
              to={card.link}
              className="module-feature-card"
            >

              <div className="module-card-icon">
                {card.icon}
              </div>

              <div className="module-card-content">

                <h2>{card.title}</h2>

                <p>{card.description}</p>

              </div>

              <div className="module-card-arrow">
                →
              </div>

            </Link>

          ))}

        </section>

        <div className="module-ready">

          <div className="ready-icon">
            ✦
          </div>

          <div>
            <strong>Module ready</strong>
            <p>
              Select an option above to continue.
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}

export default ModulePage;