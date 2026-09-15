
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ManagerDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedDecision, setSelectedDecision] = useState(null);
  const [managerFeedback, setManagerFeedback] = useState("");

  const [message, setMessage] = useState("");
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  // Fetch decisions waiting for manager approval
  const fetchDecisions = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:5173/api/decisions/manager",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch decisions"
        );
      }

      setDecisions(data);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  // Approve or Reject decision
  const handleDecision = async (status) => {
    if (!selectedDecision || actionLoading) return;

    try {
      setActionLoading(true);
      setMessage("");

      const response = await fetch(
        `http://localhost:5173/api/decisions/${selectedDecision._id}/manager`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            managerFeedback,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update decision"
        );
      }

      if (status === "Approved") {
        setApprovedCount((prev) => prev + 1);
      } else {
        setRejectedCount((prev) => prev + 1);
      }

      setMessage(
        `Decision ${status.toLowerCase()} successfully!`
      );

      setSelectedDecision(null);
      setManagerFeedback("");

      await fetchDecisions();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(error);
      setMessage(
        error.message || "Failed to update decision"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Scroll to section
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Select decision
  const selectDecision = (decision) => {
    setSelectedDecision(decision);
    setManagerFeedback("");
    setMessage("");

    setTimeout(() => {
      scrollToSection("final-review");
    }, 100);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Open document
  const handleViewDocument = (document) => {
    if (!document?.filePath) {
      setMessage("Document path not available");
      return;
    }

    const fileUrl = `http://localhost:5173/${document.filePath.replace(
      /\\/g,
      "/"
    )}`;

    window.open(fileUrl, "_blank");
  };

  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>

        <div style={styles.brand}>
          <div style={styles.logoIcon}>◉</div>

          <div>
            <h2 style={styles.brandTitle}>
              Expert Decision
            </h2>

            <p style={styles.brandSub}>
              Replay Platform
            </p>
          </div>
        </div>

        <div style={styles.navSection}>

          <button
            style={styles.activeMenu}
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("pending")
            }
          >
            <span>◷</span>
            Pending Approval
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("pending")
            }
          >
            <span>▣</span>
            Team Decisions
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("final-review")
            }
          >
            <span>✓</span>
            Final Review
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("activity")
            }
          >
            <span>◉</span>
            Analytics
          </button>

        </div>

        <button
          style={styles.logoutButton}
          onClick={handleLogout}
        >
          <span>⇥</span>
          Logout
        </button>

      </aside>

      {/* MAIN AREA */}
      <main style={styles.main}>

        {/* TOP BAR */}
        <div style={styles.topbar}>

          <div />

          <div style={styles.profileArea}>

            <div style={styles.notification}>
              ♧
            </div>

            <div style={styles.avatar}>
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "M"}
            </div>

            <div>

              <strong style={styles.userName}>
                {user?.name || "Manager"}
              </strong>

              <p style={styles.userRole}>
                {user?.role || "Manager"}
              </p>

            </div>

          </div>

        </div>

        <div style={styles.content}>

          {/* WELCOME */}
          <section style={styles.welcome}>

            <div>

              <h1 style={styles.welcomeTitle}>
                Welcome back,{" "}
                {user?.name || "Manager"}!
              </h1>

              <p style={styles.welcomeText}>
                Here's an overview of your team's
                decision activity.
              </p>

            </div>

            <p style={styles.date}>
              {new Date().toLocaleDateString(
                "en-IN",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              )}
            </p>

          </section>

          {/* MESSAGE */}
          {message && (
            <div
              style={{
                ...styles.message,
                ...(message
                  .toLowerCase()
                  .includes("successfully")
                  ? styles.successMessage
                  : styles.errorMessage),
              }}
            >
              {message}
            </div>
          )}

          {/* STATISTICS */}
          <section style={styles.stats}>

            <div
              style={{
                ...styles.statCard,
                ...styles.pendingCard,
              }}
            >
              <div style={styles.statIcon}>
                ◷
              </div>

              <div>

                <h2 style={styles.statNumber}>
                  {decisions.length}
                </h2>

                <p style={styles.statLabel}>
                  Pending Approval
                </p>

                <button
                  style={styles.viewButton}
                  onClick={() =>
                    scrollToSection("pending")
                  }
                >
                  View →
                </button>

              </div>

            </div>

            <div
              style={{
                ...styles.statCard,
                ...styles.approvedCard,
              }}
            >
              <div style={styles.statIcon}>
                ✓
              </div>

              <div>

                <h2 style={styles.statNumber}>
                  {approvedCount}
                </h2>

                <p style={styles.statLabel}>
                  Approved
                </p>

                <p style={styles.smallText}>
                  This session
                </p>

              </div>

            </div>

            <div
              style={{
                ...styles.statCard,
                ...styles.rejectedCard,
              }}
            >
              <div style={styles.statIcon}>
                ✕
              </div>

              <div>

                <h2 style={styles.statNumber}>
                  {rejectedCount}
                </h2>

                <p style={styles.statLabel}>
                  Rejected
                </p>

                <p style={styles.smallText}>
                  This session
                </p>

              </div>

            </div>

            <div
              style={{
                ...styles.statCard,
                ...styles.totalCard,
              }}
            >
              <div style={styles.statIcon}>
                ▣
              </div>

              <div>

                <h2 style={styles.statNumber}>
                  {decisions.length +
                    approvedCount +
                    rejectedCount}
                </h2>

                <p style={styles.statLabel}>
                  Decisions Processed
                </p>

                <p style={styles.smallText}>
                  Current session
                </p>

              </div>

            </div>

          </section>

          {/* MAIN GRID */}
          <div style={styles.dashboardGrid}>

            {/* PENDING DECISIONS */}
            <section
              id="pending"
              style={styles.largePanel}
            >

              <div style={styles.panelHeader}>

                <div>

                  <h2 style={styles.panelTitle}>
                    Pending Approvals
                  </h2>

                  <p style={styles.panelSubtitle}>
                    Decisions waiting for your
                    final review
                  </p>

                </div>

                <button
                  style={styles.createButton}
                  onClick={fetchDecisions}
                  disabled={loading}
                >
                  {loading
                    ? "Loading..."
                    : "↻ Refresh"}
                </button>

              </div>

              {loading ? (
                <div style={styles.emptyState}>
                  Loading decisions...
                </div>
              ) : decisions.length === 0 ? (
                <div style={styles.emptyState}>
                  ✓ No decisions are waiting for
                  approval.
                </div>
              ) : (
                <div style={styles.tableWrapper}>

                  <table style={styles.table}>

                    <thead>

                      <tr>

                        <th style={styles.tableHeader}>
                          Title
                        </th>

                        <th style={styles.tableHeader}>
                          Created By
                        </th>

                        <th style={styles.tableHeader}>
                          Reviewer Feedback
                        </th>

                        <th style={styles.tableHeader}>
                          Documents
                        </th>

                        <th style={styles.tableHeader}>
                          Created On
                        </th>

                        <th style={styles.tableHeader}>
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {decisions.map((decision) => (
                        <tr
                          key={decision._id}
                          style={styles.tableRow}
                        >

                          {/* TITLE */}
                          <td style={styles.tableCell}>

                            <strong
                              style={
                                styles.decisionTitle
                              }
                            >
                              {decision.title}
                            </strong>

                            <p
                              style={
                                styles.description
                              }
                            >
                              {decision.description}
                            </p>

                          </td>

                          {/* CREATED BY */}
                          <td style={styles.tableCell}>

                            <strong>
                              {decision.createdBy
                                ?.name ||
                                "Unknown"}
                            </strong>

                            <p style={styles.email}>
                              {decision.createdBy
                                ?.email || ""}
                            </p>

                          </td>

                          {/* REVIEWER FEEDBACK */}
                          <td style={styles.tableCell}>

                            <p
                              style={
                                styles.feedbackText
                              }
                            >
                              {decision
                                .reviewerFeedback ||
                                "No feedback"}
                            </p>

                          </td>

                          {/* DOCUMENTS */}
                          <td style={styles.tableCell}>

                            {decision.documents
                              ?.length > 0 ? (

                              <div>

                                {decision.documents.map(
                                  (doc) => (
                                    <button
                                      key={doc._id}
                                      onClick={() =>
                                        handleViewDocument(
                                          doc
                                        )
                                      }
                                      style={{
                                        ...styles.documentButton,
                                        display:
                                          "block",
                                        marginBottom:
                                          "6px",
                                      }}
                                      title={
                                        doc.fileName
                                      }
                                    >
                                      📄{" "}
                                      {doc.fileName}
                                    </button>
                                  )
                                )}

                              </div>

                            ) : (

                              <span
                                style={
                                  styles.noDocument
                                }
                              >
                                No document
                              </span>

                            )}

                          </td>

                          {/* CREATED DATE */}
                          <td style={styles.tableCell}>
                            {formatDate(
                              decision.createdAt
                            )}
                          </td>

                          {/* ACTION */}
                          <td style={styles.tableCell}>

                            <button
                              style={
                                styles.reviewButton
                              }
                              onClick={() =>
                                selectDecision(
                                  decision
                                )
                              }
                            >
                              Review
                            </button>

                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

            {/* ACTIVITY PANEL */}
            <aside
              id="activity"
              style={styles.activityPanel}
            >

              <h2 style={styles.panelTitle}>
                Manager Activity
              </h2>

              <div style={styles.activityItem}>

                <div style={styles.activityIcon}>
                  ◷
                </div>

                <div>

                  <strong>
                    Pending Reviews
                  </strong>

                  <p style={styles.activityText}>
                    {decisions.length} decision(s)
                    require attention
                  </p>

                </div>

              </div>

              <div style={styles.activityItem}>

                <div style={styles.greenIcon}>
                  ✓
                </div>

                <div>

                  <strong>
                    Approved
                  </strong>

                  <p style={styles.activityText}>
                    {approvedCount} decision(s)
                    approved this session
                  </p>

                </div>

              </div>

              <div style={styles.activityItem}>

                <div style={styles.redIcon}>
                  ✕
                </div>

                <div>

                  <strong>
                    Rejected
                  </strong>

                  <p style={styles.activityText}>
                    {rejectedCount} decision(s)
                    rejected this session
                  </p>

                </div>

              </div>

              <div style={styles.activityItemLast}>

                <div style={styles.blueIcon}>
                  ▣
                </div>

                <div>

                  <strong>
                    Team Decisions
                  </strong>

                  <p style={styles.activityText}>
                    Review decisions submitted
                    by your team
                  </p>

                </div>

              </div>

            </aside>

          </div>

          {/* FINAL REVIEW */}
          <section
            id="final-review"
            style={styles.reviewPanel}
          >

            <h2 style={styles.panelTitle}>
              Final Decision Review
            </h2>

            <p style={styles.panelSubtitle}>
              Review the decision and reviewer
              feedback before making the final
              decision.
            </p>

            {!selectedDecision ? (

              <div style={styles.emptyState}>
                Select a decision from Pending
                Approvals to begin.
              </div>

            ) : (

              <>

                {/* DECISION DETAILS */}
                <div style={styles.reviewDetails}>

                  <div style={styles.reviewHeader}>

                    <div>

                      <span
                        style={styles.statusBadge}
                      >
                        Under Review
                      </span>

                      <h2
                        style={
                          styles.selectedTitle
                        }
                      >
                        {selectedDecision.title}
                      </h2>

                    </div>

                  </div>

                  <p
                    style={
                      styles.selectedDescription
                    }
                  >
                    {selectedDecision.description}
                  </p>

                  <div style={styles.infoGrid}>

                    <div>

                      <p
                        style={
                          styles.infoLabel
                        }
                      >
                        Created By
                      </p>

                      <strong>
                        {selectedDecision
                          .createdBy?.name ||
                          "Unknown"}
                      </strong>

                    </div>

                    <div>

                      <p
                        style={
                          styles.infoLabel
                        }
                      >
                        Created On
                      </p>

                      <strong>
                        {formatDate(
                          selectedDecision.createdAt
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* DOCUMENTS */}
                <div style={styles.documentsBox}>

                  <h3
                    style={
                      styles.feedbackHeading
                    }
                  >
                    Decision Documents
                  </h3>

                  {selectedDecision.documents
                    ?.length > 0 ? (

                    <div
                      style={styles.documentList}
                    >

                      {selectedDecision.documents.map(
                        (doc) => {

                          const fileUrl =
                            `http://localhost:5173/${doc.filePath.replace(
                              /\\/g,
                              "/"
                            )}`;

                          return (
                            <div
                              key={doc._id}
                              style={
                                styles.documentItem
                              }
                            >

                              <span
                                style={
                                  styles.documentName
                                }
                              >
                                📄 {doc.fileName}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleViewDocument(
                                    doc
                                  )
                                }
                                style={
                                  styles.openDocument
                                }
                              >
                                View Document
                              </button>

                            </div>
                          );
                        }
                      )}

                    </div>

                  ) : (

                    <p
                      style={
                        styles.noDocument
                      }
                    >
                      No documents attached to
                      this decision.
                    </p>

                  )}

                </div>

                {/* REVIEWER FEEDBACK */}
                <div style={styles.reviewerBox}>

                  <h3
                    style={
                      styles.feedbackHeading
                    }
                  >
                    Reviewer Feedback
                  </h3>

                  <p
                    style={
                      styles.reviewerFeedback
                    }
                  >
                    {selectedDecision
                      .reviewerFeedback ||
                      "No reviewer feedback available."}
                  </p>

                </div>

                {/* MANAGER FORM */}
                <div style={styles.managerForm}>

                  <label style={styles.label}>
                    Manager Feedback
                  </label>

                  <textarea
                    rows="5"
                    placeholder="Add your final comments and recommendations..."
                    value={managerFeedback}
                    onChange={(e) =>
                      setManagerFeedback(
                        e.target.value
                      )
                    }
                    style={styles.textarea}
                    disabled={actionLoading}
                  />

                  <div style={styles.actionRow}>

                    <button
                      style={{
                        ...styles.rejectButton,
                        ...(actionLoading
                          ? styles.disabledButton
                          : {}),
                      }}
                      onClick={() =>
                        handleDecision(
                          "Rejected"
                        )
                      }
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Processing..."
                        : "✕ Reject Decision"}
                    </button>

                    <button
                      style={{
                        ...styles.approveButton,
                        ...(actionLoading
                          ? styles.disabledButton
                          : {}),
                      }}
                      onClick={() =>
                        handleDecision(
                          "Approved"
                        )
                      }
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Processing..."
                        : "✓ Approve Decision"}
                    </button>

                  </div>

                </div>

              </>

            )}

          </section>

        </div>

      </main>

    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f4f6fa",
    fontFamily: "Arial, sans-serif",
    color: "#1e293b",
  },

  /* SIDEBAR */

  sidebar: {
    width: "230px",
    minHeight: "100vh",
    backgroundColor: "#162131",
    color: "white",
    padding: "18px 12px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 10px 22px",
    borderBottom: "1px solid #293548",
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    backgroundColor: "#203a5c",
    color: "#60a5fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    flexShrink: 0,
  },

  brandTitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: "23px",
  },

  brandSub: {
    margin: 0,
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "20px",
  },

  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginTop: "20px",
  },

  menuButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#cbd5e1",
    padding: "14px 16px",
    borderRadius: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    gap: "14px",
    alignItems: "center",
  },

  activeMenu: {
    border: "1px solid #3b5d8c",
    backgroundColor: "#294467",
    color: "white",
    padding: "14px 16px",
    borderRadius: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    gap: "14px",
    alignItems: "center",
  },

  logoutButton: {
    marginTop: "auto",
    border: "none",
    backgroundColor: "#263548",
    color: "white",
    padding: "13px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    fontSize: "14px",
  },

  /* MAIN */

  main: {
    flex: 1,
    minWidth: 0,
  },

  topbar: {
    height: "62px",
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 30px",
  },

  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  notification: {
    fontSize: "20px",
    marginRight: "12px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#64748b",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  userName: {
    fontSize: "13px",
  },

  userRole: {
    margin: "3px 0 0",
    color: "#64748b",
    fontSize: "11px",
    textTransform: "capitalize",
  },

  content: {
    padding: "28px",
  },

  /* WELCOME */

  welcome: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#1e293b",
  },

  welcomeText: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "16px",
  },

  date: {
    color: "#475569",
    fontSize: "14px",
    marginTop: "8px",
    textAlign: "right",
  },

  /* MESSAGE */

  message: {
    marginBottom: "16px",
    padding: "12px 16px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "14px",
  },

  successMessage: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },

  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },

  /* STATS */

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "16px",
  },

  statCard: {
    padding: "17px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    minHeight: "90px",
    boxSizing: "border-box",
  },

  pendingCard: {
    backgroundColor: "#fff7df",
  },

  approvedCard: {
    backgroundColor: "#eaf8f0",
  },

  rejectedCard: {
    backgroundColor: "#fff0f0",
  },

  totalCard: {
    backgroundColor: "#edf4ff",
  },

  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor:
      "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    color: "#2563eb",
    flexShrink: 0,
  },

  statNumber: {
    margin: 0,
    fontSize: "30px",
  },

  statLabel: {
    margin: "5px 0",
    color: "#475569",
    fontSize: "15px",
  },

  smallText: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  viewButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#2563eb",
    padding: 0,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },

  /* DASHBOARD GRID */

  dashboardGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 300px",
    gap: "16px",
  },

  largePanel: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
  },

  activityPanel: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "18px",
  },

  panelHeader: {
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    borderBottom:
      "1px solid #e2e8f0",
  },

  panelTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#1e293b",
  },

  panelSubtitle: {
    color: "#64748b",
    margin: "7px 0 0",
    fontSize: "14px",
  },

  createButton: {
    backgroundColor: "#2563b8",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "9px 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  /* TABLE */

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1050px",
    fontSize: "14px",
  },

  tableHeader: {
    textAlign: "left",
    padding: "14px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    borderBottom:
      "1px solid #e2e8f0",
    fontSize: "13px",
  },

  tableRow: {
    borderBottom:
      "1px solid #eef2f7",
  },

  tableCell: {
    padding: "16px 14px",
    verticalAlign: "top",
  },

  decisionTitle: {
    color: "#1e293b",
    fontSize: "15px",
  },

  description: {
    color: "#64748b",
    fontSize: "13px",
    margin: "6px 0 0",
    maxWidth: "240px",
    lineHeight: "20px",
  },

  email: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  feedbackText: {
    margin: 0,
    fontSize: "13px",
    color: "#475569",
    maxWidth: "190px",
    lineHeight: "20px",
  },

  reviewButton: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    border:
      "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },

  /* DOCUMENTS */

  documentButton: {
    border:
      "1px solid #bfdbfe",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "6px",
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    textAlign: "left",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  documentsBox: {
    marginTop: "18px",
    padding: "18px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border:
      "1px solid #e2e8f0",
  },

  documentList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px",
  },

  documentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "12px",
    backgroundColor: "white",
    border:
      "1px solid #e2e8f0",
    borderRadius: "6px",
  },

  documentName: {
    fontSize: "13px",
    color: "#334155",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  openDocument: {
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    border:
      "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  noDocument: {
    color: "#94a3b8",
    fontSize: "12px",
  },

  emptyState: {
    margin: "16px",
    padding: "35px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    borderRadius: "8px",
  },

  /* ACTIVITY */

  activityItem: {
    display: "flex",
    gap: "12px",
    padding: "16px 0",
    borderBottom:
      "1px solid #eef2f7",
  },

  activityItemLast: {
    display: "flex",
    gap: "12px",
    padding: "16px 0 0",
  },

  activityText: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "18px",
  },

  activityIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#fff3cd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#b45309",
    flexShrink: 0,
  },

  greenIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#15803d",
    flexShrink: 0,
  },

  redIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#dc2626",
    flexShrink: 0,
  },

  blueIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2563eb",
    flexShrink: 0,
  },

  /* FINAL REVIEW */

  reviewPanel: {
    backgroundColor: "white",
    border:
      "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "22px",
    marginTop: "16px",
  },

  reviewDetails: {
    marginTop: "20px",
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "8px",
    border:
      "1px solid #e2e8f0",
  },

  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
  },

  statusBadge: {
    display: "inline-block",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  selectedTitle: {
    margin: "12px 0 0",
    fontSize: "25px",
    color: "#1e293b",
  },

  selectedDescription: {
    color: "#475569",
    lineHeight: "1.7",
    fontSize: "15px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, 1fr)",
    gap: "20px",
    marginTop: "20px",
  },

  infoLabel: {
    margin: "0 0 5px",
    color: "#64748b",
    fontSize: "12px",
  },

  /* REVIEWER FEEDBACK */

  reviewerBox: {
    marginTop: "18px",
    padding: "18px",
    backgroundColor: "#eff6ff",
    borderRadius: "8px",
    border:
      "1px solid #bfdbfe",
  },

  feedbackHeading: {
    margin: 0,
    fontSize: "15px",
    color: "#1e3a8a",
  },

  reviewerFeedback: {
    marginBottom: 0,
    color: "#334155",
    lineHeight: "1.6",
    fontSize: "14px",
  },

  /* MANAGER FORM */

  managerForm: {
    marginTop: "20px",
  },

  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "10px",
    fontSize: "15px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "8px",
    fontFamily:
      "Arial, sans-serif",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
  },

  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "16px",
  },

  approveButton: {
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  rejectButton: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};

export default ManagerDashboard;

