import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertCircle, Plus, Trash2, Layers } from 'lucide-react';
import api from '../../api/client';

export const DecisionCreatePage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tags, setTags] = useState([]);

  // Initial Alternative & Criterion
  const [initialAltTitle, setInitialAltTitle] = useState('');
  const [initialAltDesc, setInitialAltDesc] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, teamsRes, tagsRes] = await Promise.all([
          api.get('/decisions/categories'),
          api.get('/teams'),
          api.get('/decisions/tags'),
        ]);
        setCategories(catsRes.data);
        setTeams(teamsRes.data);
        setTags(tagsRes.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMetadata();
  }, []);

  const handleTagToggle = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !problemStatement.trim()) {
      setError('Please provide a decision title and problem statement.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Create Decision
      const decisionPayload = {
        title: title.trim(),
        problem_statement: problemStatement.trim(),
        category_id: categoryId || null,
        team_id: teamId || null,
        tag_ids: selectedTags,
      };

      const res = await api.post('/decisions', decisionPayload);
      const newDecision = res.data;

      // 2. Add initial alternative if provided
      if (initialAltTitle.trim()) {
        await api.post(`/decisions/${newDecision.id}/alternatives`, {
          title: initialAltTitle.trim(),
          description: initialAltDesc.trim() || null,
          sort_order: 1,
        });
      }

      navigate(`/decisions/${newDecision.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create decision record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/decisions"
          className="p-2 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Record New Decision</h1>
          <p className="text-xs text-slate-500">Initiate a structured organizational decision case file</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-700 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Case Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            1. Core Case Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Decision Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Standardize on Managed Kubernetes (EKS/GKE) for Multi-Region Deployments"
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 px-3.5 py-2.5 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Problem Statement & Context *
            </label>
            <textarea
              required
              rows={4}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Describe the organizational challenge, technical constraints, trigger event, and why a decision is necessary..."
              className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 p-3.5 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-700 p-2.5 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Responsible Team
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-700 p-2.5 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags selection */}
          {tags.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Classification Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const isSel = selectedTags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTagToggle(t.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                        isSel
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Initial Alternative (Optional) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">2. Proposed Candidate Alternative</h2>
              <p className="text-xs text-slate-500">You can add more alternatives and scoring criteria after creation</p>
            </div>
            <Layers className="w-5 h-5 text-slate-400" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Alternative Option Name
            </label>
            <input
              type="text"
              value={initialAltTitle}
              onChange={(e) => setInitialAltTitle(e.target.value)}
              placeholder="e.g. Option A: Apache Kafka on Amazon EKS with Outbox Pattern"
              className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 px-3.5 py-2.5 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Technical Summary & Trade-offs
            </label>
            <textarea
              rows={2}
              value={initialAltDesc}
              onChange={(e) => setInitialAltDesc(e.target.value)}
              placeholder="Brief description of feasibility, cost profile, and architecture..."
              className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 p-3 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/decisions"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Case File...' : 'Create Decision Case'}
          </button>
        </div>
      </form>
    </div>
  );
};
