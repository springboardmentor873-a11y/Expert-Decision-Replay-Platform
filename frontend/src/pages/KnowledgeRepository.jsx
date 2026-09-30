import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5173";

function KnowledgeRepository() {
  const [query, setQuery] = useState("");
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searched, setSearched] = useState(false);

  const token = localStorage.getItem("token");

  // =====================================================
  // SEARCH DECISIONS
  // =====================================================

  const searchDecisions = async () => {
    if (!query.trim()) {
      setMessage("Please enter a search term.");
      setDecisions([]);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/decisions/search?query=${encodeURIComponent(
          query.trim()
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to search decisions"
        );
      }

      setDecisions(data.decisions || []);
      setSearched(true);

      if ((data.decisions || []).length === 0) {
        setMessage("No decisions found.");
      }
    } catch (error) {
      console.error("Search error:", error);
      setMessage(
        error.message || "Failed to search decisions."
      );
      setDecisions([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD ALL DECISIONS INITIALLY
  // =====================================================

  const loadInitialDecisions = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/decisions/my-decisions`,
        {
          method: "GET",
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

      setDecisions(data || []);
    } catch (error) {
      console.error(
        "Load decisions error:",
        error
      );

      setMessage(
        error.message ||
          "Failed to load decisions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialDecisions();
  }, []);

  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const clearSearch = () => {
    setQuery("");
    setSearched(false);
    setMessage("");
    loadInitialDecisions();
  };

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "Approved":
        return {
          backgroundColor: "#dcfce7",
          color: "#166534",
        };

      case "Rejected":
        return {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
        };

      case "Under Review":
        return {
          backgroundColor: "#fef3c7",
          color: "#92400e",
        };

      case "Pending Review":
        return {
          backgroundColor: "#e0f2fe",
          color: "#075985",
        };

      default:
        return {
          backgroundColor: "#f3f4f6",
          color: "#374151",
        };
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div style={styles.page}>
      {/* =================================================
          HEADER
      ================================================= */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Knowledge Repository
          </h1>

          <p style={styles.subtitle}>
            Search and explore organizational
            decisions and their history.
          </p>
        </div>
      </div>

      {/* =================================================
          SEARCH SECTION
      ================================================= */}

      <div style={styles.searchCard}>
        <div style={styles.searchTitle}>
          🔎 Search Decisions
        </div>

        <div style={styles.searchRow}>
          <input
            type="text"
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                searchDecisions();
              }
            }}
            placeholder="Search by decision title or description..."
            style={styles.searchInput}
          />

          <button
            onClick={searchDecisions}
            disabled={loading}
            style={styles.searchButton}
          >
            {loading ? "Searching..." : "Search"}
          </button>

          {searched && (
            <button
              onClick={clearSearch}
              style={styles.clearButton}
            >
              Clear
            </button>
          )}
        </div>

        <p style={styles.searchHint}>
          You can search using words such as
          authentication, database, security,
          deployment, etc.
        </p>
      </div>

      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      {/* =================================================
          RESULTS HEADER
      ================================================= */}

      <div style={styles.resultsHeader}>
        <div>
          <h2 style={styles.resultsTitle}>
            {searched
              ? "Search Results"
              : "Decision Repository"}
          </h2>

          <p style={styles.resultsCount}>
            {decisions.length} decision
            {decisions.length !== 1
              ? "s"
              : ""}
          </p>
        </div>
      </div>

      {/* =================================================
          DECISION CARDS
      ================================================= */}

      {loading && !decisions.length ? (
        <div style={styles.loading}>
          Loading decisions...
        </div>
      ) : decisions.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>
            📂
          </div>

          <h3 style={styles.emptyTitle}>
            No decisions available
          </h3>

          <p style={styles.emptyText}>
            {searched
              ? "Try searching with another keyword."
              : "Decisions created in the platform will appear here."}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {decisions.map((decision) => (
            <div
              key={decision._id}
              style={styles.card}
            >
              {/* CARD HEADER */}

              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  {decision.title}
                </h3>

                <span
                  style={{
                    ...styles.status,
                    ...getStatusStyle(
                      decision.status
                    ),
                  }}
                >
                  {decision.status}
                </span>
              </div>

              {/* DESCRIPTION */}

              <p style={styles.description}>
                {decision.description}
              </p>

              {/* DETAILS */}

              <div style={styles.details}>
                <div style={styles.detailRow}>
                  <span style={styles.label}>
                    Created By
                  </span>

                  <span style={styles.value}>
                    {decision.createdBy?.name ||
                      decision.createdBy?.email ||
                      "Unknown"}
                  </span>
                </div>

                <div style={styles.detailRow}>
                  <span style={styles.label}>
                    Created On
                  </span>

                  <span style={styles.value}>
                    {formatDate(
                      decision.createdAt
                    )}
                  </span>
                </div>

                {decision.reviewedBy && (
                  <div style={styles.detailRow}>
                    <span style={styles.label}>
                      Reviewed By
                    </span>

                    <span style={styles.value}>
                      {decision.reviewedBy?.name ||
                        decision.reviewedBy?.email ||
                        "N/A"}
                    </span>
                  </div>
                )}

                {decision.approvedBy && (
                  <div style={styles.detailRow}>
                    <span style={styles.label}>
                      Manager
                    </span>

                    <span style={styles.value}>
                      {decision.approvedBy?.name ||
                        decision.approvedBy?.email ||
                        "N/A"}
                    </span>
                  </div>
                )}
              </div>

              {/* REVIEWER FEEDBACK */}

              {decision.reviewerFeedback && (
                <div style={styles.feedbackBox}>
                  <div style={styles.feedbackTitle}>
                    Reviewer Feedback
                  </div>

                  <p style={styles.feedbackText}>
                    {decision.reviewerFeedback}
                  </p>
                </div>
              )}

              {/* MANAGER FEEDBACK */}

              {decision.managerFeedback && (
                <div style={styles.feedbackBox}>
                  <div style={styles.feedbackTitle}>
                    Manager Feedback
                  </div>

                  <p style={styles.feedbackText}>
                    {decision.managerFeedback}
                  </p>
                </div>
              )}

              {/* DOCUMENTS */}

              {decision.documents &&
                decision.documents.length > 0 && (
                  <div style={styles.documents}>
                    <div style={styles.documentsTitle}>
                      📎 Documents (
                      {decision.documents.length})
                    </div>

                    {decision.documents.map(
                      (document) => (
                        <a
                          key={document._id}
                          href={`${API_URL}/${document.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.documentLink}
                        >
                          {document.fileName}
                        </a>
                      )
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "32px",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  header: {
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "15px",
  },

  searchCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  },

  searchTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "16px",
  },

  searchRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    padding: "13px 15px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
  },

  searchButton: {
    padding: "13px 22px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  clearButton: {
    padding: "13px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#374151",
    fontWeight: "600",
    cursor: "pointer",
  },

  searchHint: {
    marginTop: "12px",
    marginBottom: 0,
    fontSize: "13px",
    color: "#6b7280",
  },

  message: {
    backgroundColor: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  resultsTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    color: "#1f2937",
  },

  resultsCount: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "22px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "700",
    color: "#111827",
  },

  status: {
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  description: {
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "20px",
  },

  details: {
    borderTop:
      "1px solid #e5e7eb",
    paddingTop: "14px",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "6px 0",
  },

  label: {
    fontSize: "13px",
    color: "#6b7280",
  },

  value: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    textAlign: "right",
  },

  feedbackBox: {
    marginTop: "16px",
    padding: "13px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    borderLeft:
      "3px solid #2563eb",
  },

  feedbackTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "5px",
  },

  feedbackText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "1.5",
    color: "#6b7280",
  },

  documents: {
    marginTop: "16px",
    paddingTop: "14px",
    borderTop:
      "1px solid #e5e7eb",
  },

  documentsTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
  },

  documentLink: {
    display: "block",
    color: "#2563eb",
    fontSize: "13px",
    textDecoration: "none",
    marginBottom: "5px",
  },

  loading: {
    textAlign: "center",
    padding: "50px",
    color: "#6b7280",
  },

  empty: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "60px 20px",
    textAlign: "center",
    border:
      "1px solid #e5e7eb",
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px",
  },

  emptyTitle: {
    margin: 0,
    color: "#374151",
    fontSize: "18px",
  },

  emptyText: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "8px",
  },
};

export default KnowledgeRepository;