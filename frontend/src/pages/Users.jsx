import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { useToast } from "../hooks/useToast";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";

const ROLES = ["employee", "reviewer", "manager", "administrator"];

export default function Users() {
  const { user: me } = useAuth();
  const isAdmin = me.role === "administrator";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // { type, user }
  const [toast, showToast] = useToast();

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = {};
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.is_active = statusFilter === "active";

    userService
      .list(params)
      .then(({ data }) => setUsers(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 250); // light debounce on search typing
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleRoleChange = async (targetUser, role) => {
    try {
      await userService.changeRole(targetUser.id, role);
      showToast(`${targetUser.full_name}'s role updated to ${role}.`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || "Could not update role.", "error");
    }
  };

  const confirmToggleActive = (targetUser) => {
    setPendingAction({
      type: targetUser.is_active ? "deactivate" : "activate",
      user: targetUser,
    });
  };

  const runPendingAction = async () => {
    if (!pendingAction) return;
    const { type, user: targetUser } = pendingAction;
    try {
      if (type === "deactivate") {
        await userService.deactivate(targetUser.id);
      } else {
        await userService.activate(targetUser.id);
      }
      showToast(`${targetUser.full_name} ${type === "deactivate" ? "deactivated" : "reactivated"}.`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || "Action failed.", "error");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <p className="page-subtitle">
          {isAdmin ? "Manage roles and account status." : "Browse registered users."}
        </p>
      </div>

      <Toast toast={toast} />

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <LoadingState label="Loading users..." />
      ) : error ? (
        <ErrorState message="Couldn't load users." onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState title="No users match your filters" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    {isAdmin ? (
                      <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)}>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge tone="accent">{u.role}</StatusBadge>
                    )}
                  </td>
                  <td>
                    <StatusBadge tone={u.is_active ? "success" : "danger"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  {isAdmin && (
                    <td>
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        disabled={u.id === me.id}
                        onClick={() => confirmToggleActive(u)}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.type === "deactivate" ? "Deactivate this user?" : "Reactivate this user?"}
        description={
          pendingAction
            ? `${pendingAction.user.full_name} (${pendingAction.user.email}) will ${
                pendingAction.type === "deactivate" ? "no longer be able to log in." : "regain access to the platform."
              }`
            : ""
        }
        confirmLabel={pendingAction?.type === "deactivate" ? "Deactivate" : "Reactivate"}
        danger={pendingAction?.type === "deactivate"}
        onConfirm={runPendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
