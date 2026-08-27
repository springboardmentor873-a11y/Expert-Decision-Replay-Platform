import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { teamService } from "../services/teamService";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";

export default function Dashboard() {
  const { user } = useAuth();
  const [teamCount, setTeamCount] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    let cancelled = false;
    teamService
      .list()
      .then(({ data }) => {
        if (cancelled) return;
        const mine = data.filter((team) => team.members.some((m) => m.id === user.id));
        setTeamCount(mine.length);
      })
      .catch(() => !cancelled && setTeamCount(null))
      .finally(() => !cancelled && setLoadingTeams(false));
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const quickActions = [
    { to: "/profile", label: "Edit my profile" },
    { to: "/teams", label: "Browse teams" },
  ];
  if (user.role === "manager" || user.role === "administrator") {
    quickActions.push({ to: "/users", label: "Manage users" });
  }
  if (user.role === "administrator") {
    quickActions.push({ to: "/audit", label: "Review audit log" });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Welcome back, {user.full_name.split(" ")[0]}</h1>
        <p className="page-subtitle">Here's where things stand on the platform today.</p>
      </div>

      <section className="cards">
        <div className="card">
          <span className="card-label">Role</span>
          <span className="card-value">
            <StatusBadge tone="accent">{user.role}</StatusBadge>
          </span>
        </div>
        <div className="card">
          <span className="card-label">Account status</span>
          <span className="card-value">
            <StatusBadge tone={user.is_active ? "success" : "danger"}>
              {user.is_active ? "Active" : "Inactive"}
            </StatusBadge>
          </span>
        </div>
        <div className="card">
          <span className="card-label">Teams</span>
          <span className="card-value">
            {loadingTeams ? <LoadingState label="Loading..." /> : (teamCount ?? "—")}
          </span>
        </div>
        <div className="card">
          <span className="card-label">System status</span>
          <span className="card-value">
            <StatusBadge tone="success">Operational</StatusBadge>
          </span>
        </div>
      </section>

      <section className="panel">
        <h2>Quick actions</h2>
        <div className="quick-actions">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="btn btn-secondary">
              {action.label}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
