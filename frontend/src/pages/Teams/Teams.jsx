import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  createJoinRequest,
  createTeam,
  getMyJoinRequests,
  getMyTeam,
  listTeams,
} from "../../services/teams";
import "./Teams.css";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TeamCard({ team, canJoin, requestPending, joining, onJoin }) {
  return (
    <li className="teams__card">
      <div className="teams__card-main">
        <h2 className="teams__card-title">{team.name}</h2>
        {team.description ? (
          <p className="teams__card-desc">{team.description}</p>
        ) : (
          <p className="teams__card-desc teams__card-desc--muted">No description</p>
        )}
        <div className="teams__card-meta">
          <span>
            {team.member_count} member{team.member_count === 1 ? "" : "s"}
          </span>
          <span>
            {team.decision_count} decision{team.decision_count === 1 ? "" : "s"}
          </span>
          <span>Created {formatDate(team.created_at)}</span>
        </div>
      </div>
      <div className="teams__card-side">
        {canJoin && (
          <button
            className={`teams__card-button ${requestPending ? "teams__card-button--muted" : ""}`}
            onClick={() => onJoin(team)}
            disabled={requestPending || joining}
          >
            {requestPending ? "Request Pending" : joining ? "Joining…" : "Join Team"}
          </button>
        )}
        <Link
          to={`/teams/${team.id}`}
          className="teams__card-button"
          aria-label={`View ${team.name}`}
        >
          View Team
        </Link>
      </div>
    </li>
  );
}

export default function Teams() {
  const { user, tokens } = useAuth();
  const canManage = user?.role === "manager" || user?.role === "administrator";

  const [tab, setTab] = useState("all");
  const [teams, setTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [myJoinRequests, setMyJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [joiningTeamId, setJoiningTeamId] = useState(null);
  const [joinError, setJoinError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [teamData, myTeamData, requestsData] = await Promise.all([
          listTeams(tokens.access_token),
          getMyTeam(tokens.access_token),
          getMyJoinRequests(tokens.access_token),
        ]);
        setTeams(teamData);
        setMyTeam(myTeamData);
        setMyJoinRequests(requestsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tokens]);

  const hasTeam = Boolean(myTeam);
  const pendingTeamIds = new Set(
    myJoinRequests
      .filter((request) => request.status === "pending")
      .map((request) => request.team_id)
  );

  async function handleJoin(team) {
    setJoiningTeamId(team.id);
    setJoinError("");
    try {
      const request = await createJoinRequest(team.id, tokens.access_token);
      setMyJoinRequests((prev) => [...prev, request]);
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoiningTeamId(null);
    }
  }

  const visible = [...teams]
    .filter(
      (team) =>
        !search ||
        team.name.toLowerCase().includes(search.toLowerCase()) ||
        (team.description || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const diff = a.name.localeCompare(b.name);
      return sortAsc ? diff : -diff;
    });

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const team = await createTeam(newTeam, tokens.access_token);
      setTeams((prev) => [...prev, team].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTeam({ name: "", description: "" });
      setShowCreate(false);
      setTab("all");
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="teams">
        <header className="teams__header">
          <div>
            <p className="teams__eyebrow">Organization</p>
            <h1 className="teams__title">My Teams</h1>
            <p className="teams__subtitle">Manage and explore your organization's teams</p>
          </div>
          {canManage && (
            <button
              className="teams__new-button"
              onClick={() => setShowCreate((v) => !v)}
            >
              Create team
            </button>
          )}
        </header>

        {error && <div className="teams__error">{error}</div>}
        {joinError && <div className="teams__error">{joinError}</div>}

        {showCreate && (
          <form className="teams__create" onSubmit={handleCreate}>
            <h2 className="teams__create-title">Create a team</h2>
            <label className="teams__field">
              <span>Team name</span>
              <input
                required
                maxLength={120}
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="e.g. Data Platform"
              />
            </label>
            <label className="teams__field">
              <span>Description</span>
              <textarea
                maxLength={500}
                rows={3}
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                placeholder="What does this team work on?"
              />
            </label>
            {createError && <div className="teams__create-error">{createError}</div>}
            <div className="teams__create-actions">
              <button
                type="button"
                className="teams__create-cancel"
                onClick={() => {
                  setShowCreate(false);
                  setCreateError("");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="teams__create-submit" disabled={creating}>
                {creating ? "Creating…" : "Create team"}
              </button>
            </div>
          </form>
        )}

        <div className="teams__toolbar">
          <div className="teams__tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "all"}
              className={`teams__tab ${tab === "all" ? "teams__tab--active" : ""}`}
              onClick={() => setTab("all")}
            >
              All Teams
            </button>
            <button
              role="tab"
              aria-selected={tab === "my"}
              className={`teams__tab ${tab === "my" ? "teams__tab--active" : ""}`}
              onClick={() => setTab("my")}
            >
              My Team
            </button>
          </div>

          <div className="teams__controls">
            <input
              className="teams__search"
              type="search"
              placeholder="Search teams"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="teams__sort"
              onClick={() => setSortAsc((v) => !v)}
              title="Toggle sort direction"
            >
              Sort by Name {sortAsc ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="teams__loading">Loading…</p>
        ) : tab === "all" ? (
          visible.length === 0 ? (
            <div className="teams__empty">
              <p>
                {teams.length === 0
                  ? "No teams have been set up yet."
                  : "No teams match your search."}
              </p>
            </div>
          ) : (
            <ul className="teams__list">
              {visible.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  canJoin={!hasTeam}
                  requestPending={pendingTeamIds.has(team.id)}
                  joining={joiningTeamId === team.id}
                  onJoin={handleJoin}
                />
              ))}
            </ul>
          )
        ) : myTeam ? (
          <ul className="teams__list">
            <TeamCard key={myTeam.id} team={myTeam} />
          </ul>
        ) : (
          <div className="teams__empty">
            <p>You are not assigned to a team yet. Click “Join Team” on any team below.</p>
          </div>
        )}
      </main>
    </div>
  );
}
