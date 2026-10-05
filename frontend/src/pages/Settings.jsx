import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api.getMe(), api.listTeams()])
      .then(([user, teamList]) => {
        if (!active) return;
        setProfile(user);
        setTeams(Array.isArray(teamList) ? teamList : []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const teamName = teams.find((team) => team.id === profile?.team_id)?.name;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Application preferences and personal settings will be available here.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Loading account settings…</div>
      ) : error ? (
        <div className="empty-state"><h3>Account settings unavailable</h3><p>{error}</p></div>
      ) : profile ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Account</h2>
              <p className="meta">Account and team details from your profile.</p>
            </div>
            <Link className="btn btn-primary" to="/profile">Open Profile</Link>
          </div>
          <dl className="graph-details-list">
            <div><dt>Name</dt><dd>{profile.full_name}</dd></div>
            <div><dt>Email</dt><dd>{profile.email}</dd></div>
            <div><dt>Role</dt><dd>{user?.role || "Not available"}</dd></div>
            <div><dt>Team</dt><dd>{teamName || (profile.team_id ? `Team ${profile.team_id}` : "No team assigned")}</dd></div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
