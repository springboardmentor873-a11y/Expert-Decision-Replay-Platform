import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

const roleNames = {
  1: "Employee",
  2: "Reviewer",
  3: "Manager",
  4: "Administrator",
};

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load profile");
      }

      setUser(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error">{error}</div>
      </div>
    );
  }

  const roleName = roleNames[user?.role_id] || "User";

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="profile-page">

      {/* HEADER */}
      <div className="profile-header">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1>My Profile</h1>
          <p>
            Manage your identity, role and workspace information.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>


      {/* PROFILE HERO */}
      <section className="profile-hero">

        <div className="profile-hero-main">

          <div className="profile-avatar-large">
            {initials}
          </div>

          <div className="profile-hero-info">
            <div className="profile-name-row">
              <h2>{user.full_name}</h2>

              <span className="profile-status-badge">
                ● Active
              </span>
            </div>

            <p className="profile-email">
              {user.email}
            </p>

            <div className="profile-meta">
              <span className="profile-role-badge">
                {roleName}
              </span>

              <span className="profile-user-id">
                User ID #{user.id}
              </span>
            </div>
          </div>

        </div>

        <div className="profile-hero-side">
          <span>ACCOUNT STATUS</span>
          <strong>Active</strong>
          <small>Your account is currently active.</small>
        </div>

      </section>


      {/* OVERVIEW CARDS */}
      <div className="profile-overview">

        <div className="profile-overview-card">
          <div className="profile-overview-icon">♙</div>

          <div>
            <span>ROLE</span>
            <strong>{roleName}</strong>
          </div>
        </div>

        <div className="profile-overview-card">
          <div className="profile-overview-icon">♧</div>

          <div>
            <span>TEAM</span>
            <strong>
              {user.team_id
                ? `Team #${user.team_id}`
                : "Not assigned"}
            </strong>
          </div>
        </div>

        <div className="profile-overview-card">
          <div className="profile-overview-icon">✓</div>

          <div>
            <span>STATUS</span>
            <strong className="profile-active-text">
              Active
            </strong>
          </div>
        </div>

      </div>


      {/* INFORMATION SECTION */}
      <div className="profile-content-grid">

        {/* PERSONAL INFORMATION */}
        <section className="profile-section-card">

          <div className="profile-section-heading">
            <div className="profile-section-icon">
              ◉
            </div>

            <div>
              <h3>Personal Information</h3>
              <p>
                Your registered account information.
              </p>
            </div>
          </div>

          <div className="profile-info-grid">

            <div className="profile-info-item">
              <span>Full Name</span>
              <strong>{user.full_name}</strong>
            </div>

            <div className="profile-info-item">
              <span>Email Address</span>
              <strong>{user.email}</strong>
            </div>

            <div className="profile-info-item">
              <span>User ID</span>
              <strong>#{user.id}</strong>
            </div>

            <div className="profile-info-item">
              <span>Role</span>
              <strong>{roleName}</strong>
            </div>

          </div>

        </section>


        {/* WORKSPACE INFORMATION */}
        <section className="profile-section-card">

          <div className="profile-section-heading">
            <div className="profile-section-icon workspace-icon">
              ♧
            </div>

            <div>
              <h3>Workspace</h3>
              <p>
                Your organizational access details.
              </p>
            </div>
          </div>

          <div className="profile-workspace-card">

            <div className="workspace-row">
              <span>Team</span>

              <strong>
                {user.team_id
                  ? `Team #${user.team_id}`
                  : "Not assigned"}
              </strong>
            </div>

            <div className="workspace-row">
              <span>Access level</span>

              <strong>{roleName}</strong>
            </div>

            <div className="workspace-row">
              <span>Account status</span>

              <strong className="profile-active-text">
                Active
              </strong>
            </div>

          </div>

        </section>

      </div>


      {/* SECURITY SUMMARY */}
      <section className="profile-security-card">

        <div className="profile-security-icon">
          ✓
        </div>

        <div>
          <h3>Account security</h3>

          <p>
            Your account is authenticated through the platform's
            secure JWT-based authentication system.
          </p>
        </div>

        <button
          className="profile-settings-button"
          onClick={() => navigate("/settings")}
        >
          Open Settings →
        </button>

      </section>

    </div>
  );
}

export default Profile;