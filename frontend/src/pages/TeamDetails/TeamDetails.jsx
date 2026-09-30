import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import TeamHierarchy from "../../components/TeamHierarchy/TeamHierarchy";
import { useAuth } from "../../context/AuthContext";
import {
  createJoinRequest,
  getMyJoinRequests,
  getMyTeam,
  getTeam,
} from "../../services/teams";
import "./TeamDetails.css";

const ROLE_LABELS = {
  employee: "Employee",
  reviewer: "Reviewer",
  manager: "Manager",
  administrator: "Administrator",
};

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TeamDetails() {
  const { teamId } = useParams();
  const { tokens } = useAuth();
  const [team, setTeam] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [myJoinRequests, setMyJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  async function load() {
    const data = await getTeam(teamId, tokens.access_token);
    setTeam(data);
    const [ownTeam, requests] = await Promise.all([
      getMyTeam(tokens.access_token),
      getMyJoinRequests(tokens.access_token),
    ]);
    setMyTeam(ownTeam);
    setMyJoinRequests(requests);
  }

  useEffect(() => {
    setLoading(true);
    setError("");
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, tokens]);

  async function handleJoin() {
    setJoining(true);
    setJoinError("");
    try {
      const request = await createJoinRequest(teamId, tokens.access_token);
      setMyJoinRequests((prev) => [...prev, request]);
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
    }
  }

  const hasTeam = Boolean(myTeam);
  const pendingRequest = myJoinRequests.some(
    (request) => request.team_id === teamId && request.status === "pending"
  );

  return (
    <div className="page">
      <Navbar />
      <main className="team-details">
        <Link to="/teams" className="team-details__back">
          ← Back to My Teams
        </Link>

        {error && <div className="team-details__error">{error}</div>}

        {loading ? (
          <p className="team-details__loading">Loading…</p>
        ) : team ? (
          <>
            <header className="team-details__header">
              <div>
                <p className="team-details__eyebrow">Team</p>
                <h1 className="team-details__title">{team.name}</h1>
                {team.description ? (
                  <p className="team-details__desc">{team.description}</p>
                ) : (
                  <p className="team-details__desc team-details__desc--muted">No description</p>
                )}
              </div>
              <div className="team-details__header-actions">
                {!hasTeam && team && (
                  <button
                    className={`team-details__join ${pendingRequest ? "team-details__join--pending" : ""}`}
                    onClick={handleJoin}
                    disabled={pendingRequest || joining}
                  >
                    {pendingRequest ? "Request Pending" : joining ? "Joining…" : "Join Team"}
                  </button>
                )}
                <div className="team-details__stats">
                <span className="team-details__stat">
                  <strong>{team.member_count}</strong> member{team.member_count === 1 ? "" : "s"}
                </span>
                <span className="team-details__stat">
                  <strong>{team.decision_count}</strong> decision
                  {team.decision_count === 1 ? "" : "s"}
                </span>
                <span className="team-details__stat">Created {formatDate(team.created_at)}</span>
              </div>
              </div>
            </header>

            {joinError && <div className="team-details__error">{joinError}</div>}

            {team.members.length > 0 && <TeamHierarchy team={team} />}

            <section className="team-details__panel">
              <h2 className="team-details__panel-title">Members</h2>
              {team.members.length === 0 ? (
                <div className="team-details__empty">
                  <p>No members assigned to this team yet.</p>
                </div>
              ) : (
                <ul className="team-details__members">
                  {team.members.map((member) => (
                    <li key={member.id} className="team-details__member">
                      <span className="team-details__member-name">{member.full_name}</span>
                      <span className="team-details__member-email">{member.email}</span>
                      <span className="team-details__member-role">
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="team-details__panel">
              <h2 className="team-details__panel-title">Recent decisions</h2>
              {team.decisions.length === 0 ? (
                <div className="team-details__empty">
                  <p>This team hasn't recorded any decisions yet.</p>
                </div>
              ) : (
                <ul className="team-details__decisions">
                  {team.decisions.map((decision) => (
                    <li key={decision.id} className="team-details__decision">
                      <Link to={`/decisions/${decision.id}`} className="team-details__decision-main">
                        <span className="team-details__decision-title">{decision.title}</span>
                        <span className="team-details__decision-date">
                          {formatDate(decision.created_at)}
                        </span>
                      </Link>
                      <StatusBadge status={decision.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}