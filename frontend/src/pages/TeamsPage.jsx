import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users2, Plus, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export const TeamsPage = () => {
  const { isManager } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Team Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
    } catch (err) {
      console.error("Failed to load teams:", err);
      setError("Failed to fetch teams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await api.post('/teams', { name, description });
      setTeams((prev) => [...prev, res.data]);
      setName('');
      setDescription('');
      setIsModalOpen(false);
      setSuccessMsg(`Team "${res.data.name}" created successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Failed to create team:", err);
      setError(err.response?.data?.detail || "Failed to create team.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-2">
            <Users2 className="w-3.5 h-3.5" />
            <span>Organization Structure</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Teams & Departments</h1>
          <p className="text-slate-400 text-sm mt-1">
            Explore organizational teams, descriptions, and functional units.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Team</span>
          </button>
        )}
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Teams Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <span>Loading teams catalog...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-800">
          <Users2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No Teams Created Yet</h3>
          <p className="text-slate-500 text-sm mt-1">
            Managers and administrators can create teams using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 mb-3">
                  <Users2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{team.name}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  {team.description || 'No description provided for this team.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </span>
                <span className="font-semibold text-slate-400">Team #{team.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">Create New Team</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Analytics & AI"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of team objectives..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamsPage;
