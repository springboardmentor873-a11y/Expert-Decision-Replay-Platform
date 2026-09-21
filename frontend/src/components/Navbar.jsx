import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

const roleNames = {
  1: "Employee",
  2: "Reviewer",
  3: "Manager",
  4: "Administrator",
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchCurrentUser();
    fetchUnreadNotifications();
  }, []);

  async function fetchCurrentUser() {
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
        throw new Error(data.detail || "Failed to load user");
      }

      setUser(data);
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  }

  async function fetchUnreadNotifications() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/notifications/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    const unreadCount = data.filter(
      (notification) => !notification.is_read
    ).length;

    setUnreadNotifications(unreadCount);
  } catch (error) {
    console.error("Failed to load notifications:", error);
  }
}

  function handleLogout() {
    localStorage.removeItem("access_token");
    navigate("/");
  }

  function isActive(path) {
    if (path === "/decisions") {
      return location.pathname.startsWith("/decisions");
    }

    return location.pathname === path;
  }

  const userName = user?.full_name || "Loading...";
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
    <aside className="sidebar">

      <div
        className="sidebar-brand"
        onClick={() => navigate("/dashboard")}
      >
        <div className="brand-logo">ED</div>

        <div className="brand-text">
          <h1>Expert Decision</h1>
          <span>Replay Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">

        <button
          className={
            isActive("/dashboard")
              ? "sidebar-link active"
              : "sidebar-link"
          }
          onClick={() => navigate("/dashboard")}
        >
          <span className="nav-icon">⌂</span>
          <span>Dashboard</span>
        </button>

        <button
          className={
            isActive("/decisions")
              ? "sidebar-link active"
              : "sidebar-link"
          }
          onClick={() => navigate("/decisions")}
        >
          <span className="nav-icon">✓</span>
          <span>Decisions</span>
        </button>

        <button
  className={isActive("/approvals") ? "sidebar-link active" : "sidebar-link"}
  onClick={() => navigate("/approvals")}
>
  <span className="nav-icon">✓</span>
  <span>Approvals</span>
</button>

<button
  className={
    isActive("/notifications")
      ? "sidebar-link active"
      : "sidebar-link"
  }
  onClick={() => navigate("/notifications")}
>
  <span className="nav-icon">🔔</span>
  <span>Notifications</span>

  {unreadNotifications > 0 && (
    <span className="notification-badge">
      {unreadNotifications}
    </span>
  )}
</button>
<button
  className={
    isActive("/reports")
      ? "sidebar-link active"
      : "sidebar-link"
  }
  onClick={() => navigate("/reports")}
>
  <span className="nav-icon">📊</span>
  <span>Reports</span>
</button>
        <button
          className="sidebar-link"
          onClick={() => navigate("/decisions/create")}
        >
          <span className="nav-icon">＋</span>
          <span>Create Decision</span>
        </button>

        <button className="sidebar-link">
          <span className="nav-icon">♧</span>
          <span>Teams</span>
        </button>

        <button className="sidebar-link">
          <span className="nav-icon">◌</span>
          <span>Discussions</span>
        </button>

        <button className="sidebar-link">
          <span className="nav-icon">▣</span>
          <span>Documents</span>
        </button>

        <button className="sidebar-link">
          <span className="nav-icon">▥</span>
          <span>Analytics</span>
        </button>

        <button
          className={
            isActive("/profile")
              ? "sidebar-link active"
              : "sidebar-link"
          }
          onClick={() => navigate("/profile")}
        >
          <span className="nav-icon">♙</span>
          <span>Profile</span>
        </button>

        <button className="sidebar-link">
          <span className="nav-icon">⚙</span>
          <span>Settings</span>
        </button>

      </nav>

      <div className="sidebar-bottom">

        <div className="user-mini">

          <div className="user-avatar">
            {initials}
          </div>

          <div>
            <strong>{userName}</strong>
            <span>{roleName}</span>
          </div>

        </div>

        <button
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </div>

    </aside>
  );
}

export default Navbar;