import { useEffect, useState, type FormEvent } from "react";
import { AppLayout } from "../components/AppLayout";
import { useAuth } from "../lib/auth";
import { api, ApiError, type TeamDetail, type TeamSummary, type User } from "../lib/api";
import { avatarColor, initials } from "../lib/format";

export function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selected, setSelected] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", department: "" });
  const canManage = user?.role === "Manager" || user?.role === "Administrator";

  const loadTeams = () => {
    api
      .get<TeamSummary[]>("/teams")
      .then(setTeams)
      .catch((e) => setError(e.message));
  };

  useEffect(loadTeams, []);

  const openTeam = (teamId: number) => {
    api
      .get<TeamDetail>(`/teams/${teamId}`)
      .then(setSelected)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load team"));
  };

  const createTeam = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/teams", form);
      setShowForm(false);
      setForm({ name: "", department: "" });
      loadTeams();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create team");
    }
  };

  if (selected) {
    return (
      <AppLayout title="Teams">
        <div className="page-header">
          <div>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>
              ← Back to teams
            </button>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 4 }}>{selected.name}</h2>
          <p className="text-muted">{selected.department} · {selected.member_count} members</p>
          <div className="divider" />
          <h3 className="section-title">Members</h3>
          {selected.members.length === 0 ? (
            <p className="text-muted">No members yet.</p>
          ) : (
            selected.members.map((m) => (
              <div className="team-card" key={m.id}>
                <div className="avatar-circle" style={{ background: avatarColor(m.full_name) }}>
                  {initials(m.full_name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="activity-row-title">{m.full_name}</div>
                  <div className="activity-row-sub">{m.designation} · {m.email}</div>
                </div>
                <span className="role-badge">{m.role}</span>
                {canManage && (
                  <button
                    className="btn btn-secondary"
                    style={{ marginLeft: 10 }}
                    onClick={async () => {
                      await api.delete(`/teams/${selected.id}/members/${m.id}`);
                      openTeam(selected.id);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
          {canManage && <AddMemberForm teamId={selected.id} onAdded={() => openTeam(selected.id)} />}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Teams">
      <div className="page-header">
        <div>
          <h2>Teams</h2>
          <p>Organizational teams and their members.</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ New team"}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card" style={{ maxWidth: 480 }}>
          <form onSubmit={createTeam}>
            <div className="field">
              <label>Team name</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Department</label>
              <input
                required
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" type="submit">Create team</button>
          </form>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="empty-state">
          <h3>No teams yet</h3>
        </div>
      ) : (
        <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {teams.map((t) => (
            <div className="card" key={t.id} style={{ cursor: "pointer" }} onClick={() => openTeam(t.id)}>
              <div className="avatar-circle" style={{ background: avatarColor(t.name), marginBottom: 10 }}>
                {initials(t.name)}
              </div>
              <h3 className="section-title" style={{ margin: 0 }}>{t.name}</h3>
              <p className="text-muted" style={{ margin: 0 }}>{t.department} · {t.member_count} members</p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function AddMemberForm({ teamId, onAdded }: { teamId: number; onAdded: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<User[]>("/users").then(setUsers).catch(() => {});
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userId) return;
    try {
      await api.post(`/teams/${teamId}/members`, { user_id: userId });
      setUserId("");
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add member");
    }
  };

  return (
    <div className="spacer-top">
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Add member</label>
          <select required value={userId} onChange={(e) => setUserId(Number(e.target.value))}>
            <option value="">Select a user…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="submit">Add</button>
      </form>
    </div>
  );
}
