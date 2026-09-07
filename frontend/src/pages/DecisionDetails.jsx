import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDecision, submitDecision, deleteDecision } from '../services/decisionService';
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
import { DecisionStatusBadge } from '../components/DecisionStatusBadge';
import { AlternativeComparisonTable } from '../components/AlternativeComparisonTable';
import { AlternativeModal } from '../components/AlternativeModal';
import { DocumentUpload } from '../components/DocumentUpload';
import { DocumentList } from '../components/DocumentList';
import { DiscussionSection } from '../components/DiscussionSection';
import { VersionHistory } from '../components/VersionHistory';
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
} from 'lucide-react';

export const DecisionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [decision, setDecision] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Alternative Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Document Upload & Action States
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docActionLoadingId, setDocActionLoadingId] = useState(null);

  const fetchDecisionDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDecision(id);
      setDecision(data);

      // Fetch alternatives
      try {
        const alts = await getAlternatives(id);
        setAlternatives(alts || []);
      } catch (altErr) {
        console.warn('Could not load alternatives:', altErr);
        if (data.alternatives && Array.isArray(data.alternatives)) {
          setAlternatives(data.alternatives);
        }
      }

      // Fetch attached documents
      try {
        const docs = await getDocuments(id);
        setDocuments(docs || []);
      } catch (docErr) {
        console.warn('Could not load documents:', docErr);
        if (data.documents && Array.isArray(data.documents)) {
          setDocuments(data.documents);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load decision details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisionDetails();
  }, [id]);

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

  // Alternative CRUD handlers
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

      // Refresh alternatives
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

  // Document handlers
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
      await downloadDocument(id, doc.id, doc.original_filename);
    } catch (err) {
      alert(err.message || 'Failed to download document.');
    } finally {
      setDocActionLoadingId(null);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm(`Are you sure you want to permanently delete document "${doc.original_filename}"?`)) {
      return;
    }

    try {
      setDocActionLoadingId(doc.id);
      await deleteDocument(id, doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    } finally {
      setDocActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="details-page-wrapper">
        <div className="card loading-state-card">
          <Loader2 size={36} className="spinner-icon text-primary" />
          <span>Loading decision details...</span>
        </div>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="details-page-wrapper">
        <div className="alert alert-error">{error || 'Decision not found.'}</div>
        <Link to="/decisions" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Decisions</span>
        </Link>
      </div>
    );
  }

  const isOwner = user && decision.created_by === user.id;
  const isAdmin = user?.role?.name?.toLowerCase() === 'administrator';
  const isDraft = decision.status === 'Draft';
  const canEdit = isOwner || isAdmin;
  const canDelete = (isDraft && isOwner) || isAdmin;
  const canEditAlternatives = (isDraft && isOwner) || isAdmin;
  const canUploadDocuments = (isDraft && isOwner) || isAdmin;
  const canDeleteDocuments = (isDraft && isOwner) || isAdmin;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const workflowStages = ['Draft', 'Submitted', 'Under Review', 'Approved'];

  return (
    <div className="details-page-wrapper">
      {/* Top Action Bar */}
      <div className="details-top-bar">
        <Link to="/decisions" className="btn btn-secondary btn-sm">
          <ArrowLeft size={15} />
          <span>Back to Decisions</span>
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canEdit && (
            <Link to={`/decisions/${decision.id}/edit`} className="btn btn-secondary btn-sm">
              <Edit3 size={15} />
              <span>Edit Draft</span>
            </Link>
          )}

          {isDraft && canEdit && (
            <button
              onClick={handleSubmit}
              className="btn btn-primary btn-sm"
              disabled={actionLoading}
            >
              <Send size={15} />
              <span>Submit for Review</span>
            </button>
          )}

          {canDelete && (
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
          </div>
        </section>

        {/* Structured Content Sections */}
        <div className="detail-content-sections">
          <section className="section-box">
            <h3 className="section-box-title">
              <AlertTriangle size={18} className="text-warning" />
              <span>Problem Statement</span>
            </h3>
            <p className="section-box-body">{decision.problem_statement}</p>
          </section>

          <section className="section-box">
            <h3 className="section-box-title">
              <FileText size={18} />
              <span>Context</span>
            </h3>
            <p className="section-box-body">{decision.context}</p>
          </section>

          <section className="decision-highlight-box">
            <h3 className="section-box-title">
              <CheckCircle2 size={18} color="var(--primary-600)" />
              <span>Decision Taken</span>
            </h3>
            <p className="section-box-body">{decision.decision_taken}</p>
          </section>

          <section className="section-box">
            <h3 className="section-box-title">
              <Layers size={18} />
              <span>Reasoning & Trade-offs</span>
            </h3>
            <p className="section-box-body">{decision.reasoning}</p>
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
              VERSION TRACKING & HISTORY SECTION
              ========================================================= */}
          <VersionHistory
            decisionId={id}
            currentDecisionStatus={decision.status}
          />

          {/* =========================================================
              DISCUSSIONS & COLLABORATION SECTION
              ========================================================= */}
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
    </div>
  );
};
