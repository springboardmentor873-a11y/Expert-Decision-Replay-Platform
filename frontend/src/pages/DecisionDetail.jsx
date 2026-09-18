import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Trash2, Plus, MessageSquare, FileText, Send, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { decisionService } from '../services/decisionService';

const DecisionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);
  const [decision, setDecision] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAltForm, setShowAltForm] = useState(false);
  const [altForm, setAltForm] = useState({ description: '', pros: '', cons: '', cost: '', feasibility: '', risk: '' });
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('Comment');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Edit Decision State
  const [isEditingDecision, setIsEditingDecision] = useState(false);
  const [editDecisionForm, setEditDecisionForm] = useState({ title: '', description: '', category: '' });
  
  // Document Upload State
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
  const [uploadMessage, setUploadMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const decData = await decisionService.getDecision(id);
      setDecision(decData);
      setEditDecisionForm({
        title: decData.title || '',
        description: decData.description || '',
        category: decData.category || ''
      });
      
      const [altData, discData, docData, usersData] = await Promise.all([
        decisionService.getAlternatives(id),
        decisionService.getDiscussions(id),
        decisionService.getDocuments(id),
        decisionService.getUsers()
      ]);
      
      setAlternatives(altData);
      setDiscussions(discData);
      setDocuments(docData);
      setUsers(usersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDeleteDecision = async () => {
    if (window.confirm('Are you sure you want to delete this decision?')) {
      try {
        await decisionService.deleteDecision(id);
        navigate('/decisions');
      } catch (err) {
        alert('Failed to delete decision.');
      }
    }
  };

  const handleEditDecision = async (e) => {
    e.preventDefault();
    try {
      const updated = await decisionService.updateDecision(id, editDecisionForm);
      setDecision(updated);
      setIsEditingDecision(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update decision.');
    }
  };

  const handleManagerAccept = async () => {
    try {
      const updated = await decisionService.updateDecision(id, { status: 'APPROVED' });
      setDecision(updated);
    } catch (err) {
      alert('Failed to approve decision');
    }
  };

  const handleManagerReject = async () => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      if (reason.trim()) {
        await decisionService.createDiscussion(id, { content: `Rejection Reason: ${reason}` });
      }
      const updated = await decisionService.updateDecision(id, { status: 'REJECTED' });
      setDecision(updated);
      
      // refresh discussions
      const discData = await decisionService.getDiscussions(id);
      setDiscussions(discData);
    } catch (err) {
      alert('Failed to reject decision');
      alert('Failed to reject decision');
    }
  };

  const handleRequestApproval = async (e) => {
    e.preventDefault();
    if (!selectedReviewer) return;
    try {
      await decisionService.createApproval(id, selectedReviewer);
      const decData = await decisionService.getDecision(id);
      setDecision(decData);
      setSelectedReviewer('');
      alert("Approval requested successfully");
    } catch (err) {
      alert("Failed to request approval");
    }
  };

  const handleReviewerAction = async (approvalId, status) => {
    const comments = window.prompt(`Enter comments for ${status}:`);
    if (comments === null) return;
    try {
      await decisionService.updateApproval(approvalId, status, comments);
      const decData = await decisionService.getDecision(id);
      setDecision(decData);
    } catch (err) {
      alert(`Failed to ${status.toLowerCase()}`);
    }
  };

  const handleCreateAlternative = async (e) => {
    e.preventDefault();
    try {
      await decisionService.createAlternative(id, altForm);
      setAltForm({ description: '', pros: '', cons: '', cost: '', feasibility: '', risk: '' });
      setShowAltForm(false);
      const altData = await decisionService.getAlternatives(id);
      setAlternatives(altData);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const formattedContent = commentType !== 'Comment' ? `[${commentType}] ${commentText}` : commentText;
      await decisionService.createDiscussion(id, { content: formattedContent });
      setCommentText('');
      setCommentType('Comment');
      const discData = await decisionService.getDiscussions(id);
      setDiscussions(discData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    setUploadStatus('uploading');
    setUploadMessage('Uploading document...');
    
    try {
      await decisionService.uploadDocument(id, selectedFile);
      setSelectedFile(null);
      
      // If decision was draft or rejected, automatically move to UNDER_REVIEW so manager sees it
      if (decision.status === 'DRAFT' || decision.status === 'REJECTED') {
        await decisionService.updateDecision(id, { status: 'UNDER_REVIEW' });
        // update local state
        setDecision(prev => ({ ...prev, status: 'UNDER_REVIEW' }));
      }
      
      const docData = await decisionService.getDocuments(id);
      setDocuments(docData);
      
      setUploadStatus('success');
      setUploadMessage('Document added successfully');
      
      // Reset status after a few seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
      
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
      setUploadMessage(err.response?.data?.detail || 'Document not added. An error occurred.');
    }
  };

  if (loading) return <div className="p-8">Loading decision details...</div>;
  if (!decision) return <div className="p-8">Decision not found.</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/decisions')} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-bold text-brand tracking-wider uppercase mb-1">Decision Workspace</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{decision.title}</h1>
        </div>
        <button onClick={handleDeleteDecision} className="btn-danger">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content: Overview & Alternatives */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-lg font-bold text-slate-900">Overview</h3>
              <div className="flex gap-2">
                {user?.role === 'MANAGER' && decision.status === 'UNDER_REVIEW' && (
                  <>
                    <button onClick={handleManagerAccept} className="px-3 py-1.5 bg-green-50 text-green-700 font-semibold text-sm rounded-lg hover:bg-green-100 transition-colors">
                      Accept
                    </button>
                    <button onClick={handleManagerReject} className="px-3 py-1.5 bg-red-50 text-red-700 font-semibold text-sm rounded-lg hover:bg-red-100 transition-colors">
                      Reject
                    </button>
                  </>
                )}
                
                {/* Pending approvals assigned to current user */}
                {decision.approvals?.filter(a => a.status === 'PENDING' && a.reviewer_id === user?.id).map(approval => (
                  <div key={approval.id} className="flex gap-2 mr-2">
                    <button onClick={() => handleReviewerAction(approval.id, 'APPROVED')} className="px-3 py-1.5 bg-green-50 text-green-700 font-semibold text-sm rounded-lg hover:bg-green-100 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => handleReviewerAction(approval.id, 'REJECTED')} className="px-3 py-1.5 bg-red-50 text-red-700 font-semibold text-sm rounded-lg hover:bg-red-100 transition-colors">
                      Reject
                    </button>
                  </div>
                ))}
                
                {!isEditingDecision && (
                  <button onClick={() => setIsEditingDecision(true)} className="text-sm font-semibold text-brand hover:text-brand-hover ml-2">
                    Edit Decision
                  </button>
                )}
              </div>
            </div>
            
            {isEditingDecision ? (
              <form onSubmit={handleEditDecision} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Title</label>
                  <input type="text" className="form-input" value={editDecisionForm.title} onChange={(e) => setEditDecisionForm({...editDecisionForm, title: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea rows="4" className="form-input resize-none" value={editDecisionForm.description} onChange={(e) => setEditDecisionForm({...editDecisionForm, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <input type="text" className="form-input" value={editDecisionForm.category} onChange={(e) => setEditDecisionForm({...editDecisionForm, category: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsEditingDecision(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-slate-600 whitespace-pre-wrap">{decision.description || "No description provided."}</p>
                <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{decision.status}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</span>
                    <span className="text-sm font-semibold text-slate-900">{decision.category || 'None'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Version</span>
                    <span className="text-sm font-semibold text-slate-900">v{decision.version}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
              <h3 className="text-lg font-bold text-slate-900">Alternatives ({alternatives.length})</h3>
              <button onClick={() => setShowAltForm(!showAltForm)} className="text-sm font-semibold text-brand flex items-center gap-1 hover:text-brand-hover">
                <Plus className="w-4 h-4" /> Add Option
              </button>
            </div>

            {showAltForm && (
              <form onSubmit={handleCreateAlternative} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <input 
                  type="text" 
                  placeholder="Alternative Name / Description" 
                  className="form-input" 
                  value={altForm.description}
                  onChange={(e) => setAltForm({...altForm, description: e.target.value})}
                  required 
                />
                <div className="grid grid-cols-2 gap-4">
                  <textarea placeholder="Pros..." className="form-input" value={altForm.pros} onChange={(e) => setAltForm({...altForm, pros: e.target.value})} />
                  <textarea placeholder="Cons..." className="form-input" value={altForm.cons} onChange={(e) => setAltForm({...altForm, cons: e.target.value})} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="Estimated Cost..." className="form-input" value={altForm.cost} onChange={(e) => setAltForm({...altForm, cost: e.target.value})} />
                  <input type="text" placeholder="Feasibility (e.g. High/Med/Low)..." className="form-input" value={altForm.feasibility} onChange={(e) => setAltForm({...altForm, feasibility: e.target.value})} />
                  <input type="text" placeholder="Risk (e.g. High/Med/Low)..." className="form-input" value={altForm.risk} onChange={(e) => setAltForm({...altForm, risk: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAltForm(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save Alternative</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {alternatives.length === 0 ? (
                <p className="text-slate-500 text-sm">No alternatives recorded yet.</p>
              ) : (
                alternatives.map(alt => (
                  <div key={alt.id} className="p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2">{alt.description}</h4>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {alt.pros && <div><span className="text-xs font-bold text-green-600 uppercase tracking-wider">Pros</span><p className="text-sm text-slate-600">{alt.pros}</p></div>}
                      {alt.cons && <div><span className="text-xs font-bold text-red-600 uppercase tracking-wider">Cons</span><p className="text-sm text-slate-600">{alt.cons}</p></div>}
                    </div>
                    {(alt.cost || alt.feasibility || alt.risk) && (
                      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100">
                        {alt.cost && <div className="bg-slate-50 px-3 py-1.5 rounded-lg"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cost</span><span className="text-sm font-semibold text-slate-800">{alt.cost}</span></div>}
                        {alt.feasibility && <div className="bg-slate-50 px-3 py-1.5 rounded-lg"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Feasibility</span><span className="text-sm font-semibold text-slate-800">{alt.feasibility}</span></div>}
                        {alt.risk && <div className="bg-slate-50 px-3 py-1.5 rounded-lg"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Risk</span><span className="text-sm font-semibold text-slate-800">{alt.risk}</span></div>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Documents & Discussion */}
        <div className="space-y-8">
          
          {/* Approvals Widget */}
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand" /> Approvals
            </h3>
            
            <div className="space-y-3 mb-4">
              {decision.approvals?.length === 0 ? (
                <p className="text-slate-500 text-sm">No approvals requested.</p>
              ) : (
                decision.approvals?.map(approval => (
                  <div key={approval.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-700">{approval.reviewer?.full_name || 'Reviewer'}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        approval.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        approval.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {approval.status}
                      </span>
                    </div>
                    {approval.comments && <p className="text-slate-500 mt-1">"{approval.comments}"</p>}
                  </div>
                ))
              )}
            </div>

            {decision.creator_id === user?.id && decision.status !== 'APPROVED' && (
              <form onSubmit={handleRequestApproval} className="flex gap-2">
                <select 
                  className="form-input py-2 text-sm flex-1"
                  value={selectedReviewer}
                  onChange={e => setSelectedReviewer(e.target.value)}
                >
                  <option value="">Select Reviewer...</option>
                  {users.filter(u => u.id !== user.id).map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary py-2 px-3 disabled:opacity-50" disabled={!selectedReviewer}>
                  Request
                </button>
              </form>
            )}
          </div>

          {/* Documents */}
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" /> Documents
            </h3>
            
            {uploadStatus !== 'idle' && (
              <div className={`mb-4 ${uploadStatus === 'success' ? 'alert-success' : uploadStatus === 'error' ? 'alert-error' : 'flex items-center gap-2 p-3 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200'}`}>
                {uploadStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {uploadStatus === 'error' && <XCircle className="w-4 h-4" />}
                {uploadStatus === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{uploadMessage}</span>
              </div>
            )}
            
            <form onSubmit={handleFileUpload} className="flex gap-2 mb-4">
              <input 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files[0])} 
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 w-full"
                disabled={uploadStatus === 'uploading'}
              />
              <button type="submit" className="p-2 bg-brand text-white rounded-full hover:bg-brand-hover disabled:opacity-50" disabled={!selectedFile || uploadStatus === 'uploading'}>
                <Upload className="w-4 h-4" />
              </button>
            </form>

            <ul className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-slate-500 text-sm">No documents attached.</p>
              ) : (
                documents.map(doc => (
                  <li key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-sm">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="truncate flex-1 font-medium text-slate-700">{doc.filename}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Discussion */}
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand" /> Discussion
            </h3>
            
            <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
              {discussions.length === 0 ? (
                <p className="text-slate-500 text-sm">No comments yet.</p>
              ) : (
                discussions.map(disc => (
                  <div key={disc.id} className="bg-slate-50 p-3 rounded-xl rounded-tl-none border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-800">{disc.user?.full_name || 'User'}</span>
                    </div>
                    <p className="text-sm text-slate-600">{disc.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="flex flex-col gap-2">
              <select 
                className="form-input py-2 text-sm" 
                value={commentType} 
                onChange={(e) => setCommentType(e.target.value)}
              >
                <option value="Comment">💬 Comment</option>
                <option value="Meeting Note">📝 Meeting Note</option>
                <option value="Decision Rationale">💡 Decision Rationale</option>
              </select>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add your thoughts..." 
                  className="form-input py-2" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" className="p-2 bg-brand text-white rounded-xl hover:bg-brand-hover">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DecisionDetail;
