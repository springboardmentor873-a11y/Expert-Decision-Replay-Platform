import { useEffect, useState, useCallback } from "react";

import { API_BASE_URL, AppSidebar, NotificationBell } from "./shared";


// ==========================================
// HELPERS
// ==========================================

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
};


// ==========================================
// MEETINGS PAGE
// ==========================================

export const MeetingsPage = (props) => {
  const { user, getRoleName, navigateTo, handleLogout } = props;

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [includePast, setIncludePast] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/meetings/?include_past=${includePast}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        setError("Unable to load meetings right now.");
        return;
      }

      const payload = await response.json();
      setMeetings(Array.isArray(payload) ? payload : []);
      setError("");
    } catch (e) {
      console.error("Meetings error:", e);
      setError("Unable to load meetings right now.");
    } finally {
      setLoading(false);
    }
  }, [includePast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="meetings"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main home-dash-main db-main">

        <header className="dash-header">
          <div>
            <h2 className="dash-header-title">Team Meetings</h2>
            <p className="dash-header-sub">
              Upcoming meetings across the teams you belong to
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="dash-card db-meetings-card">
          <div className="dash-card-header">
            <div className="home-card-title">
              <div className="home-card-title-icon chip-blue">{"\uD83D\uDCC5"}</div>
              <div>
                <h4>{includePast ? "All Meetings" : "Upcoming Meetings"}</h4>
                <span>{meetings.length} meeting(s)</span>
              </div>
            </div>
            <button
              className="dash-link-btn"
              onClick={() => setIncludePast((v) => !v)}
            >
              {includePast ? "Upcoming Only" : "Show Past"}
            </button>
          </div>

          {error && <div className="db-error">{error}</div>}

          {loading ? (
            <div className="db-empty">Loading meetings...</div>
          ) : meetings.length === 0 ? (
            <div className="home-empty home-empty-compact">
              <div className="home-empty-icon">{"\uD83D\uDCC5"}</div>
              <div className="home-empty-title">No meetings scheduled</div>
              <div className="home-empty-desc">
                Upcoming team meetings will appear here.
              </div>
            </div>
          ) : (
            <div className="home-table-wrap">
              <table className="home-table">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Team</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Organizer</th>
                    <th>Related Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((m) => (
                    <tr key={m.meeting_id}>
                      <td>
                        <div className="db-meeting-title">{m.title}</div>
                        {m.location && (
                          <div className="db-sub">{m.location}</div>
                        )}
                      </td>
                      <td>{m.team_name || "—"}</td>
                      <td>{formatDate(m.scheduled_at)}</td>
                      <td>{formatTime(m.scheduled_at)}</td>
                      <td>{m.organizer_name || "—"}</td>
                      <td>
                        {m.decision_id ? (
                          <button
                            className="db-link"
                            onClick={() =>
                              navigateTo("decision-view", {
                                decision_id: m.decision_id
                              })
                            }
                          >
                            {m.decision_title}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MeetingsPage;
