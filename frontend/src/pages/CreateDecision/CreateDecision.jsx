import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  addAlternative,
  createDecision,
  uploadAttachment,
} from "../../services/decision";
import "./CreateDecision.css";

const EMPTY_ALTERNATIVE = { title: "", pros: "", cons: "", estimated_cost: "" };

export default function CreateDecision() {
  const { tokens } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [alternatives, setAlternatives] = useState([{ ...EMPTY_ALTERNATIVE }]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateAlternative(index, field, value) {
    setAlternatives((prev) =>
      prev.map((alt, i) => (i === index ? { ...alt, [field]: value } : alt))
    );
  }

  function addAlternativeRow() {
    setAlternatives((prev) => [...prev, { ...EMPTY_ALTERNATIVE }]);
  }

  function removeAlternativeRow(index) {
    setAlternatives((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const decision = await createDecision(
        { title, category: category || null, problem_statement: problemStatement },
        tokens.access_token
      );

      // Only save alternatives that actually have a title filled in —
      // empty rows are just left over from the form, not real options.
      const alternativesToSave = alternatives.filter((alt) => alt.title.trim());
      for (const alt of alternativesToSave) {
        await addAlternative(
          decision.id,
          {
            title: alt.title,
            pros: alt.pros || null,
            cons: alt.cons || null,
            estimated_cost: alt.estimated_cost ? Number(alt.estimated_cost) : null,
          },
          tokens.access_token
        );
      }
      if (selectedFile) {
       await uploadAttachment(
       decision.id,
       selectedFile,
       tokens.access_token
       );
      }

      navigate(`/decisions/${decision.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="create-decision">
        <p className="create-decision__eyebrow">New record</p>
        <h1 className="create-decision__title">Create a decision</h1>
        <p className="create-decision__subtitle">
          Starts as a Draft. You can keep editing until you submit it for review.
        </p>

        {error && <div className="create-decision__error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-decision__form">
          <section className="form-section">
            <label className="field">
              <span className="field__label">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Choose a CI provider"
                required
              />
            </label>

            <label className="field">
              <span className="field__label">Category (optional)</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Tooling, Hiring, Budget"
              />
            </label>

            <label className="field">
              <span className="field__label">Problem statement</span>
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="What are we actually trying to solve?"
                rows={4}
                required
              />
            </label>
          </section>

          <section className="form-section">
            <div className="form-section__header">
              <span className="field__label">Alternatives (optional)</span>
              <p className="form-section__hint">Add the options you're weighing. You can add more later.</p>
            </div>

            {alternatives.map((alt, index) => (
              <div className="alternative-row" key={index}>
                <div className="alternative-row__header">
                  <span className="alternative-row__number">Option {index + 1}</span>
                  {alternatives.length > 1 && (
                    <button
                      type="button"
                      className="alternative-row__remove"
                      onClick={() => removeAlternativeRow(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Option title"
                  value={alt.title}
                  onChange={(e) => updateAlternative(index, "title", e.target.value)}
                  className="alternative-row__title-input"
                />

                <div className="alternative-row__grid">
                  <textarea
                    placeholder="Pros"
                    value={alt.pros}
                    onChange={(e) => updateAlternative(index, "pros", e.target.value)}
                    rows={2}
                  />
                  <textarea
                    placeholder="Cons"
                    value={alt.cons}
                    onChange={(e) => updateAlternative(index, "cons", e.target.value)}
                    rows={2}
                  />
                </div>

                <input
                  type="number"
                  placeholder="Estimated cost (optional)"
                  value={alt.estimated_cost}
                  onChange={(e) => updateAlternative(index, "estimated_cost", e.target.value)}
                  min="0"
                  step="0.01"
                  className="alternative-row__cost-input"
                />
              </div>
            ))}

            <button
  type="button"
  className="add-alternative-button"
  onClick={addAlternativeRow}
>
  + Add another option
</button>
</section>

{/* Attachment section */}
<section className="form-section">
  <div className="form-section__header">
    <span className="field__label">Attachment</span>
    <p className="form-section__hint">
      Upload a supporting document.
    </p>
  </div>

  <input
    type="file"
    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
  />

  {selectedFile && (
    <p>Selected: {selectedFile.name}</p>
  )}
</section>

{/* Submit button */}
<div className="create-decision__actions">
  <button
    type="submit"
    className="create-decision__submit"
    disabled={submitting}
  >
    {submitting ? "Creating…" : "Create decision"}
  </button>
</div>
        </form>
      </main>
    </div>
  );
}
