import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../lib/auth";
import { formatFileSize, timeAgo } from "../lib/format";
import {
  api,
  ApiError,
  API_URL,
  type Alternative,
  type Approval,
  type Comment,
  type Decision,
  type DecisionVersionEntry,
  type DiscussionThread,
  type DocumentEntry,
  type MeetingNote,
  type Rationale,
  type ThreadReply,
  type TimelineEvent,
  type User,
} from "../lib/api";

type Tab =
  | "overview"
  | "alternatives"
  | "discussion"
  | "comments"
  | "notes"
  | "rationale"
  | "documents"
  | "approvals"
  | "history"
  | "replay";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "alternatives", label: "Alternatives" },
  { key: "discussion", label: "Discussion" },
  { key: "comments", label: "Comments" },
  { key: "notes", label: "Meeting Notes" },
  { key: "rationale", label: "Rationale" },
  { key: "documents", label: "Documents" },
  { key: "approvals", label: "Approvals" },
  { key: "history", label: "Version History" },
  { key: "replay", label: "Replay" },
];

export function DecisionDetail() {
  const { id } = useParams();
  const decisionId = Number(id);
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDecision = () => {
    api
      .get<Decision>(`/decisions/${decisionId}`)
      .then(setDecision)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  };

  useEffect(() => {
    loadDecision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId]);

  if (error) {
    return (
      <AppLayout title="Decision">
        <div className="alert alert-error">{error}</div>
      </AppLayout>
    );
  }

  if (!decision) {
    return (
      <AppLayout title="Decision">
        <div className="loading-row">Loading…</div>
      </AppLayout>
    );
  }

  const isOwner = user?.id === decision.created_by;
  const canEdit = isOwner || user?.role === "Manager" || user?.role === "Administrator";

  return (
    <AppLayout title={decision.title}>
      <div className="page-header">
        <div>
          <h2>{decision.title}</h2>
          <p>
            <StatusBadge status={decision.status} /> &nbsp; {decision.category}
          </p>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab decision={decision} canEdit={canEdit} onUpdated={loadDecision} />
      )}
      {tab === "alternatives" && <AlternativesTab decisionId={decisionId} />}
      {tab === "discussion" && <DiscussionTab decisionId={decisionId} />}
      {tab === "comments" && <CommentsTab decisionId={decisionId} />}
      {tab === "notes" && <NotesTab decisionId={decisionId} />}
      {tab === "rationale" && <RationaleTab decisionId={decisionId} />}
      {tab === "documents" && <DocumentsTab decisionId={decisionId} />}
      {tab === "approvals" && (
        <ApprovalsTab decisionId={decisionId} onChanged={loadDecision} />
      )}
      {tab === "history" && <VersionHistoryTab decisionId={decisionId} />}
      {tab === "replay" && <ReplayTab decisionId={decisionId} />}
    </AppLayout>
  );
}

// ---------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------
function OverviewTab({
  decision,
  canEdit,
  onUpdated,
}: {
  decision: Decision;
  canEdit: boolean;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: decision.title,
    problem_statement: decision.problem_statement,
    category: decision.category,
    tags: decision.tags || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const locked = decision.status === "Approved" || decision.status === "Rejected";

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put(`/decisions/${decision.id}`, form);
      setEditing(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const moveToReview = async () => {
    setError(null);
    try {
      await api.patch(`/decisions/${decision.id}/status`, { status: "Under Review" });
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update status");
    }
  };

  if (editing) {
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="field">
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label>Problem statement</label>
            <textarea
              value={form.problem_statement}
              onChange={(e) => setForm((f) => ({ ...f, problem_statement: e.target.value }))}
              required
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Tags</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>
          </div>
          <div className="inline-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              Save changes
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card">
      {error && <div className="alert alert-error">{error}</div>}
      <h3 className="section-title">Problem statement</h3>
      <p>{decision.problem_statement}</p>
      {decision.tags && (
        <p className="text-muted">Tags: {decision.tags}</p>
      )}
      <div className="divider" />
      <div className="inline-actions">
        {canEdit && !locked && (
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>
            Edit decision
          </button>
        )}
        {canEdit && decision.status === "Draft" && (
          <button className="btn btn-primary" onClick={moveToReview}>
            Move to Under Review
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Alternatives
// ---------------------------------------------------------------------
function AlternativesTab({ decisionId }: { decisionId: number }) {
  const [items, setItems] = useState<Alternative[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    pros: "",
    cons: "",
    estimated_cost: 0,
    feasibility_score: 3,
    risk_level: "Medium",
  });

  const load = () => {
    api
      .get<Alternative[]>(`/decisions/${decisionId}/alternatives`)
      .then(setItems)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [decisionId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/decisions/${decisionId}/alternatives`, form);
      setShowForm(false);
      setForm({
        name: "",
        description: "",
        pros: "",
        cons: "",
        estimated_cost: 0,
        feasibility_score: 3,
        risk_level: "Medium",
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add alternative");
    }
  };

  const remove = async (altId: number) => {
    try {
      await api.delete(`/alternatives/${altId}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete");
    }
  };

  const selectAsPreferred = async (altId: number) => {
    try {
      await api.patch(`/alternatives/${altId}/select`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not mark as selected");
    }
  };

  const toggleCompareSelection = (altId: number) => {
    setSelectedIds((prev) =>
      prev.includes(altId) ? prev.filter((id) => id !== altId) : [...prev, altId]
    );
  };

  const comparedItems = items.filter((a) => selectedIds.includes(a.id));

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h3 className="section-title">Alternatives considered</h3>
        <div className="inline-actions">
          {items.length >= 2 && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCompareMode((c) => !c);
                setSelectedIds([]);
              }}
            >
              {compareMode ? "Exit compare" : "Compare"}
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add alternative"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={submit}>
            <div className="field">
              <label>Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Pros</label>
                <input
                  required
                  value={form.pros}
                  onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Cons</label>
                <input
                  required
                  value={form.cons}
                  onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Estimated cost</label>
                <input
                  type="number"
                  required
                  value={form.estimated_cost}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, estimated_cost: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="field">
                <label>Feasibility (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  required
                  value={form.feasibility_score}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, feasibility_score: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="field">
                <label>Risk level</label>
                <select
                  value={form.risk_level}
                  onChange={(e) => setForm((f) => ({ ...f, risk_level: e.target.value }))}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              Add alternative
            </button>
          </form>
        </div>
      )}

      {compareMode && comparedItems.length >= 2 && (
        <div className="card" style={{ overflowX: "auto" }}>
          <h3 className="section-title">Side-by-side comparison</h3>
          <table>
            <thead>
              <tr>
                <th>Criteria</th>
                {comparedItems.map((a) => (
                  <th key={a.id}>{a.name}{a.is_selected && " ★"}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><td>Estimated cost</td>{comparedItems.map((a) => <td key={a.id}>{a.estimated_cost}</td>)}</tr>
              <tr><td>Feasibility</td>{comparedItems.map((a) => <td key={a.id}>{a.feasibility_score}/5</td>)}</tr>
              <tr><td>Risk level</td>{comparedItems.map((a) => <td key={a.id}>{a.risk_level}</td>)}</tr>
              <tr><td>Pros</td>{comparedItems.map((a) => <td key={a.id}>{a.pros}</td>)}</tr>
              <tr><td>Cons</td>{comparedItems.map((a) => <td key={a.id}>{a.cons}</td>)}</tr>
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="empty-state">
          <h3>No alternatives yet</h3>
          <p>Add the options that were considered for this decision.</p>
        </div>
      )}

      {items.map((alt) => (
        <div className="card" key={alt.id}>
          <div className="page-header" style={{ marginBottom: 8 }}>
            <h3 className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              {compareMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(alt.id)}
                  onChange={() => toggleCompareSelection(alt.id)}
                />
              )}
              {alt.name}
              {alt.is_selected && <span className="badge badge-approved">Selected</span>}
            </h3>
            {!compareMode && (
              <div className="inline-actions">
                {!alt.is_selected && (
                  <button className="btn btn-secondary" onClick={() => selectAsPreferred(alt.id)}>
                    Mark as selected
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => remove(alt.id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
          <p>{alt.description}</p>
          <div className="field-row">
            <div>
              <strong>Pros:</strong> {alt.pros}
            </div>
            <div>
              <strong>Cons:</strong> {alt.cons}
            </div>
          </div>
          <p className="text-muted">
            Cost: {alt.estimated_cost} · Feasibility: {alt.feasibility_score}/5 · Risk:{" "}
            {alt.risk_level}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Discussion
// ---------------------------------------------------------------------
function DiscussionTab({ decisionId }: { decisionId: number }) {
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState<number | null>(null);

  const load = () => {
    api
      .get<DiscussionThread[]>(`/decisions/${decisionId}/discussion-threads`)
      .then(setThreads)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [decisionId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/decisions/${decisionId}/discussion-threads`, { title, content });
      setTitle("");
      setContent("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start thread");
    }
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <h3 className="section-title">Start a discussion thread</h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Title</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea required value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">
            Post thread
          </button>
        </form>
      </div>

      {threads.length === 0 && (
        <div className="empty-state">
          <h3>No discussion yet</h3>
        </div>
      )}

      {threads.map((t) => (
        <div className="card" key={t.id}>
          <h3 className="section-title">{t.title}</h3>
          <p>{t.content}</p>
          <button
            className="btn btn-secondary"
            onClick={() => setOpenThread(openThread === t.id ? null : t.id)}
          >
            {openThread === t.id ? "Hide replies" : "View replies"}
          </button>
          {openThread === t.id && <ThreadReplies threadId={t.id} />}
        </div>
      ))}
    </div>
  );
}

function ThreadReplies({ threadId }: { threadId: number }) {
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api
      .get<ThreadReply[]>(`/discussion-threads/${threadId}/replies`)
      .then(setReplies)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [threadId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/discussion-threads/${threadId}/replies`, { content });
      setContent("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reply");
    }
  };

  return (
    <div className="spacer-top">
      {error && <div className="alert alert-error">{error}</div>}
      {replies.map((r) => (
        <div className="comment" key={r.id}>
          {r.content}
        </div>
      ))}
      <form onSubmit={submit} style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--slate-300)",
            borderRadius: 4,
          }}
          placeholder="Write a reply…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button className="btn btn-secondary" type="submit">
          Reply
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------
function CommentsTab({ decisionId }: { decisionId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api
      .get<Comment[]>(`/decisions/${decisionId}/comments`)
      .then(setComments)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [decisionId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/decisions/${decisionId}/comments`, { content });
      setContent("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add comment");
    }
  };

  return (
    <div className="card">
      {error && <div className="alert alert-error">{error}</div>}
      {comments.length === 0 && <p className="text-muted">No comments yet.</p>}
      {comments.map((c) => (
        <div className="comment" key={c.id}>
          <div className="comment-meta">{new Date(c.created_at).toLocaleString()}</div>
          <div>{c.content}</div>
        </div>
      ))}
      <form onSubmit={submit} className="spacer-top" style={{ display: "flex", gap: 8 }}>
        <input
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--slate-300)",
            borderRadius: 4,
          }}
          placeholder="Add a comment…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit">
          Comment
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------
// Meeting Notes
// ---------------------------------------------------------------------
function NotesTab({ decisionId }: { decisionId: number }) {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api
      .get<MeetingNote[]>(`/decisions/${decisionId}/meeting-notes`)
      .then(setNotes)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [decisionId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/decisions/${decisionId}/meeting-notes`, { content });
      setContent("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add note");
    }
  };

  return (
    <div className="card">
      {error && <div className="alert alert-error">{error}</div>}
      {notes.length === 0 && <p className="text-muted">No meeting notes yet.</p>}
      {notes.map((n) => (
        <div className="comment" key={n.id}>
          {n.content}
        </div>
      ))}
      <form onSubmit={submit} className="spacer-top">
        <div className="field">
          <label>Add meeting note</label>
          <textarea required value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit">
          Save note
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------
// Rationale
// ---------------------------------------------------------------------
function RationaleTab({ decisionId }: { decisionId: number }) {
  const [rationale, setRationale] = useState<Rationale | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = () => {
    api
      .get<Rationale>(`/decisions/${decisionId}/rationale`)
      .then((r) => {
        setRationale(r);
        setContent(r.content);
      })
      .catch(() => setRationale(null))
      .finally(() => setLoaded(true));
  };

  useEffect(load, [decisionId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (rationale) {
        await api.put(`/decisions/${decisionId}/rationale`, { content });
      } else {
        await api.post(`/decisions/${decisionId}/rationale`, { content });
      }
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save rationale");
    }
  };

  if (!loaded) return <div className="loading-row">Loading…</div>;

  return (
    <div className="card">
      {error && <div className="alert alert-error">{error}</div>}
      <h3 className="section-title">
        {rationale ? "Decision rationale" : "Record the rationale"}
      </h3>
      <form onSubmit={submit}>
        <div className="field">
          <textarea
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Why was this decision made? What evidence, assumptions and risks were considered?"
          />
        </div>
        <button className="btn btn-primary" type="submit">
          {rationale ? "Update rationale" : "Save rationale"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------
function ApprovalsTab({
  decisionId,
  onChanged,
}: {
  decisionId: number;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [reviewerId, setReviewerId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canAssign = user?.role === "Manager" || user?.role === "Administrator";

  const load = () => {
    api
      .get<Approval[]>(`/approvals?decision_id=${decisionId}`)
      .then(setApprovals)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [decisionId]);

  useEffect(() => {
    if (canAssign) {
      api
        .get<User[]>("/users?role=Reviewer")
        .then(setReviewers)
        .catch(() => setReviewers([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAssign]);

  const assign = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!reviewerId) return;
    try {
      await api.post("/approvals", {
        decision_id: decisionId,
        reviewer_id: reviewerId,
        approval_level: 1,
      });
      setSuccess("Reviewer assigned. Decision moved to Under Review.");
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not assign reviewer");
    }
  };

  const decide = async (approvalId: number, decision: "Approved" | "Rejected") => {
    setError(null);
    try {
      await api.patch(`/approvals/${approvalId}`, { status: decision });
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update approval");
    }
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {canAssign && (
        <div className="card">
          <h3 className="section-title">Assign a reviewer</h3>
          <form onSubmit={assign} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Reviewer</label>
              <select
                required
                value={reviewerId}
                onChange={(e) => setReviewerId(Number(e.target.value))}
              >
                <option value="">Select a reviewer…</option>
                {reviewers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} ({r.department})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">
              Request approval
            </button>
          </form>
        </div>
      )}

      {approvals.length === 0 && (
        <div className="empty-state">
          <h3>No approval requests yet</h3>
        </div>
      )}

      {approvals.map((a) => (
        <div className="card" key={a.id}>
          <div className="page-header" style={{ marginBottom: 8 }}>
            <div>
              <strong>Approval level {a.approval_level}</strong>
              <p className="text-muted" style={{ margin: 0 }}>
                Assigned {new Date(a.assigned_at).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
          {user?.id === a.reviewer_id && a.status === "Pending" && (
            <div className="inline-actions">
              <button className="btn btn-primary" onClick={() => decide(a.id, "Approved")}>
                Approve
              </button>
              <button className="btn btn-danger" onClick={() => decide(a.id, "Rejected")}>
                Reject
              </button>
            </div>
          )}
          {canAssign && a.status === "Pending" && (
            <EscalateControl approvalId={a.id} currentReviewerId={a.reviewer_id} onEscalated={() => { load(); onChanged(); }} />
          )}
        </div>
      ))}
    </div>
  );
}

function EscalateControl({
  approvalId,
  currentReviewerId,
  onEscalated,
}: {
  approvalId: number;
  currentReviewerId: number;
  onEscalated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [newReviewerId, setNewReviewerId] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      api.get<User[]>("/users?role=Reviewer").then(setReviewers).catch(() => {});
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newReviewerId) return;
    try {
      await api.post(`/approvals/${approvalId}/escalate`, {
        new_reviewer_id: newReviewerId,
        reason: reason || undefined,
      });
      setOpen(false);
      onEscalated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not escalate");
    }
  };

  if (!open) {
    return (
      <div className="inline-actions spacer-top">
        <button className="btn btn-secondary" onClick={() => setOpen(true)}>
          Escalate to another reviewer
        </button>
      </div>
    );
  }

  return (
    <div className="spacer-top">
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
          <label>Escalate to</label>
          <select required value={newReviewerId} onChange={(e) => setNewReviewerId(Number(e.target.value))}>
            <option value="">Select a reviewer…</option>
            {reviewers.filter((r) => r.id !== currentReviewerId).map((r) => (
              <option key={r.id} value={r.id}>{r.full_name} ({r.department})</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
          <label>Reason (optional)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Out of office" />
        </div>
        <button className="btn btn-primary" type="submit">Escalate</button>
        <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------
// Replay
// ---------------------------------------------------------------------
function ReplayTab({ decisionId }: { decisionId: number }) {
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ timeline: TimelineEvent[] }>(`/decisions/${decisionId}/replay`)
      .then((r) => setTimeline(r.timeline))
      .catch((e) => setError(e.message));
  }, [decisionId]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!timeline) return <div className="loading-row">Reconstructing timeline…</div>;

  return (
    <div className="card">
      <h3 className="section-title">How this decision evolved</h3>
      <div className="timeline">
        {timeline.map((event, idx) => (
          <div className="timeline-item" key={idx}>
            <div className="timeline-time">{new Date(event.timestamp).toLocaleString()}</div>
            <div className="timeline-summary">{event.summary}</div>
            {event.actor && <div className="timeline-actor">{event.actor}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------
function DocumentsTab({ decisionId }: { decisionId: number }) {
  const [docs, setDocs] = useState<DocumentEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    api
      .get<DocumentEntry[]>(`/decisions/${decisionId}/documents`)
      .then(setDocs)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [decisionId]);

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("edrp_token");
      const res = await fetch(`${API_URL}/decisions/${decisionId}/documents`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || "Upload failed");
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const download = async (doc: DocumentEntry) => {
    try {
      const blob = await api.downloadBlob(`/documents/${doc.id}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    }
  };

  const remove = async (docId: number) => {
    try {
      await api.delete(`/documents/${docId}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete");
    }
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      <div
        className="card"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        style={{
          textAlign: "center",
          border: `2px dashed ${dragOver ? "var(--brass-dark)" : "var(--slate-300)"}`,
          background: dragOver ? "var(--brass-tint)" : "var(--paper)",
          padding: "32px 20px",
        }}
      >
        <p className="text-muted" style={{ marginBottom: 10 }}>
          {uploading ? "Uploading…" : "Drag and drop a file here, or"}
        </p>
        <label className="btn btn-primary" style={{ cursor: "pointer" }}>
          Browse files
          <input
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
        </label>
        <p className="text-muted" style={{ fontSize: "0.76rem", marginTop: 10 }}>
          PDF, Word, Excel, PowerPoint, images, text — up to 20MB
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="empty-state">
          <h3>No documents yet</h3>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.filename}</td>
                  <td>{formatFileSize(d.file_size)}</td>
                  <td>{timeAgo(d.created_at)}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-secondary" onClick={() => download(d)}>Download</button>
                      <button className="btn btn-secondary" onClick={() => remove(d.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Version History
// ---------------------------------------------------------------------
function VersionHistoryTab({ decisionId }: { decisionId: number }) {
  const [versions, setVersions] = useState<DecisionVersionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<number | "">("");
  const [compareB, setCompareB] = useState<number | "">("");
  const [diff, setDiff] = useState<Record<string, { version_a: string; version_b: string }> | null>(null);

  useEffect(() => {
    api
      .get<DecisionVersionEntry[]>(`/decisions/${decisionId}/history`)
      .then(setVersions)
      .catch((e) => setError(e.message));
  }, [decisionId]);

  const runCompare = async () => {
    if (!compareA || !compareB) return;
    setError(null);
    try {
      const result = await api.get<{ differences: Record<string, { version_a: string; version_b: string }> }>(
        `/decisions/${decisionId}/versions/compare?version_a=${compareA}&version_b=${compareB}`
      );
      setDiff(result.differences);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not compare versions");
    }
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {versions.length === 0 ? (
        <div className="empty-state">
          <h3>No edits recorded yet</h3>
          <p>Every time this decision is edited, a version snapshot is kept here.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h3 className="section-title">Compare two versions</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Version A</label>
                <select value={compareA} onChange={(e) => setCompareA(Number(e.target.value))}>
                  <option value="">Select…</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.version_number}>v{v.version_number}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Version B</label>
                <select value={compareB} onChange={(e) => setCompareB(Number(e.target.value))}>
                  <option value="">Select…</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.version_number}>v{v.version_number}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={runCompare}>Compare</button>
            </div>

            {diff && (
              <div className="spacer-top">
                {Object.keys(diff).length === 0 ? (
                  <p className="text-muted">No differences between these versions.</p>
                ) : (
                  <table>
                    <thead>
                      <tr><th>Field</th><th>Version A</th><th>Version B</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(diff).map(([field, values]) => (
                        <tr key={field}>
                          <td>{field}</td>
                          <td>{values.version_a}</td>
                          <td>{values.version_b}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="section-title">All versions</h3>
            <table>
              <thead>
                <tr><th>Version</th><th>Title</th><th>Status</th><th>Changed</th></tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id}>
                    <td>v{v.version_number}</td>
                    <td>{v.title}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td>{timeAgo(v.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
