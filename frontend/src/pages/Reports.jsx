import React, { useEffect, useState } from "react";
import api from "../api/api";

const Reports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/reports/summary");
      setReport(response.data);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError("Unable to load report data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Reports</h1>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Reports</h1>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container reports-page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Overview of decisions, approvals and project activity</p>
        </div>
      </div>

      {/* Decision Summary */}
      <section className="report-section">
        <h2>Decision Summary</h2>

        <div className="report-grid">
          <div className="report-card">
            <span className="report-icon">📋</span>
            <div>
              <p>Total Decisions</p>
              <h3>{report.decisions.total}</h3>
            </div>
          </div>

          <div className="report-card">
            <span className="report-icon">📝</span>
            <div>
              <p>Draft Decisions</p>
              <h3>{report.decisions.draft}</h3>
            </div>
          </div>

          <div className="report-card">
            <span className="report-icon">✅</span>
            <div>
              <p>Approved Decisions</p>
              <h3>{report.decisions.approved}</h3>
            </div>
          </div>

          <div className="report-card">
            <span className="report-icon">❌</span>
            <div>
              <p>Rejected Decisions</p>
              <h3>{report.decisions.rejected}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Approval Summary */}
      <section className="report-section">
        <h2>Approval Summary</h2>

        <div className="report-grid">
          <div className="report-card">
            <span className="report-icon">📊</span>
            <div>
              <p>Total Approvals</p>
              <h3>{report.approvals.total}</h3>
            </div>
          </div>

          <div className="report-card">
            <span className="report-icon">⏳</span>
            <div>
              <p>Pending Approvals</p>
              <h3>{report.approvals.pending}</h3>
            </div>
          </div>

          <div className="report-card">
            <span className="report-icon">✔️</span>
            <div>
              <p>Approved</p>
              <h3>{report.approvals.approved}</h3>
            </div>
          </div>

          <div className="report-card">
            <span className="report-icon">🚫</span>
            <div>
              <p>Rejected</p>
              <h3>{report.approvals.rejected}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Summary */}
      <section className="report-section">
        <h2>Activity Summary</h2>

        <div className="report-grid">
          <div className="report-card">
            <span className="report-icon">🔀</span>
            <div>
              <p>Alternatives</p>
              <h3>{report.total_alternatives}</h3>
            </div>
          </div>

          <div className="report-card">
            <span className="report-icon">📎</span>
            <div>
              <p>Files</p>
              <h3>{report.total_files}</h3>
            </div>
          </div>

          <div className="report-card">
            <span className="report-icon">💬</span>
            <div>
              <p>Discussions</p>
              <h3>{report.total_discussions}</h3>
            </div>
          </div>

          <div className="report-card">
            <span className="report-icon">📝</span>
            <div>
              <p>Audit Logs</p>
              <h3>{report.total_audit_logs}</h3>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Reports;