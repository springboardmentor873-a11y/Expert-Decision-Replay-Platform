import { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  getReportActivity,
  getReportSummary,
  getStatusBreakdown,
  getUserReport,
} from "../../services/reports";
import "./Reports.css";

const STATUS_LABELS = {
  draft: "Draft",
  under_review: "Under Review",
  pending_manager_review: "Pending Manager Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

const USER_PAGE_SIZE = 10;
const ACTIVITY_WINDOW = 30;

export default function Reports() {
  const { tokens } = useAuth();
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [offset, setOffset] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filters, setFilters] = useState({});
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (nextFilters, userOffset = 0) => {
      setLoading(true);
      setError("");
      try {
        const params = { start_date: nextFilters.start_date, end_date: nextFilters.end_date };
        const summaryData = await getReportSummary(tokens.access_token, params);
        const activityData = await getReportActivity(tokens.access_token, {
          ...params,
          limit: ACTIVITY_WINDOW,
        });
        const userData = await getUserReport(tokens.access_token, {
          ...params,
          limit: USER_PAGE_SIZE,
          offset: userOffset,
        });
        setSummary(summaryData);
        setActivity(activityData);
        setUsers(userData.users);
        setTotalUsers(userData.total_users);
        setOffset(userOffset);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [tokens]
  );

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  function handleApplyFilters() {
    const next = {};
    if (startDate) next.start_date = startDate;
    if (endDate) next.end_date = endDate;
    setFilters(next);
    setFiltersApplied(Boolean(startDate || endDate));
    load(next, 0);
  }

  function handleClearFilters() {
    setStartDate("");
    setEndDate("");
    setFilters({});
    setFiltersApplied(false);
    load({}, 0);
  }

  function handleUserPage(nextOffset) {
    load(filters, nextOffset);
  }

  const maxStatus = summary
    ? Math.max(1, ...summary.by_status.map((s) => s.count))
    : 1;

  const maxDecisions = activity?.points?.length
    ? Math.max(1, ...activity.points.map((p) => p.decisions_created))
    : 1;
  const maxApprovals = activity?.points?.length
    ? Math.max(1, ...activity.points.map((p) => p.approvals_actioned))
    : 1;

  const days = activity?.points?.slice(0, ACTIVITY_WINDOW) ?? [];

  return (
    <div className="page">
      <Navbar />
      <main className="reports">
        <div className="reports__header">
          <h1 className="reports__title">Reports</h1>
          <p className="reports__subtitle">Management overview of decision activity</p>
        </div>

        <div className="reports__filters">
          <label className="reports__filter">
            <span>From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="reports__filter">
            <span>To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <button
            className="reports__button reports__button--primary"
            onClick={handleApplyFilters}
            disabled={loading}
          >
            Apply
          </button>
          {filtersApplied && (
            <button className="reports__button" onClick={handleClearFilters}>
              Clear
            </button>
          )}
          {filtersApplied && <span className="reports__range-note">Date range applied</span>}
        </div>

        {error && <div className="reports__error">{error}</div>}

        {loading ? (
          <p className="reports__loading">Loading…</p>
        ) : (
          <>
            <section className="reports__cards">
              <div className="reports__card">
                <span className="reports__card-label">Total decisions</span>
                <span className="reports__card-value">{summary.total_decisions}</span>
              </div>
              <div className="reports__card reports__card--teal">
                <span className="reports__card-label">Approved</span>
                <span className="reports__card-value">{summary.total_approvals}</span>
              </div>
              <div className="reports__card reports__card--danger">
                <span className="reports__card-label">Rejected</span>
                <span className="reports__card-value">{summary.total_rejections}</span>
              </div>
              <div className="reports__card reports__card--brass">
                <span className="reports__card-label">Pending review</span>
                <span className="reports__card-value">{summary.pending_review}</span>
              </div>
              <div className="reports__card">
                <span className="reports__card-label">Active users</span>
                <span className="reports__card-value">
                  {summary.users.active_users}/{summary.users.total_users}
                </span>
              </div>
              <div className="reports__card">
                <span className="reports__card-label">Teams</span>
                <span className="reports__card-value">{summary.teams.total_teams}</span>
              </div>
            </section>

            {summary.total_decisions === 0 && (
              <div className="reports__empty">
                <p>No decisions recorded yet. Reports will fill in as the team starts working.</p>
              </div>
            )}

            <section className="reports__grid">
              <div className="reports__panel">
                <h2 className="reports__panel-title">Decisions by status</h2>
                <div className="reports__bars">
                  {summary.by_status.map((s) => (
                    <div className="reports__bar-row" key={s.status}>
                      <span className="reports__bar-label">{STATUS_LABELS[s.status]}</span>
                      <div className="reports__bar-track">
                        <div
                          className={`reports__bar reports__bar--${s.status}`}
                          style={{ width: `${(s.count / maxStatus) * 100}%` }}
                        />
                      </div>
                      <span className="reports__bar-count">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reports__panel">
                <h2 className="reports__panel-title">Approval activity</h2>
                <div className="reports__bars">
                  <div className="reports__bar-row">
                    <span className="reports__bar-label">Reviewer approve</span>
                    <div className="reports__bar-track">
                      <div
                        className="reports__bar reports__bar--approved"
                        style={{ width: `${(summary.by_reviewer.approvals / Math.max(1, summary.total_approvals + summary.total_rejections)) * 100}%` }}
                      />
                    </div>
                    <span className="reports__bar-count">{summary.by_reviewer.approvals}</span>
                  </div>
                  <div className="reports__bar-row">
                    <span className="reports__bar-label">Reviewer reject</span>
                    <div className="reports__bar-track">
                      <div
                        className="reports__bar reports__bar--rejected"
                        style={{ width: `${(summary.by_reviewer.rejections / Math.max(1, summary.total_approvals + summary.total_rejections)) * 100}%` }}
                      />
                    </div>
                    <span className="reports__bar-count">{summary.by_reviewer.rejections}</span>
                  </div>
                  <div className="reports__bar-row">
                    <span className="reports__bar-label">Manager approve</span>
                    <div className="reports__bar-track">
                      <div
                        className="reports__bar reports__bar--approved"
                        style={{ width: `${(summary.by_manager.approvals / Math.max(1, summary.total_approvals + summary.total_rejections)) * 100}%` }}
                      />
                    </div>
                    <span className="reports__bar-count">{summary.by_manager.approvals}</span>
                  </div>
                  <div className="reports__bar-row">
                    <span className="reports__bar-label">Manager reject</span>
                    <div className="reports__bar-track">
                      <div
                        className="reports__bar reports__bar--rejected"
                        style={{ width: `${(summary.by_manager.rejections / Math.max(1, summary.total_approvals + summary.total_rejections)) * 100}%` }}
                      />
                    </div>
                    <span className="reports__bar-count">{summary.by_manager.rejections}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="reports__panel">
              <h2 className="reports__panel-title">Activity over time</h2>
              {days.length === 0 ? (
                <div className="reports__empty">
                  <p>No activity in the current range.</p>
                </div>
              ) : (
                <>
                  <div className="reports__legend">
                    <span className="reports__legend-key reports__legend-key--decisions">Decisions created</span>
                    <span className="reports__legend-key reports__legend-key--approvals">Approvals actioned</span>
                  </div>
                  <div className="reports__activity">
                    {days.map((point) => (
                      <div className="reports__activity-col" key={point.date} title={`${point.date} — ${point.decisions_created} created, ${point.approvals_actioned} approvals`}>
                        <div className="reports__activity-bars">
                          <div
                            className="reports__activity-bar reports__activity-bar--decisions"
                            style={{ height: `${(point.decisions_created / maxDecisions) * 100}%` }}
                          />
                          <div
                            className="reports__activity-bar reports__activity-bar--approvals"
                            style={{ height: `${(point.approvals_actioned / maxApprovals) * 100}%` }}
                          />
                        </div>
                        <span className="reports__activity-date">{point.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="reports__panel">
              <h2 className="reports__panel-title">User activity</h2>
              <table className="reports__table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Decisions created</th>
                    <th>Approvals</th>
                    <th>Rejections</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id}>
                      <td>{u.full_name}</td>
                      <td className="reports__cell-muted">{u.role}</td>
                      <td>{u.decisions_created}</td>
                      <td className="reports__cell-teal">{u.approvals}</td>
                      <td className="reports__cell-danger">{u.rejections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="reports__pagination">
                <span>
                  Showing {users.length === 0 ? 0 : offset + 1}–
                  {Math.min(offset + users.length, totalUsers)} of {totalUsers}
                </span>
                <div className="reports__pagination-buttons">
                  <button
                    className="reports__button"
                    onClick={() => handleUserPage(Math.max(0, offset - USER_PAGE_SIZE))}
                    disabled={offset === 0 || loading}
                  >
                    ← Prev
                  </button>
                  <button
                    className="reports__button"
                    onClick={() => handleUserPage(offset + USER_PAGE_SIZE)}
                    disabled={offset + users.length >= totalUsers || loading}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}