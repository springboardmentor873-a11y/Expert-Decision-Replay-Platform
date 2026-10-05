import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

const CATEGORIES = ["Architecture", "Infrastructure", "Security", "Process"];

export default function CreateDecision() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Architecture");
  const [problemStatement, setProblemStatement] = useState("");
  const [rationale, setRationale] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadTeams() {
      setTeamsLoading(true);
      setTeamsError("");
      try {
        const [teamData, profile] = await Promise.all([api.listTeams(), api.getMe()]);
        const availableTeams = Array.isArray(teamData) ? teamData : [];
        const userTeams = user?.role === "employee"
          ? availableTeams.filter((team) => team.id === profile.team_id)
          : availableTeams;
        if (active) {
          setTeams(userTeams);
          setTeamId("");
        }
      } catch (err) {
        if (active) setTeamsError(err.message);
      } finally {
        if (active) setTeamsLoading(false);
      }
    }
    loadTeams();
    return () => {
      active = false;
    };
  }, [user?.role]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const created = await api.createDecision({
        title,
        category,
        problem_statement: problemStatement,
        rationale,
        ...(teamId ? { team_id: Number(teamId) } : {}),
      });

      showToast("Decision created.");
      navigate(`/decisions/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Create Decision</h1>
          <p>Document a decision and preserve the context behind it.</p>
        </div>
      </div>

      <div className="form-card create-decision-form">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Adopt Kubernetes for staging environment"
            />
          </div>

          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="team">Team</label>
            {teamsLoading ? (
              <div className="loading-text">Loading teams…</div>
            ) : teamsError ? (
              <div className="error-text">Unable to load teams: {teamsError}</div>
            ) : teams.length === 0 ? (
              <>
                <select id="team" value="" disabled>
                  <option value="">No team assigned</option>
                </select>
                <span className="team-member-note">
                  {user?.role === "employee" ? "No team assigned" : "No teams available"}
                </span>
              </>
            ) : (
              <select id="team" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">No team assigned</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="field">
            <label htmlFor="problem">Problem statement</label>
            <textarea
              id="problem"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="What issue or opportunity led to this decision?"
            />
          </div>

          <div className="field">
            <label htmlFor="rationale">Rationale</label>
            <textarea
              id="rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why was this approach chosen?"
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
