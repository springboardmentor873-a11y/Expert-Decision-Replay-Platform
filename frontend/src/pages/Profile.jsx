import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { teamService } from "../services/teamService";
import { useToast } from "../hooks/useToast";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";
import LoadingState from "../components/LoadingState";

export default function Profile() {
  const { user, refreshCurrentUser } = useAuth();
  const [form, setForm] = useState({
    full_name: user.full_name,
    job_title: user.job_title || "",
    department: user.department || "",
    avatar_url: user.avatar_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [myTeams, setMyTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [toast, showToast] = useToast();

  useEffect(() => {
    teamService
      .list()
      .then(({ data }) => setMyTeams(data.filter((t) => t.members.some((m) => m.id === user.id))))
      .catch(() => setMyTeams([]))
      .finally(() => setLoadingTeams(false));
  }, [user.id]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await userService.updateMe(form);
      await refreshCurrentUser();
      showToast("Profile updated.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      full_name: user.full_name,
      job_title: user.job_title || "",
      department: user.department || "",
      avatar_url: user.avatar_url || "",
    });
    setError("");
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p className="page-subtitle">Manage your personal details. Role and account status are managed by administrators.</p>
      </div>

      <Toast toast={toast} />

      <div className="two-col">
        <section className="panel">
          <h2>Details</h2>
          {error && <p className="error" role="alert">{error}</p>}
          <form onSubmit={handleSave} className="form-grid">
            <label>
              Full name
              <input value={form.full_name} onChange={update("full_name")} minLength={2} required />
            </label>
            <label>
              Email
              <input value={user.email} disabled />
            </label>
            <label>
              Job title
              <input value={form.job_title} onChange={update("job_title")} />
            </label>
            <label>
              Department
              <input value={form.department} onChange={update("department")} />
            </label>
            <label>
              Avatar URL
              <input value={form.avatar_url} onChange={update("avatar_url")} placeholder="https://..." />
            </label>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Account</h2>
          <dl className="detail-list">
            <div>
              <dt>Role</dt>
              <dd><StatusBadge tone="accent">{user.role}</StatusBadge></dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge tone={user.is_active ? "success" : "danger"}>
                  {user.is_active ? "Active" : "Inactive"}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>

          <h3>Teams</h3>
          {loadingTeams ? (
            <LoadingState label="Loading teams..." />
          ) : myTeams.length === 0 ? (
            <p className="muted">You're not on any teams yet.</p>
          ) : (
            <ul className="plain-list">
              {myTeams.map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
