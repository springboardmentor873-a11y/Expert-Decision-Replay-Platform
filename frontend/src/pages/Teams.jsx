import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { teamService } from "../services/teamService";
import { userService } from "../services/userService";
import { useToast } from "../hooks/useToast";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";

export default function Teams() {
  const { user } = useAuth();
  const canManage = user.role === "manager" || user.role === "administrator";

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const [allUsers, setAllUsers] = useState([]);
  const [addUserId, setAddUserId] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [toast, showToast] = useToast();

  const fetchTeams = useCallback(() => {
    setLoading(true);
    setError(false);
    teamService
      .list()
      .then(({ data }) => setTeams(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchTeams, [fetchTeams]);

  useEffect(() => {
    if (canManage) {
      userService.list({ is_active: true }).then(({ data }) => setAllUsers(data)).catch(() => setAllUsers([]));
    }
  }, [canManage]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || null;

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const { data } = await teamService.create(newTeam);
      setTeams((prev) => [data, ...prev]);
      setNewTeam({ name: "", description: "" });
      setShowCreate(false);
      showToast(`Team "${data.name}" created.`);
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Could not create team.");
    } finally {
      setCreating(false);
    }
  };

  const refreshSelectedTeam = async (teamId) => {
    const { data } = await teamService.get(teamId);
    setTeams((prev) => prev.map((t) => (t.id === teamId ? data : t)));
  };

  const handleAddMember = async () => {
    if (!addUserId || !selectedTeam) return;
    try {
      await teamService.addMember(selectedTeam.id, addUserId);
      await refreshSelectedTeam(selectedTeam.id);
      setAddUserId("");
      showToast("Member added.");
    } catch (err) {
      showToast(err.response?.data?.detail || "Could not add member.", "error");
    }
  };

  const confirmRemoveMember = (member) => setRemoveTarget(member);

  const handleRemoveMember = async () => {
    if (!removeTarget || !selectedTeam) return;
    try {
      await teamService.removeMember(selectedTeam.id, removeTarget.id);
      await refreshSelectedTeam(selectedTeam.id);
      showToast("Member removed.");
    } catch (err) {
      showToast(err.response?.data?.detail || "Could not remove member.", "error");
    } finally {
      setRemoveTarget(null);
    }
  };

  const availableToAdd = selectedTeam
    ? allUsers.filter((u) => !selectedTeam.members.some((m) => m.id === u.id))
    : [];

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>Teams</h1>
          <p className="page-subtitle">Browse teams and their members.</p>
        </div>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancel" : "Create team"}
          </button>
        )}
      </div>

      <Toast toast={toast} />

      {showCreate && (
        <section className="panel">
          <h2>New team</h2>
          {createError && <p className="error" role="alert">{createError}</p>}
          <form onSubmit={handleCreate} className="form-grid">
            <label>
              Name
              <input
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                required
                minLength={2}
              />
            </label>
            <label>
              Description
              <input
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Creating..." : "Create team"}
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <LoadingState label="Loading teams..." />
      ) : error ? (
        <ErrorState message="Couldn't load teams." onRetry={fetchTeams} />
      ) : teams.length === 0 ? (
        <EmptyState title="No teams yet" description={canManage ? "Create the first one above." : "Check back later."} />
      ) : (
        <div className="two-col">
          <section className="panel">
            <h2>All teams</h2>
            <ul className="plain-list clickable-list">
              {teams.map((t) => (
                <li
                  key={t.id}
                  className={t.id === selectedTeamId ? "list-item-active" : ""}
                  onClick={() => setSelectedTeamId(t.id)}
                >
                  <span className="list-item-title">{t.name}</span>
                  <span className="muted">{t.members.length} member{t.members.length === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            {!selectedTeam ? (
              <EmptyState title="Select a team" description="Choose a team from the list to see its members." />
            ) : (
              <>
                <h2>{selectedTeam.name}</h2>
                {selectedTeam.description && <p className="muted">{selectedTeam.description}</p>}

                <h3>Members</h3>
                {selectedTeam.members.length === 0 ? (
                  <p className="muted">No members yet.</p>
                ) : (
                  <ul className="plain-list">
                    {selectedTeam.members.map((m) => (
                      <li key={m.id} className="member-row">
                        <span>{m.full_name} <span className="muted">({m.email})</span></span>
                        {canManage && (
                          <button
                            type="button"
                            className="btn btn-small btn-secondary"
                            onClick={() => confirmRemoveMember(m)}
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {canManage && (
                  <div className="inline-form">
                    <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)}>
                      <option value="">Add a member...</option>
                      {availableToAdd.map((u) => (
                        <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-secondary" onClick={handleAddMember} disabled={!addUserId}>
                      Add
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove this member?"
        description={removeTarget ? `${removeTarget.full_name} will be removed from ${selectedTeam?.name}.` : ""}
        confirmLabel="Remove"
        danger
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
