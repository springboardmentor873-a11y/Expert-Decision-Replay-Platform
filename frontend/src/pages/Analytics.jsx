import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const Analytics = () => {
  const [decisions, setDecisions] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

const [
  decisionsResponse,
  reportResponse,
  teamsResponse,
  usersResponse,
] = await Promise.all([
  api.get("/decisions/"),
  api.get("/reports/summary"),
  api.get("/teams/"),
  api.get("/users/"),
]);

const reportData = reportResponse.data;

setDecisions(decisionsResponse.data || []);

setApprovals([
  ...(reportData.approvals?.pending
    ? Array(reportData.approvals.pending).fill({
        status: "Pending",
      })
    : []),

  ...(reportData.approvals?.approved
    ? Array(reportData.approvals.approved).fill({
        status: "Approved",
      })
    : []),

  ...(reportData.approvals?.rejected
    ? Array(reportData.approvals.rejected).fill({
        status: "Rejected",
      })
    : []),
]);

setTeams(teamsResponse.data || []);
setUsers(usersResponse.data || []);
    } catch (err) {
      console.error("Analytics loading error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load analytics data."
      );
    } finally {
      setLoading(false);
    }
  };

  const decisionStats = useMemo(() => {
    return {
      total: decisions.length,
      draft: decisions.filter(
        (d) => d.status === "Draft"
      ).length,
      inProgress: decisions.filter(
        (d) =>
          d.status === "In Progress" ||
          d.status === "InProgress"
      ).length,
      approved: decisions.filter(
        (d) => d.status === "Approved" ||
          d.status === "Completed"
      ).length,
      rejected: decisions.filter(
        (d) => d.status === "Rejected"
      ).length,
    };
  }, [decisions]);

  const priorityStats = useMemo(() => {
    return {
      high: decisions.filter(
        (d) => d.priority === "High"
      ).length,
      medium: decisions.filter(
        (d) => d.priority === "Medium"
      ).length,
      low: decisions.filter(
        (d) => d.priority === "Low"
      ).length,
    };
  }, [decisions]);

  const approvalStats = useMemo(() => {
    return {
      total: approvals.length,
      pending: approvals.filter(
        (a) => a.status === "Pending"
      ).length,
      approved: approvals.filter(
        (a) => a.status === "Approved"
      ).length,
      rejected: approvals.filter(
        (a) => a.status === "Rejected"
      ).length,
    };
  }, [approvals]);

  const percentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  const maxDecisionValue = Math.max(
    decisionStats.draft,
    decisionStats.inProgress,
    decisionStats.approved,
    decisionStats.rejected,
    1
  );

  const maxPriorityValue = Math.max(
    priorityStats.high,
    priorityStats.medium,
    priorityStats.low,
    1
  );

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <div className="analytics-loading-icon">◌</div>
          <h2>Loading Analytics...</h2>
          <p>
            Collecting live information from the platform.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">

      {/* HEADER */}
      <div className="analytics-header">
        <div>
          <div className="analytics-eyebrow">
            PLATFORM INSIGHTS
          </div>

          <h1>Analytics</h1>

          <p>
            Monitor decisions, approvals, priorities,
            teams and platform activity.
          </p>
        </div>

        <button
          className="analytics-refresh-button"
          onClick={loadAnalytics}
        >
          ↻ Refresh Data
        </button>
      </div>

      {error && (
        <div className="analytics-error">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="analytics-summary-grid">

        <div className="analytics-stat-card">
          <span className="analytics-stat-icon">◈</span>
          <div>
            <strong>{decisionStats.total}</strong>
            <span>Total Decisions</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <span className="analytics-stat-icon">✓</span>
          <div>
            <strong>{approvalStats.approved}</strong>
            <span>Approved</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <span className="analytics-stat-icon">◉</span>
          <div>
            <strong>{approvalStats.pending}</strong>
            <span>Pending Approvals</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <span className="analytics-stat-icon">♧</span>
          <div>
            <strong>{teams.length}</strong>
            <span>Teams</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <span className="analytics-stat-icon">♙</span>
          <div>
            <strong>{users.length}</strong>
            <span>Users</span>
          </div>
        </div>

      </div>

      {/* DECISION ANALYTICS */}
      <div className="analytics-grid">

        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>Decision Status</h2>
              <p>Current decision distribution</p>
            </div>
          </div>

          <div className="analytics-bars">

            <div className="analytics-bar-row">
              <div className="analytics-bar-label">
                <span>Draft</span>
                <strong>{decisionStats.draft}</strong>
              </div>

              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill draft-fill"
                  style={{
                    width: `${percentage(
                      decisionStats.draft,
                      maxDecisionValue
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="analytics-bar-row">
              <div className="analytics-bar-label">
                <span>In Progress</span>
                <strong>{decisionStats.inProgress}</strong>
              </div>

              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill progress-fill"
                  style={{
                    width: `${percentage(
                      decisionStats.inProgress,
                      maxDecisionValue
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="analytics-bar-row">
              <div className="analytics-bar-label">
                <span>Approved / Completed</span>
                <strong>{decisionStats.approved}</strong>
              </div>

              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill approved-fill"
                  style={{
                    width: `${percentage(
                      decisionStats.approved,
                      maxDecisionValue
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="analytics-bar-row">
              <div className="analytics-bar-label">
                <span>Rejected</span>
                <strong>{decisionStats.rejected}</strong>
              </div>

              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill rejected-fill"
                  style={{
                    width: `${percentage(
                      decisionStats.rejected,
                      maxDecisionValue
                    )}%`,
                  }}
                />
              </div>
            </div>

          </div>
        </section>

        {/* PRIORITY */}
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>Decision Priority</h2>
              <p>Priority distribution</p>
            </div>
          </div>

          <div className="analytics-priority-list">

            <div className="analytics-priority-item">
              <div>
                <span className="priority-dot high-dot" />
                <span>High Priority</span>
              </div>

              <strong>{priorityStats.high}</strong>
            </div>

            <div className="analytics-priority-progress">
              <div
                className="priority-progress high-progress"
                style={{
                  width: `${percentage(
                    priorityStats.high,
                    maxPriorityValue
                  )}%`,
                }}
              />
            </div>

            <div className="analytics-priority-item">
              <div>
                <span className="priority-dot medium-dot" />
                <span>Medium Priority</span>
              </div>

              <strong>{priorityStats.medium}</strong>
            </div>

            <div className="analytics-priority-progress">
              <div
                className="priority-progress medium-progress"
                style={{
                  width: `${percentage(
                    priorityStats.medium,
                    maxPriorityValue
                  )}%`,
                }}
              />
            </div>

            <div className="analytics-priority-item">
              <div>
                <span className="priority-dot low-dot" />
                <span>Low Priority</span>
              </div>

              <strong>{priorityStats.low}</strong>
            </div>

            <div className="analytics-priority-progress">
              <div
                className="priority-progress low-progress"
                style={{
                  width: `${percentage(
                    priorityStats.low,
                    maxPriorityValue
                  )}%`,
                }}
              />
            </div>

          </div>
        </section>

      </div>

      {/* APPROVAL ANALYTICS */}
      <section className="analytics-card analytics-approval-card">

        <div className="analytics-card-header">
          <div>
            <h2>Approval Workflow</h2>
            <p>
              Current state of decision approval requests
            </p>
          </div>

          <div className="analytics-total-badge">
            {approvalStats.total} Total
          </div>
        </div>

        <div className="approval-analytics-grid">

          <div className="approval-analytics-item">
            <strong>{approvalStats.pending}</strong>
            <span>Pending</span>
            <small>
              {percentage(
                approvalStats.pending,
                approvalStats.total
              )}%
            </small>
          </div>

          <div className="approval-analytics-item">
            <strong>{approvalStats.approved}</strong>
            <span>Approved</span>
            <small>
              {percentage(
                approvalStats.approved,
                approvalStats.total
              )}%
            </small>
          </div>

          <div className="approval-analytics-item">
            <strong>{approvalStats.rejected}</strong>
            <span>Rejected</span>
            <small>
              {percentage(
                approvalStats.rejected,
                approvalStats.total
              )}%
            </small>
          </div>

        </div>

      </section>

      {/* PLATFORM OVERVIEW */}
      <section className="analytics-card">

        <div className="analytics-card-header">
          <div>
            <h2>Platform Overview</h2>
            <p>Current platform resources</p>
          </div>
        </div>

        <div className="platform-overview-grid">

          <div>
            <span>Decisions</span>
            <strong>{decisions.length}</strong>
          </div>

          <div>
            <span>Users</span>
            <strong>{users.length}</strong>
          </div>

          <div>
            <span>Teams</span>
            <strong>{teams.length}</strong>
          </div>

          <div>
            <span>Approvals</span>
            <strong>{approvals.length}</strong>
          </div>

        </div>

      </section>

    </div>
  );
};

export default Analytics;