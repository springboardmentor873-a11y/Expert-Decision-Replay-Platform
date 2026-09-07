import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DecisionStatusBadge from '../components/DecisionStatusBadge';
import CommentTypeBadge from '../components/CommentTypeBadge';
import RoleBadge from '../components/RoleBadge';
import {
  ArrowLeft,
  Calendar,
  Tag,
  User,
  History,
  GitBranch,
  MessageSquare,
  Paperclip,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  Download,
  Upload,
  Reply,
  FileText,
  Clock,
  Sparkles,
  Layers,
  Compass,
  CornerDownRight
} from 'lucide-react';

export const DecisionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isReviewer } = useAuth();

  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('alternatives'); // 'alternatives', 'discussions', 'versions', 'attachments'

  // Edit Decision Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editProblem, setEditProblem] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStatus, setEditStatus] = useState('Draft');
  const [changeSummary, setChangeSummary] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Alternative Modal State
  const [isAddAltOpen, setIsAddAltOpen] = useState(false);
  const [altTitle, setAltTitle] = useState('');
  const [altDescription, setAltDescription] = useState('');
  const [altPros, setAltPros] = useState('');
  const [altCons, setAltCons] = useState('');
  const [altCost, setAltCost] = useState(0);
  const [altFeasibility, setAltFeasibility] = useState(7);
  const [altRisk, setAltRisk] = useState('Low to Moderate risk.');
  const [savingAlt, setSavingAlt] = useState(false);

  // Comparison Matrix Modal State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Discussion / Comment State
  const [commentType, setCommentType] = useState('general_comment');
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [postingComment, setPostingComment] = useState(false);

  // File Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Snapshot Inspection Modal State
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  const fetchDecisionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/decisions/${id}`);
      setDecision(res.data);
      setEditTitle(res.data.title);
      setEditProblem(res.data.problem_statement);
      setEditCategory(res.data.category);
      setEditStatus(res.data.status);
    } catch (err) {
      console.error('Failed to fetch decision details:', err);
      setError('Unable to load decision details or decision does not exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisionDetails();
  }, [id]);

  // Handle Edit Decision
  const handleUpdateDecision = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await api.put(`/decisions/${id}`, {
        title: editTitle,
        problem_statement: editProblem,
        category: editCategory,
        status: editStatus,
        change_summary: changeSummary || 'Decision updated.'
      });
      setIsEditOpen(false);
      setChangeSummary('');
      await fetchDecisionDetails();
    } catch (err) {
      console.error('Failed to update decision:', err);
      alert(err.response?.data?.detail || 'Failed to update decision.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete Decision
  const handleDeleteDecision = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this decision?')) return;
    try {
      await api.delete(`/decisions/${id}`);
      navigate('/decisions');
    } catch (err) {
      console.error('Failed to delete decision:', err);
      alert(err.response?.data?.detail || 'Failed to delete decision.');
    }
  };

  // Handle Add Alternative
  const handleAddAlternative = async (e) => {
    e.preventDefault();
    setSavingAlt(true);
    try {
      const prosList = altPros.split('\n').map(s => s.trim()).filter(Boolean);
      const consList = altCons.split('\n').map(s => s.trim()).filter(Boolean);

      await api.post(`/decisions/${id}/alternatives`, {
        title: altTitle,
        description: altDescription,
        pros: prosList,
        cons: consList,
        estimated_cost: parseFloat(altCost) || 0,
        feasibility_score: parseInt(altFeasibility) || 5,
        risk_assessment: altRisk
      });

      // Reset
      setAltTitle('');
      setAltDescription('');
      setAltPros('');
      setAltCons('');
      setAltCost(0);
      setAltFeasibility(7);
      setAltRisk('');
      setIsAddAltOpen(false);
      await fetchDecisionDetails();
    } catch (err) {
      console.error('Failed to add alternative:', err);
      alert(err.response?.data?.detail || 'Failed to add alternative.');
    } finally {
      setSavingAlt(false);
    }
  };

  // Handle Open Compare Matrix
  const handleOpenCompare = async () => {
    setIsCompareOpen(true);
    setLoadingCompare(true);
    try {
      const res = await api.get(`/decisions/${id}/alternatives/compare`);
      setComparisonData(res.data);
    } catch (err) {
      console.error('Failed to fetch comparison matrix:', err);
    } finally {
      setLoadingCompare(false);
    }
  };

  // Handle Post Comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      await api.post(`/decisions/${id}/comments`, {
        comment_type: commentType,
        content: commentText,
        parent_id: replyingTo ? replyingTo.id : null
      });

      setCommentText('');
      setReplyingTo(null);
      await fetchDecisionDetails();
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert(err.response?.data?.detail || 'Failed to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await api.post(`/decisions/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadFile(null);
      await fetchDecisionDetails();
    } catch (err) {
      console.error('Failed to upload file:', err);
      setUploadError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Attachment Download
  const handleDownloadAttachment = async (fileId, fileName) => {
    try {
      const res = await api.get(`/decisions/${id}/attachments/${fileId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 space-x-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-base font-semibold">Loading decision workbench...</span>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span>{error || 'Decision not found'}</span>
        </div>
        <Link
          to="/decisions"
          className="inline-flex items-center space-x-2 text-sm font-bold text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Decisions List</span>
        </Link>
      </div>
    );
  }

  const isAuthor = decision.created_by_id === user?.id;
  const canEdit = isAuthor || isAdmin || isManager || isReviewer;
  const canDelete = isAuthor || isAdmin || isManager;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/decisions"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Decisions Knowledge Hub</span>
        </Link>

        <div className="flex items-center space-x-3">
          {canEdit && (
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
            >
              <Edit3 className="w-4 h-4 text-blue-400" />
              <span>Edit / Update Status</span>
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDeleteDecision}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors border border-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Decision Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        
        <div className="flex flex-wrap items-center gap-3">
          <DecisionStatusBadge status={decision.status} size="lg" />
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>{decision.category}</span>
          </span>
          <span className="text-xs font-mono text-slate-500">ID #{decision.id}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          {decision.title}
        </h1>

        {/* Problem Statement Box */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Problem Statement & Technical Context</span>
          </span>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {decision.problem_statement}
          </p>
        </div>

        {/* Meta Info Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-3">
            <span>Author:</span>
            <span className="text-slate-200 font-semibold flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>{decision.creator?.full_name || `User #${decision.created_by_id}`}</span>
            </span>
            {decision.creator?.role && <RoleBadge role={decision.creator.role} size="sm" />}
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Created: {new Date(decision.created_at).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Updated: {new Date(decision.updated_at).toLocaleDateString()}</span>
            </span>
          </div>
        </div>

      </div>

      {/* Interactive Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('alternatives')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
            activeTab === 'alternatives'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Alternatives ({decision.alternatives?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('discussions')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
            activeTab === 'discussions'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Discussions & Notes ({decision.comments?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('versions')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
            activeTab === 'versions'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Version Snapshots ({decision.versions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('attachments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
            activeTab === 'attachments'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>Attachments ({decision.attachments?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: ALTERNATIVES ANALYSIS */}
      {activeTab === 'alternatives' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Evaluated Alternatives</h2>
              <p className="text-xs text-slate-400">Side-by-side technical options, trade-offs, feasibility, and risk profiles.</p>
            </div>

            <div className="flex items-center space-x-3">
              {decision.alternatives?.length > 1 && (
                <button
                  onClick={handleOpenCompare}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold transition-colors border border-indigo-500/30"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Compare Matrix</span>
                </button>
              )}

              <button
                onClick={() => setIsAddAltOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Alternative</span>
              </button>
            </div>
          </div>

          {!decision.alternatives || decision.alternatives.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-3">
              <GitBranch className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">No alternatives evaluated yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Add 2 or more architectural alternatives to run trade-off analysis and side-by-side scoring.
              </p>
              <button
                onClick={() => setIsAddAltOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Alternative</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {decision.alternatives.map((alt, index) => (
                <div
                  key={alt.id}
                  className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                          Option #{index + 1}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">{alt.title}</h3>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold shrink-0">
                        Score: {alt.feasibility_score}/10
                      </div>
                    </div>

                    {alt.description && (
                      <p className="text-slate-300 text-xs leading-relaxed">{alt.description}</p>
                    )}

                    {/* Pros & Cons Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                        <span className="text-[11px] font-bold uppercase text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pros / Advantages</span>
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {alt.pros && alt.pros.length > 0 ? (
                            alt.pros.map((p, i) => (
                              <li key={i} className="flex items-start space-x-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{p}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-500 italic">No pros listed</li>
                          )}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-2">
                        <span className="text-[11px] font-bold uppercase text-rose-400 flex items-center space-x-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cons / Trade-offs</span>
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {alt.cons && alt.cons.length > 0 ? (
                            alt.cons.map((c, i) => (
                              <li key={i} className="flex items-start space-x-1.5">
                                <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <span>{c}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-500 italic">No cons listed</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Footer Metrics */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Est. Cost:</span>
                      <span className="text-slate-200 font-bold">${alt.estimated_cost?.toLocaleString()}</span>
                    </div>

                    {alt.risk_assessment && (
                      <span className="text-slate-400 text-[11px] max-w-[200px] truncate" title={alt.risk_assessment}>
                        Risk: {alt.risk_assessment}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DISCUSSIONS & RATIONALE */}
      {activeTab === 'discussions' && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Discussion & Architectural Rationale</h2>
              <p className="text-xs text-slate-400">Collaborative threaded commentary, Architecture Review Board meeting notes, and decision rationale.</p>
            </div>
          </div>

          {/* Comment Creation Box */}
          <form onSubmit={handlePostComment} className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            {replyingTo && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between text-blue-300">
                <span className="flex items-center space-x-2">
                  <Reply className="w-3.5 h-3.5" />
                  <span>Replying to {replyingTo.author?.full_name || 'Comment'}: "{replyingTo.content.substring(0, 50)}..."</span>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase text-slate-400 mr-2">Tag Type:</span>
              <button
                type="button"
                onClick={() => setCommentType('general_comment')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  commentType === 'general_comment'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                General Comment
              </button>
              <button
                type="button"
                onClick={() => setCommentType('meeting_note')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  commentType === 'meeting_note'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Meeting Note
              </button>
              <button
                type="button"
                onClick={() => setCommentType('rationale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  commentType === 'rationale'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Architectural Rationale
              </button>
            </div>

            <textarea
              required
              rows={3}
              placeholder={
                commentType === 'rationale'
                  ? 'State why specific alternatives or parameters were chosen...'
                  : commentType === 'meeting_note'
                  ? 'Record decisions, sync timestamps, or Architecture Review Board findings...'
                  : 'Add a thought, question, or comment on this decision...'
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={postingComment || !commentText.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {postingComment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>Post Entry</span>
                )}
              </button>
            </div>
          </form>

          {/* Comments List / Hierarchy */}
          {!decision.comments || decision.comments.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center border border-slate-800 text-slate-400 text-xs">
              No comments or rationale notes posted yet. Start the conversation above!
            </div>
          ) : (
            <div className="space-y-4">
              {decision.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4"
                >
                  {/* Root comment header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                        {comment.author?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{comment.author?.full_name}</span>
                          {comment.author?.role && <RoleBadge role={comment.author.role} size="sm" />}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <CommentTypeBadge type={comment.comment_type} />
                  </div>

                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed pl-11 whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  <div className="pl-11 flex items-center justify-between pt-1">
                    <button
                      onClick={() => setReplyingTo(comment)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Threaded Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 sm:ml-11 pl-4 border-l-2 border-slate-800 space-y-3 pt-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CornerDownRight className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-xs font-bold text-slate-200">{reply.author?.full_name}</span>
                              {reply.author?.role && <RoleBadge role={reply.author.role} size="sm" />}
                              <span className="text-[10px] text-slate-500">{new Date(reply.created_at).toLocaleTimeString()}</span>
                            </div>
                            <CommentTypeBadge type={reply.comment_type} />
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed pl-5 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 3: VERSION SNAPSHOTS */}
      {activeTab === 'versions' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Immutable Version History & Replay</h2>
            <p className="text-xs text-slate-400">
              Every edit, status change, or alternative modification automatically snapshots the state for full governance replay.
            </p>
          </div>

          <div className="space-y-3">
            {decision.versions?.map((ver) => (
              <div
                key={ver.id}
                className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                    v{ver.version_number}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">
                      {ver.change_summary || 'Decision revision captured.'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Changed by: <strong className="text-slate-300">{ver.changed_by?.full_name || 'System / Author'}</strong></span>
                      <span>•</span>
                      <span>{new Date(ver.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSnapshot(ver)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 shrink-0 self-end sm:self-auto transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span>Inspect Snapshot</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ATTACHMENTS */}
      {activeTab === 'attachments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Document Attachments</h2>
              <p className="text-xs text-slate-400">Upload architectural diagrams, benchmark PDFs, and specs.</p>
            </div>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleFileUpload} className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shrink-0 shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center space-x-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Upload Document</span>
              </button>
            </div>

            {uploadError && (
              <p className="text-rose-400 text-xs">{uploadError}</p>
            )}
          </form>

          {/* Attachment List */}
          {!decision.attachments || decision.attachments.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center border border-slate-800 text-slate-400 text-xs">
              No files or documents attached yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {decision.attachments.map((att) => (
                <div
                  key={att.id}
                  className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate" title={att.file_name}>
                        {att.file_name}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {(att.file_size / 1024).toFixed(1)} KB • {new Date(att.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadAttachment(att.id, att.file_name)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors shrink-0"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT DECISION MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card rounded-3xl border border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Edit Decision & Create Snapshot</h2>
              <button onClick={() => setIsEditOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Category</label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Workflow Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Problem Statement</label>
                <textarea
                  required
                  rows={4}
                  value={editProblem}
                  onChange={(e) => setEditProblem(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-amber-400 mb-1.5">
                  Change Summary / Audit Note (Version Reason)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Updated status to Under Review following ARB sync"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save & Snapshot</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ALTERNATIVE MODAL */}
      {isAddAltOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card rounded-3xl border border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Add Alternative Option</h2>
              <button onClick={() => setIsAddAltOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAlternative} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Alternative Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS OpenSearch Managed Cluster"
                  value={altTitle}
                  onChange={(e) => setAltTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Technical Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of how this alternative is architected..."
                  value={altDescription}
                  onChange={(e) => setAltDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-emerald-400 mb-1.5">
                    Pros / Advantages (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="High throughput&#10;Multi-AZ replication"
                    value={altPros}
                    onChange={(e) => setAltPros(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-xs glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-rose-400 mb-1.5">
                    Cons / Limitations (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Higher cost&#10;JVM memory tuning required"
                    value={altCons}
                    onChange={(e) => setAltCons(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-xs glass-input text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Estimated Cost ($ / yr)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={altCost}
                    onChange={(e) => setAltCost(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Feasibility Score (1 - 10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={altFeasibility}
                    onChange={(e) => setAltFeasibility(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Risk Assessment</label>
                <input
                  type="text"
                  placeholder="e.g. Low risk due to existing team competency"
                  value={altRisk}
                  onChange={(e) => setAltRisk(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAltOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAlt}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2"
                >
                  {savingAlt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Append Alternative</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPARISON MATRIX MODAL */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card rounded-3xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Side-by-Side Alternative Comparison</h2>
              </div>
              <button onClick={() => setIsCompareOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingCompare ? (
              <div className="py-16 text-center text-slate-400 flex items-center justify-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span>Generating comparison matrix...</span>
              </div>
            ) : comparisonData ? (
              <div className="space-y-6">
                
                {/* Aggregate Summary Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Options Evaluated</span>
                    <p className="text-xl font-extrabold text-white mt-1">{comparisonData.metrics.total_alternatives}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-bold text-blue-400 uppercase">Highest Feasibility</span>
                    <p className="text-xs font-bold text-blue-300 mt-1 truncate">{comparisonData.metrics.highest_feasibility_alternative}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase">Lowest Cost Option</span>
                    <p className="text-xs font-bold text-emerald-300 mt-1 truncate">{comparisonData.metrics.lowest_cost_alternative}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-bold text-purple-400 uppercase">Avg Feasibility</span>
                    <p className="text-xl font-extrabold text-purple-300 mt-1">{comparisonData.metrics.average_feasibility} / 10</p>
                  </div>
                </div>

                {/* Side-by-Side Table Matrix */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60">
                        <th className="p-3 text-slate-400 uppercase font-semibold">Evaluation Criteria</th>
                        {comparisonData.alternatives.map((alt) => (
                          <th key={alt.id} className="p-3 font-bold text-white text-sm min-w-[220px]">
                            {alt.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr>
                        <td className="p-3 font-semibold text-slate-400">Feasibility Score</td>
                        {comparisonData.alternatives.map((alt) => (
                          <td key={alt.id} className="p-3">
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                              {alt.feasibility_score} / 10
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-400">Estimated Cost</td>
                        {comparisonData.alternatives.map((alt) => (
                          <td key={alt.id} className="p-3 font-bold text-emerald-400">
                            ${alt.estimated_cost?.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-400">Key Strengths (Pros)</td>
                        {comparisonData.alternatives.map((alt) => (
                          <td key={alt.id} className="p-3 space-y-1">
                            {alt.pros.map((p, i) => (
                              <div key={i} className="flex items-start space-x-1 text-slate-300">
                                <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{p}</span>
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-400">Trade-offs (Cons)</td>
                        {comparisonData.alternatives.map((alt) => (
                          <td key={alt.id} className="p-3 space-y-1">
                            {alt.cons.map((c, i) => (
                              <div key={i} className="flex items-start space-x-1 text-slate-300">
                                <X className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                                <span>{c}</span>
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-400">Risk Assessment</td>
                        {comparisonData.alternatives.map((alt) => (
                          <td key={alt.id} className="p-3 text-slate-300">
                            {alt.risk_assessment || 'N/A'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* SNAPSHOT INSPECTION MODAL */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card rounded-3xl border border-slate-700 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Version #{selectedSnapshot.version_number} Point-in-Time Snapshot</h2>
                <p className="text-xs text-slate-400">{selectedSnapshot.change_summary} ({new Date(selectedSnapshot.timestamp).toLocaleString()})</p>
              </div>
              <button onClick={() => setSelectedSnapshot(null)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-96">
              <pre>{JSON.stringify(selectedSnapshot.snapshot_data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DecisionDetailPage;
