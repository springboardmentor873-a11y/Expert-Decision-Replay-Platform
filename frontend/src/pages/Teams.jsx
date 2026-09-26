import React, { useEffect, useState } from "react";
import api from "../api/api";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [teamName, setTeamName] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/teams/overview");
      setTeams(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load teams."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get("/users/");
      setUsers(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load users."
      );
    }
  };

  useEffect(() => {
    loadTeams();
    loadUsers();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) {
      setError("Please enter a team name.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      await api.post("/teams/", {
        name: teamName.trim(),
      });

      setTeamName("");
      setShowCreate(false);

      setSuccess("Team created successfully.");

      await loadTeams();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to create team."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
    setShowAddMember(false);
    setSelectedUser("");
    setError("");
    setSuccess("");
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUser) {
      setError("Please select a user.");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      await api.put(
        `/users/${selectedUser}/team/${selectedTeam.id}`
      );

      setSuccess("Member added successfully.");
      setSelectedUser("");
      setShowAddMember(false);

      await loadUsers();
      await loadTeams();

      const updatedTeams =
        await api.get("/teams/overview");

      const updatedTeam =
        updatedTeams.data.find(
          (team) => team.id === selectedTeam.id
        );

      setSelectedTeam(updatedTeam || null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to add member."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (
      !window.confirm(
        "Remove this user from the team?"
      )
    ) {
      return;
    }

    try {
      setRemoving(userId);
      setError("");
      setSuccess("");

      await api.delete(`/users/${userId}/team`);

      setSuccess("Member removed successfully.");

      await loadUsers();
      await loadTeams();

      const updatedTeams =
        await api.get("/teams/overview");

      const updatedTeam =
        updatedTeams.data.find(
          (team) => team.id === selectedTeam?.id
        );

      setSelectedTeam(updatedTeam || null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to remove member."
      );
    } finally {
      setRemoving(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    if (
      !window.confirm(
        `Delete "${selectedTeam.name}"?`
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await api.delete(
        `/teams/${selectedTeam.id}`
      );

      setSuccess("Team deleted successfully.");
      setSelectedTeam(null);

      await loadTeams();
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to delete team."
      );
    } finally {
      setDeleting(false);
    }
  };

  const availableUsers = selectedTeam
    ? users.filter(
        (user) =>
          !selectedTeam.members.some(
            (member) => member.id === user.id
          )
      )
    : [];

  const getStatusClass = (status) => {
    if (
      status === "Approved" ||
      status === "Completed"
    ) {
      return "team-status-approved";
    }

    if (status === "Rejected") {
      return "team-status-rejected";
    }

    if (status === "In Progress") {
      return "team-status-progress";
    }

    return "team-status-draft";
  };

  return (
    <div className="page-container teams-dashboard">

      {/* HEADER */}
      <div className="teams-header">
        <div>
          <div className="teams-eyebrow">
            COLLABORATION
          </div>

          <h1>My Teams</h1>

          <p>
            Teams you are a part of. Collaborate,
            contribute and make better decisions together.
          </p>
        </div>

        <button
          className="team-create-top-button"
          onClick={() => setShowCreate(!showCreate)}
        >
          + Create Team
        </button>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* CREATE TEAM */}
      {showCreate && (
        <div className="team-create-panel">
          <div>
            <h3>Create a New Team</h3>
            <p>
              Create a team and then add existing users
              with their current roles.
            </p>
          </div>

          <form
            className="team-create-inline"
            onSubmit={handleCreateTeam}
          >
            <input
              value={teamName}
              onChange={(e) =>
                setTeamName(e.target.value)
              }
              placeholder="Enter team name"
            />

            <button
              type="submit"
              className="primary-button"
              disabled={creating}
            >
              {creating
                ? "Creating..."
                : "Create"}
            </button>
          </form>
        </div>
      )}

      {/* SUMMARY */}
      <div className="teams-summary-row">
        <div className="teams-summary-card">
          <div className="teams-summary-icon blue">
            👥
          </div>

          <div>
            <strong>{teams.length}</strong>
            <span>Total Teams</span>
          </div>
        </div>

        <div className="teams-summary-card">
          <div className="teams-summary-icon green">
            ●
          </div>

          <div>
            <strong>
              {
                teams.filter(
                  (team) => team.status === "Active"
                ).length
              }
            </strong>
            <span>Active Teams</span>
          </div>
        </div>

        <div className="teams-summary-card">
          <div className="teams-summary-icon purple">
            👤
          </div>

          <div>
            <strong>
              {teams.reduce(
                (total, team) =>
                  total + team.member_count,
                0
              )}
            </strong>
            <span>Total Members</span>
          </div>
        </div>
      </div>

      {/* TEAM LIST */}
      <div className="teams-section-title">
        <div>
          <h2>Active Teams</h2>
          <p>
            Explore your teams and their recent decisions.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="teams-loading">
          <div>◌</div>
          <h3>Loading teams...</h3>
        </div>
      ) : teams.length === 0 ? (
        <div className="teams-empty">
          <div>👥</div>
          <h3>No teams yet</h3>
          <p>
            Create your first team to get started.
          </p>
        </div>
      ) : (
        <div className="teams-reference-grid">
          {teams.map((team) => (
            <div
              className={
                selectedTeam?.id === team.id
                  ? "reference-team-card selected"
                  : "reference-team-card"
              }
              key={team.id}
            >
              {/* TEAM CARD HEADER */}
              <div className="reference-team-top">
                <div className="reference-team-icon">
                  👥
                </div>

                <button
                  className="team-menu-button"
                  onClick={() =>
                    handleSelectTeam(team)
                  }
                >
                  ⋯
                </button>
              </div>

              <h3>{team.name}</h3>

              <p className="team-description">
                {team.member_count > 0
                  ? "Collaborating on better decisions and shared knowledge."
                  : "This team is ready for members."}
              </p>

              <div className="team-card-status-row">
                <span className="active-team-badge">
                  ● {team.status}
                </span>

                <span>
                  {team.member_count} member
                  {team.member_count !== 1
                    ? "s"
                    : ""}
                </span>
              </div>

              {/* RECENT DECISIONS */}
              <div className="recent-team-decisions">
                <h4>Recent Decisions</h4>

                {team.recent_decisions?.length ? (
                  team.recent_decisions
                    .slice(0, 2)
                    .map((decision) => (
                      <div
                        className="team-decision-row"
                        key={decision.id}
                      >
                        <span className="decision-file-icon">
                          ▣
                        </span>

                        <div>
                          <strong>
                            {decision.title}
                          </strong>

                          <span>
                            <span
                              className={`mini-decision-status ${getStatusClass(
                                decision.status
                              )}`}
                            >
                              {decision.status}
                            </span>
                          </span>
                        </div>

                        <span className="decision-arrow">
                          →
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="no-team-decisions">
                    No recent decisions
                  </p>
                )}
              </div>

              <button
                className="view-team-button"
                onClick={() =>
                  handleSelectTeam(team)
                }
              >
                View Team
              </button>
            </div>
          ))}

          {/* CREATE CARD */}
          <button
            className="create-team-placeholder"
            onClick={() => setShowCreate(true)}
          >
            <div className="create-team-plus">
              +
            </div>

            <h3>Create a Team</h3>

            <p>
              Bring people together to collaborate
              on decisions.
            </p>
          </button>
        </div>
      )}

      {/* SELECTED TEAM */}
      {selectedTeam && (
        <div className="selected-team-panel">

          <div className="selected-team-header">
            <div>
              <div className="selected-team-label">
                TEAM DETAILS
              </div>

              <h2>{selectedTeam.name}</h2>

              <p>
                {selectedTeam.member_count} members
                · {selectedTeam.status}
              </p>
            </div>

            <div className="selected-team-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setShowAddMember(
                    !showAddMember
                  )
                }
              >
                + Add Member
              </button>

              <button
                className="danger-button"
                onClick={handleDeleteTeam}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Team"}
              </button>
            </div>
          </div>

          {/* ADD MEMBER */}
          {showAddMember && (
            <div className="team-add-member-panel">
              <div>
                <h3>Add Existing Member</h3>

                <p>
                  Users keep their existing
                  Employee, Reviewer, Manager or
                  Administrator role.
                </p>
              </div>

              <div className="team-add-member-form">
                <select
                  value={selectedUser}
                  onChange={(e) =>
                    setSelectedUser(e.target.value)
                  }
                >
                  <option value="">
                    Select a user
                  </option>

                  {availableUsers.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.full_name} —{" "}
                      {user.role_name}
                    </option>
                  ))}
                </select>

                <button
                  className="primary-button"
                  onClick={handleAddMember}
                  disabled={
                    adding || !selectedUser
                  }
                >
                  {adding
                    ? "Adding..."
                    : "Add Member"}
                </button>
              </div>
            </div>
          )}

          {/* MEMBERS */}
          <div className="team-members-section">
            <div className="selected-section-heading">
              <div>
                <h3>Team Members</h3>
                <p>
                  {selectedTeam.member_count} people
                  in this team
                </p>
              </div>
            </div>

            <div className="professional-members-grid">
              {selectedTeam.members.map(
                (member) => (
                  <div
                    className="professional-member"
                    key={member.id}
                  >
                    <div className="professional-avatar">
                      {member.full_name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div className="professional-member-info">
                      <h4>
                        {member.full_name}
                      </h4>

                      <span>
                        {member.role_name}
                      </span>
                    </div>

                    <button
                      className="member-remove-icon"
                      title="Remove member"
                      onClick={() =>
                        handleRemoveMember(
                          member.id
                        )
                      }
                      disabled={
                        removing === member.id
                      }
                    >
                      {removing === member.id
                        ? "..."
                        : "×"}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM ACTIVITY */}
      <div className="teams-bottom-grid">

        <div className="team-activity-card">
          <div className="bottom-card-heading">
            <div>
              <h3>Team Activity</h3>
              <p>Recent team-related information</p>
            </div>
          </div>

          {selectedTeam &&
          selectedTeam.recent_decisions?.length ? (
            selectedTeam.recent_decisions.map(
              (decision) => (
                <div
                  className="team-activity-item"
                  key={decision.id}
                >
                  <div className="activity-dot">
                    ●
                  </div>

                  <div>
                    <strong>
                      Decision updated
                    </strong>

                    <p>
                      {decision.title}
                    </p>
                  </div>
                </div>
              )
            )
          ) : (
            <div className="team-activity-empty">
              Select a team to see recent activity.
            </div>
          )}
        </div>

        <div className="team-collaboration-card">
          <div className="collaboration-icon">
            👥
          </div>

          <h3>Better decisions together</h3>

          <p>
            Bring your team knowledge, discussions
            and decisions together in one place.
          </p>

          <button
            onClick={() => setShowCreate(true)}
          >
            Create Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default Teams;