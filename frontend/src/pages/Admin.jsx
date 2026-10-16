import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

const ROLES = ["employee", "reviewer", "manager", "administrator"];

const ROLE_ID_MAP = {
  1: "employee",
  2: "reviewer",
  3: "manager",
  4: "administrator"
};

export default function Admin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = user?.role === "administrator";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uList, tList] = await Promise.all([
        api.listUsers().catch(async () => {
          // Fallback if current user is not admin
          return await api.listUserDirectory().catch(() => []);
        }),
        api.listTeams().catch(() => []),
      ]);
      setUsers(uList || []);
      setTeams(tList || []);
    } catch (err) {
      showToast(err.message || "Failed to load user directory", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRoleChange(userId, newRoleName) {
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRoleName);
      showToast(`User #${userId} role successfully changed to '${newRoleName}'.`);
      
      // Update local state immediately
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              role_name: newRoleName,
              role: newRoleName,
              role_id: Object.keys(ROLE_ID_MAP).find((key) => ROLE_ID_MAP[key] === newRoleName) || u.role_id
            };
          }
          return u;
        })
      );
    } catch (err) {
      if (err.message.includes("403") || err.message.toLowerCase().includes("administrator")) {
        showToast("⚠️ Only Administrators can modify user roles. Log in as Administrator.", "error");
      } else {
        showToast(err.message || "Failed to update user role", "error");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleTeamAssign(userId, newTeamId) {
    setUpdatingId(userId);
    try {
      await api.assignUserToTeam(userId, newTeamId);
      showToast(`User #${userId} assigned to team successfully.`);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to assign team", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    const roleName = u.role_name || u.role || ROLE_ID_MAP[u.role_id] || "employee";
    const text = (u.full_name + " " + u.email).toLowerCase();
    const matchesSearch = text.includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || roleName.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (roleName) => {
    const r = (roleName || "").toLowerCase();
    if (r === "administrator" || r === "admin") {
      return { label: "Administrator", bg: "#fef2f2", color: "#ef4444" };
    }
    if (r === "manager") {
      return { label: "Manager", bg: "#fff7ed", color: "#d97706" };
    }
    if (r === "reviewer") {
      return { label: "Reviewer", bg: "#eff6ff", color: "#2563eb" };
    }
    return { label: "Employee", bg: "#f0fdf4", color: "#16a34a" };
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          padding: "24px 32px",
          borderRadius: 16,
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
          color: "#ffffff"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>👥</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.02em" }}>
              User Directory & Role Management
            </h1>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "6px 0 0 40px", maxWidth: 650 }}>
            Manage organization user access roles, team assignments, and administrative privileges.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700
            }}
          >
            Enrolled Members: {users.length} Users
          </div>
          {!isAdmin && (
            <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(245, 158, 11, 0.2)", padding: "2px 8px", borderRadius: 4 }}>
              🔒 Administrator login required to change roles
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: 16,
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          marginBottom: 24,
          display: "flex",
          gap: 14,
          alignItems: "center"
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search enrolled users by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              outline: "none"
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            background: "#ffffff",
            color: "#334155",
            cursor: "pointer"
          }}
        >
          <option value="all">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: 22,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}
      >
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
          Enrolled Organization Members ({filteredUsers.length})
        </h3>

        {loading ? (
          <div className="loading-state" style={{ padding: 40, textAlign: "center" }}>
            Loading enrolled user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            No enrolled members found matching search query.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>User Member</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Email Address</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Assigned Team</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Current Role</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", color: "#475569", fontWeight: 600 }}>Change Access Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const currentRoleName = u.role_name || u.role || ROLE_ID_MAP[u.role_id] || "employee";
                  const badge = getRoleBadge(currentRoleName);
                  const isBusy = updatingId === u.id;

                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 13
                            }}
                          >
                            {u.full_name ? u.full_name.substring(0, 2).toUpperCase() : u.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                              {u.full_name || "Enrolled User"}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>User ID: #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px", color: "#334155", fontWeight: 600 }}>
                        {u.email}
                      </td>

                      {/* Team Assignment Dropdown */}
                      <td style={{ padding: "14px" }}>
                        <select
                          value={u.team_id || ""}
                          onChange={(e) => handleTeamAssign(u.id, e.target.value)}
                          disabled={isBusy}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 12,
                            background: "#f8fafc",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          <option value="">Unassigned</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              👥 {t.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Current Role Badge */}
                      <td style={{ padding: "14px" }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 6
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Role Change Dropdown */}
                      <td style={{ padding: "14px", textAlign: "right" }}>
                        <select
                          value={currentRoleName.toLowerCase()}
                          disabled={isBusy}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            background: "#ffffff",
                            cursor: "pointer",
                            fontWeight: 700,
                            color: "#0f172a",
                            outline: "none"
                          }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r.toLowerCase()}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
