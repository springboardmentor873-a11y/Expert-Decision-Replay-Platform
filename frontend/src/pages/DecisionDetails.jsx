import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDecision, submitDecision, deleteDecision } from '../services/decisionService';
import { DecisionStatusBadge } from '../components/DecisionStatusBadge';
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
  Layers
} from 'lucide-react';

export const DecisionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDecisionDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDecision(id);
      setDecision(data);
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
    if (!window.confirm('Are you sure you want to permanently delete this decision? This action cannot be undone.')) {
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
              <span>Reasoning</span>
            </h3>
            <p className="section-box-body">{decision.reasoning}</p>
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
        </div>
      </article>
    </div>
  );
};
