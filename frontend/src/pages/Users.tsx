import { useEffect, useState, type FormEvent } from "react";
import { AppLayout } from "../components/AppLayout";
import { api, ApiError, type User } from "../lib/api";

const ROLES = ["Employee", "Reviewer", "Manager", "Administrator"];

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "Employee",
    employee_id: "",
    department: "",
    designation: "",
    phone_number: "",
  });

  const load = () => {
    api
      .get<User[]>("/users")
      .then(setUsers)
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/users", form);
      setShowForm(false);
      setSuccess(`${form.full_name} was created.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create user");
    }
  };

  const changeRole = async (userId: number, role: string) => {
    setError(null);
    try {
      await api.patch(`/users/${userId}/role`, { role });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change role");
    }
  };

  const toggleActive = async (u: User) => {
    setError(null);
    try {
      if (u.is_active) {
        await api.delete(`/users/${u.id}`);
      } else {
        await api.put(`/users/${u.id}`, { is_active: true });
      }
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update user");
    }
  };

  return (
    <AppLayout title="Users">
      <div className="page-header">
        <div>
          <h2>User administration</h2>
          <p>Create accounts and manage roles across the organization.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add user"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card" style={{ maxWidth: 640 }}>
          <form onSubmit={submit}>
            <div className="field-row">
              <div className="field">
                <label>Full name</label>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Temporary password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Employee ID</label>
                <input
                  required
                  value={form.employee_id}
                  onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Department</label>
                <input
                  required
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Designation</label>
                <input
                  required
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Phone number</label>
                <input
                  required
                  value={form.phone_number}
                  onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              Create user
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.department}</td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={`badge ${u.is_active ? "badge-approved" : "badge-rejected"}`}>
                    {u.is_active ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary" onClick={() => toggleActive(u)}>
                    {u.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
