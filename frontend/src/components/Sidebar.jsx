import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "administrator";

  return (
    <div className="sidebar">
      <div className="sidebar-brand">Decision<br />Replay</div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Decisions
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
          Profile
        </NavLink>
        <NavLink to="/teams" className={({ isActive }) => (isActive ? "active" : "")}>
          Teams
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
            Admin
          </NavLink>
        )}
      </nav>
      <div className="sidebar-footer">
        <div style={{ marginBottom: 6 }}>{user?.full_name}</div>
        <div style={{ marginBottom: 10, opacity: 0.8 }}>{user?.role}</div>
        <button onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
