import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const API_URL = "http://127.0.0.1:8000";

function DecisionDetails() {
  const { decisionId } = useParams();
  const navigate = useNavigate();

  const [decision, setDecision] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [alternatives, setAlternatives] = useState([]);

const [files, setFiles] = useState([]);
const [discussions, setDiscussions] = useState([]);
const [discussionLoading, setDiscussionLoading] = useState(false);
const [discussionError, setDiscussionError] = useState("");
const [comment, setComment] = useState("");
const [commentSaving, setCommentSaving] = useState(false);
const [fileLoading, setFileLoading] = useState(false);
const [fileError, setFileError] = useState("");
const [selectedFile, setSelectedFile] = useState(null);

const [showEditForm, setShowEditForm] = useState(false);
const [editForm, setEditForm] = useState({
  title: "",
  description: "",
  status: "",
  priority: "",
});
const [editError, setEditError] = useState("");
const [editSaving, setEditSaving] = useState(false);

const [showAlternativeForm, setShowAlternativeForm] = useState(false);

const [alternativeForm, setAlternativeForm] = useState({
  name: "",
  description: "",
  pros: "",
  cons: "",
});

const [alternativeError, setAlternativeError] = useState("");
const [savingAlternative, setSavingAlternative] = useState(false);

useEffect(() => {
  fetchDecision();
  fetchAlternatives();
  fetchFiles();
  fetchDiscussions();
}, [decisionId]);

  // ==============================
  // FETCH DECISION
  // ==============================
  async function fetchDecision() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/decisions/${decisionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load decision"
        );
      }

      setDecision(data);
    } catch (err) {
      console.error("Error loading decision:", err);
      setError(
        err.message || "Unable to load decision."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // FETCH ALTERNATIVES
  // ==============================
  async function fetchAlternatives() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/decisions/${decisionId}/alternatives/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load alternatives"
        );
      }

      setAlternatives(data);
    } catch (err) {
      console.error(
        "Error loading alternatives:",
        err
      );
    }
  }

  // ==============================
// FETCH FILES
// ==============================
async function fetchFiles() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/");
    return;
  }

  setFileLoading(true);
  setFileError("");

  try {
    const response = await fetch(
      `${API_URL}/decisions/${decisionId}/files/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to load files"
      );
    }

    setFiles(data);
  } catch (err) {
    console.error("Error loading files:", err);
    setFileError(
      err.message || "Unable to load files."
    );
  } finally {
    setFileLoading(false);
  }
}

// ==============================
// FETCH DISCUSSIONS
// ==============================
async function fetchDiscussions() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/");
    return;
  }

  setDiscussionLoading(true);
  setDiscussionError("");

  try {
    const response = await fetch(
      `${API_URL}/decisions/${decisionId}/discussions/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to load discussions"
      );
    }
    console.log("Discussion API data:", data);

    setDiscussions(data);
  } catch (err) {
    console.error("Error loading discussions:", err);

    setDiscussionError(
      err.message || "Unable to load discussions."
    );
  } finally {
    setDiscussionLoading(false);
  }
}

// ==============================
// ADD DISCUSSION COMMENT
// ==============================
async function handleAddComment(event) {
  event.preventDefault();

  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/");
    return;
  }

  if (!comment.trim()) {
    setDiscussionError("Please enter a comment.");
    return;
  }

  setCommentSaving(true);
  setDiscussionError("");

  try {
    const response = await fetch(
      `${API_URL}/decisions/${decisionId}/discussions/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          comment: comment.trim(),
        }),
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to add comment"
      );
    }

await fetchDiscussions();

setComment("");
  } catch (err) {
    console.error("Error adding comment:", err);

    setDiscussionError(
      err.message || "Unable to add comment."
    );
  } finally {
    setCommentSaving(false);
  }
}

// ==============================
// UPLOAD FILE
// ==============================
async function handleFileUpload(event) {
  event.preventDefault();

  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/");
    return;
  }

  if (!selectedFile) {
    setFileError("Please select a file first.");
    return;
  }

  setFileLoading(true);
  setFileError("");

  try {
    const formData = new FormData();
    formData.append("uploaded_file", selectedFile);

    const response = await fetch(
      `${API_URL}/decisions/${decisionId}/files/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to upload file"
      );
    }

    setFiles((previous) => [
      ...previous,
      data,
    ]);

    setSelectedFile(null);

    event.target.reset();

  } catch (err) {
    console.error("Error uploading file:", err);

    setFileError(
      err.message || "Unable to upload file."
    );
  } finally {
    setFileLoading(false);
  }
}

  async function handleEditDecision(event) {
  event.preventDefault();

  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/");
    return;
  }

  if (!editForm.title.trim()) {
    setEditError("Decision title is required.");
    return;
  }

  setEditSaving(true);
  setEditError("");

  try {
    const response = await fetch(
      `${API_URL}/decisions/${decisionId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          status: editForm.status,
          priority: editForm.priority,
        }),
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to update decision."
      );
    }

    setDecision(data);

    setShowEditForm(false);

    setEditForm({
      title: data.title,
      description: data.description || "",
      status: data.status,
      priority: data.priority,
    });
  } catch (err) {
    console.error("Error updating decision:", err);

    setEditError(
      err.message || "Unable to update decision."
    );
  } finally {
    setEditSaving(false);
  }
}

  async function handleAddAlternative(event) {
  event.preventDefault();

  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/");
    return;
  }

  if (!alternativeForm.name.trim()) {
    setAlternativeError("Alternative name is required.");
    return;
  }

  setSavingAlternative(true);
  setAlternativeError("");

  try {
    const response = await fetch(
      `${API_URL}/decisions/${decisionId}/alternatives/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: alternativeForm.name.trim(),
          description:
            alternativeForm.description.trim() || null,
          pros: alternativeForm.pros.trim() || null,
          cons: alternativeForm.cons.trim() || null,
        }),
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to create alternative"
      );
    }

    // Add the newly created alternative immediately
    setAlternatives((previous) => [
      ...previous,
      data,
    ]);

    // Reset form
    setAlternativeForm({
      name: "",
      description: "",
      pros: "",
      cons: "",
    });

    setShowAlternativeForm(false);
  } catch (err) {
    console.error("Error creating alternative:", err);
    setAlternativeError(
      err.message || "Unable to create alternative."
    );
  } finally {
    setSavingAlternative(false);
  }
}

async function handleDeleteAlternative(alternativeId) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/decisions/${decisionId}/alternatives/${alternativeId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to delete alternative");
    }

    setAlternatives((currentAlternatives) =>
      currentAlternatives.filter(
        (alternative) => alternative.id !== alternativeId
      )
    );

  } catch (err) {
    console.error("Delete alternative error:", err);
    setError(err.message || "Unable to delete alternative.");
  }
}

async function handleDeleteFile(fileId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this file?"
  );

  if (!confirmed) {
    return;
  }

  const token = localStorage.getItem("access_token");

  if (!token) {
    alert("Your session has expired. Please login again.");
    navigate("/");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/decisions/${decisionId}/files/${fileId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/");
      return;
    }

    if (!response.ok) {
      console.error("Delete file error:", response.status, data);
      throw new Error(data.detail || "Unable to delete the file.");
    }

    // Remove deleted file immediately from the UI
    setFiles((previousFiles) =>
      previousFiles.filter((file) => file.id !== fileId)
    );

  } catch (error) {
    console.error("Delete file failed:", error);
    alert(error.message || "Unable to delete the file.");
  }
}

  // ==============================
  // LOADING
  // ==============================
  if (loading) {
    return <Loading message="Loading decision..." />;
  }

  // ==============================
  // ERROR
  // ==============================
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // ==============================
  // DECISION NOT FOUND
  // ==============================
  if (!decision) {
    return (
      <div className="empty-state">
        <h3>Decision not found</h3>

        <p>
          The requested decision could not be found.
        </p>

        <button
          className="primary-button"
          onClick={() => navigate("/decisions")}
        >
          Back to Decisions
        </button>
      </div>
    );
  }

  // ==============================
  // MAIN PAGE
  // ==============================
  return (
    <div className="decision-details-page">

      {/* =====================================
          PAGE HEADER
      ====================================== */}
      <section className="decision-details-header">

        <div>
          <span className="eyebrow">
            DECISION MANAGEMENT
          </span>

          <h1>{decision.title}</h1>

          <p>
            Review the decision details, supporting
            information and decision history.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/decisions")}
        >
          ← Back to Decisions
        </button>

      </section>


      {/* =====================================
          DECISION INFORMATION
      ====================================== */}
      <section className="decision-details-card">

        {/* TOP INFORMATION */}
        <div className="decision-details-top">

          <div>
            <span className="detail-label">
              Decision ID
            </span>

            <strong>
              #{decision.id}
            </strong>
          </div>

          <div className="decision-detail-badges">

            <span className="status-badge">
              {decision.status}
            </span>

            <span className="priority-badge">
              {decision.priority}
            </span>

          </div>

        </div>


        {/* DESCRIPTION */}
        <div className="decision-description">

          <span className="detail-label">
            Description
          </span>

          <p>
            {decision.description ||
              "No description available."}
          </p>

        </div>


        {/* INFORMATION GRID */}
        <div className="decision-info-grid">

          <div className="detail-item">
            <span className="detail-label">
              Status
            </span>

            <strong>
              {decision.status}
            </strong>
          </div>


          <div className="detail-item">
            <span className="detail-label">
              Priority
            </span>

            <strong>
              {decision.priority}
            </strong>
          </div>


          <div className="detail-item">
            <span className="detail-label">
              Owner ID
            </span>

            <strong>
              #{decision.owner_id}
            </strong>
          </div>


          <div className="detail-item">
            <span className="detail-label">
              Created
            </span>

            <strong>
              {decision.created_at
                ? new Date(
                    decision.created_at
                  ).toLocaleDateString()
                : "—"}
            </strong>
          </div>

        </div>


        {/* =====================================
            ACTIONS
        ====================================== */}
        <div className="decision-actions">

          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                `/decisions/${decisionId}/replay`
              )
            }
          >
            ↻ Replay Decision
          </button>


<button
  className="primary-button"
  onClick={() => {
    setEditForm({
      title: decision.title || "",
      description: decision.description || "",
      status: decision.status || "Draft",
      priority: decision.priority || "Medium",
    });

    setEditError("");
    setShowEditForm(true);
  }}
>
  Edit Decision
</button>

        </div>

        {showEditForm && (
  <form
    className="decision-edit-form"
    onSubmit={handleEditDecision}
  >
    <div className="decision-edit-header">
      <div>
        <span className="eyebrow">EDIT DECISION</span>

        <h2>Update Decision</h2>

        <p>
          Modify the decision details. Each update is
          recorded in the decision history.
        </p>
      </div>
    </div>

    {editError && (
      <div className="form-error">
        {editError}
      </div>
    )}

    <div className="form-group">
      <label htmlFor="edit-title">
        Decision Title *
      </label>

      <input
        id="edit-title"
        type="text"
        value={editForm.title}
        onChange={(event) =>
          setEditForm({
            ...editForm,
            title: event.target.value,
          })
        }
        placeholder="Enter decision title"
      />
    </div>

    <div className="form-group">
      <label htmlFor="edit-description">
        Description
      </label>

      <textarea
        id="edit-description"
        rows="4"
        value={editForm.description}
        onChange={(event) =>
          setEditForm({
            ...editForm,
            description: event.target.value,
          })
        }
        placeholder="Describe the decision..."
      />
    </div>

    <div className="decision-edit-grid">

      <div className="form-group">
        <label htmlFor="edit-status">
          Status
        </label>

        <select
          id="edit-status"
          value={editForm.status}
          onChange={(event) =>
            setEditForm({
              ...editForm,
              status: event.target.value,
            })
          }
        >
          <option value="Draft">Draft</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="edit-priority">
          Priority
        </label>

        <select
          id="edit-priority"
          value={editForm.priority}
          onChange={(event) =>
            setEditForm({
              ...editForm,
              priority: event.target.value,
            })
          }
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

    </div>

    <div className="decision-edit-actions">

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          setShowEditForm(false);
          setEditError("");
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="primary-button"
        disabled={editSaving}
      >
        {editSaving
          ? "Saving..."
          : "Save Changes"}
      </button>

    </div>
  </form>
)}


        {/* =====================================
            ALTERNATIVES
        ====================================== */}
        <section className="detail-section">

          {/* SECTION HEADER */}
          <div className="section-heading">

            <div>
              <span className="eyebrow">
                ALTERNATIVES
              </span>

              <h2>
                Available Alternatives
              </h2>

              <p>
                Compare the options considered for
                this decision.
              </p>
            </div>

<button
  className="primary-button"
  onClick={() => {
    setShowAlternativeForm((current) => !current);
    setAlternativeError("");
  }}
>
  {showAlternativeForm ? "Cancel" : "+ Add Alternative"}
</button>

          </div>

          {showAlternativeForm && (
  <form
    className="alternative-form"
    onSubmit={handleAddAlternative}
  >
    <div className="alternative-form-header">
      <div>
        <span className="eyebrow">
          NEW ALTERNATIVE
        </span>

        <h3>Add Decision Alternative</h3>

        <p>
          Add an option that can be considered for this decision.
        </p>
      </div>
    </div>

    {alternativeError && (
      <div className="error-message">
        {alternativeError}
      </div>
    )}

    <div className="form-group">
      <label htmlFor="alternative-name">
        Alternative Name *
      </label>

      <input
        id="alternative-name"
        type="text"
        value={alternativeForm.name}
        onChange={(event) =>
          setAlternativeForm({
            ...alternativeForm,
            name: event.target.value,
          })
        }
        placeholder="e.g. MySQL"
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor="alternative-description">
        Description
      </label>

      <textarea
        id="alternative-description"
        value={alternativeForm.description}
        onChange={(event) =>
          setAlternativeForm({
            ...alternativeForm,
            description: event.target.value,
          })
        }
        placeholder="Describe this alternative..."
        rows="3"
      />
    </div>

    <div className="alternative-form-grid">

      <div className="form-group">
        <label htmlFor="alternative-pros">
          Pros
        </label>

        <textarea
          id="alternative-pros"
          value={alternativeForm.pros}
          onChange={(event) =>
            setAlternativeForm({
              ...alternativeForm,
              pros: event.target.value,
            })
          }
          placeholder="Advantages of this option..."
          rows="4"
        />
      </div>

      <div className="form-group">
        <label htmlFor="alternative-cons">
          Cons
        </label>

        <textarea
          id="alternative-cons"
          value={alternativeForm.cons}
          onChange={(event) =>
            setAlternativeForm({
              ...alternativeForm,
              cons: event.target.value,
            })
          }
          placeholder="Disadvantages of this option..."
          rows="4"
        />
      </div>

    </div>

    <div className="alternative-form-actions">

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          setShowAlternativeForm(false);
          setAlternativeError("");
        }}
        disabled={savingAlternative}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="primary-button"
        disabled={savingAlternative}
      >
        {savingAlternative
          ? "Saving..."
          : "Save Alternative"}
      </button>

    </div>
  </form>
)}


          {/* ALTERNATIVE LIST */}
          <div className="alternative-grid">

            {alternatives.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No alternatives added
                </h3>

                <p>
                  Add alternatives to compare the
                  available options for this decision.
                </p>

              </div>

            ) : (

              alternatives.map((alternative) => (

  <article
    className="alternative-card"
    key={alternative.id}
  >

    <div className="alternative-header">

      <h3>
        {alternative.name}
      </h3>

      <button
        className="delete-alternative-button"
        onClick={() => handleDeleteAlternative(alternative.id)}
      >
        Delete
      </button>

    </div>


    <p className="alternative-description">
      {alternative.description ||
        "No description available"}
    </p>


    <div className="alternative-columns">

      {/* PROS */}
      <div>
        <span className="alternative-label">
          Pros
        </span>

        <p>
          {alternative.pros ||
            "No advantages recorded"}
        </p>
      </div>


      {/* CONS */}
      <div>
        <span className="alternative-label">
          Cons
        </span>

        <p>
          {alternative.cons ||
            "No disadvantages recorded"}
        </p>
      </div>

    </div>

  </article>

))

            )}

          </div>

        </section>

        {/* =====================================
            DOCUMENTS & FILES
        ====================================== */}
        <section className="detail-section">

          <div className="section-heading">

            <div>
              <span className="eyebrow">
                DOCUMENTS
              </span>

              <h2>
                Supporting Files
              </h2>

              <p>
                Upload and manage documents related to this decision.
              </p>
            </div>

          </div>

          {/* FILE UPLOAD */}
          <form
            className="file-upload-form"
            onSubmit={handleFileUpload}
          >

            <div className="file-upload-content">

              <div>
                <h3>
                  Upload Supporting File
                </h3>

                <p>
                  Attach reports, documents or other supporting information.
                </p>
              </div>

              <div className="file-upload-controls">

                <input
                  type="file"
                  onChange={(event) =>
                    setSelectedFile(event.target.files[0] || null)
                  }
                />

                <button
                  type="submit"
                  className="primary-button"
                  disabled={fileLoading}
                >
                  {fileLoading
                    ? "Uploading..."
                    : "Upload File"}
                </button>

              </div>

            </div>

          </form>

          {/* FILE ERROR */}
          {fileError && (
            <div className="error-message">
              {fileError}
            </div>
          )}

          {/* FILE LIST */}
<div className="uploaded-files-list">
  {files.length === 0 ? (
    <div className="empty-files-state">
      <div className="empty-file-icon">▱</div>
      <strong>No files uploaded</strong>
      <span>Supporting documents will appear here.</span>
    </div>
  ) : (
    files.map((file) => (
      <div className="uploaded-file-card" key={file.id}>
        <div className="uploaded-file-icon">
          📄
        </div>

        <div className="uploaded-file-info">
          <strong>{file.file_name}</strong>

          <div className="uploaded-file-meta">
            <span>{file.file_type || "Unknown file type"}</span>
            <span>•</span>
            <span>
              Uploaded{" "}
              {new Date(file.uploaded_at).toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="file-delete-button"
          onClick={() => handleDeleteFile(file.id)}
        >
          Delete
        </button>
      </div>
    ))
  )}
</div>

        </section>
                {/* =====================================
            DISCUSSIONS
        ====================================== */}
        <section className="detail-section">

          <div className="section-heading">

            <div>
              <span className="eyebrow">
                DISCUSSION
              </span>

              <h2>
                Decision Discussion
              </h2>

              <p>
                Share comments, questions and insights
                about this decision.
              </p>
            </div>

          </div>

          {/* DISCUSSION ERROR */}
          {discussionError && (
            <div className="error-message">
              {discussionError}
            </div>
          )}

          {/* ADD COMMENT */}
          <form
            className="discussion-form"
            onSubmit={handleAddComment}
          >

            <div className="form-group">

              <label htmlFor="decision-comment">
                Add a Comment
              </label>

              <textarea
                id="decision-comment"
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                placeholder="Write your comment or question..."
                rows="4"
              />

            </div>

            <div className="discussion-form-actions">

              <button
                type="submit"
                className="primary-button"
                disabled={commentSaving}
              >
                {commentSaving
                  ? "Posting..."
                  : "Post Comment"}
              </button>

            </div>

          </form>

          {/* DISCUSSION LIST */}
          <div className="discussion-list">

            {discussionLoading ? (

              <Loading message="Loading discussions..." />

            ) : discussions.length === 0 ? (

              <div className="empty-state">
                <div className="empty-icon">
                  💬
                </div>

                <h3>
                  No comments yet
                </h3>

                <p>
                  Start the discussion by adding
                  the first comment.
                </p>
              </div>

            ) : (

              discussions.map((discussion) => (

                <article
                  className="discussion-card"
                  key={discussion.id}
                >

                  <div className="discussion-header">

                    <div className="discussion-user">

<div className="discussion-avatar">
  👤
</div>

           <div className="discussion-meta">
  <strong>User #{discussion.user_id}</strong>
  <span className="discussion-date">
    {discussion.created_at
      ? new Date(discussion.created_at).toLocaleString()
      : "Date unavailable"}
  </span>
</div>

                    </div>

                  </div>

                  <p className="discussion-comment">
                    {discussion.comment}
                  </p>

                </article>

              ))

            )}

          </div>

        </section>

      </section>

    </div>
  );
}

export default DecisionDetails;