
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ReviewerDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const [reviewedCount, setReviewedCount] = useState(0);

  // Fetch pending decisions
  const fetchDecisions = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:5173/api/decisions/review",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch decisions");
      }

      setDecisions(data);
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  // Submit reviewer feedback
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!selectedDecision) return;

    if (!feedback.trim()) {
      setMessage("Reviewer feedback is required");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5173/api/decisions/${selectedDecision._id}/review`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reviewerFeedback: feedback,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      setMessage("Review submitted successfully!");

      setReviewedCount((prev) => prev + 1);

      setFeedback("");
      setSelectedDecision(null);

      fetchDecisions();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // Open document
  const handleViewDocument = (document) => {
    if (!document?.filePath) {
      setMessage("Document file is not available");
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
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>🔍 Decision Replay</h2>

        <button
          style={styles.menuButton}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          🏠 Dashboard
        </button>

        <button
          style={styles.menuButton}
          onClick={() => scrollToSection("pending-reviews")}
        >
          📥 Pending Reviews
        </button>

        <button
          style={styles.menuButton}
          onClick={() => scrollToSection("review-form")}
        >
          📝 Review Decision
        </button>

        <button
          style={styles.menuButton}
          onClick={() => scrollToSection("pending-reviews")}
        >
          📋 Assigned Decisions
        </button>

        <button
          style={styles.menuButton}
          onClick={() => scrollToSection("review-form")}
        >
          💬 Feedback
        </button>

        <button style={styles.logoutButton} onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Reviewer Dashboard</h1>

            <p style={styles.subtitle}>
              Welcome back, {user?.name} 👋
            </p>
          </div>

          <div style={styles.roleBadge}>{user?.role}</div>
        </div>

        {/* Statistics */}
        <div style={styles.stats}>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Pending Reviews</p>

            <h2 style={styles.cardNumber}>{decisions.length}</h2>

            <p style={styles.cardDescription}>
              Decisions waiting for review
            </p>
          </div>

          <div style={styles.card}>
            <p style={styles.cardLabel}>Reviewed This Session</p>

            <h2 style={styles.cardNumber}>{reviewedCount}</h2>

            <p style={styles.cardDescription}>
              Reviews completed this session
            </p>
          </div>

          <div style={styles.card}>
            <p style={styles.cardLabel}>Selected Decision</p>

            <h2 style={styles.cardNumber}>
              {selectedDecision ? "1" : "0"}
            </h2>

            <p style={styles.cardDescription}>
              Currently being reviewed
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>

          <p style={styles.sectionText}>
            Quickly access your review tasks.
          </p>

          <div style={styles.actionContainer}>
            <button
              style={styles.primaryActionButton}
              onClick={() => scrollToSection("pending-reviews")}
            >
              📥 View Pending Reviews
            </button>

            <button
              style={styles.actionButton}
              onClick={() => scrollToSection("review-form")}
            >
              📝 Review Selected Decision
            </button>
          </div>
        </div>

        {/* Pending Reviews */}
        <div id="pending-reviews" style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Pending Reviews</h2>

              <p style={styles.sectionText}>
                Select a decision to review and provide feedback.
              </p>
            </div>

            <button style={styles.refreshButton} onClick={fetchDecisions}>
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <p style={styles.emptyText}>Loading decisions...</p>
          ) : decisions.length === 0 ? (
            <p style={styles.emptyText}>
              🎉 No pending decisions to review.
            </p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Decision</th>

                    <th style={styles.th}>Created By</th>

                    <th style={styles.th}>Documents</th>

                    <th style={styles.th}>Status</th>

                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {decisions.map((decision) => (
                    <tr key={decision._id}>
                      <td style={styles.td}>
                        <strong>{decision.title}</strong>

                        <p style={styles.description}>
                          {decision.description}
                        </p>
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {decision.createdBy?.name || "Unknown"}
                        </strong>

                        <p style={styles.email}>
                          {decision.createdBy?.email || ""}
                        </p>
                      </td>

                      {/* Documents */}
                      <td style={styles.td}>
                        {!decision.documents ||
                        decision.documents.length === 0 ? (
                          <span style={styles.noDocument}>
                            No documents
                          </span>
                        ) : (
                          <div style={styles.documentList}>
                            {decision.documents.map((document) => (
                              <div
                                key={document._id}
                                style={styles.documentItem}
                              >
                                <span style={styles.documentName}>
                                  📄 {document.fileName}
                                </span>

                                <button
                                  style={styles.viewDocumentButton}
                                  onClick={() =>
                                    handleViewDocument(document)
                                  }
                                >
                                  👁 View
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td style={styles.td}>
                        <span style={styles.pendingBadge}>
                          {decision.status}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <button
                          style={styles.reviewButton}
                          onClick={() => {
                            setSelectedDecision(decision);
                            setFeedback("");
                            setMessage("");

                            setTimeout(() => {
                              scrollToSection("review-form");
                            }, 100);
                          }}
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
        </div>

        {/* Review Form */}
        <div id="review-form" style={styles.section}>
          <h2 style={styles.sectionTitle}>Review Decision</h2>

          <p style={styles.sectionText}>
            Review the selected decision, examine its documents, and
            provide your recommendations.
          </p>

          {!selectedDecision ? (
            <p style={styles.emptyText}>
              Select a decision from the Pending Reviews table.
            </p>
          ) : (
            <>
              {/* Selected Decision */}
              <div style={styles.selectedDecision}>
                <div style={styles.selectedHeader}>
                  <div>
                    <h3 style={styles.selectedTitle}>
                      {selectedDecision.title}
                    </h3>

                    <p style={styles.selectedDescription}>
                      {selectedDecision.description}
                    </p>
                  </div>

                  <span style={styles.pendingBadge}>
                    {selectedDecision.status}
                  </span>
                </div>

                <p style={styles.createdBy}>
                  <strong>Created by:</strong>{" "}
                  {selectedDecision.createdBy?.name || "Unknown"}
                </p>

                <p style={styles.createdBy}>
                  <strong>Email:</strong>{" "}
                  {selectedDecision.createdBy?.email || ""}
                </p>

                {/* Documents */}
                <div style={styles.documentSection}>
                  <h4 style={styles.documentHeading}>
                    📎 Supporting Documents
                  </h4>

                  {!selectedDecision.documents ||
                  selectedDecision.documents.length === 0 ? (
                    <p style={styles.noDocumentText}>
                      No documents were uploaded with this decision.
                    </p>
                  ) : (
                    <div style={styles.selectedDocuments}>
                      {selectedDecision.documents.map((document) => (
                        <div
                          key={document._id}
                          style={styles.selectedDocumentCard}
                        >
                          <div>
                            <div style={styles.selectedDocumentName}>
                              📄 {document.fileName}
                            </div>

                            <div style={styles.documentType}>
                              {document.fileType ||
                                "Document"}
                            </div>
                          </div>

                          <div style={styles.documentActions}>
                            <button
                              type="button"
                              style={styles.viewDocumentButton}
                              onClick={() =>
                                handleViewDocument(document)
                              }
                            >
                              👁 View
                            </button>

                            <a
                              href={`http://localhost:5173/${document.filePath.replace(
                                /\\/g,
                                "/"
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.downloadButton}
                            >
                              📥 Open
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback Form */}
              <form
                onSubmit={handleSubmitReview}
                style={styles.form}
              >
                <div>
                  <label style={styles.label}>
                    Reviewer Feedback
                  </label>

                  <textarea
                    rows="6"
                    placeholder="Provide your review and recommendations..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    style={styles.textarea}
                    required
                  />
                </div>

                <div style={styles.formActions}>
                  <button
                    type="submit"
                    style={styles.submitButton}
                  >
                    ✓ Submit Review
                  </button>

                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => {
                      setSelectedDecision(null);
                      setFeedback("");
                      setMessage("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}

          {message && (
            <p
              style={{
                ...styles.message,
                color: message
                  .toLowerCase()
                  .includes("success")
                  ? "#15803d"
                  : "#dc2626",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f1f5f9",
  },

  sidebar: {
    width: "250px",
    minHeight: "100vh",
    padding: "24px 16px",
    backgroundColor: "#111827",
    color: "white",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
    boxSizing: "border-box",
  },

  logo: {
    marginBottom: "28px",
    fontSize: "21px",
  },

  menuButton: {
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    backgroundColor: "transparent",
    color: "#d1d5db",
    fontSize: "15px",
  },

  logoutButton: {
    marginTop: "auto",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#374151",
    color: "white",
    textAlign: "left",
    fontSize: "15px",
  },

  main: {
    flex: 1,
    padding: "32px",
    minWidth: 0,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  pageTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "32px",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
    fontSize: "16px",
  },

  roleBadge: {
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    padding: "10px 18px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "14px",
    textTransform: "capitalize",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },

  cardLabel: {
    color: "#6b7280",
    margin: 0,
    fontSize: "16px",
  },

  cardNumber: {
    margin: "10px 0",
    fontSize: "34px",
    color: "#111827",
  },

  cardDescription: {
    margin: 0,
    color: "#9ca3af",
    fontSize: "13px",
  },

  section: {
    backgroundColor: "white",
    padding: "26px",
    marginTop: "25px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "22px",
  },

  sectionText: {
    color: "#6b7280",
    marginTop: "8px",
    fontSize: "15px",
  },

  actionContainer: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "20px",
  },

  primaryActionButton: {
    padding: "13px 20px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  actionButton: {
    padding: "13px 20px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "white",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  refreshButton: {
    padding: "11px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px",
  },

  tableWrapper: {
    overflowX: "auto",
    marginTop: "20px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px",
  },

  th: {
    textAlign: "left",
    padding: "15px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px",
  },

  td: {
    padding: "17px 15px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: "15px",
    verticalAlign: "top",
  },

  description: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    maxWidth: "400px",
    lineHeight: "1.5",
  },

  email: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  pendingBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  reviewButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },

  documentList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "190px",
  },

  documentItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "8px",
    backgroundColor: "#f8fafc",
    borderRadius: "7px",
    border: "1px solid #e5e7eb",
  },

  documentName: {
    fontSize: "12px",
    color: "#374151",
    maxWidth: "130px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  viewDocumentButton: {
    padding: "7px 10px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  noDocument: {
    color: "#9ca3af",
    fontSize: "13px",
  },

  selectedDecision: {
    marginTop: "22px",
    padding: "22px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },

  selectedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  selectedTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px",
  },

  selectedDescription: {
    color: "#4b5563",
    lineHeight: "1.6",
    marginTop: "12px",
    fontSize: "15px",
  },

  createdBy: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "12px",
  },

  documentSection: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
  },

  documentHeading: {
    margin: "0 0 15px",
    color: "#111827",
    fontSize: "17px",
  },

  noDocumentText: {
    color: "#9ca3af",
    fontSize: "14px",
  },

  selectedDocuments: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  selectedDocumentCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "14px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },

  selectedDocumentName: {
    color: "#111827",
    fontWeight: "bold",
    fontSize: "14px",
  },

  documentType: {
    marginTop: "5px",
    color: "#9ca3af",
    fontSize: "12px",
  },

  documentActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  downloadButton: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: "6px",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "bold",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    marginTop: "22px",
  },

  label: {
    display: "block",
    marginBottom: "9px",
    color: "#374151",
    fontWeight: "bold",
    fontSize: "15px",
  },

  textarea: {
    width: "100%",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },

  formActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  submitButton: {
    padding: "13px 22px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  cancelButton: {
    padding: "13px 22px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "white",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  message: {
    marginTop: "18px",
    fontWeight: "bold",
    fontSize: "15px",
  },

  emptyText: {
    marginTop: "20px",
    color: "#6b7280",
    fontSize: "15px",
  },
};

export default ReviewerDashboard;
