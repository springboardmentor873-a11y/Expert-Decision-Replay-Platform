import { useEffect, useState, useRef, type FormEvent, type DragEvent } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../lib/auth";
import {
  api,
  ApiError,
  humanFileSize,
  relativeTime,
  type Alternative,
  type Approval,
  type Comment,
  type Decision,
  type DiscussionThread,
  type Document,
  type MeetingNote,
  type Rationale,
  type ThreadReply,
  type TimelineEvent,
  type User,
} from "../lib/api";

type Tab =
  | "overview"
  | "alternatives"
  | "documents"
  | "discussion"
  | "comments"
  | "notes"
  | "rationale"
  | "approvals"
  | "versions"
  | "replay";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview",     label: "Overview" },
  { key: "alternatives", label: "Alternatives" },
  { key: "documents",    label: "Documents" },
  { key: "discussion",   label: "Discussion" },
  { key: "comments",     label: "Comments" },
  { key: "notes",        label: "Meeting Notes" },
  { key: "rationale",    label: "Rationale" },
  { key: "approvals",    label: "Approvals" },
  { key: "versions",     label: "Version History" },
  { key: "replay",       label: "Replay" },
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
      {tab === "alternatives" && <AlternativesTab decisionId={decisionId} canEdit={canEdit} />}
      {tab === "documents"    && <DocumentsTab decisionId={decisionId} />}
      {tab === "discussion"   && <DiscussionTab decisionId={decisionId} />}
      {tab === "comments"     && <CommentsTab decisionId={decisionId} />}
      {tab === "notes"        && <NotesTab decisionId={decisionId} />}
      {tab === "rationale"    && <RationaleTab decisionId={decisionId} />}
      {tab === "approvals"    && (
        <ApprovalsTab decisionId={decisionId} onChanged={loadDecision} />
      )}
      {tab === "versions"     && <VersionHistoryTab decisionId={decisionId} />}
      {tab === "replay"       && <ReplayTab decisionId={decisionId} />}
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
// Alternatives — with compare mode and mark-as-selected
// ---------------------------------------------------------------------
function AlternativesTab({ decisionId, canEdit }: { decisionId: number; canEdit: boolean }) {
  const [items, setItems] = useState<Alternative[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", pros: "", cons: "",
    estimated_cost: 0, feasibility_score: 3, risk_level: "Medium",
  });

  const load = () => {
    api.get<Alternative[]>(`/decisions/${decisionId}/alternatives`)
      .then(setItems)
      .catch((e) => setError(e.message));
  };
  useEffect(load, [decisionId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    try {
      await api.post(`/decisions/${decisionId}/alternatives`, form);
      setShowForm(false);
      setForm({ name: "", description: "", pros: "", cons: "", estimated_cost: 0, feasibility_score: 3, risk_level: "Medium" });
      load();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not add"); }
  };

  const remove = async (altId: number) => {
    try { await api.delete(`/alternatives/${altId}`); load(); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Delete failed"); }
  };

  const markSelected = async (altId: number) => {
    try { await api.patch<Alternative>(`/alternatives/${altId}/select`); load(); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Could not mark as selected"); }
  };

  const compareItems = items.filter((a) => selected.has(a.id));

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h3 className="section-title">Alternatives considered</h3>
        <div className="inline-actions">
          <button className="btn btn-secondary" onClick={() => { setCompareMode((v) => !v); setSelected(new Set()); }}>
            {compareMode ? "Exit Compare" : "⚖ Compare"}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add alternative"}
          </button>
        </div>
      </div>

      {/* Compare table */}
      {compareMode && compareItems.length >= 2 && (
        <div className="card compare-table-wrapper" style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 12px" }}>Side-by-side comparison</h4>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Criterion</th>
                {compareItems.map((a) => <th key={a.id}>{a.name}{a.is_selected && <span className="selected-alt-badge">✓ Selected</span>}</th>)}
              </tr>
            </thead>
            <tbody>
              {([
                ["Description",    (a: Alternative) => a.description],
                ["Cost",           (a: Alternative) => `$${a.estimated_cost.toLocaleString()}`],
                ["Feasibility",    (a: Alternative) => `${a.feasibility_score}/5`],
                ["Risk",           (a: Alternative) => a.risk_level],
                ["Pros",           (a: Alternative) => a.pros],
                ["Cons",           (a: Alternative) => a.cons],
              ] as [string, (a: Alternative) => string][]).map(([label, fn]) => (
                <tr key={label}>
                  <td style={{ fontWeight: 600, background: "var(--parchment)" }}>{label}</td>
                  {compareItems.map((a) => <td key={a.id}>{fn(a)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {compareMode && compareItems.length < 2 && (
        <div className="alert alert-info">Select 2 or more alternatives using the checkboxes to compare them.</div>
      )}

      {showForm && (
        <div className="card">
          <form onSubmit={submit}>
            <div className="field"><label>Name</label><input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="field"><label>Description</label><textarea required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="field-row">
              <div className="field"><label>Pros</label><input required value={form.pros} onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))} /></div>
              <div className="field"><label>Cons</label><input required value={form.cons} onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Estimated cost</label><input type="number" required value={form.estimated_cost} onChange={(e) => setForm((f) => ({ ...f, estimated_cost: Number(e.target.value) }))} /></div>
              <div className="field"><label>Feasibility (1-5)</label><input type="number" min={1} max={5} required value={form.feasibility_score} onChange={(e) => setForm((f) => ({ ...f, feasibility_score: Number(e.target.value) }))} /></div>
              <div className="field"><label>Risk level</label><select value={form.risk_level} onChange={(e) => setForm((f) => ({ ...f, risk_level: e.target.value }))}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
            </div>
            <button className="btn btn-primary" type="submit">Add alternative</button>
          </form>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="empty-state"><h3>No alternatives yet</h3><p>Add options to compare.</p></div>
      )}

      {items.map((alt) => (
        <div className="card" key={alt.id} style={{ borderLeft: alt.is_selected ? "3px solid var(--success)" : undefined }}>
          <div className="page-header" style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {compareMode && (
                <input type="checkbox" checked={selected.has(alt.id)}
                  onChange={(e) => setSelected((prev) => { const s = new Set(prev); e.target.checked ? s.add(alt.id) : s.delete(alt.id); return s; })} />
              )}
              <h3 className="section-title" style={{ margin: 0 }}>
                {alt.name}
                {alt.is_selected && <span className="selected-alt-badge" style={{ marginLeft: 8 }}>✓ Selected</span>}
              </h3>
            </div>
            <div className="inline-actions">
              {canEdit && !alt.is_selected && (
                <button className="btn btn-secondary btn-sm" onClick={() => markSelected(alt.id)}>Mark as selected</button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => remove(alt.id)}>Delete</button>
            </div>
          </div>
          <p>{alt.description}</p>
          <div className="field-row">
            <div><strong>Pros:</strong> {alt.pros}</div>
            <div><strong>Cons:</strong> {alt.cons}</div>
          </div>
          <p className="text-muted">Cost: ${alt.estimated_cost.toLocaleString()} · Feasibility: {alt.feasibility_score}/5 · Risk: {alt.risk_level}</p>
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
        </div>
      ))}
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
// Documents � drag-and-drop upload + list
// ---------------------------------------------------------------------
function DocumentsTab({ decisionId }: { decisionId: number }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileIcon = (ct: string) => {
    if (ct.includes("pdf")) return "??";
    if (ct.includes("image")) return "???";
    if (ct.includes("sheet") || ct.includes("csv")) return "??";
    if (ct.includes("word") || ct.includes("text")) return "??";
    return "??";
  };

  const load = () =>
    api.get<Document[]>(`/decisions/${decisionId}/documents`)
      .then(setDocs)
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, [decisionId]);

  const upload = async (file: File) => {
    setUploading(true); setError(null);
    try { await api.uploadFile(decisionId, file); load(); }
    catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const onDeleteDoc = async (docId: number) => {
    if (!confirm("Delete this document?")) return;
    try { await api.delete(`/documents/${docId}`); load(); }
    catch (e: any) { setError(e.message); }
  };

  const onDownload = async (doc: Document) => {
    try {
      const blob = await api.downloadBlob(`/documents/${doc.id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = doc.filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <div
        className={`upload-zone${dragOver ? " drag-over" : ""}`}
        style={{ marginBottom: 20 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-zone-icon">??</div>
        <p><strong>Click to upload</strong> or drag and drop a file here</p>
        <p style={{ fontSize: "0.78rem", marginTop: 6 }}>PDF, Word, Excel, PowerPoint, image, CSV � max 20 MB</p>
        <input
          ref={fileInputRef} type="file" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
      </div>
      {uploading && <div className="loading-row"><div className="spinner" /></div>}
      {docs.length === 0 && !uploading && (
        <div className="empty-state">
          <h3>No documents yet</h3>
          <p>Upload supporting files using the area above.</p>
        </div>
      )}
      {docs.map((doc) => (
        <div className="file-list-item" key={doc.id}>
          <div className="file-icon">{fileIcon(doc.content_type)}</div>
          <div className="file-info">
            <div className="file-name">{doc.filename}</div>
            <div className="file-meta">{humanFileSize(doc.file_size)} � {relativeTime(doc.created_at)}</div>
          </div>
          <div className="file-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => onDownload(doc)}>Download</button>
            {(doc.uploaded_by === user?.id || user?.role === "Administrator" || user?.role === "Manager") && (
              <button className="btn btn-danger btn-sm" onClick={() => onDeleteDoc(doc.id)}>Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Version History � list + diff view
// ---------------------------------------------------------------------
interface DecisionVersionType {
  id: number;
  decision_id: number;
  version_number: number;
  changed_by: number;
  title: string;
  problem_statement: string;
  category: string;
  status: string;
  created_at: string;
}

function VersionHistoryTab({ decisionId }: { decisionId: number }) {
  const [versions, setVersions] = useState<DecisionVersionType[]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DecisionVersionType[]>(`/decisions/${decisionId}/versions`)
      .then(setVersions)
      .catch((e) => setError(e.message));
  }, [decisionId]);

  const diffFields = ["title", "problem_statement", "category", "status"];
  const a = selected ? versions.find((v) => v.version_number === selected[0]) : null;
  const b = selected ? versions.find((v) => v.version_number === selected[1]) : null;

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {versions.length === 0 && (
        <div className="empty-state">
          <h3>No versions recorded yet</h3>
          <p>Every time this decision is edited, a snapshot is saved here.</p>
        </div>
      )}
      {versions.map((v, idx) => (
        <div className="version-item" key={v.id}>
          <div className="version-number">v{v.version_number}</div>
          <div className="version-body">
            <div className="version-title">{v.title}</div>
            <div className="version-meta">{new Date(v.created_at).toLocaleString()} � {v.status}</div>
            {idx > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 6, padding: "4px 0", color: "var(--brand)" }}
                onClick={() => setSelected([versions[idx - 1].version_number, v.version_number])}
              >
                Compare with v{versions[idx - 1].version_number}
              </button>
            )}
          </div>
        </div>
      ))}
      {selected && a && b && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">
            <span>Diff: v{a.version_number} vs v{b.version_number}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="diff-table">
            <div className="diff-row">
              <div className="diff-cell diff-header diff-field">Field</div>
              <div className="diff-cell diff-header diff-old">v{a.version_number}</div>
              <div className="diff-cell diff-header diff-new">v{b.version_number}</div>
            </div>
            {diffFields.map((field) => {
              const oldVal = (a as any)[field] ?? "";
              const newVal = (b as any)[field] ?? "";
              if (oldVal === newVal) return null;
              return (
                <div className="diff-row" key={field}>
                  <div className="diff-cell diff-field">{field.replace(/_/g, " ")}</div>
                  <div className="diff-cell diff-old">{oldVal}</div>
                  <div className="diff-cell diff-new">{newVal}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
