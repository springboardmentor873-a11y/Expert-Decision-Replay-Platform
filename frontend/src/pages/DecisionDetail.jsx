import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, MessageSquare, FileText, Send, Upload } from 'lucide-react';
import { decisionService } from '../services/decisionService';

const DecisionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [decision, setDecision] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAltForm, setShowAltForm] = useState(false);
  const [altForm, setAltForm] = useState({ description: '', pros: '', cons: '' });
  const [commentText, setCommentText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const decData = await decisionService.getDecision(id);
      setDecision(decData);
      
      const [altData, discData, docData] = await Promise.all([
        decisionService.getAlternatives(id),
        decisionService.getDiscussions(id),
        decisionService.getDocuments(id)
      ]);
      
      setAlternatives(altData);
      setDiscussions(discData);
      setDocuments(docData);
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

  const handleCreateAlternative = async (e) => {
    e.preventDefault();
    try {
      await decisionService.createAlternative(id, altForm);
      setAltForm({ description: '', pros: '', cons: '' });
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
      await decisionService.createDiscussion(id, { content: commentText });
      setCommentText('');
      const discData = await decisionService.getDiscussions(id);
      setDiscussions(discData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    try {
      await decisionService.uploadDocument(id, selectedFile);
      setSelectedFile(null);
      const docData = await decisionService.getDocuments(id);
      setDocuments(docData);
    } catch (err) {
      console.error(err);
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
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Overview</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{decision.description || "No description provided."}</p>
            <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{decision.status}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Version</span>
                <span className="text-sm font-semibold text-slate-900">v{decision.version}</span>
              </div>
            </div>
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Documents & Discussion */}
        <div className="space-y-8">
          {/* Documents */}
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" /> Documents
            </h3>
            
            <form onSubmit={handleFileUpload} className="flex gap-2 mb-4">
              <input 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files[0])} 
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 w-full"
              />
              <button type="submit" className="p-2 bg-brand text-white rounded-full hover:bg-brand-hover" disabled={!selectedFile}>
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

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                className="form-input py-2" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="p-2 bg-brand text-white rounded-xl hover:bg-brand-hover">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DecisionDetail;
