import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function EmployeeDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const API_URL = "http://localhost:5173";

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  // Documents section
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentMessage, setDocumentMessage] = useState("");

  // Documents attached while creating a decision
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Discussions
  const [discussions, setDiscussions] = useState([]);
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [discussionText, setDiscussionText] = useState("");

  // Alternatives
  const [alternatives, setAlternatives] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState("");

  const [alternativeName, setAlternativeName] = useState("");
  const [alternativeDescription, setAlternativeDescription] =
    useState("");

  const [cost, setCost] = useState("");
  const [performance, setPerformance] = useState("");
  const [scalability, setScalability] = useState("");
  const [risk, setRisk] = useState("");

  const [alternativeMessage, setAlternativeMessage] = useState("");

  // Fetch decisions created by logged-in employee
  const fetchDecisions = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/decisions/my-decisions`,
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
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch uploaded documents
  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/documents/my-documents`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch documents"
        );
      }

      setDocuments(data);
    } catch (error) {
      console.error(error);
      setDocumentMessage(error.message);
    }
  };

  // Fetch discussions
  const fetchDiscussions = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/discussions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch discussions"
        );
      }

      setDiscussions(data);
    } catch (error) {
      console.error(error);
      setDiscussionMessage(error.message);
    }
  };

  // Fetch alternatives
  const fetchAlternatives = async (decisionId) => {
    if (!decisionId) {
      setAlternatives([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/alternatives/decision/${decisionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch alternatives"
        );
      }

      setAlternatives(data);
    } catch (error) {
      console.error(error);
      setAlternativeMessage(error.message);
    }
  };

  useEffect(() => {
    fetchDecisions();
    fetchDocuments();
    fetchDiscussions();
  }, []);

  // ============================================================
  // CREATE DECISION + OPTIONAL DOCUMENTS
  // ============================================================

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const formData = new FormData();

      // Add decision information
      formData.append("title", title);
      formData.append("description", description);

      // Add optional documents
      selectedFiles.forEach((file) => {
        formData.append("documents", file);
      });

      const response = await fetch(
        `${API_URL}/api/decisions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create decision"
        );
      }

      // Reset decision fields
      setTitle("");
      setDescription("");

      // Reset selected documents
      setSelectedFiles([]);

      const decisionFileInput =
        document.getElementById("decisionDocuments");

      if (decisionFileInput) {
        decisionFileInput.value = "";
      }

      // Success message
      if (selectedFiles.length > 0) {
        setMessage(
          `Decision created and ${selectedFiles.length} document(s) uploaded successfully!`
        );
      } else {
        setMessage("Decision created successfully!");
      }

      // Refresh data
      fetchDecisions();
      fetchDocuments();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  // ============================================================
  // SELECT DOCUMENTS FOR NEW DECISION
  // ============================================================

  const handleDecisionFileSelection = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 10) {
      setMessage(
        "You can upload a maximum of 10 documents."
      );

      e.target.value = "";
      setSelectedFiles([]);
      return;
    }

    setSelectedFiles(files);
    setMessage("");
  };

  // ============================================================
  // SEPARATE DOCUMENT UPLOAD
  // ============================================================

  const handleDocumentUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setDocumentMessage("Please select a file");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("document", selectedFile);

      const response = await fetch(
        `${API_URL}/api/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Document upload failed"
        );
      }

      setDocumentMessage(
        "Document uploaded successfully!"
      );

      setSelectedFile(null);

      fetchDocuments();
    } catch (error) {
      console.error(error);
      setDocumentMessage(error.message);
    }
  };

  // ============================================================
  // CREATE DISCUSSION
  // ============================================================

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();

    if (!discussionText.trim()) {
      setDiscussionMessage(
        "Please enter a discussion message"
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/discussions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: discussionText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create discussion"
        );
      }

      setDiscussionText("");
      setDiscussionMessage(
        "Discussion posted successfully!"
      );

      fetchDiscussions();
    } catch (error) {
      console.error(error);
      setDiscussionMessage(error.message);
    }
  };

  // ============================================================
  // CREATE ALTERNATIVE
  // ============================================================

  const handleCreateAlternative = async (e) => {
    e.preventDefault();

    if (!selectedDecision) {
      setAlternativeMessage("Please select a decision");
      return;
    }

    if (!alternativeName.trim()) {
      setAlternativeMessage(
        "Please enter an alternative name"
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/alternatives`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: alternativeName,
            description: alternativeDescription,
            decision: selectedDecision,
            cost: Number(cost),
            performance: Number(performance),
            scalability: Number(scalability),
            risk: Number(risk),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create alternative"
        );
      }

      setAlternativeName("");
      setAlternativeDescription("");
      setCost("");
      setPerformance("");
      setScalability("");
      setRisk("");

      setAlternativeMessage(
        "Alternative added successfully!"
      );

      fetchAlternatives(selectedDecision);
    } catch (error) {
      console.error(error);
      setAlternativeMessage(error.message);
    }
  };

  // ============================================================
  // DELETE DOCUMENT
  // ============================================================

  const handleDeleteDocument = async (documentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/api/documents/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete document"
        );
      }

      setDocumentMessage(
        "Document deleted successfully!"
      );

      fetchDocuments();
    } catch (error) {
      console.error(error);
      setDocumentMessage(error.message);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // ============================================================
  // SCROLL
  // ============================================================

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalDecisions = decisions.length;

  const inReview = decisions.filter(
    (decision) =>
      decision.status === "Pending Review" ||
      decision.status === "Under Review"
  ).length;

  const approved = decisions.filter(
    (decision) => decision.status === "Approved"
  ).length;

  const rejected = decisions.filter(
    (decision) => decision.status === "Rejected"
  ).length;

  const chartData = [
    {
      name: "In Review",
      decisions: inReview,
    },
    {
      name: "Approved",
      decisions: approved,
    },
    {
      name: "Rejected",
      decisions: rejected,
    },
  ];

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
              scrollToSection("new-decision")
            }
          >
            <span>＋</span>
            New Decision
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("my-decisions")
            }
          >
            <span>▣</span>
            My Decisions
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("my-decisions")
            }
          >
            <span>◷</span>
            Decision History
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("documents")
            }
          >
            📎 Documents
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("discussions")
            }
          >
            💬 Discussions
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("alternatives")
            }
          >
            📊 Compare Alternatives
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
              {user?.name?.charAt(0)?.toUpperCase() ||
                "E"}
            </div>

            <div>
              <strong style={styles.userName}>
                {user?.name || "Employee"}
              </strong>

              <p style={styles.userRole}>
                {user?.role || "Employee"}
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
                {user?.name || "Employee"}!
              </h1>

              <p style={styles.welcomeText}>
                Track your decisions and follow their
                review progress.
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

          {/* STATISTICS */}

          <section style={styles.stats}>
            <div
              style={{
                ...styles.statCard,
                ...styles.totalCard,
              }}
            >
              <div style={styles.statIcon}>▣</div>

              <div>
                <h2 style={styles.statNumber}>
                  {totalDecisions}
                </h2>

                <p style={styles.statLabel}>
                  My Decisions
                </p>

                <p style={styles.smallText}>
                  Total submitted
                </p>
              </div>
            </div>

            <div
              style={{
                ...styles.statCard,
                ...styles.pendingCard,
              }}
            >
              <div style={styles.statIcon}>◷</div>

              <div>
                <h2 style={styles.statNumber}>
                  {inReview}
                </h2>

                <p style={styles.statLabel}>
                  In Review
                </p>

                <p style={styles.smallText}>
                  Awaiting progress
                </p>
              </div>
            </div>

            <div
              style={{
                ...styles.statCard,
                ...styles.approvedCard,
              }}
            >
              <div style={styles.statIcon}>✓</div>

              <div>
                <h2 style={styles.statNumber}>
                  {approved}
                </h2>

                <p style={styles.statLabel}>
                  Approved
                </p>

                <p style={styles.smallText}>
                  Successfully completed
                </p>
              </div>
            </div>

            <div
              style={{
                ...styles.statCard,
                ...styles.rejectedCard,
              }}
            >
              <div style={styles.statIcon}>✕</div>

              <div>
                <h2 style={styles.statNumber}>
                  {rejected}
                </h2>

                <p style={styles.statLabel}>
                  Rejected
                </p>

                <p style={styles.smallText}>
                  Needs reconsideration
                </p>
              </div>
            </div>
          </section>

          {/* DECISION ANALYTICS */}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Decision Analytics
            </h2>

            <div style={styles.chartContainer}>
              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Bar
                    dataKey="decisions"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* QUICK ACTIONS */}

          <section style={styles.quickPanel}>
            <div>
              <h2 style={styles.panelTitle}>
                Quick Actions
              </h2>

              <p style={styles.panelSubtitle}>
                Manage your decisions quickly.
              </p>
            </div>

            <div style={styles.actions}>
              <button
                style={styles.primaryActionButton}
                onClick={() =>
                  scrollToSection("new-decision")
                }
              >
                ＋ Create New Decision
              </button>

              <button
                style={styles.secondaryActionButton}
                onClick={() =>
                  scrollToSection("my-decisions")
                }
              >
                ▣ View My Decisions
              </button>
            </div>
          </section>

          {/* ==================================================
              CREATE DECISION
          ================================================== */}

          <section
            id="new-decision"
            style={styles.section}
          >
            <h2 style={styles.panelTitle}>
              Create New Decision
            </h2>

            <p style={styles.panelSubtitle}>
              Record your decision and submit it for
              review.
            </p>

            <form
              onSubmit={handleCreateDecision}
              style={styles.form}
            >
              {/* TITLE */}

              <div>
                <label style={styles.label}>
                  Decision Title
                </label>

                <input
                  type="text"
                  placeholder="Enter a clear decision title"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  required
                  style={styles.input}
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label style={styles.label}>
                  Decision Description
                </label>

                <textarea
                  placeholder="Explain the decision, reasoning, and expected outcome..."
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  required
                  rows="6"
                  style={styles.textarea}
                />
              </div>

              {/* ==================================================
                  OPTIONAL DECISION DOCUMENTS
              ================================================== */}

              <div>
                <label style={styles.label}>
                  📎 Attach Documents{" "}
                  <span style={styles.optionalText}>
                    (Optional)
                  </span>
                </label>

                <p style={styles.documentUploadHint}>
                  Attach documents related to this
                  decision. You can select multiple files.
                  Maximum 10 files, up to 5 MB each.
                </p>

                <input
                  id="decisionDocuments"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={
                    handleDecisionFileSelection
                  }
                  style={styles.fileInput}
                />

                {/* SELECTED FILES */}

                {selectedFiles.length > 0 && (
                  <div style={styles.selectedFiles}>
                    <div
                      style={
                        styles.selectedFilesHeader
                      }
                    >
                      <strong>
                        Selected Documents (
                        {selectedFiles.length})
                      </strong>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFiles([]);

                          const input =
                            document.getElementById(
                              "decisionDocuments"
                            );

                          if (input) {
                            input.value = "";
                          }
                        }}
                        style={styles.clearFilesButton}
                      >
                        Clear
                      </button>
                    </div>

                    {selectedFiles.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          style={
                            styles.selectedFileItem
                          }
                        >
                          <span>
                            📄 {file.name}
                          </span>

                          <span
                            style={
                              styles.selectedFileSize
                            }
                          >
                            {(
                              file.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {selectedFiles.length === 0 && (
                  <p style={styles.noFilesText}>
                    No documents selected. You can submit
                    the decision without documents.
                  </p>
                )}
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                style={styles.submitButton}
              >
                Submit for Review →
              </button>
            </form>

            {message && (
              <div
                style={{
                  ...styles.message,
                  ...(message.includes("success")
                    ? styles.successMessage
                    : styles.errorMessage),
                }}
              >
                {message}
              </div>
            )}
          </section>

          {/* ==================================================
              DOCUMENTS
          ================================================== */}

          <div
            id="documents"
            style={styles.section}
          >
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  📎 Documents
                </h2>

                <p style={styles.sectionText}>
                  Upload and manage your decision-related
                  documents.
                </p>
              </div>

              <button
                style={styles.refreshButton}
                onClick={fetchDocuments}
              >
                🔄 Refresh
              </button>
            </div>

           

            {/* Documents List */}

            <div style={styles.documentList}>
              <h3 style={styles.documentListTitle}>
                My Uploaded Documents
              </h3>

              {documents.length === 0 ? (
                <p style={styles.emptyText}>
                  No documents uploaded yet.
                </p>
              ) : (
                documents.map((document) => (
                  <div
                    key={document._id}
                    style={styles.documentItem}
                  >
                    <div>
                      <strong>
                        {document.fileName}
                      </strong>

                      <p
                        style={styles.documentInfo}
                      >
                        {document.fileType}
                      </p>

                      {document.decision && (
                        <p
                          style={
                            styles.documentInfo
                          }
                        >
                          Decision:{" "}
                          {document.decision.title}
                        </p>
                      )}
                    </div>

                    <div
                      style={
                        styles.documentActions
                      }
                    >
                      <a
                        href={`${API_URL}/${document.filePath.replace(
                          /\\/g,
                          "/"
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.viewButton}
                      >
                        👁 View
                      </a>

                      <button
                        onClick={() =>
                          handleDeleteDocument(
                            document._id
                          )
                        }
                        style={
                          styles.deleteButton
                        }
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ==================================================
              DISCUSSIONS
          ================================================== */}

          <div
            id="discussions"
            style={styles.section}
          >
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  💬 Discussions
                </h2>

                <p style={styles.sectionText}>
                  Share your thoughts and discuss
                  decisions with the team.
                </p>
              </div>

              <button
                style={styles.refreshButton}
                onClick={fetchDiscussions}
              >
                🔄 Refresh
              </button>
            </div>

            <form
              onSubmit={handleCreateDiscussion}
              style={styles.discussionForm}
            >
              <textarea
                placeholder="Write your discussion message..."
                value={discussionText}
                onChange={(e) =>
                  setDiscussionText(
                    e.target.value
                  )
                }
                rows="4"
                style={styles.discussionTextarea}
              />

              <button
                type="submit"
                style={styles.submitButton}
              >
                💬 Post Discussion
              </button>
            </form>

            {discussionMessage && (
              <p
                style={{
                  ...styles.message,
                  color:
                    discussionMessage.includes(
                      "success"
                    )
                      ? "#15803d"
                      : "#dc2626",
                }}
              >
                {discussionMessage}
              </p>
            )}

            <div style={styles.discussionList}>
              <h3
                style={
                  styles.documentListTitle
                }
              >
                Recent Discussions
              </h3>

              {discussions.length === 0 ? (
                <p style={styles.emptyText}>
                  No discussions yet. Start the
                  conversation!
                </p>
              ) : (
                discussions.map(
                  (discussion) => (
                    <div
                      key={discussion._id}
                      style={
                        styles.discussionItem
                      }
                    >
                      <div
                        style={
                          styles.discussionHeader
                        }
                      >
                        <strong>
                          {discussion.createdBy
                            ?.name ||
                            "Unknown User"}
                        </strong>

                        <span
                          style={
                            styles.discussionRole
                          }
                        >
                          {
                            discussion
                              .createdBy?.role
                          }
                        </span>
                      </div>

                      <p
                        style={
                          styles.discussionContent
                        }
                      >
                        {discussion.message}
                      </p>

                      {discussion.decision && (
                        <p
                          style={
                            styles.discussionDecision
                          }
                        >
                          📋 Related Decision:{" "}
                          {
                            discussion.decision
                              .title
                          }
                        </p>
                      )}

                      <p
                        style={
                          styles.discussionDate
                        }
                      >
                        {new Date(
                          discussion.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* ==================================================
              ALTERNATIVE COMPARISON
          ================================================== */}

          <div
            id="alternatives"
            style={styles.section}
          >
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  📊 Alternative Comparison
                </h2>

                <p style={styles.sectionText}>
                  Add and compare different
                  alternatives for a decision.
                </p>
              </div>
            </div>

            {/* Select Decision */}

            <div
              style={
                styles.alternativeSelectContainer
              }
            >
              <label style={styles.label}>
                Select Decision
              </label>

              <select
                value={selectedDecision}
                onChange={(e) => {
                  setSelectedDecision(
                    e.target.value
                  );

                  fetchAlternatives(
                    e.target.value
                  );
                }}
                style={styles.input}
              >
                <option value="">
                  -- Select a Decision --
                </option>

                {decisions.map((decision) => (
                  <option
                    key={decision._id}
                    value={decision._id}
                  >
                    {decision.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Alternative */}

            {selectedDecision && (
              <form
                onSubmit={handleCreateAlternative}
                style={styles.alternativeForm}
              >
                <h3
                  style={
                    styles.documentListTitle
                  }
                >
                  Add Alternative
                </h3>

                <input
                  type="text"
                  placeholder="Alternative name"
                  value={alternativeName}
                  onChange={(e) =>
                    setAlternativeName(
                      e.target.value
                    )
                  }
                  style={styles.input}
                  required
                />

                <textarea
                  placeholder="Describe this alternative..."
                  value={
                    alternativeDescription
                  }
                  onChange={(e) =>
                    setAlternativeDescription(
                      e.target.value
                    )
                  }
                  rows="3"
                  style={styles.textarea}
                />

                <div
                  style={styles.criteriaGrid}
                >
                  <div>
                    <label
                      style={styles.label}
                    >
                      Cost (1–10)
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={cost}
                      onChange={(e) =>
                        setCost(e.target.value)
                      }
                      style={styles.input}
                      required
                    />
                  </div>

                  <div>
                    <label
                      style={styles.label}
                    >
                      Performance (1–10)
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={performance}
                      onChange={(e) =>
                        setPerformance(
                          e.target.value
                        )
                      }
                      style={styles.input}
                      required
                    />
                  </div>

                  <div>
                    <label
                      style={styles.label}
                    >
                      Scalability (1–10)
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={scalability}
                      onChange={(e) =>
                        setScalability(
                          e.target.value
                        )
                      }
                      style={styles.input}
                      required
                    />
                  </div>

                  <div>
                    <label
                      style={styles.label}
                    >
                      Risk (1–10)
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={risk}
                      onChange={(e) =>
                        setRisk(e.target.value)
                      }
                      style={styles.input}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={styles.submitButton}
                >
                  ➕ Add Alternative
                </button>
              </form>
            )}

            {alternativeMessage && (
              <p
                style={{
                  ...styles.message,
                  color:
                    alternativeMessage.includes(
                      "success"
                    )
                      ? "#15803d"
                      : "#dc2626",
                }}
              >
                {alternativeMessage}
              </p>
            )}

            {/* Comparison Table */}

            {selectedDecision && (
              <div
                style={
                  styles.comparisonContainer
                }
              >
                <h3
                  style={
                    styles.documentListTitle
                  }
                >
                  Comparison Results
                </h3>

                {alternatives.length === 0 ? (
                  <p style={styles.emptyText}>
                    No alternatives added yet.
                  </p>
                ) : (
                  <div
                    style={styles.tableWrapper}
                  >
                    <table
                      style={styles.table}
                    >
                      <thead>
                        <tr>
                          <th style={styles.th}>
                            Alternative
                          </th>

                          <th style={styles.th}>
                            Cost
                          </th>

                          <th style={styles.th}>
                            Performance
                          </th>

                          <th style={styles.th}>
                            Scalability
                          </th>

                          <th style={styles.th}>
                            Risk
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {alternatives.map(
                          (alternative) => (
                            <tr
                              key={
                                alternative._id
                              }
                            >
                              <td
                                style={
                                  styles.td
                                }
                              >
                                <strong>
                                  {
                                    alternative.name
                                  }
                                </strong>

                                {alternative.description && (
                                  <p
                                    style={
                                      styles.decisionDescription
                                    }
                                  >
                                    {
                                      alternative.description
                                    }
                                  </p>
                                )}
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                {alternative.cost}
                                /10
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                {
                                  alternative.performance
                                }
                                /10
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                {
                                  alternative.scalability
                                }
                                /10
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                {alternative.risk}
                                /10
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ==================================================
              MY DECISIONS
          ================================================== */}

          <section
            id="my-decisions"
            style={styles.section}
          >
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>
                  My Decisions
                </h2>

                <p style={styles.panelSubtitle}>
                  Track the progress of your submitted
                  decisions.
                </p>
              </div>

              <button
                style={styles.refreshButton}
                onClick={fetchDecisions}
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div style={styles.emptyState}>
                Loading decisions...
              </div>
            ) : decisions.length === 0 ? (
              <div style={styles.emptyState}>
                No decisions yet. Create your first
                decision above.
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>
                        Decision
                      </th>

                      <th style={styles.th}>
                        Status
                      </th>

                      <th style={styles.th}>
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {decisions.map(
                      (decision) => (
                        <tr
                          key={decision._id}
                        >
                          <td style={styles.td}>
                            <strong
                              style={
                                styles.decisionTitle
                              }
                            >
                              {decision.title}
                            </strong>

                            <p
                              style={
                                styles.decisionDescription
                              }
                            >
                              {
                                decision.description
                              }
                            </p>

                            {/* Show documents attached to decision */}

                            {decision.documents &&
                              decision.documents
                                .length >
                                0 && (
                                <div
                                  style={
                                    styles.decisionDocuments
                                  }
                                >
                                  <strong>
                                    📎{" "}
                                    {
                                      decision
                                        .documents
                                        .length
                                    }{" "}
                                    document(s)
                                  </strong>
                                </div>
                              )}
                          </td>

                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...(decision.status ===
                                "Approved"
                                  ? styles.approvedBadge
                                  : decision.status ===
                                    "Rejected"
                                  ? styles.rejectedBadge
                                  : styles.pendingBadge),
                              }}
                            >
                              {decision.status}
                            </span>
                          </td>

                          <td style={styles.td}>
                            {formatDate(
                              decision.createdAt
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
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

  sidebar: {
    width: "250px",
    height: "100vh",
    padding: "24px 16px",
    backgroundColor: "#111827",
    color: "white",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "fixed",
    top: 0,
    left: 0,
    boxSizing: "border-box",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 10px 24px",
    borderBottom: "1px solid #293548",
  },

  logoIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    backgroundColor: "#203a5c",
    color: "#60a5fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
  },

  brandTitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: "23px",
  },

  brandSub: {
    margin: 0,
    fontSize: "17px",
    lineHeight: "22px",
  },

  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "18px",
  },

  menuButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#cbd5e1",
    padding: "15px 16px",
    borderRadius: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    gap: "14px",
    alignItems: "center",
  },

  activeMenu: {
    border: "1px solid #3b5d8c",
    backgroundColor: "#294467",
    color: "white",
    padding: "15px 16px",
    borderRadius: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    gap: "14px",
    alignItems: "center",
  },

  logoutButton: {
    marginTop: "auto",
    border: "none",
    backgroundColor: "#263548",
    color: "white",
    padding: "15px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    gap: "12px",
    fontSize: "16px",
  },

  main: {
    flex: 1,
    padding: "32px",
    marginLeft: "250px",
    minWidth: 0,
  },

  topbar: {
    height: "70px",
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 32px",
  },

  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  notification: {
    fontSize: "24px",
    marginRight: "14px",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#64748b",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
  },

  userName: {
    fontSize: "15px",
  },

  userRole: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  content: {
    padding: "32px",
  },

  welcome: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#1e293b",
  },

  welcomeText: {
    margin: "9px 0 0",
    color: "#64748b",
    fontSize: "16px",
  },

  date: {
    color: "#475569",
    fontSize: "15px",
    marginTop: "10px",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(180px, 1fr))",
    gap: "16px",
  },

  statCard: {
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    minHeight: "105px",
    boxSizing: "border-box",
  },

  totalCard: {
    backgroundColor: "#edf4ff",
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

  statIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    backgroundColor:
      "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
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
    fontSize: "16px",
  },

  smallText: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  quickPanel: {
    marginTop: "18px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  primaryActionButton: {
    backgroundColor: "#2563b8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "13px 18px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
  },

  secondaryActionButton: {
    backgroundColor: "white",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "13px 18px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
  },

  section: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginTop: "18px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#1e293b",
  },

  sectionText: {
    color: "#64748b",
    margin: "8px 0 0",
    fontSize: "15px",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    paddingBottom: "18px",
    borderBottom: "1px solid #e2e8f0",
  },

  panelTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#1e293b",
  },

  panelSubtitle: {
    color: "#64748b",
    margin: "8px 0 0",
    fontSize: "15px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginTop: "24px",
  },

  label: {
    display: "block",
    marginBottom: "10px",
    color: "#334155",
    fontWeight: "bold",
    fontSize: "16px",
  },

  optionalText: {
    color: "#64748b",
    fontWeight: "normal",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    padding: "15px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "16px",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    padding: "15px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "16px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.5",
  },

  submitButton: {
    alignSelf: "flex-start",
    padding: "14px 22px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#2563b8",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  },

  message: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "15px",
  },

  successMessage: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },

  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },

  documentUploadHint: {
    margin: "0 0 12px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  noFilesText: {
    margin: "10px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
  },

  selectedFiles: {
    marginTop: "14px",
    padding: "14px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
  },

  selectedFilesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    color: "#334155",
  },

  selectedFileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px",
    color: "#334155",
  },

  selectedFileSize: {
    color: "#64748b",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },

  clearFilesButton: {
    border: "none",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },

  refreshButton: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "7px",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },

  tableWrapper: {
    overflowX: "auto",
    marginTop: "20px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
    fontSize: "15px",
  },

  th: {
    textAlign: "left",
    padding: "16px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "15px",
  },

  td: {
    padding: "18px 16px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: "15px",
    verticalAlign: "top",
  },

  decisionTitle: {
    color: "#1e293b",
    fontSize: "17px",
  },

  decisionDescription: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "14px",
    maxWidth: "550px",
    lineHeight: "20px",
  },

  decisionDocuments: {
    marginTop: "10px",
    color: "#4338ca",
    fontSize: "13px",
  },

  statusBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  pendingBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },

  approvedBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },

  rejectedBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },

  chartContainer: {
    width: "100%",
    height: "300px",
    marginTop: "25px",
  },

  emptyState: {
    marginTop: "20px",
    padding: "40px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "16px",
  },

  documentForm: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: "20px",
  },

  fileInput: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    maxWidth: "100%",
  },

  documentList: {
    marginTop: "30px",
  },

  documentListTitle: {
    fontSize: "18px",
    color: "#111827",
    marginBottom: "15px",
  },

  documentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "12px",
    gap: "15px",
  },

  documentInfo: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  documentActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  viewButton: {
    padding: "10px 14px",
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },

  deleteButton: {
    padding: "10px 14px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  emptyText: {
    color: "#64748b",
    fontSize: "14px",
  },

  discussionForm: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "20px",
  },

  discussionTextarea: {
    width: "100%",
    padding: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },

  discussionList: {
    marginTop: "30px",
  },

  discussionItem: {
    padding: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    marginBottom: "15px",
    backgroundColor: "#f8fafc",
  },

  discussionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  discussionRole: {
    padding: "4px 9px",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  discussionContent: {
    margin: "14px 0",
    color: "#374151",
    lineHeight: "1.5",
  },

  discussionDecision: {
    margin: "8px 0",
    color: "#4f46e5",
    fontSize: "13px",
  },

  discussionDate: {
    margin: "10px 0 0",
    color: "#9ca3af",
    fontSize: "12px",
  },

  alternativeSelectContainer: {
    marginTop: "20px",
  },

  alternativeForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "25px",
    padding: "20px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
  },

  criteriaGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },

  comparisonContainer: {
    marginTop: "30px",
  },
};

export default EmployeeDashboard;