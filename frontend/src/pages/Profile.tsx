import { useState, type FormEvent } from "react";
import { AppLayout } from "../components/AppLayout";
import { useAuth } from "../lib/auth";
import { api, ApiError } from "../lib/api";

export function Profile() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone_number: user?.phone_number || "",
    designation: user?.designation || "",
  });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  if (!user) return null;

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.put(`/users/${user.id}`, form);
      await refreshProfile();
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    try {
      await api.post("/users/me/change-password", pw);
      setPw({ current_password: "", new_password: "" });
      setPwSuccess("Password updated.");
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "Could not change password");
    }
  };

  return (
    <AppLayout title="Profile">
      <div className="page-header">
        <div>
          <h2>{user.full_name}</h2>
          <p>
            {user.designation} · {user.department} · <span className="role-badge">{user.role}</span>
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h3 className="section-title">Edit profile</h3>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={saveProfile}>
          <div className="field">
            <label>Full name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Designation</label>
            <input
              value={form.designation}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input
              value={form.phone_number}
              onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Save profile
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h3 className="section-title">Change password</h3>
        {pwError && <div className="alert alert-error">{pwError}</div>}
        {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
        <form onSubmit={changePassword}>
          <div className="field">
            <label>Current password</label>
            <input
              type="password"
              required
              value={pw.current_password}
              onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={pw.new_password}
              onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Update password
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
