/*
 * Handles the login and registration forms.
 * Communicates with the real FastAPI backend via api.js's apiRequest().
 */

function showAlert(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert ${type}`;
  el.style.display = "block";
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = "none";
}

// ---------------------------------------------------------------------
// Login form
// ---------------------------------------------------------------------
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideAlert("login-alert");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const data = await apiRequest("/auth/login-json", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveToken(data.access_token);
      window.location.href = "dashboard.html";
    } catch (err) {
      showAlert("login-alert", err.message, "error");
    }
  });
}

// ---------------------------------------------------------------------
// Registration form
// ---------------------------------------------------------------------
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  // Populate the team dropdown from the backend (public list, but the
  // teams endpoint requires auth, so registration allows "No team").
  const teamSelect = document.getElementById("team_id");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideAlert("register-alert");

    const payload = {
      full_name: document.getElementById("full_name").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      role: document.getElementById("role").value,
    };

    const teamValue = teamSelect ? teamSelect.value : "";
    if (teamValue) {
      payload.team_id = parseInt(teamValue, 10);
    }

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showAlert(
        "register-alert",
        "Registration successful! You can now log in.",
        "success"
      );
      form.reset();
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (err) {
      showAlert("register-alert", err.message, "error");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
});
