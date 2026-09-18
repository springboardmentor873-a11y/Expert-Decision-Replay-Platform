import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getDecision,
  submitDecision,
  deleteDecision,
  archiveDecision,
  unarchiveDecision,
} from '../services/decisionService';
import {
  getAlternatives,
  createAlternative,
  updateAlternative,
  deleteAlternative,
} from '../services/alternativeService';
import {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from '../services/documentService';
import {
  getMeetingNotes,
  createMeetingNote,
  deleteMeetingNote,
} from '../services/meetingNoteService';
import {
  getApprovalWorkflows,
  createApprovalWorkflow,
  takeApprovalStepAction,
  escalateApprovalWorkflow,
} from '../services/approvalWorkflowService';
import { getUserRoster } from '../services/userService';

import { DecisionStatusBadge } from '../components/DecisionStatusBadge';
import { AlternativeComparisonTable } from '../components/AlternativeComparisonTable';
import { AlternativeModal } from '../components/AlternativeModal';
import { DocumentUpload } from '../components/DocumentUpload';
import { DocumentList } from '../components/DocumentList';
import { DiscussionSection } from '../components/DiscussionSection';
import { VersionHistory } from '../components/VersionHistory';
import ApprovalActions from '../components/ApprovalActions';
import ApprovalHistory from '../components/ApprovalHistory';
import {
  ArrowLeft,
  Edit3,
  Send,
  Trash2,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  TrendingUp,
  Loader2,
  Layers,
  PlusCircle,
  Sparkles,
  Paperclip,
  Archive,
  RotateCcw,
  Folder,
  Tag as TagIcon,
  Users,
  CheckSquare,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';

export const DecisionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [decision, setDecision] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalRefresh, setApprovalRefresh] = useState(0);

  // Alternative Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Document Upload & Action States
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docActionLoadingId, setDocActionLoadingId] = useState(null);

  // Meeting Note Modal State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: '',
    meeting_date: new Date().toISOString().slice(0, 16),
    attendees: '',
    notes: '',
    action_items: '',
  });
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Multi-Level Workflow State & Modals
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [rosterUsers, setRosterUsers] = useState([]);
  const [workflowTitle, setWorkflowTitle] = useState('Standard Multi-Level Architecture Review');
  const [workflowSteps, setWorkflowSteps] = useState([
    { step_number: 1, step_name: 'Technical Peer Review', reviewer_id: '', due_date: '' },
    { step_number: 2, step_name: 'Architecture Board Review', reviewer_id: '', due_date: '' },
  ]);
  const [workflowSubmitting, setWorkflowSubmitting] = useState(false);

  // Workflow Step Action Modal
  const [activeStepActionModal, setActiveStepActionModal] = useState(null); // { workflowId, step }
  const [stepActionType, setStepActionType] = useState('Approved');
  const [stepActionComments, setStepActionComments] = useState('');
  const [stepActionSubmitting, setStepActionSubmitting] = useState(false);

  const fetchDecisionDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDecision(id);
      setDecision(data);

      // Load supporting sub-resources in parallel
      const [alts, docs, notes, wfs] = await Promise.all([
        getAlternatives(id).catch(() => data.alternatives || []),
        getDocuments(id).catch(() => data.documents || []),
        getMeetingNotes(id).catch(() => []),
        getApprovalWorkflows(id).catch(() => []),
      ]);

      setAlternatives(alts || []);
      setDocuments(docs || []);
      setMeetingNotes(notes || []);
      setWorkflows(wfs || []);
    } catch (err) {
      setError(err.message || 'Failed to load decision details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisionDetails();
  }, [id]);

  const isArchived = decision?.status === 'Archived';
  const isDraft = decision?.status === 'Draft';
  const isOwner = user && decision && decision.created_by === user.id;
  const isAdmin = user?.role?.name?.toLowerCase() === 'administrator';
  const isManager = user?.role?.name?.toLowerCase() === 'manager';
  const isReviewer = user?.role?.name?.toLowerCase() === 'reviewer';
  const canEdit = (isOwner || isAdmin) && !isArchived;
  const canSubmit = isDraft && canEdit;
  const canDelete = (isOwner && isDraft) || isAdmin;
  const canReview = (isReviewer || isManager || isAdmin) && !isArchived && decision?.status === 'Submitted';
  const canEditAlternatives = (isOwner || isAdmin) && !isArchived && isDraft;
  const canUploadDocuments = !isArchived && ((isOwner && isDraft) || isAdmin || canReview);
  const canDeleteDocuments = !isArchived && (isOwner || isAdmin);

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit this draft decision for review? Once submitted, core fields will be locked.')) {
      return;
    }

    setActionLoading(true);
    try {
      const updated = await submitDecision(id);
      setDecision(updated);
    } catch (err) {
      alert(err.message || 'Failed to submit decision.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this decision? Archived decisions become read-only.')) {
      return;
    }

    setActionLoading(true);
    try {
      const updated = await archiveDecision(id);
      setDecision(updated);
    } catch (err) {
      alert(err.message || 'Failed to archive decision.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnarchive = async () => {
    if (!window.confirm('Unarchive this decision? It will be restored to Draft status for active management.')) {
      return;
    }

    setActionLoading(true);
    try {
      const updated = await unarchiveDecision(id);
      setDecision(updated);
    } catch (err) {
      alert(err.message || 'Failed to unarchive decision.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this decision, its alternatives, and attached documents? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteDecision(id);
      navigate('/decisions');
    } catch (err) {
      alert(err.message || 'Failed to delete decision.');
      setActionLoading(false);
    }
  };

  // Alternatives Handlers
  const handleOpenAddModal = () => {
    setSelectedAlternative(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (alt) => {
    setSelectedAlternative(alt);
    setModalOpen(true);
  };

  const handleSaveAlternative = async (altPayload) => {
    setModalLoading(true);
    try {
      if (selectedAlternative) {
        await updateAlternative(id, selectedAlternative.id, altPayload);
      } else {
        await createAlternative(id, altPayload);
      }
      setModalOpen(false);
      setSelectedAlternative(null);
      const updatedAlts = await getAlternatives(id);
      setAlternatives(updatedAlts);
    } catch (err) {
      alert(err.message || 'Failed to save alternative evaluation.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteAlternative = async (altId) => {
    if (!window.confirm('Are you sure you want to delete this alternative evaluation?')) {
      return;
    }

    try {
      await deleteAlternative(id, altId);
      setAlternatives(prev => prev.filter(a => a.id !== altId));
    } catch (err) {
      alert(err.message || 'Failed to delete alternative.');
    }
  };

  // Document Handlers
  const handleUploadDocument = async (file) => {
    setUploadingDoc(true);
    try {
      const newDoc = await uploadDocument(id, file);
      setDocuments(prev => [newDoc, ...prev]);
      setShowUploadForm(false);
    } catch (err) {
      alert(err.message || 'Failed to upload document.');
      throw err;
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      setDocActionLoadingId(doc.id);
      await downloadDocument(id, doc.id, doc.file_name);
    } catch (err) {
      alert(err.message || 'Failed to download document.');
    } finally {
      setDocActionLoadingId(null);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this attached document?')) {
      return;
    }

    try {
      setDocActionLoadingId(docId);
      await deleteDocument(id, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    } finally {
      setDocActionLoadingId(null);
    }
  };

  // Meeting Notes Handlers
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.notes.trim()) {
      alert('Please provide note title and content.');
      return;
    }
    setNoteSubmitting(true);
    try {
      const newNote = await createMeetingNote(id, {
        title: noteForm.title.trim(),
        meeting_date: noteForm.meeting_date ? new Date(noteForm.meeting_date).toISOString() : new Date().toISOString(),
        attendees: noteForm.attendees.trim() || null,
        notes: noteForm.notes.trim(),
        action_items: noteForm.action_items.trim() || null,
      });
      setMeetingNotes(prev => [newNote, ...prev]);
      setShowNoteModal(false);
      setNoteForm({
        title: '',
        meeting_date: new Date().toISOString().slice(0, 16),
        attendees: '',
        notes: '',
        action_items: '',
      });
    } catch (err) {
      alert(err.message || 'Failed to save meeting note.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this meeting note?')) return;
    try {
      await deleteMeetingNote(id, noteId);
      setMeetingNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      alert(err.message || 'Failed to delete note.');
    }
  };

  // Workflow Handlers
  const handleOpenWorkflowModal = async () => {
    try {
      const roster = await getUserRoster();
      setRosterUsers(roster || []);
      setShowWorkflowModal(true);
    } catch (err) {
      alert('Failed to load user roster for workflow creation.');
    }
  };

  const handleAddWorkflowStep = () => {
    setWorkflowSteps(prev => [
      ...prev,
      { step_number: prev.length + 1, step_name: `Level ${prev.length + 1} Review`, reviewer_id: '', due_date: '' }
    ]);
  };

  const handleRemoveWorkflowStep = (idx) => {
    if (workflowSteps.length <= 1) return;
    setWorkflowSteps(prev =>
      prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 }))
    );
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    for (const step of workflowSteps) {
      if (!step.reviewer_id) {
        alert('Please assign a reviewer for each step in the workflow.');
        return;
      }
    }

    setWorkflowSubmitting(true);
    try {
      const payload = {
        title: workflowTitle.trim(),
        steps: workflowSteps.map(s => ({
          step_number: s.step_number,
          step_name: s.step_name.trim(),
          reviewer_id: parseInt(s.reviewer_id, 10),
          due_date: s.due_date ? new Date(s.due_date).toISOString() : null,
        })),
      };
      const created = await createApprovalWorkflow(id, payload);
      setWorkflows(prev => [created, ...prev]);
      setShowWorkflowModal(false);
    } catch (err) {
      alert(err.message || 'Failed to initiate workflow.');
    } finally {
      setWorkflowSubmitting(false);
    }
  };

  const handleStepActionSubmit = async (e) => {
    e.preventDefault();
    if (!activeStepActionModal) return;
    setStepActionSubmitting(true);
    try {
      const updatedWf = await takeApprovalStepAction(
        id,
        activeStepActionModal.workflowId,
        activeStepActionModal.step.id,
        {
          action: stepActionType,
          comments: stepActionComments.trim() || null,
        }
      );
      setWorkflows(prev => prev.map(w => (w.id === updatedWf.id ? updatedWf : w)));
      setActiveStepActionModal(null);
      setStepActionComments('');
      // Refresh decision status
      const updatedDec = await getDecision(id);
      setDecision(updatedDec);
    } catch (err) {
      alert(err.message || 'Step action failed: ' + (err.message || ''));
    } finally {
      setStepActionSubmitting(false);
    }
  };

  const handleEscalateWorkflow = async (workflowId) => {
    if (!window.confirm('Escalate this approval workflow to notify management and flag overdue steps?')) return;
    try {
      const escalated = await escalateApprovalWorkflow(id, workflowId);
      setWorkflows(prev => prev.map(w => (w.id === escalated.id ? escalated : w)));
      alert('Workflow has been successfully escalated.');
    } catch (err) {
      alert(err.message || 'Failed to escalate workflow.');
    }
  };

  const handleApprovalComplete = () => {
    fetchDecisionDetails();
    setApprovalRefresh(prev => prev + 1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const workflowStages = ['Draft', 'Submitted', 'Under Review', 'Approved'];

  if (loading) {
    return (
      <div className="card loading-state-card" style={{ minHeight: '300px' }}>
        <Loader2 size={36} className="spinner-icon text-primary" />
        <span>Loading decision details...</span>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="alert alert-error" role="alert">
        <p>{error || 'Decision not found.'}</p>
        <Link to="/decisions" className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
          &larr; Back to Decisions
        </Link>
      </div>
    );
  }

  return (
    <div className="decision-details-container">
      {/* Back Navigation & Action Bar */}
      <div className="details-action-bar">
        <Link to="/decisions" className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
          <ArrowLeft size={14} />
          <span>Back to Decisions</span>
        </Link>

        <div className="details-actions-right">
          {canEdit && (
            <Link to={`/decisions/${id}/edit`} className="btn btn-secondary btn-sm">
              <Edit3 size={15} />
              <span>Edit</span>
            </Link>
          )}

          {canSubmit && (
            <button
              onClick={handleSubmit}
              className="btn btn-primary btn-sm"
              disabled={actionLoading}
            >
              <Send size={15} />
              <span>Submit for Review</span>
            </button>
          )}

          {/* Archive / Unarchive Action */}
          {!isArchived ? (
            (isOwner || isAdmin) && (
              <button
                onClick={handleArchive}
                className="btn btn-outline btn-sm"
                disabled={actionLoading}
                title="Archive this decision (sets to read-only)"
              >
                <Archive size={15} />
                <span>Archive</span>
              </button>
            )
          ) : (
            (isOwner || isAdmin) && (
              <button
                onClick={handleUnarchive}
                className="btn btn-primary btn-sm"
                disabled={actionLoading}
                title="Restore this archived decision to active Draft status"
              >
                <RotateCcw size={15} />
                <span>Unarchive Decision</span>
              </button>
            )
          )}

          {canDelete && !isArchived && (
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
              disabled={actionLoading}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Archived Warning Banner */}
      {isArchived && (
        <div className="alert alert-warning" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
          <Archive size={20} />
          <div>
            <strong>Decision Archived (Read-Only Mode)</strong>
            <p style={{ margin: '2px 0 0', fontSize: '0.9rem' }}>
              This decision is locked. No edits, submissions, or deletions can be made while it is archived. You may unarchive it anytime to resume editing.
            </p>
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <article className="card details-main-card">
        {/* Header */}
        <header className="details-hero-section">
          <div className="details-title-row">
            <h1>{decision.title}</h1>
            <DecisionStatusBadge status={decision.status} />
          </div>

          <div className="details-metadata-badges">
            <div className="meta-badge-item">
              <User size={14} />
              <span>Creator: <strong>{decision.creator?.full_name || `User #${decision.created_by}`}</strong></span>
            </div>

            <div className="meta-badge-item">
              <Calendar size={14} />
              <span>Created: <strong>{formatDate(decision.created_at)}</strong></span>
            </div>

            {decision.updated_at && (
              <div className="meta-badge-item">
                <Clock size={14} />
                <span>Updated: <strong>{formatDate(decision.updated_at)}</strong></span>
              </div>
            )}

            {/* Category badge */}
            {decision.category && (
              <div className="meta-badge-item meta-badge-category">
                <Folder size={14} />
                <span>Category: <strong>{decision.category.name}</strong></span>
              </div>
            )}

            {/* Team badge */}
            {decision.team && (
              <Link to={`/teams/${decision.team.id}`} className="meta-badge-item meta-badge-team" title="Open Team Workspace">
                <Users size={14} />
                <span>Team: <strong>{decision.team.name}</strong></span>
              </Link>
            )}

            {/* Tags row */}
            {decision.tags && decision.tags.length > 0 && (
              <div className="meta-badge-item meta-badge-tags">
                <TagIcon size={14} />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {decision.tags.map((t) => (
                    <span key={t.id} className="tag-pill-badge">{t.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Visual Decision Lifecycle Timeline */}
        <section className="decision-workflow-timeline">
          <span className="workflow-timeline-title">Visual Decision Lifecycle</span>
          <div className="workflow-timeline-steps">
            {workflowStages.map((stage, idx) => {
              const isCurrent = decision.status === stage;
              const isPassed =
                (decision.status === 'Submitted' && stage === 'Draft') ||
                (decision.status === 'Under Review' && (stage === 'Draft' || stage === 'Submitted')) ||
                (decision.status === 'Approved' && stage !== 'Approved');

              return (
                <React.Fragment key={stage}>
                  <div
                    className={`timeline-step ${isCurrent ? 'active' : isPassed ? 'passed' : ''}`}
                  >
                    {isPassed ? <CheckCircle2 size={13} /> : null}
                    <span>{stage}</span>
                  </div>
                  {idx < workflowStages.length - 1 && (
                    <span className="timeline-connector">→</span>
                  )}
                </React.Fragment>
              );
            })}
            {decision.status === 'Rejected' && (
              <>
                <span className="timeline-connector">→</span>
                <div className="timeline-step active" style={{ backgroundColor: 'var(--danger-solid)', borderColor: 'var(--danger-solid)' }}>
                  <span>Rejected</span>
                </div>
              </>
            )}
            {decision.status === 'Archived' && (
              <>
                <span className="timeline-connector">→</span>
                <div className="timeline-step active" style={{ backgroundColor: '#64748b', borderColor: '#64748b' }}>
                  <span>Archived</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Legacy single-stage approval actions banner */}
        {canReview && (
          <ApprovalActions
            decision={decision}
            onActionComplete={handleApprovalComplete}
          />
        )}

        {/* Structured Content Sections */}
        <div className="detail-content-sections">
          {/* Problem Statement */}
          <section className="section-box">
            <h3 className="section-box-title">
              <AlertTriangle size={18} className="text-warning" />
              <span>Problem Statement</span>
            </h3>
            <p className="section-box-body">{decision.problem_statement}</p>
          </section>

          {/* Context */}
          <section className="section-box">
            <h3 className="section-box-title">
              <FileText size={18} />
              <span>Context & Constraints</span>
            </h3>
            <p className="section-box-body">{decision.context}</p>
          </section>

          {/* Decision Taken */}
          <section className="decision-highlight-box">
            <h3 className="section-box-title">
              <CheckCircle2 size={18} color="var(--primary-600)" />
              <span>Decision Taken</span>
            </h3>
            <p className="section-box-body">{decision.decision_taken}</p>
          </section>

          {/* =========================================================
              FEATURE 4: DECISION RATIONALE (PROMINENTLY HIGHLIGHTED)
              ========================================================= */}
          <section className="decision-rationale-box">
            <div className="decision-rationale-header">
              <div className="rationale-icon-badge">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="rationale-title">Decision Rationale (Core Justification)</h3>
                <span className="rationale-subtitle">
                  Architectural, economic, and strategic trade-off evaluation
                </span>
              </div>
            </div>
            <div className="decision-rationale-body">
              <p>{decision.reasoning}</p>
            </div>
          </section>

          {/* Expected / Actual Outcomes */}
          {decision.expected_outcome && (
            <section className="section-box">
              <h3 className="section-box-title">
                <TrendingUp size={18} />
                <span>Expected Outcome</span>
              </h3>
              <p className="section-box-body">{decision.expected_outcome}</p>
            </section>
          )}

          {decision.actual_outcome && (
            <section className="section-box">
              <h3 className="section-box-title">
                <CheckCircle2 size={18} color="var(--success-solid)" />
                <span>Actual Outcome</span>
              </h3>
              <p className="section-box-body">{decision.actual_outcome}</p>
            </section>
          )}

          {/* =========================================================
              FEATURE 5: MULTI-LEVEL APPROVAL WORKFLOWS & ESCALATION
              ========================================================= */}
          <section className="section-box workflows-section">
            <div className="section-header-row">
              <div className="section-header-title-group">
                <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
                  <CheckSquare size={16} />
                </div>
                <h3 className="section-box-title" style={{ margin: 0 }}>
                  Multi-Level Approval Workflows
                </h3>
                <span className="alternatives-count-pill">
                  {workflows.length} {workflows.length === 1 ? 'Workflow' : 'Workflows'}
                </span>
              </div>

              {!isArchived && (isOwner || isAdmin || isManager) && (
                <button
                  type="button"
                  onClick={handleOpenWorkflowModal}
                  className="btn btn-outline btn-sm"
                  title="Configure and start a sequential multi-level approval workflow"
                >
                  <PlusCircle size={15} />
                  <span>+ Start Multi-Level Workflow</span>
                </button>
              )}
            </div>

            {workflows.length === 0 ? (
              <div className="empty-sub-state">
                <p>No multi-level approval workflows configured for this decision yet.</p>
                {!isArchived && (
                  <button
                    type="button"
                    onClick={handleOpenWorkflowModal}
                    className="btn btn-secondary btn-sm"
                  >
                    Initiate Multi-Level Review
                  </button>
                )}
              </div>
            ) : (
              <div className="workflows-list">
                {workflows.map((wf) => {
                  const isWfOverdue = wf.is_overdue;

                  return (
                    <div key={wf.id} className="workflow-card">
                      <div className="workflow-card-top">
                        <div>
                          <h4 className="workflow-card-title">{wf.title}</h4>
                          <span className="workflow-card-meta">
                            Status: <strong className={`wf-status-${wf.status.toLowerCase()}`}>{wf.status}</strong>
                            {' • '}Level {wf.current_step} of {wf.steps?.length || 0}
                          </span>
                        </div>

                        <div className="workflow-card-actions">
                          {isWfOverdue && wf.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleEscalateWorkflow(wf.id)}
                              className="btn btn-warning btn-sm"
                              title="Escalate overdue workflow"
                            >
                              <AlertCircle size={14} />
                              <span>Escalate</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stepper Progress */}
                      <div className="workflow-stepper">
                        {wf.steps?.map((step) => {
                          const isStepCurrent = step.step_number === wf.current_step && wf.status === 'Pending';
                          const isStepCompleted = step.status === 'Approved';
                          const isStepRejected = step.status === 'Rejected';
                          const isStepEscalated = step.status === 'Escalated';
                          const isReviewerMe = user && step.reviewer_id === user.id;
                          const isDecisionAuthorMe = user && decision.created_by === user.id;

                          return (
                            <div
                              key={step.id}
                              className={`wf-step-box ${isStepCurrent ? 'active' : ''} ${isStepCompleted ? 'completed' : ''} ${isStepRejected ? 'rejected' : ''} ${isStepEscalated ? 'escalated' : ''}`}
                            >
                              <div className="wf-step-number">{step.step_number}</div>
                              <div className="wf-step-info">
                                <span className="wf-step-name">{step.step_name}</span>
                                <span className="wf-step-reviewer">
                                  Reviewer: {step.reviewer?.full_name || `User #${step.reviewer_id}`}
                                </span>
                                {step.due_date && (
                                  <span className="wf-step-due">
                                    Due: {new Date(step.due_date).toLocaleDateString()}
                                  </span>
                                )}
                                <span className={`wf-step-status-tag status-${step.status.toLowerCase()}`}>
                                  {step.status}
                                </span>

                                {step.comments && (
                                  <p className="wf-step-comments">"{step.comments}"</p>
                                )}

                                {/* Action button if active step and user is reviewer (or admin) */}
                                {isStepCurrent && (isReviewerMe || isAdmin) && !isArchived && (
                                  <div style={{ marginTop: '0.5rem' }}>
                                    {isReviewerMe && isDecisionAuthorMe && !isAdmin ? (
                                      <span className="self-review-warning" title="Anti-bias protection: You cannot approve your own decision.">
                                        <AlertTriangle size={12} /> Self-review prevented
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                          setActiveStepActionModal({ workflowId: wf.id, step });
                                          setStepActionType('Approved');
                                          setStepActionComments('');
                                        }}
                                      >
                                        Review Step #{step.step_number}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* =========================================================
              FEATURE 3: MEETING NOTES & COLLABORATIVE RECORDS
              ========================================================= */}
          <section className="section-box meeting-notes-section">
            <div className="section-header-row">
              <div className="section-header-title-group">
                <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
                  <FileText size={16} />
                </div>
                <h3 className="section-box-title" style={{ margin: 0 }}>
                  Meeting Notes & Architectural Reviews
                </h3>
                <span className="alternatives-count-pill">
                  {meetingNotes.length} {meetingNotes.length === 1 ? 'Note' : 'Notes'}
                </span>
              </div>

              {!isArchived && (
                <button
                  type="button"
                  onClick={() => setShowNoteModal(true)}
                  className="btn btn-primary btn-sm"
                  title="Document architecture sync or decision review meeting"
                >
                  <PlusCircle size={15} />
                  <span>+ Add Meeting Note</span>
                </button>
              )}
            </div>

            {meetingNotes.length === 0 ? (
              <div className="empty-sub-state">
                <p>No meeting notes attached to this decision yet.</p>
                {!isArchived && (
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    Record Meeting Note
                  </button>
                )}
              </div>
            ) : (
              <div className="meeting-notes-list">
                {meetingNotes.map((note) => {
                  const canDeleteNote = !isArchived && (isAdmin || (user && note.author_id === user.id));

                  return (
                    <div key={note.id} className="meeting-note-card">
                      <div className="meeting-note-header">
                        <div>
                          <h4 className="meeting-note-title">{note.title}</h4>
                          <div className="meeting-note-meta">
                            <span>
                              <Calendar size={12} /> {formatDate(note.meeting_date)}
                            </span>
                            <span>•</span>
                            <span>
                              <User size={12} /> {note.author?.full_name || `User #${note.author_id}`}
                            </span>
                            {note.attendees && (
                              <>
                                <span>•</span>
                                <span>Attendees: {note.attendees}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {canDeleteNote && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="btn-icon-danger"
                            title="Delete note"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="meeting-note-content">
                        <p>{note.notes}</p>
                      </div>

                      {note.action_items && (
                        <div className="meeting-note-actions-block">
                          <strong>Action Items:</strong>
                          <p>{note.action_items}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* =========================================================
              ALTERNATIVE COMPARISON & ANALYSIS SECTION
              ========================================================= */}
          <section className="section-box alternatives-comparison-section">
            <div className="alternatives-section-header">
              <div className="alt-header-title-group">
                <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
                  <Sparkles size={16} />
                </div>
                <h3 className="section-box-title" style={{ margin: 0 }}>
                  Alternative Comparison & Trade-off Analysis
                </h3>
                <span className="alternatives-count-pill">
                  {alternatives.length} {alternatives.length === 1 ? 'Option' : 'Options'}
                </span>
              </div>

              {canEditAlternatives && (
                <button
                  onClick={handleOpenAddModal}
                  className="btn btn-primary btn-sm"
                  title="Add a new alternative for trade-off comparison"
                >
                  <PlusCircle size={15} />
                  <span>+ Add Alternative</span>
                </button>
              )}
            </div>

            <AlternativeComparisonTable
              alternatives={alternatives}
              canEdit={canEditAlternatives}
              onAddAlternative={handleOpenAddModal}
              onEditAlternative={handleOpenEditModal}
              onDeleteAlternative={handleDeleteAlternative}
            />
          </section>

          {/* =========================================================
              DOCUMENTS & ATTACHMENTS SECTION
              ========================================================= */}
          <section className="section-box documents-section">
            <div className="documents-section-header">
              <div className="doc-header-title-group">
                <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
                  <Paperclip size={16} />
                </div>
                <h3 className="section-box-title" style={{ margin: 0 }}>
                  Supporting Documents & Attachments
                </h3>
                <span className="documents-count-pill">
                  {documents.length} {documents.length === 1 ? 'File' : 'Files'}
                </span>
              </div>

              {canUploadDocuments && (
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className={`btn ${showUploadForm ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                  title="Attach supporting files to this decision"
                >
                  <Paperclip size={15} />
                  <span>{showUploadForm ? 'Cancel' : '+ Attach Document'}</span>
                </button>
              )}
            </div>

            {showUploadForm && canUploadDocuments && (
              <div className="document-upload-wrapper">
                <DocumentUpload
                  onUpload={handleUploadDocument}
                  loading={uploadingDoc}
                  onClose={() => setShowUploadForm(false)}
                />
              </div>
            )}

            <DocumentList
              documents={documents}
              canDelete={canDeleteDocuments}
              onDownload={handleDownloadDocument}
              onDelete={handleDeleteDocument}
              actionLoadingId={docActionLoadingId}
            />
          </section>

          {/* Single-level Approval History */}
          <ApprovalHistory
            decisionId={id}
            refreshTrigger={approvalRefresh}
          />

          {/* Version Tracking */}
          <VersionHistory
            decisionId={id}
            currentDecisionStatus={decision.status}
          />

          {/* Discussions */}
          <DiscussionSection
            decisionId={id}
            currentUserId={user?.id}
            isAdmin={isAdmin}
          />
        </div>
      </article>

      {/* Alternative Add / Edit Modal Dialog */}
      <AlternativeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAlternative}
        alternative={selectedAlternative}
        loading={modalLoading}
      />

      {/* Add Meeting Note Modal */}
      {showNoteModal && (
        <div className="rpt-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowNoteModal(false)}>
          <div className="rpt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h2 className="rpt-modal-title">Record Meeting Note</h2>
              <button className="rpt-modal-close" onClick={() => setShowNoteModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateNote}>
              <div className="rpt-modal-body">
                <div className="form-group">
                  <label htmlFor="note_title">Meeting Title *</label>
                  <input
                    id="note_title"
                    type="text"
                    className="form-control-input"
                    placeholder="e.g. Architecture Alignment Sync"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label htmlFor="meeting_date">Meeting Date *</label>
                    <input
                      id="meeting_date"
                      type="datetime-local"
                      className="form-control-input"
                      value={noteForm.meeting_date}
                      onChange={(e) => setNoteForm({ ...noteForm, meeting_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="attendees">Attendees</label>
                    <input
                      id="attendees"
                      type="text"
                      className="form-control-input"
                      placeholder="e.g. Alice, Bob, Charlie (Staff Arch)"
                      value={noteForm.attendees}
                      onChange={(e) => setNoteForm({ ...noteForm, attendees: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes_content">Discussion & Decisions *</label>
                  <textarea
                    id="notes_content"
                    className="form-control-textarea"
                    rows={5}
                    placeholder="Key discussion points, consensus reached, objections discussed..."
                    value={noteForm.notes}
                    onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="action_items">Action Items</label>
                  <textarea
                    id="action_items"
                    className="form-control-textarea"
                    rows={3}
                    placeholder="Actionable next steps, owners, and targets..."
                    value={noteForm.action_items}
                    onChange={(e) => setNoteForm({ ...noteForm, action_items: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--slate-200)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNoteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={noteSubmitting}>
                  {noteSubmitting ? 'Saving...' : 'Save Meeting Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Multi-Level Workflow Modal */}
      {showWorkflowModal && (
        <div className="rpt-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowWorkflowModal(false)}>
          <div className="rpt-modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h2 className="rpt-modal-title">Initiate Multi-Level Approval Workflow</h2>
              <button className="rpt-modal-close" onClick={() => setShowWorkflowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateWorkflow}>
              <div className="rpt-modal-body">
                <div className="form-group">
                  <label htmlFor="wf_title">Workflow Name *</label>
                  <input
                    id="wf_title"
                    type="text"
                    className="form-control-input"
                    value={workflowTitle}
                    onChange={(e) => setWorkflowTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong>Sequential Approval Stages</strong>
                    <button type="button" onClick={handleAddWorkflowStep} className="btn btn-secondary btn-sm">
                      <Plus size={14} /> Add Step
                    </button>
                  </div>

                  {workflowSteps.map((step, idx) => (
                    <div key={idx} className="workflow-step-builder-row">
                      <span className="step-builder-num">#{step.step_number}</span>
                      <input
                        type="text"
                        className="form-control-input"
                        placeholder="Stage Name"
                        value={step.step_name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorkflowSteps(prev => prev.map((s, i) => i === idx ? { ...s, step_name: val } : s));
                        }}
                        style={{ flex: 2 }}
                        required
                      />
                      <select
                        className="form-control-input"
                        value={step.reviewer_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorkflowSteps(prev => prev.map((s, i) => i === idx ? { ...s, reviewer_id: val } : s));
                        }}
                        style={{ flex: 2 }}
                        required
                      >
                        <option value="">-- Select Reviewer --</option>
                        {rosterUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.role?.name})
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        className="form-control-input"
                        title="Optional Due Date"
                        value={step.due_date}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorkflowSteps(prev => prev.map((s, i) => i === idx ? { ...s, due_date: val } : s));
                        }}
                        style={{ flex: 1.5 }}
                      />
                      {workflowSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkflowStep(idx)}
                          className="btn-icon-danger"
                          title="Remove stage"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--slate-200)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowWorkflowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={workflowSubmitting}>
                  {workflowSubmitting ? 'Starting Workflow...' : 'Start Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Step Action Modal */}
      {activeStepActionModal && (
        <div className="rpt-modal-overlay" role="dialog" aria-modal="true" onClick={() => setActiveStepActionModal(null)}>
          <div className="rpt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <div>
                <h2 className="rpt-modal-title">Review Step: {activeStepActionModal.step.step_name}</h2>
                <span className="rpt-modal-subtitle">Step #{activeStepActionModal.step.step_number} in workflow</span>
              </div>
              <button className="rpt-modal-close" onClick={() => setActiveStepActionModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleStepActionSubmit}>
              <div className="rpt-modal-body">
                <div className="form-group">
                  <label>Your Decision *</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className={`btn ${stepActionType === 'Approved' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setStepActionType('Approved')}
                    >
                      <CheckCircle2 size={15} /> Approve Step
                    </button>
                    <button
                      type="button"
                      className={`btn ${stepActionType === 'Requested Changes' ? 'btn-warning' : 'btn-secondary'} btn-sm`}
                      onClick={() => setStepActionType('Requested Changes')}
                    >
                      <RotateCcw size={15} /> Request Changes
                    </button>
                    <button
                      type="button"
                      className={`btn ${stepActionType === 'Rejected' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                      onClick={() => setStepActionType('Rejected')}
                    >
                      <Trash2 size={15} /> Reject
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="step_comments">Reviewer Feedback & Comments</label>
                  <textarea
                    id="step_comments"
                    className="form-control-textarea"
                    rows={4}
                    placeholder="Document your technical assessment, reservations, or approvals..."
                    value={stepActionComments}
                    onChange={(e) => setStepActionComments(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--slate-200)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveStepActionModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={stepActionSubmitting}>
                  {stepActionSubmitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionDetails;
