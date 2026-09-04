/*
 * Administrator-only user management page.
 * Lists all users and allows changing a user's role via the backend.
 */

const ROLES = ["Employee", "Reviewer", "Manager", "Administrator"];

function buildRoleSelect(currentRole, userId) {
  const select = document.createElement("select");
  select.className = "role-select";
  select.dataset.userId = userId;

  ROLES.forEach((role) => {
    const option = document.createElement("option");
    option.value = role;
    option.textContent = role;
    if (role === currentRole) option.selected = true;
    select.appendChild(option);
  });

  return select;
}

async function loadUsers() {
  const tbody = document.getElementById("users-tbody");
  tbody.innerHTML = "";

  try {
    const users = await apiRequest("/users", { method: "GET" }, true);

    users.forEach((user) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = user.full_name;

      const emailCell = document.createElement("td");
      emailCell.textContent = user.email;

      const teamCell = document.createElement("td");
      teamCell.textContent = user.team_name || "—";

      const roleCell = document.createElement("td");
      const roleSelect = buildRoleSelect(user.role, user.id);
      roleCell.appendChild(roleSelect);

      const actionCell = document.createElement("td");
      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Update Role";
      saveBtn.addEventListener("click", () => updateRole(user.id, roleSelect.value));
      actionCell.appendChild(saveBtn);

      row.appendChild(nameCell);
      row.appendChild(emailCell);
      row.appendChild(teamCell);
      row.appendChild(roleCell);
      row.appendChild(actionCell);

      tbody.appendChild(row);
    });
  } catch (err) {
    showAlert("users-alert", err.message, "error");
  }
}

async function updateRole(userId, newRole) {
  hideAlert("users-alert");
  try {
    await apiRequest(
      `/users/${userId}/role`,
      { method: "PATCH", body: JSON.stringify({ role: newRole }) },
      true
    );
    showAlert("users-alert", "Role updated successfully.", "success");
    loadUsers();
  } catch (err) {
    showAlert("users-alert", err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  requireLoginOrRedirect();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // Confirm the current user is actually an Administrator before
  // showing the page contents. Non-admins are redirected away; the
  // backend also independently enforces this on every API call.
  try {
    const me = await apiRequest("/auth/me", { method: "GET" }, true);
    if (me.role !== "Administrator") {
      alert("This page is only available to Administrators.");
      window.location.href = "dashboard.html";
      return;
    }
    loadUsers();
  } catch (err) {
    clearToken();
    window.location.href = "login.html";
  }
});
