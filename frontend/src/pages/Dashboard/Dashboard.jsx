import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

const ROLE_LABELS = {
  employee: "Employee",
  reviewer: "Reviewer",
  manager: "Manager",
  administrator: "Administrator",
};

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page">
      <Navbar />
      <main className="dashboard__body">
        <p className="dashboard__eyebrow">Signed in as</p>
        <h1 className="dashboard__title">{user?.full_name}</h1>
        <p className="dashboard__meta">
          {user?.email} · <span className="dashboard__role">{ROLE_LABELS[user?.role]}</span>
        </p>

        <Link to="/decisions" className="dashboard__cta">
          View decisions →
        </Link>
      </main>
    </div>
  );
}
