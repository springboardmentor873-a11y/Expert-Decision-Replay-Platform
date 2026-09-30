import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  Link,
} from "react-router-dom";

import {
  API_BASE,
  getCurrentUser,
} from "../api";

import "./Workspace.css";


const CATEGORY_OPTIONS = [
  "Technology",
  "Finance",
  "Hiring",
  "Product",
  "Operations",
  "Strategy",
  "Other",
];


function statusClass(status) {
  return `status-badge status-${(
    status || "Draft"
  ).replaceAll(" ", "-")}`;
}


function DecisionDetail() {

  const { id } = useParams();
  const navigate = useNavigate();

  const user = getCurrentUser();

  const role = (
    user?.role || ""
  ).toLowerCase();

  const isManager =
    role === "manager" ||
    role === "admin" ||
    role === "administrator";


  // ==========================================================
  // STATES
  // ==========================================================

  const [decision, setDecision] =
    useState(null);

  const [alternatives, setAlternatives] =
    useState([]);

  const [comments, setComments] =
    useState([]);

  const [documents, setDocuments] =
    useState([]);

  const [history, setHistory] =
    useState([]);


  const [tab, setTab] =
    useState("alternatives");


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // Alternative
  const [altName, setAltName] =
    useState("");

  const [altDesc, setAltDesc] =
    useState("");


  // Discussion
  const [commentText, setCommentText] =
    useState("");

  const [isMeetingNote, setIsMeetingNote] =
    useState(false);


  // Edit
  const [isEditing, setIsEditing] =
    useState(false);

  const [editTitle, setEditTitle] =
    useState("");

  const [editProblem, setEditProblem] =
    useState("");

  const [editReasoning, setEditReasoning] =
    useState("");

  const [editCategory, setEditCategory] =
    useState("");

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [editError, setEditError] =
    useState("");

  // Approval workflow
  const [submittingApproval, setSubmittingApproval] =
    useState(false);

  const [approvalMessage, setApprovalMessage] =
    useState("");


  // Upload
  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const [uploadError, setUploadError] =
    useState("");


  // ==========================================================
  // LOAD EVERYTHING
  // ==========================================================

  const loadAll = async () => {

    try {

      setLoading(true);
      setError("");


      if (!user?.id) {

        setError(
          "User session not found. Please login again."
        );

        setLoading(false);

        return;
      }


      /*
        IMPORTANT:
        user_id is sent to the backend.

        Manager:
        backend allows all decisions.

        Employee:
        backend allows only their own decision.
      */

      const [
        decisionRes,
        alternativesRes,
        commentsRes,
        documentsRes,
        historyRes,
      ] = await Promise.all([

        fetch(
          `${API_BASE}/decisions/${id}?user_id=${encodeURIComponent(
            user.id
          )}`
        ),

        fetch(
          `${API_BASE}/decisions/${id}/alternatives`
        ),

        fetch(
          `${API_BASE}/decisions/${id}/comments`
        ),

        fetch(
          `${API_BASE}/decisions/${id}/documents`
        ),

        fetch(
          `${API_BASE}/decisions/${id}/history`
        ),

      ]);


      // ======================================================
      // DECISION PERMISSION CHECK
      // ======================================================

      if (!decisionRes.ok) {

        let data = {};

        try {
          data = await decisionRes.json();
        } catch {
          data = {};
        }


        if (decisionRes.status === 403) {

          setError(
            data.detail ||
            "You are not allowed to view this decision."
          );

        } else if (decisionRes.status === 404) {

          setError(
            "Decision not found."
          );

        } else {

          setError(
            data.detail ||
            "Could not load decision."
          );

        }

        setLoading(false);

        return;
      }


      const decisionData =
        await decisionRes.json();


      setDecision(
        decisionData
      );


      setEditTitle(
        decisionData.title || ""
      );

      setEditProblem(
        decisionData.problem || ""
      );

      setEditReasoning(
        decisionData.reasoning || ""
      );

      setEditCategory(
        decisionData.category || ""
      );


      setAlternatives(
        alternativesRes.ok
          ? await alternativesRes.json()
          : []
      );


      setComments(
        commentsRes.ok
          ? await commentsRes.json()
          : []
      );


      setDocuments(
        documentsRes.ok
          ? await documentsRes.json()
          : []
      );


      setHistory(
        historyRes.ok
          ? await historyRes.json()
          : []
      );


      setLoading(false);

    } catch (err) {

      console.error(err);

      setError(
        "Cannot connect to backend. Please make sure the server is running."
      );

      setLoading(false);
    }
  };


  useEffect(() => {

    // Prevent API requests such as /decisions/undefined
    // if the route does not contain a valid decision ID.
    const decisionId = Number(id);

    if (!Number.isInteger(decisionId) || decisionId <= 0) {
      navigate("/dashboard", { replace: true });
      return;
    }

    loadAll();

  }, [id, navigate]);


  // ==========================================================
  // ADD ALTERNATIVE
  // ==========================================================

  const handleAddAlternative =
    async (e) => {

      e.preventDefault();


      if (!altName.trim()) {

        alert(
          "Please enter an option name."
        );

        return;
      }


      try {

        const response =
          await fetch(
            `${API_BASE}/decisions/${id}/alternatives`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                name: altName.trim(),
                description:
                  altDesc.trim(),
              }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          alert(
            data.detail ||
            "Could not add alternative"
          );

          return;
        }


        setAltName("");
        setAltDesc("");

        await loadAll();

      } catch (err) {

        console.error(err);

        alert(
          "Cannot connect to backend"
        );
      }
    };


  // ==========================================================
  // DELETE ALTERNATIVE
  // ==========================================================

  const handleDeleteAlternative =
    async (altId) => {

      if (
        !window.confirm(
          "Remove this alternative?"
        )
      ) {
        return;
      }


      try {

        const response =
          await fetch(
            `${API_BASE}/alternatives/${altId}`,
            {
              method: "DELETE",
            }
          );


        if (!response.ok) {

          let data = {};

          try {
            data = await response.json();
          } catch {
            data = {};
          }


          alert(
            data.detail ||
            "Could not delete alternative"
          );

          return;
        }


        await loadAll();

      } catch (err) {

        console.error(err);

        alert(
          "Cannot connect to backend"
        );
      }
    };


  // ==========================================================
  // ADD COMMENT
  // ==========================================================

  const handleAddComment =
    async (e) => {

      e.preventDefault();


      if (!commentText.trim()) {
        return;
      }


      try {

        const response =
          await fetch(
            `${API_BASE}/decisions/${id}/comments`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                content:
                  commentText.trim(),

                is_meeting_note:
                  isMeetingNote ? 1 : 0,

                user_id:
                  user?.id,
              }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          alert(
            data.detail ||
            "Could not post comment"
          );

          return;
        }


        setCommentText("");
        setIsMeetingNote(false);

        await loadAll();

      } catch (err) {

        console.error(err);

        alert(
          "Cannot connect to backend"
        );
      }
    };


  // ==========================================================
  // FILE SELECT
  // ==========================================================

  const handleFileSelect =
    (e) => {

      const file =
        e.target.files?.[0];


      if (!file) {
        return;
      }


      setSelectedFile(file);

      setUploadMessage("");

      setUploadError("");
    };


  // ==========================================================
  // UPLOAD FILE
  // ==========================================================

  const handleUpload =
    async () => {

      if (!selectedFile) {

        setUploadError(
          "Please select a file first."
        );

        return;
      }


      try {

        setUploading(true);

        setUploadMessage("");

        setUploadError("");


        const formData =
          new FormData();


        formData.append(
          "file",
          selectedFile
        );


        const response =
          await fetch(
            `${API_BASE}/decisions/${id}/documents?user_id=${encodeURIComponent(
              user?.id || ""
            )}`,
            {
              method: "POST",
              body: formData,
            }
          );


        let data = {};

        try {

          data =
            await response.json();

        } catch {

          data = {};

        }


        if (!response.ok) {

          setUploadError(
            data.detail ||
            "Could not upload file."
          );

          setUploading(false);

          return;
        }


        setUploadMessage(
          `"${selectedFile.name}" uploaded successfully.`
        );


        setSelectedFile(null);


        const input =
          document.getElementById(
            "decision-file-input"
          );


        if (input) {
          input.value = "";
        }


        await loadAll();


        setUploading(false);

      } catch (err) {

        console.error(err);

        setUploadError(
          "Cannot connect to backend. Please make sure the server is running."
        );

        setUploading(false);
      }
    };


  // ==========================================================
  // REMOVE SELECTED FILE
  // ==========================================================

  const removeSelectedFile =
    () => {

      setSelectedFile(null);


      const input =
        document.getElementById(
          "decision-file-input"
        );


      if (input) {
        input.value = "";
      }


      setUploadMessage("");

      setUploadError("");
    };


  // ==========================================================
  // MARK COMPLETED
  // MANAGER ONLY
  // ==========================================================

  const handleMarkComplete =
    async () => {

      if (!isManager) {

        alert(
          "Only managers can complete a decision."
        );

        return;
      }


      if (!user?.id) {

        alert(
          "User session not found. Please login again."
        );

        return;
      }


      const finalDecision =
        window.prompt(
          "What was the final decision?"
        );


      if (!finalDecision?.trim()) {
        return;
      }


      try {

        const response =
          await fetch(
            `${API_BASE}/decisions/${id}?final_decision=${encodeURIComponent(
              finalDecision.trim()
            )}&user_id=${encodeURIComponent(
              user.id
            )}`,
            {
              method: "PUT",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          alert(
            data.detail ||
            "Could not complete decision"
          );

          return;
        }


        await loadAll();

      } catch (err) {

        console.error(err);

        alert(
          "Cannot connect to backend"
        );
      }
    };


  // ==========================================================
  // SAVE EDIT
  // MANAGER ONLY
  // ==========================================================

  const handleSaveEdit =
    async (e) => {

      e.preventDefault();


      if (!isManager) {

        setEditError(
          "Only managers can edit decisions."
        );

        return;
      }


      if (!user?.id) {

        setEditError(
          "User session not found. Please login again."
        );

        return;
      }


      setSavingEdit(true);

      setEditError("");


      try {

        const response =
          await fetch(
            `${API_BASE}/decisions/${id}/edit?user_id=${encodeURIComponent(
              user.id
            )}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                title:
                  editTitle.trim(),

                problem:
                  editProblem.trim(),

                reasoning:
                  editReasoning.trim(),

                category:
                  editCategory || null,
              }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          setEditError(
            data.detail ||
            "Could not save changes"
          );

          setSavingEdit(false);

          return;
        }


        setIsEditing(false);

        setSavingEdit(false);

        await loadAll();

      } catch (err) {

        console.error(err);

        setEditError(
          "Cannot connect to backend"
        );

        setSavingEdit(false);
      }
    };


  // ==========================================================
  // DELETE DECISION
  // MANAGER ONLY
  // ==========================================================

  const handleDeleteDecision =
    async () => {

      if (!isManager) {

        alert(
          "Only managers can delete decisions."
        );

        return;
      }


      if (!user?.id) {

        alert(
          "User session not found. Please login again."
        );

        return;
      }


      const confirmed =
        window.confirm(
          "Delete this decision permanently?\n\nAll alternatives, comments, documents and history associated with this decision will be deleted."
        );


      if (!confirmed) {
        return;
      }


      try {

        const response =
          await fetch(
            `${API_BASE}/decisions/${id}?user_id=${encodeURIComponent(
              user.id
            )}`,
            {
              method: "DELETE",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          alert(
            data.detail ||
            "Could not delete decision"
          );

          return;
        }


        navigate("/dashboard");

      } catch (err) {

        console.error(err);

        alert(
          "Cannot connect to backend"
        );
      }
    };


  // ==========================================================
  // SUBMIT FOR APPROVAL
  // EMPLOYEE ONLY
  // ==========================================================

  const handleSubmitForApproval = async () => {

    if (isManager) {
      alert(
        "Only employees can submit decisions for approval."
      );
      return;
    }

    if (!user?.id) {
      alert(
        "User session not found. Please login again."
      );
      return;
    }

    const confirmed = window.confirm(
      "Submit this decision for manager approval?\n\n" +
        "The decision will move to Under Review."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmittingApproval(true);
      setApprovalMessage("");

      // IMPORTANT: backend expects user_id as a QUERY PARAMETER
      const response = await fetch(
        `${API_BASE}/decisions/${id}/submit-approval?user_id=${encodeURIComponent(
          user.id
        )}`,
        {
          method: "POST",
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        alert(
          data.detail ||
            "Could not submit the decision for approval."
        );
        return;
      }

      setApprovalMessage(
        "Decision submitted successfully. It is now under manager review."
      );

      await loadAll();
    } catch (err) {
      console.error(err);

      alert(
        "Cannot connect to backend. Please make sure the server is running."
      );
    } finally {
      setSubmittingApproval(false);
    }
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="workspace">

        <div className="loading-screen">

          <div className="loading-spinner"></div>

          <h3>
            Loading decision...
          </h3>

          <p>
            Please wait
          </p>

        </div>

      </div>

    );
  }


  // ==========================================================
  // ERROR / ACCESS DENIED
  // ==========================================================

  if (error || !decision) {

    return (

      <div className="workspace">

        <div className="error-card">

          <div className="error-icon">
            !
          </div>

          <h2>
            {error ||
              "Decision not found"}
          </h2>

          <p
            style={{
              color: "#64748b",
              marginBottom: "20px",
            }}
          >
            If you are an employee, you can only
            access decisions created by you.
          </p>

          <Link
            to="/dashboard"
            className="primary-btn"
          >
            ← Back to Dashboard
          </Link>

        </div>

      </div>

    );
  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <div className="workspace">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="topbar">

        <div className="topbar-brand">

          <div className="topbar-logo">
            ED
          </div>

          <div>

            <h2>
              Expert Decision Replay
            </h2>

            <span className="brand-subtitle">
              Knowledge & Decision Intelligence Platform
            </span>

          </div>

        </div>


        <div className="topbar-user">

          <div className="user-avatar">
            {user?.name
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>


          <div className="user-info">

            <strong>
              {user?.name || "User"}
            </strong>

            <span>
              {user?.role || "Employee"}
            </span>

          </div>


          <Link
            to="/dashboard"
            className="header-dashboard-btn"
          >
            Dashboard
          </Link>

        </div>

      </div>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="detail-container">


        {/* BACK */}

        <Link
          className="back-link modern-back"
          to="/dashboard"
        >
          ← Back to Decisions
        </Link>


        {/* ===================================================
            DECISION HERO
            =================================================== */}

        {!isEditing && (

          <section className="decision-hero">

            <div className="decision-hero-content">

              <div className="badge-row">

                <span
                  className={statusClass(
                    decision.status
                  )}
                >
                  {decision.status ||
                    "Draft"}
                </span>


                {decision.category && (

                  <span className="category-badge">
                    {decision.category}
                  </span>

                )}

              </div>


              <span className="decision-number">
                DECISION #{decision.id}
              </span>


              <h1>
                {decision.title}
              </h1>


              <p className="hero-description">
                {decision.problem}
              </p>

            </div>


            {/* =================================================
                MANAGER ACTIONS
                ================================================= */}

            {isManager && (

              <div className="decision-actions">

                <button
                  className="secondary-btn"
                  onClick={() => {

                    setEditError("");

                    setIsEditing(true);

                  }}
                >
                  ✏ Edit
                </button>


                {decision.status !==
                  "Completed" && (

                  <button
                    className="complete-btn"
                    onClick={
                      handleMarkComplete
                    }
                  >
                    ✓ Mark Completed
                  </button>

                )}


                <button
                  className="delete-btn"
                  onClick={
                    handleDeleteDecision
                  }
                >
                  Delete
                </button>

              </div>

            )}

          </section>

        )}


        {/* ===================================================
            EMPLOYEE ACCESS MESSAGE
            =================================================== */}

        {!isManager && !isEditing && (

          <div
            style={{
              marginTop: "15px",
              marginBottom: "20px",
              padding: "13px 17px",
              borderRadius: "12px",
              background: "#f8fafc",
              border:
                "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            🔒 Employee access: You can view and
            collaborate on your own decision.
            Editing, completion and deletion are
            available only to managers.
          </div>

        )}


        {/* ===================================================
            SUBMIT FOR APPROVAL
            EMPLOYEE ONLY
            =================================================== */}

        {!isManager &&
          !isEditing &&
          (decision.status === "Draft" ||
            decision.status === "Rejected") && (
            <section
              className="workspace-card"
              style={{
                marginTop: "15px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span className="eyebrow">
                    APPROVAL WORKFLOW
                  </span>

                  <h3 style={{ margin: "6px 0" }}>
                    Ready for Manager Review?
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                    }}
                  >
                    Submit this decision to your manager for approval.
                  </p>
                </div>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={submittingApproval}
                >
                  {submittingApproval
                    ? "Submitting..."
                    : "✓ Submit for Approval"}
                </button>
              </div>

              {approvalMessage && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "12px 15px",
                    borderRadius: "10px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#166534",
                    fontSize: "13px",
                  }}
                >
                  ✓ {approvalMessage}
                </div>
              )}
            </section>
          )}


        {/* ===================================================
            EDIT FORM
            =================================================== */}

        {isEditing ? (

          <section className="workspace-card edit-card">

            <div className="card-heading">

              <div>

                <span className="eyebrow">
                  EDIT DECISION
                </span>

                <h2>
                  Update Decision
                </h2>

                <p>
                  Modify the information associated
                  with this decision.
                </p>

              </div>

            </div>


            <form
              onSubmit={
                handleSaveEdit
              }
            >


              <div className="form-group">

                <label>
                  Decision Title
                </label>

                <input
                  value={editTitle}
                  onChange={(e) =>
                    setEditTitle(
                      e.target.value
                    )
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select category
                  </option>

                  {CATEGORY_OPTIONS.map(
                    (category) => (

                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group">

                <label>
                  Problem Statement
                </label>

                <textarea
                  value={editProblem}
                  onChange={(e) =>
                    setEditProblem(
                      e.target.value
                    )
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Reasoning / Important Factors
                </label>

                <textarea
                  value={editReasoning}
                  onChange={(e) =>
                    setEditReasoning(
                      e.target.value
                    )
                  }
                  required
                />

              </div>


              {editError && (

                <div className="form-error">
                  {editError}
                </div>

              )}


              <div className="form-actions">

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? "Saving..."
                    : "Save Changes"}
                </button>


                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() =>
                    setIsEditing(false)
                  }
                  disabled={savingEdit}
                >
                  Cancel
                </button>

              </div>

            </form>

          </section>

        ) : (

          <>


            {/* =================================================
                SUMMARY
                ================================================= */}

            <section className="summary-section">

              <div className="section-heading center-heading">

                <span className="eyebrow">
                  DECISION SUMMARY
                </span>

                <h2>
                  Why this decision was made
                </h2>

                <p>
                  The key information and reasoning
                  behind this organizational decision.
                </p>

              </div>


              <div className="summary-grid">


                <div className="summary-box problem-box">

                  <div className="summary-icon">
                    ?
                  </div>

                  <div>

                    <span>
                      Problem Statement
                    </span>

                    <p>
                      {decision.problem}
                    </p>

                  </div>

                </div>


                <div className="summary-box reasoning-box">

                  <div className="summary-icon">
                    💡
                  </div>

                  <div>

                    <span>
                      Reasoning
                    </span>

                    <p>
                      {decision.reasoning}
                    </p>

                  </div>

                </div>


                {decision.final_decision && (

                  <div className="summary-box final-box">

                    <div className="summary-icon">
                      ✓
                    </div>

                    <div>

                      <span>
                        Final Decision
                      </span>

                      <p>
                        {decision.final_decision}
                      </p>

                    </div>

                  </div>

                )}

              </div>

            </section>


            {/* =================================================
                TABS
                ================================================= */}

            <section className="tabs-section">

              <div className="modern-tabs">


                {/* ALTERNATIVES */}

                <button
                  className={
                    tab === "alternatives"
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() =>
                    setTab(
                      "alternatives"
                    )
                  }
                >

                  <span>
                    ⚖
                  </span>

                  <div>

                    <strong>
                      Alternatives
                    </strong>

                    <small>
                      Compare options
                    </small>

                  </div>

                  <b>
                    {alternatives.length}
                  </b>

                </button>


                {/* DISCUSSION */}

                <button
                  className={
                    tab === "discussion"
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() =>
                    setTab(
                      "discussion"
                    )
                  }
                >

                  <span>
                    💬
                  </span>

                  <div>

                    <strong>
                      Discussion
                    </strong>

                    <small>
                      Team collaboration
                    </small>

                  </div>

                  <b>
                    {comments.length}
                  </b>

                </button>


                {/* DOCUMENTS */}

                <button
                  className={
                    tab === "documents"
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() =>
                    setTab(
                      "documents"
                    )
                  }
                >

                  <span>
                    📎
                  </span>

                  <div>

                    <strong>
                      Documents
                    </strong>

                    <small>
                      Supporting evidence
                    </small>

                  </div>

                  <b>
                    {documents.length}
                  </b>

                </button>


                {/* HISTORY */}

                <button
                  className={
                    tab === "history"
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() =>
                    setTab(
                      "history"
                    )
                  }
                >

                  <span>
                    ↻
                  </span>

                  <div>

                    <strong>
                      History
                    </strong>

                    <small>
                      Track changes
                    </small>

                  </div>

                  <b>
                    {history.length}
                  </b>

                </button>

              </div>


              {/* =================================================
                  TAB CONTENT
                  ================================================= */}

              <div className="workspace-card tab-content">


                {/* =================================================
                    ALTERNATIVES
                    ================================================= */}

                {tab === "alternatives" && (

                  <div>

                    <div className="section-heading">

                      <span className="eyebrow">
                        COMPARE OPTIONS
                      </span>

                      <h2>
                        Alternative Comparison
                      </h2>

                      <p>
                        Compare possible solutions
                        before making the final decision.
                      </p>

                    </div>


                    <form
                      className="alternative-form"
                      onSubmit={
                        handleAddAlternative
                      }
                    >

                      <div className="input-wrapper">

                        <label>
                          Option Name
                        </label>

                        <input
                          placeholder="e.g. React"
                          value={altName}
                          onChange={(e) =>
                            setAltName(
                              e.target.value
                            )
                          }
                        />

                      </div>


                      <div className="input-wrapper">

                        <label>
                          Pros / Cons / Notes
                        </label>

                        <input
                          placeholder="Advantages, disadvantages or notes"
                          value={altDesc}
                          onChange={(e) =>
                            setAltDesc(
                              e.target.value
                            )
                          }
                        />

                      </div>


                      <button
                        className="primary-btn"
                        type="submit"
                      >
                        + Add Option
                      </button>

                    </form>


                    {alternatives.length ===
                    0 ? (

                      <div className="empty-module">

                        <div className="empty-icon">
                          ⚖
                        </div>

                        <h3>
                          No alternatives added
                        </h3>

                        <p>
                          Add different options above
                          to compare them.
                        </p>

                      </div>

                    ) : (

                      <div className="alternative-grid">

                        {alternatives.map(
                          (
                            alternative,
                            index
                          ) => (

                            <div
                              className="alternative-card"
                              key={
                                alternative.id
                              }
                            >

                              <div className="alternative-top">

                                <div className="option-number">
                                  {String(
                                    index + 1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                                </div>


                                <button
                                  className="remove-btn"
                                  type="button"
                                  onClick={() =>
                                    handleDeleteAlternative(
                                      alternative.id
                                    )
                                  }
                                >
                                  ×
                                </button>

                              </div>


                              <span className="option-small">
                                OPTION{" "}
                                {index + 1}
                              </span>


                              <h3>
                                {
                                  alternative.name
                                }
                              </h3>


                              <div className="option-divider"></div>


                              <span className="option-label">
                                NOTES
                              </span>


                              <p>
                                {
                                  alternative.description ||
                                  "No additional notes provided."
                                }
                              </p>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                )}


                {/* =================================================
                    DISCUSSION
                    ================================================= */}

                {tab === "discussion" && (

                  <div>

                    <div className="section-heading">

                      <span className="eyebrow">
                        TEAM COLLABORATION
                      </span>

                      <h2>
                        Discussion
                      </h2>

                      <p>
                        Capture comments, ideas and
                        important meeting notes.
                      </p>

                    </div>


                    <form
                      className="discussion-form"
                      onSubmit={
                        handleAddComment
                      }
                    >

                      <textarea
                        placeholder="Share your thoughts, comments or meeting notes..."
                        value={commentText}
                        onChange={(e) =>
                          setCommentText(
                            e.target.value
                          )
                        }
                        rows={5}
                      />


                      <div className="discussion-actions">

                        <label className="meeting-check">

                          <input
                            type="checkbox"
                            checked={
                              isMeetingNote
                            }
                            onChange={(e) =>
                              setIsMeetingNote(
                                e.target.checked
                              )
                            }
                          />

                          <span>
                            Mark as meeting note
                          </span>

                        </label>


                        <button
                          className="primary-btn"
                          type="submit"
                        >
                          Post Comment
                        </button>

                      </div>

                    </form>


                    {comments.length ===
                    0 ? (

                      <div className="empty-module">

                        <div className="empty-icon">
                          💬
                        </div>

                        <h3>
                          No discussion yet
                        </h3>

                        <p>
                          Start a discussion around
                          this decision.
                        </p>

                      </div>

                    ) : (

                      <div className="discussion-list">

                        {comments.map(
                          (comment) => (

                            <div
                              className="comment-card"
                              key={
                                comment.id
                              }
                            >

                              <div className="comment-icon">

                                {comment.is_meeting_note
                                  ? "📝"
                                  : "💬"}

                              </div>


                              <div className="comment-body">

                                <div className="comment-top">

                                  <strong>

                                    {comment.is_meeting_note
                                      ? "Meeting Note"
                                      : "Team Comment"}

                                  </strong>


                                  <span>

                                    {comment.created_at
                                      ? new Date(
                                          comment.created_at
                                        ).toLocaleString()
                                      : ""}

                                  </span>

                                </div>


                                <p>
                                  {
                                    comment.content
                                  }
                                </p>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                )}


                {/* =================================================
                    DOCUMENTS
                    ================================================= */}

                {tab === "documents" && (

                  <div className="documents-module">

                    <div className="section-heading">

                      <span className="eyebrow">
                        DOCUMENT MANAGEMENT
                      </span>

                      <h2>
                        Supporting Documents
                      </h2>

                      <p>
                        Store important files, reports
                        and evidence related to this decision.
                      </p>

                    </div>


                    {/* UPLOAD CARD */}

                    <div className="document-upload-card">

                      <div className="document-upload-header">

                        <div className="document-upload-title">

                          <div className="document-upload-icon">
                            ↑
                          </div>

                          <div>

                            <h3>
                              Upload supporting file
                            </h3>

                            <p>
                              Add documents that help
                              explain or support this decision.
                            </p>

                          </div>

                        </div>

                      </div>


                      <label
                        className={
                          selectedFile
                            ? "upload-dropzone selected"
                            : "upload-dropzone"
                        }
                        htmlFor="decision-file-input"
                      >

                        <div className="upload-cloud-icon">
                          📁
                        </div>


                        <h3>

                          {selectedFile
                            ? "File selected"
                            : "Choose a file to upload"}

                        </h3>


                        <p>

                          {selectedFile
                            ? selectedFile.name
                            : "Click here to browse your computer"}

                        </p>


                        <span>
                          PDF, DOC, DOCX, XLS, XLSX,
                          PPT, PPTX, TXT, CSV and other files
                        </span>


                        <input
                          id="decision-file-input"
                          type="file"
                          onChange={
                            handleFileSelect
                          }
                        />

                      </label>


                      {/* SELECTED FILE */}

                      {selectedFile && (

                        <div className="selected-file-card">

                          <div className="selected-file-left">

                            <div className="selected-file-icon">
                              📄
                            </div>

                            <div>

                              <strong>
                                {
                                  selectedFile.name
                                }
                              </strong>

                              <span>

                                {(
                                  selectedFile.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB

                              </span>

                            </div>

                          </div>


                          <button
                            type="button"
                            className="remove-selected-file"
                            onClick={
                              removeSelectedFile
                            }
                          >
                            ×
                          </button>

                        </div>

                      )}


                      {/* UPLOAD BUTTON */}

                      <div className="upload-action-row">

                        <button
                          type="button"
                          className="primary-btn upload-main-btn"
                          onClick={
                            handleUpload
                          }
                          disabled={
                            uploading ||
                            !selectedFile
                          }
                        >

                          {uploading
                            ? "Uploading..."
                            : "↑ Upload File"}

                        </button>

                      </div>


                      {/* SUCCESS */}

                      {uploadMessage && (

                        <div className="upload-success">

                          <span>
                            ✓
                          </span>

                          <div>

                            <strong>
                              Upload successful
                            </strong>

                            <p>
                              {uploadMessage}
                            </p>

                          </div>

                        </div>

                      )}


                      {/* ERROR */}

                      {uploadError && (

                        <div className="upload-error">

                          <span>
                            !
                          </span>

                          <div>

                            <strong>
                              Upload failed
                            </strong>

                            <p>
                              {uploadError}
                            </p>

                          </div>

                        </div>

                      )}

                    </div>


                    {/* ATTACHED FILES */}

                    <div className="documents-list-section">

                      <div className="documents-list-header">

                        <div>

                          <span className="eyebrow">
                            ATTACHED FILES
                          </span>

                          <h3>
                            Decision Documents
                          </h3>

                        </div>


                        <div className="document-count">

                          {documents.length}

                          <span>

                            {documents.length ===
                            1
                              ? " file"
                              : " files"}

                          </span>

                        </div>

                      </div>


                      {documents.length ===
                      0 ? (

                        <div className="document-empty-state">

                          <div className="document-empty-icon">
                            📎
                          </div>

                          <h3>
                            No documents attached
                          </h3>

                          <p>
                            Upload reports,
                            presentations,
                            spreadsheets or
                            other evidence related
                            to this decision.
                          </p>


                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() =>
                              document
                                .getElementById(
                                  "decision-file-input"
                                )
                                ?.click()
                            }
                          >
                            + Select File
                          </button>

                        </div>

                      ) : (

                        <div className="document-list">

                          {documents.map(
                            (doc) => {

                              const extension =
                                doc.filename
                                  ?.split(".")
                                  .pop()
                                  ?.toLowerCase();


                              let fileType =
                                "FILE";


                              if (
                                extension ===
                                "pdf"
                              ) {

                                fileType =
                                  "PDF";

                              } else if (
                                [
                                  "doc",
                                  "docx",
                                ].includes(
                                  extension
                                )
                              ) {

                                fileType =
                                  "DOC";

                              } else if (
                                [
                                  "xls",
                                  "xlsx",
                                ].includes(
                                  extension
                                )
                              ) {

                                fileType =
                                  "XLS";

                              } else if (
                                [
                                  "ppt",
                                  "pptx",
                                ].includes(
                                  extension
                                )
                              ) {

                                fileType =
                                  "PPT";

                              } else if (
                                extension ===
                                "txt"
                              ) {

                                fileType =
                                  "TXT";

                              } else if (
                                extension ===
                                "csv"
                              ) {

                                fileType =
                                  "CSV";

                              }


                              return (

                                <div
                                  className="document-card premium-document-card"
                                  key={doc.id}
                                >

                                  <div className="document-icon-wrapper">

                                    <div className="document-icon">
                                      {fileType}
                                    </div>

                                  </div>


                                  <div className="document-info">

                                    <h3>
                                      {
                                        doc.filename
                                      }
                                    </h3>

                                    <p>
                                      Supporting document
                                    </p>


                                    {doc.uploaded_at && (

                                      <span>

                                        Uploaded{" "}
                                        {new Date(
                                          doc.uploaded_at
                                        ).toLocaleString()}

                                      </span>

                                    )}

                                  </div>


                                  <a
                                    className="download-btn premium-download-btn"
                                    href={`${API_BASE}/documents/${doc.id}/download`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >

                                    <span>
                                      ↓
                                    </span>

                                    Download

                                  </a>

                                </div>

                              );

                            }
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                )}


                {/* =================================================
                    HISTORY
                    ================================================= */}

                {tab === "history" && (

                  <div>

                    <div className="section-heading">

                      <span className="eyebrow">
                        AUDIT TRAIL
                      </span>

                      <h2>
                        Version History
                      </h2>

                      <p>
                        Track changes made to this
                        decision over time.
                      </p>

                    </div>


                    {history.length ===
                    0 ? (

                      <div className="empty-module">

                        <div className="empty-icon">
                          ↻
                        </div>

                        <h3>
                          No version history yet
                        </h3>

                        <p>
                          Changes to this decision
                          will appear here.
                        </p>

                      </div>

                    ) : (

                      <div className="timeline">

                        {history.map(
                          (
                            item,
                            index
                          ) => (

                            <div
                              className="timeline-item"
                              key={
                                item.id
                              }
                            >

                              <div className="timeline-dot">
                                {index + 1}
                              </div>


                              <div className="timeline-content">

                                <span className="history-label">
                                  VERSION UPDATE
                                </span>


                                <h3>
                                  {item.action}
                                </h3>


                                <p>
                                  {
                                    item.description
                                  }
                                </p>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                )}

              </div>

            </section>

          </>

        )}

      </main>

    </div>

  );
}


export default DecisionDetail;