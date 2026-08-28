import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileEdit, 
  Send, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  Award, 
  CheckCircle2, 
  MessageSquare, 
  Paperclip, 
  History, 
  Info 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DecisionStatusBadge, ImplementationStatusBadge } from '../../components/ui/StatusBadge';
import api from '../../api/client';

import { OverviewTab } from './tabs/OverviewTab';
import { AlternativesTab } from './tabs/AlternativesTab';
import { CriteriaMatrixTab } from './tabs/CriteriaMatrixTab';
import { RisksTab } from './tabs/RisksTab';
import { ApprovalsTab } from './tabs/ApprovalsTab';
import { DiscussionsTab } from './tabs/DiscussionsTab';
import { AttachmentsTab } from './tabs/AttachmentsTab';
import { VersionsTab } from './tabs/VersionsTab';
import { DecisionModals } from './DecisionModals';

export const DecisionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, roleCode, isAdmin, isManager, isReviewer } = useAuth();

  const [decision, setDecision] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [approvals, setApprovals] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [actionModal, setActionModal] = useState({ open: false, type: '', title: '', comment: '' });
  const [showAddAltModal, setShowAddAltModal] = useState(false);
  const [altForm, setAltForm] = useState({ title: '', description: '', sort_order: 0 });

  const [showAddCritModal, setShowAddCritModal] = useState(false);
  const [critForm, setCritForm] = useState({ name: '', description: '', weight: 1.0, sort_order: 0 });

  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [riskForm, setRiskForm] = useState({ title: '', description: '', severity: 'medium', likelihood: 'medium', mitigation: '' });

  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', body: '', occurred_at: new Date().toISOString().slice(0, 16) });

  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showAddDiscModal, setShowAddDiscModal] = useState(false);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [outcomeForm, setOutcomeForm] = useState({ outcome_summary: '', implementation_status: 'in_progress' });
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  const [diffModal, setDiffModal] = useState({ open: false, v1: 1, v2: 2, data: null });
  const [editingScores, setEditingScores] = useState({});
  const [savingMatrix, setSavingMatrix] = useState(false);

  const fetchFullCaseFile = async () => {
    try {
      const [decRes, matRes, appRes, discRes, notesRes, attRes, verRes] = await Promise.all([
        api.get(`/decisions/${id}`),
        api.get(`/decisions/${id}/evaluation-matrix`),
        api.get(`/decisions/${id}/approvals`),
        api.get(`/decisions/${id}/discussions`),
        api.get(`/decisions/${id}/meeting-notes`),
        api.get(`/decisions/${id}/attachments`),
        api.get(`/decisions/${id}/versions`),
      ]);
      setDecision(decRes.data);
      setMatrix(matRes.data);
      setApprovals(appRes.data);
      setDiscussions(discRes.data);
      setMeetingNotes(notesRes.data);
      setAttachments(attRes.data);
      setVersions(verRes.data);

      if (decRes.data.outcome_summary) {
        setOutcomeForm({
          outcome_summary: decRes.data.outcome_summary,
          implementation_status: decRes.data.implementation_status || 'completed',
        });
      }

      const scoreMap = {};
      matRes.data.evaluations.forEach((ev) => {
        scoreMap[`${ev.alternative_id}_${ev.criterion_id}`] = ev.score;
      });
      setEditingScores(scoreMap);
    } catch (e) {
      console.error('Error fetching decision case file:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullCaseFile();
  }, [id]);

  const handleSubmitForReview = async () => {
    try {
      await api.post(`/decisions/${id}/submit`);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to submit decision.');
    }
  };

  const handleApprovalAction = async () => {
    const { type, comment } = actionModal;
    try {
      if (type === 'approve') {
        await api.post(`/decisions/${id}/approve`, { comment });
      } else if (type === 'reject') {
        await api.post(`/decisions/${id}/reject`, { comment });
      } else if (type === 'changes_requested') {
        await api.post(`/decisions/${id}/request-changes`, { comment });
      }
      setActionModal({ open: false, type: '', title: '', comment: '' });
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Approval action failed.');
    }
  };

  const handleAddAlternative = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/decisions/${id}/alternatives`, altForm);
      setAltForm({ title: '', description: '', sort_order: 0 });
      setShowAddAltModal(false);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add alternative.');
    }
  };

  const handleSelectAlternative = async (altId) => {
    try {
      await api.post(`/decisions/${id}/select-alternative`, { alternative_id: altId });
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to select alternative.');
    }
  };

  const handleDeleteAlternative = async (altId) => {
    if (!window.confirm('Are you sure you want to remove this alternative?')) return;
    try {
      await api.delete(`/alternatives/${altId}`);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete alternative.');
    }
  };

  const handleAddCriterion = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/decisions/${id}/criteria`, critForm);
      setCritForm({ name: '', description: '', weight: 1.0, sort_order: 0 });
      setShowAddCritModal(false);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add criterion.');
    }
  };

  const handleDeleteCriterion = async (critId) => {
    if (!window.confirm('Delete this evaluation criterion?')) return;
    try {
      await api.delete(`/criteria/${critId}`);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete criterion.');
    }
  };

  const handleScoreChange = (altId, critId, val) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setEditingScores({ ...editingScores, [`${altId}_${critId}`]: num });
  };

  const handleSaveEvaluationMatrix = async () => {
    setSavingMatrix(true);
    try {
      const evaluations = [];
      matrix.alternatives.forEach((alt) => {
        matrix.criteria.forEach((crit) => {
          const score = editingScores[`${alt.id}_${crit.id}`] ?? 0;
          evaluations.push({
            alternative_id: alt.id,
            criterion_id: crit.id,
            score: score,
          });
        });
      });
      await api.post(`/decisions/${id}/evaluations/batch`, { evaluations });
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save evaluation scores.');
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleAddRisk = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/decisions/${id}/risks`, riskForm);
      setRiskForm({ title: '', description: '', severity: 'medium', likelihood: 'medium', mitigation: '' });
      setShowAddRiskModal(false);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add risk.');
    }
  };

  const handleDeleteRisk = async (riskId) => {
    if (!window.confirm('Delete this risk item?')) return;
    try {
      await api.delete(`/risks/${riskId}`);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete risk.');
    }
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/decisions/${id}/discussions`, { title: newDiscussionTitle });
      setNewDiscussionTitle('');
      setShowAddDiscModal(false);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start discussion.');
    }
  };

  const handlePostComment = async (discussionId, parentId = null) => {
    const key = parentId ? `${discussionId}_${parentId}` : discussionId;
    const body = replyText[key];
    if (!body || !body.trim()) return;

    try {
      await api.post(`/discussions/${discussionId}/comments`, { body, parent_id: parentId });
      setReplyText({ ...replyText, [key]: '' });
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment.');
    }
  };

  const handleAddMeetingNote = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/decisions/${id}/meeting-notes`, {
        ...noteForm,
        occurred_at: new Date(noteForm.occurred_at).toISOString(),
      });
      setNoteForm({ title: '', body: '', occurred_at: new Date().toISOString().slice(0, 16) });
      setShowAddNoteModal(false);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add meeting note.');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await api.post(`/decisions/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadFile(null);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveOutcome = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/decisions/${id}/outcome`, outcomeForm);
      setShowOutcomeModal(false);
      await fetchFullCaseFile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record outcome.');
    }
  };

  const handleOpenDiff = async (v1, v2) => {
    try {
      const res = await api.get(`/decisions/${id}/versions/compare?v1=${v1}&v2=${v2}`);
      setDiffModal({ open: true, v1, v2, data: res.data });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to compare versions.');
    }
  };

  if (loading || !decision) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isOwner = decision.owner_id === user?.id;
  const canEdit = isOwner || isAdmin;
  const isDraftOrChanges = decision.status === 'draft' || decision.status === 'changes_requested';

  const currentPendingStep = approvals?.steps?.find((s) => s.status === 'pending');
  const userCanActOnApproval =
    currentPendingStep &&
    (isAdmin ||
      (currentPendingStep.required_role_code === 'reviewer' && isReviewer) ||
      (currentPendingStep.required_role_code === 'manager' && isManager));

  const tabs = [
    { id: 'overview', label: '1. Case Overview', icon: Info },
    { id: 'alternatives', label: '2. Alternatives Analysis', count: decision.alternatives?.length, icon: Layers },
    { id: 'criteria', label: '3. Evaluation & Scoring', count: decision.criteria?.length, icon: Award },
    { id: 'risks', label: '4. Risks Assessment', count: decision.risks?.length, icon: AlertTriangle },
    { id: 'approvals', label: '5. Approval Workflow', icon: CheckCircle2 },
    { id: 'discussions', label: '6. Discussions & Notes', count: discussions.length + meetingNotes.length, icon: MessageSquare },
    { id: 'attachments', label: '7. Attachments', count: attachments.length, icon: Paperclip },
    { id: 'versions', label: '8. Version History', count: versions.length, icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              to="/decisions"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <DecisionStatusBadge status={decision.status} />
            <ImplementationStatusBadge status={decision.implementation_status} />
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              v{decision.current_version_no}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {decision.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span>
              Author: <strong className="text-slate-700 font-semibold">{decision.owner_name}</strong>
            </span>
            <span>?</span>
            <span>Category: <strong className="text-slate-700 font-semibold">{decision.category?.name || 'Uncategorized'}</strong></span>
            <span>?</span>
            <span>Team: <strong className="text-slate-700 font-semibold">{decision.team_name || 'General'}</strong></span>
            <span>?</span>
            <span>Created: {new Date(decision.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
          {isDraftOrChanges && (isOwner || isAdmin) && (
            <button
              onClick={handleSubmitForReview}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
            </button>
          )}

          {userCanActOnApproval && (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setActionModal({
                    open: true,
                    type: 'approve',
                    title: `Approve Step: ${currentPendingStep.step_name}`,
                    comment: '',
                  })
                }
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve Step</span>
              </button>

              <button
                onClick={() =>
                  setActionModal({
                    open: true,
                    type: 'changes_requested',
                    title: 'Request Modifications',
                    comment: '',
                  })
                }
                className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Changes</span>
              </button>

              <button
                onClick={() =>
                  setActionModal({
                    open: true,
                    type: 'reject',
                    title: 'Reject Decision',
                    comment: '',
                  })
                }
                className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          )}

          {decision.status === 'approved' && (
            <button
              onClick={() => setShowOutcomeModal(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Record Outcome</span>
            </button>
          )}

          <a
            href={`/api/v1/reports/decision/${id}/pdf`}
            download
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </a>

          <a
            href={`/api/v1/reports/decision/${id}/excel`}
            download
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </a>

          {canEdit && (
            <Link
              to={`/decisions/${id}/edit`}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === t.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Render Active Tab */}
      {activeTab === 'overview' && (
        <OverviewTab decision={decision} approvals={approvals} setActiveTab={setActiveTab} />
      )}

      {activeTab === 'alternatives' && (
        <AlternativesTab
          decision={decision}
          canEdit={canEdit}
          setShowAddAltModal={setShowAddAltModal}
          handleSelectAlternative={handleSelectAlternative}
          handleDeleteAlternative={handleDeleteAlternative}
        />
      )}

      {activeTab === 'criteria' && (
        <CriteriaMatrixTab
          matrix={matrix}
          canEdit={canEdit}
          editingScores={editingScores}
          savingMatrix={savingMatrix}
          setShowAddCritModal={setShowAddCritModal}
          handleSaveEvaluationMatrix={handleSaveEvaluationMatrix}
          handleScoreChange={handleScoreChange}
          handleDeleteCriterion={handleDeleteCriterion}
        />
      )}

      {activeTab === 'risks' && (
        <RisksTab
          decision={decision}
          canEdit={canEdit}
          setShowAddRiskModal={setShowAddRiskModal}
          handleDeleteRisk={handleDeleteRisk}
        />
      )}

      {activeTab === 'approvals' && <ApprovalsTab approvals={approvals} />}

      {activeTab === 'discussions' && (
        <DiscussionsTab
          discussions={discussions}
          meetingNotes={meetingNotes}
          replyText={replyText}
          setReplyText={setReplyText}
          setShowAddDiscModal={setShowAddDiscModal}
          setShowAddNoteModal={setShowAddNoteModal}
          handlePostComment={handlePostComment}
        />
      )}

      {activeTab === 'attachments' && (
        <AttachmentsTab
          attachments={attachments}
          uploadFile={uploadFile}
          setUploadFile={setUploadFile}
          uploading={uploading}
          handleFileUpload={handleFileUpload}
        />
      )}

      {activeTab === 'versions' && (
        <VersionsTab versions={versions} handleOpenDiff={handleOpenDiff} />
      )}

      {/* Master Modals */}
      <DecisionModals
        actionModal={actionModal}
        setActionModal={setActionModal}
        handleApprovalAction={handleApprovalAction}
        showAddAltModal={showAddAltModal}
        setShowAddAltModal={setShowAddAltModal}
        altForm={altForm}
        setAltForm={setAltForm}
        handleAddAlternative={handleAddAlternative}
        showAddCritModal={showAddCritModal}
        setShowAddCritModal={setShowAddCritModal}
        critForm={critForm}
        setCritForm={setCritForm}
        handleAddCriterion={handleAddCriterion}
        showAddRiskModal={showAddRiskModal}
        setShowAddRiskModal={setShowAddRiskModal}
        riskForm={riskForm}
        setRiskForm={setRiskForm}
        handleAddRisk={handleAddRisk}
        showOutcomeModal={showOutcomeModal}
        setShowOutcomeModal={setShowOutcomeModal}
        outcomeForm={outcomeForm}
        setOutcomeForm={setOutcomeForm}
        handleSaveOutcome={handleSaveOutcome}
        diffModal={diffModal}
        setDiffModal={setDiffModal}
        showAddDiscModal={showAddDiscModal}
        setShowAddDiscModal={setShowAddDiscModal}
        newDiscussionTitle={newDiscussionTitle}
        setNewDiscussionTitle={setNewDiscussionTitle}
        handleCreateDiscussion={handleCreateDiscussion}
        showAddNoteModal={showAddNoteModal}
        setShowAddNoteModal={setShowAddNoteModal}
        noteForm={noteForm}
        setNoteForm={setNoteForm}
        handleAddMeetingNote={handleAddMeetingNote}
      />
    </div>
  );
};
