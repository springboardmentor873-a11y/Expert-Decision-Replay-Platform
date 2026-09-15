import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { api, type UserSettings } from "../lib/api";
import { useAuth } from "../lib/auth";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

export function Settings() {
  const { user, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<UserSettings>("/users/me/settings")
      .then(setSettings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async (patch: Partial<UserSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    setSaving(true);
    try {
      await api.put<UserSettings>("/users/me/settings", patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Settings">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Manage your notification preferences and account details.</p>
        </div>
        {saved && <div className="alert alert-success" style={{ margin: 0 }}>Settings saved ✓</div>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading-row"><div className="spinner" /></div>}

      {settings && (
        <div style={{ maxWidth: 640 }}>
          {/* Notifications */}
          <div className="card">
            <div className="settings-section-title">Notification Preferences</div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Comments</div>
                <div className="settings-row-sub">Notify when someone comments on your decision</div>
              </div>
              <Toggle
                checked={settings.notify_on_comment}
                onChange={(v) => save({ notify_on_comment: v })}
              />
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Approvals</div>
                <div className="settings-row-sub">Notify when an approval is submitted</div>
              </div>
              <Toggle
                checked={settings.notify_on_approval}
                onChange={(v) => save({ notify_on_approval: v })}
              />
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Status changes</div>
                <div className="settings-row-sub">Notify when a decision's status changes</div>
              </div>
              <Toggle
                checked={settings.notify_on_status_change}
                onChange={(v) => save({ notify_on_status_change: v })}
              />
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Digest frequency</div>
                <div className="settings-row-sub">How often to send activity digests</div>
              </div>
              <select
                value={settings.digest_frequency}
                onChange={(e) => save({ digest_frequency: e.target.value })}
                style={{ padding: "6px 12px", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-sm)" }}
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Account */}
          <div className="card">
            <div className="settings-section-title">Account</div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">{user?.full_name}</div>
                <div className="settings-row-sub">{user?.email} · {user?.role}</div>
              </div>
              <Link className="btn btn-secondary btn-sm" to="/profile">Edit profile</Link>
            </div>

            <div className="settings-row" style={{ border: "none" }}>
              <div className="settings-row-info">
                <div className="settings-row-label">Department</div>
                <div className="settings-row-sub">{user?.department} · {user?.designation}</div>
              </div>
            </div>
          </div>

          {/* App info */}
          <div className="card">
            <div className="settings-section-title">About</div>
            <div className="settings-row" style={{ border: "none" }}>
              <div className="settings-row-info">
                <div className="settings-row-label">Expert Decision Replay Platform</div>
                <div className="settings-row-sub">Version 2.0 — Notification preferences are persisted in the database.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
