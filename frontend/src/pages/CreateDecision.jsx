import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function CreateDecision() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Draft",
    priority: "Medium",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!formData.title.trim()) {
      setError("Decision title is required.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/decisions/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          priority: formData.priority,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create decision.");
      }

      navigate(`/decisions/${data.id}`);
    } catch (err) {
      console.error("Error creating decision:", err);
      setError(err.message || "Unable to create decision.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-decision-page">

      <section className="create-decision-header">
        <div>
          <span className="eyebrow">DECISION MANAGEMENT</span>

          <h1>Create Decision</h1>

          <p>
            Create a decision record that can be reviewed,
            compared and replayed later.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/decisions")}
        >
          ← Back to Decisions
        </button>
      </section>


      <section className="create-decision-card">

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="title">
              Decision Title <span>*</span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter the decision title"
              maxLength={200}
              disabled={loading}
            />
          </div>


          <div className="form-group">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the decision, its context and objective..."
              rows={6}
              disabled={loading}
            />
          </div>


          <div className="form-row">

            <div className="form-group">
              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>


            <div className="form-group">
              <label htmlFor="priority">
                Priority
              </label>

              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

          </div>


          <div className="form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/decisions")}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Decision"}
            </button>

          </div>

        </form>

      </section>

    </div>
  );
}

export default CreateDecision;