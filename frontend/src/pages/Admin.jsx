import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";

const ROLES = ["employee", "reviewer", "manager", "administrator"];

export default function Admin() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await api.listUsers());
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleRoleChange(userId, newRoleName) {
    try {
      await api.updateUserRole(userId, newRoleName);
      showToast("Role updated.");
      loadUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin</h1>
          <p>All users in the organization.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Loading users…</div>
      ) : (
        <table className="decisions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Team ID</th>
              <th>Role ID</th>
              <th>Change role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.team_id ?? "—"}</td>
                <td>{u.role_id}</td>
                <td>
                  <select defaultValue="" onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                    <option value="" disabled>Change to…</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
