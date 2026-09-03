import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const ROLE_LABELS = {
  employee: "Employee",
  reviewer: "Reviewer",
  manager: "Manager",
  administrator: "Administrator",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="navbar">
      <div className="navbar__left">
        <span className="navbar__mark">EDR</span>
        <nav className="navbar__links">
          <Link
            to="/dashboard"
            className={`navbar__link ${location.pathname === "/dashboard" ? "navbar__link--active" : ""}`}
          >
            Dashboard
          </Link>
          <Link
            to="/decisions"
            className={`navbar__link ${location.pathname.startsWith("/decisions") ? "navbar__link--active" : ""}`}
          >
            Decisions
          </Link>
        </nav>
      </div>

      <div className="navbar__right">
        <span className="navbar__user">
          {user?.full_name} <span className="navbar__role">· {ROLE_LABELS[user?.role]}</span>
        </span>
        <button className="navbar__logout" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
