/*
 * Loads the authenticated user's real profile information from the
 * backend (/auth/me) and displays it on the dashboard.
 */

document.addEventListener("DOMContentLoaded", async () => {
  requireLoginOrRedirect();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  try {
    const user = await apiRequest("/auth/me", { method: "GET" }, true);

    document.getElementById("welcome-name").textContent = user.full_name;
    const topbarName = document.getElementById("welcome-name-topbar");
    if (topbarName) topbarName.textContent = user.full_name;
    document.getElementById("info-name").textContent = user.full_name;
    document.getElementById("info-email").textContent = user.email;
    document.getElementById("info-role").textContent = user.role;
    document.getElementById("info-team").textContent =
      user.team_name || "Not assigned";

    // Only show the "Manage Users" link to Administrators.
    if (user.role === "Administrator") {
      const adminLink = document.getElementById("admin-link");
      if (adminLink) adminLink.style.display = "inline";
    }
  } catch (err) {
    // Token likely invalid/expired - send back to login.
    clearToken();
    window.location.href = "login.html";
  }
});
