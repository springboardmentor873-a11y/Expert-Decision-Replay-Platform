import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

export default function Teams() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === "administrator";
  const canManage = user?.role === "administrator" || user?.role === "manager";

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamUser, setTeamUser] = useState(user);
  const [usersAvailable, setUsersAvailable] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignTeamId, setAssignTeamId] = useState("");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const [teamResult, usersResult, profileResult] = await Promise.allSettled([
        api.listTeams(),
        isAdmin ? api.listUsers() : Promise.resolve(null),
        user?.role === "manager" ? api.getMe() : Promise.resolve(user),
      ]);
      if (teamResult.status === "rejected") throw teamResult.reason;
      const loadedTeams = Array.isArray(teamResult.value) ? teamResult.value : [];
      const resolvedTeamUser = profileResult.status === "fulfilled"
        ? { ...profileResult.value, role: user?.role }
        : user;
      setTeams(loadedTeams);
      setTeamUser(resolvedTeamUser);
      const viewableTeams = loadedTeams.filter(
        (team) => isAdmin || (
          resolvedTeamUser?.role === "manager" &&
          (team.manager_id === resolvedTeamUser.id || team.id === resolvedTeamUser.team_id)
        )
      );
      setSelectedTeamId((current) =>
        viewableTeams.some((team) => team.id === Number(current))
          ? current
          : String(viewableTeams[0]?.id ?? "")
      );

      if (isAdmin && usersResult.status === "fulfilled" && Array.isArray(usersResult.value)) {
        setUsers(usersResult.value);
        setUsersAvailable(true);
      } else {
        setUsers([]);
        setUsersAvailable(false);
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast, user?.id, user?.role, user?.team_id]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const viewableTeams = teams.filter(
    (team) => isAdmin || (
      teamUser?.role === "manager" &&
      (team.manager_id === teamUser.id || team.id === teamUser.team_id)
    )
  );
  const selectedTeam = viewableTeams.find((team) => team.id === Number(selectedTeamId));

  useEffect(() => {
    if (!selectedTeam) {
      setMembers([]);
      setMembersError("");
      setMembersLoading(false);
      return undefined;
    }

    let active = true;
    setMembersLoading(true);
    setMembersError("");
    api.listTeamMembers(selectedTeam.id)
      .then((result) => {
        if (active) setMembers(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (active) {
          setMembers([]);
          setMembersError(err.message);
        }
      })
      .finally(() => {
        if (active) setMembersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTeam?.id]);

  async function handleCreateTeam(e) {
    e.preventDefault();
    try {
      const payload = { name: newTeamName };
      if (managerId) payload.manager_id = Number(managerId);
      await api.createTeam(payload);
      setNewTeamName("");
      setManagerId("");
      showToast("Team created.");
      await loadTeams();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    try {
      const res = await api.assignUserToTeam(assignUserId, assignTeamId);
      showToast(res?.message || "User assigned.");
      setAssignUserId("");
      setAssignTeamId("");
      await loadTeams();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div className="teams-page">
      <div className="teams-hero">
        <div>
          <p className="teams-kicker">Organization</p>
          <h1>Teams</h1>
          <p className="teams-intro">Team membership across the organization.</p>
        </div>
        <div className="teams-total">
          <span className="teams-total-value">{teams.length}</span>
          <span className="teams-total-label">{teams.length === 1 ? "team" : "teams"}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Loading teams…</div>
      ) : teams.length === 0 ? (
        <div className="empty-state teams-empty-state">
          <h3>No teams yet</h3>
          <p>{canManage ? "Create the first one below." : "Ask a manager or administrator to create one."}</p>
        </div>
      ) : (
        <section className="teams-grid" aria-label="Organization teams">
          {teams.map((team) => {
            const manager = users.find((candidate) => candidate.id === team.manager_id);
            return (
              <article className="team-card" key={team.id}>
                <div className="team-card-topline">
                  <div className="team-card-mark">{team.name.slice(0, 2).toUpperCase()}</div>
                  <span className="team-card-id">Team {team.id}</span>
                </div>
                <h2>{team.name}</h2>
                <div className="team-card-detail">
                  <span className="team-card-detail-label">Manager</span>
                  <strong>
                    {team.manager_id
                      ? `${manager?.full_name || `User ${team.manager_id}`}${manager ? ` (ID ${manager.id})` : ""}`
                      : "Not assigned"}
                  </strong>
                </div>
                <div className="team-card-detail">
                  <span className="team-card-detail-label">Created</span>
                  <strong>{new Date(team.created_at).toLocaleDateString()}</strong>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="panel team-members-panel">
        <div className="panel-header">
          <div>
            <h2>Team members</h2>
            <p className="team-member-note">
              {isAdmin
                ? "Select any team to view its current members."
                : teamUser?.role === "manager"
                  ? "You can view members of teams you manage or belong to."
                  : "Member details are restricted to managers of a team and administrators."}
            </p>
          </div>
          {viewableTeams.length > 0 && (
            <div className="team-member-selector">
              <label htmlFor="team-members-select">Team</label>
              <select
                id="team-members-select"
                value={selectedTeamId}
                onChange={(event) => setSelectedTeamId(event.target.value)}
              >
                {viewableTeams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!isAdmin && teamUser?.role !== "manager" ? (
          <div className="empty-state slim"><p>You do not have permission to view team members.</p></div>
        ) : viewableTeams.length === 0 ? (
          <div className="empty-state slim">
            <p>{isAdmin ? "No teams are available." : "You are not assigned to or managing a team."}</p>
          </div>
        ) : membersLoading ? (
          <div className="loading-text">Loading team members…</div>
        ) : membersError ? (
          <div className="empty-state slim"><p>{membersError}</p></div>
        ) : members.length === 0 ? (
          <div className="empty-state slim"><p>No members are assigned to this team.</p></div>
        ) : (
          <ul className="team-member-list">
            {members.map((member) => (
              <li key={member.id}>
                <strong>{member.full_name}</strong>
                <span>{member.email}</span>
                <span>{member.role}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage && (
        <section className="teams-management">
          <div className="teams-section-heading">
            <p className="teams-kicker">Team management</p>
            <h2>Keep your organization in sync</h2>
            <p>Create a team or assign an existing user to one.</p>
          </div>

          <div className="teams-management-grid">
            <form className="team-form-card" onSubmit={handleCreateTeam}>
              <div className="team-form-heading">
                <span className="team-form-number">01</span>
                <div>
                  <h3>Create a team</h3>
                  <p>Add a new group to the organization.</p>
                </div>
              </div>
              <div className="field">
                <label htmlFor="new-team-name">Team name</label>
                <input
                  id="new-team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="new-team-manager">Manager user ID (optional)</label>
                <input
                  id="new-team-manager"
                  type="number"
                  min="1"
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" type="submit">Create team</button>
            </form>

            <form className="team-form-card" onSubmit={handleAssign}>
              <div className="team-form-heading">
                <span className="team-form-number">02</span>
                <div>
                  <h3>Assign a user</h3>
                  <p>Place a user in an existing team.</p>
                </div>
              </div>
              <div className="team-form-fields">
                <div className="field">
                  <label htmlFor="assign-user">User</label>
                  {isAdmin && usersAvailable ? (
                    <select
                      id="assign-user"
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      required
                    >
                      <option value="">Select a user…</option>
                      {users.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name} (ID {member.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="assign-user"
                      type="number"
                      min="1"
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      required
                    />
                  )}
                </div>
                <div className="field">
                  <label htmlFor="assign-team">Team</label>
                  <select
                    id="assign-team"
                    value={assignTeamId}
                    onChange={(e) => setAssignTeamId(e.target.value)}
                    required
                    disabled={teams.length === 0}
                  >
                    <option value="">Select a team…</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={teams.length === 0}>
                Assign user
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
