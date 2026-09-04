import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Clock, CheckCircle, FileText } from 'lucide-react';
import { decisionService } from '../services/decisionService';
import { useNavigate } from 'react-router-dom';

const Decisions = () => {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'DRAFT',
  });

  const loadDecisions = () => {
    setLoading(true);
    decisionService.getDecisions()
      .then(data => {
        setDecisions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    decisionService.createDecision(formData)
      .then((newDecision) => {
        setShowForm(false);
        setFormData({ title: '', description: '', category: '', status: 'DRAFT' });
        loadDecisions();
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="max-w-6xl">
      {/* Top Header Section */}
      <div className="mb-8">
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Workspace</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Decisions</h1>
      </div>

      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-xs font-bold text-brand tracking-wider uppercase mb-1">Decision Management</p>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">All Decisions</h2>
          <p className="text-sm text-slate-500">Create, view and manage organizational decisions.</p>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            New Decision
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-8">
          <button 
            onClick={() => setShowForm(false)}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            &times;
          </button>

          <h3 className="text-xl font-bold text-slate-900 mb-1">Create New Decision</h3>
          <p className="text-sm text-slate-500 mb-8">Record a new organizational problem to solve.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Decision Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="E.g., Q4 Marketing Software"
                  className="form-input"
                  required
                />
              </div>
              <div className="row-span-2">
                <label className="form-label">Description / Problem Statement</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the decision that needs to be made..."
                  rows="5"
                  className="form-input resize-none h-[calc(100%-2rem)]"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="E.g., Engineering"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-input cursor-pointer"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-4">
              Create Decision
            </button>
          </form>
        </div>
      )}

      {/* Decisions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500">Loading decisions...</p>
        ) : decisions.length === 0 ? (
          <p className="text-slate-500 col-span-3">No decisions found. Create one above!</p>
        ) : (
          decisions.map(decision => (
            <div 
              key={decision.id} 
              onClick={() => navigate(`/decisions/${decision.id}`)}
              className="card !p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/10 transition-all duration-300 cursor-pointer group border border-slate-200"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                  ${decision.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                    decision.status === 'UNDER_REVIEW' ? 'bg-orange-100 text-orange-700' : 
                    'bg-slate-100 text-slate-700'}`}>
                  {decision.status.replace('_', ' ')}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-brand/10 group-hover:border-brand/20 transition-colors">
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand transition-colors" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{decision.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-3 mb-4 h-15">
                {decision.description || "No description provided."}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand" />
                  v{decision.version}
                </div>
                {decision.category && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                    {decision.category}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Decisions;
