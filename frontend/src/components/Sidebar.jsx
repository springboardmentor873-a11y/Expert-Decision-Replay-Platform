import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "administrator";

  const navItems = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/decisions", label: "Decisions" },
    { to: "/create-decision", label: "Create Decision" },
    { to: "/teams", label: "Teams" },
    { to: "/my-discussions", label: "My Discussions" },
    { to: "/documents", label: "Documents" },
    { to: "/analytics", label: "Analytics" },
    { to: "/profile", label: "Profile" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">Decision<br />Replay</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {item.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "") }>
            Admin
          </NavLink>
        )}
      </nav>
      <div className="sidebar-footer">
        <div style={{ marginBottom: 6, fontWeight: 600, color: "#fff" }}>{user?.full_name}</div>
        <div style={{ marginBottom: 10, opacity: 0.8, textTransform: "capitalize" }}>{user?.role}</div>
        <button onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
