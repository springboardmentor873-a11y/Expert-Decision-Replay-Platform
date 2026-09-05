import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

export default function Teams() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canManage = user?.role === "administrator" || user?.role === "manager";

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignTeamId, setAssignTeamId] = useState("");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      setTeams(await api.listTeams());
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  async function handleCreateTeam(e) {
    e.preventDefault();
    try {
      await api.createTeam({ name: newTeamName });
      setNewTeamName("");
      showToast("Team created.");
      loadTeams();
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
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Teams</h1>
          <p>Team membership across the organization.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Loading teams…</div>
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <h3>No teams yet</h3>
          <p>{canManage ? "Create the first one below." : "Ask a manager or administrator to create one."}</p>
        </div>
      ) : (
        <table className="decisions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Manager ID</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td>{t.manager_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canManage && (
        <>
          <h3 style={{ marginTop: 28, marginBottom: 14 }}>Create a team</h3>
          <form className="form-card" style={{ maxWidth: 420, flexDirection: "row", display: "flex", gap: 10, alignItems: "flex-end" }} onSubmit={handleCreateTeam}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Team name</label>
              <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit">Create</button>
          </form>

          <h3 style={{ marginTop: 28, marginBottom: 14 }}>Assign a user to a team</h3>
          <form className="form-card" style={{ maxWidth: 420, flexDirection: "row", display: "flex", gap: 10, alignItems: "flex-end" }} onSubmit={handleAssign}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>User ID</label>
              <input value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} required />
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Team ID</label>
              <input value={assignTeamId} onChange={(e) => setAssignTeamId(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit">Assign</button>
          </form>
        </>
      )}
    </div>
  );
}
