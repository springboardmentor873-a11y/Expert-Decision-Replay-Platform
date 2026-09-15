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

      <div className="profile-header">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1>My Profile</h1>
          <p>View your account information and role details.</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>

      <section className="profile-card">

        <div className="profile-identity">

          <div className="profile-avatar">
            {initials}
          </div>

          <div>
            <h2>{user.full_name}</h2>
            <p>{user.email}</p>
            <span className="profile-role">
              {roleName}
            </span>
          </div>

        </div>

        <div className="profile-divider" />

        <div className="profile-details">

          <div className="profile-detail">
            <span>Full Name</span>
            <strong>{user.full_name}</strong>
          </div>

          <div className="profile-detail">
            <span>Email Address</span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-detail">
            <span>Role</span>
            <strong>{roleName}</strong>
          </div>

          <div className="profile-detail">
            <span>User ID</span>
            <strong>#{user.id}</strong>
          </div>

          <div className="profile-detail">
            <span>Team ID</span>
            <strong>
              {user.team_id ? `#${user.team_id}` : "Not assigned"}
            </strong>
          </div>

          <div className="profile-detail">
            <span>Account Status</span>
            <strong className="account-active">
              Active
            </strong>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Profile;