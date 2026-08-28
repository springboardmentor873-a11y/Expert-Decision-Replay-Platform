import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  FileEdit, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  Plus, 
  Layers, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DecisionStatusBadge } from '../components/ui/StatusBadge';
import api from '../api/client';

export const DashboardPage = () => {
  const { user, roleCode, isAdmin, isManager, isReviewer, isEmployee } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentDecisions, setRecentDecisions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, decisionsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/decisions?limit=5'),
        ]);
        setStats(statsRes.data);
        setRecentDecisions(decisionsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metrics = stats?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.profile?.full_name || user?.email}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin && 'Enterprise System Administrator Console ? Full Governance & Audit Control'}
            {isManager && 'Executive Management Hub ? Authorize Decisions & Review Performance'}
            {isReviewer && 'Technical Reviewer Center ? Verify Proposals & Architecture Cases'}
            {isEmployee && 'Decision Workspace ? Propose, Manage & Track Strategic Cases'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/decisions/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Decision</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* EMPLOYEE METRICS */}
        {isEmployee && (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Decisions</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.my_decisions_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Total cases authored</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Drafts</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <FileEdit className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.drafts_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Work in progress</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under Review</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.under_review_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Awaiting approval</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.approved_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Authorized for rollout</p>
            </div>
          </>
        )}

        {/* REVIEWER METRICS */}
        {isReviewer && (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Reviews</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.pending_reviews_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Requiring your verification</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Reviews</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.assigned_reviews_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Total lifecycle assignments</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Reviews</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.completed_reviews_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Actions finalized</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Action</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <Link to="/reviews" className="inline-block mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">
                Go to Review Queue &rarr;
              </Link>
              <p className="text-xs text-slate-400 mt-1">Evaluate pending cases</p>
            </div>
          </>
        )}

        {/* MANAGER METRICS */}
        {isManager && (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.pending_approvals_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Awaiting executive sign-off</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Decisions</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.team_decisions_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Active case files</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed Off</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.approved_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Authorized for execution</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Turnaround</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.avg_turnaround_days ?? 1.5}d</p>
              <p className="text-xs text-slate-400 mt-1">Average cycle speed</p>
            </div>
          </>
        )}

        {/* ADMINISTRATOR METRICS */}
        {isAdmin && (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Decisions</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.total_decisions ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Across all departments</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Users</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.active_users ?? 0} / {metrics.total_users ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Active enterprise seats</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.pending_approvals ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Awaiting tier completion</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Rate</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.completion_rate_pct ?? 0}%</p>
              <p className="text-xs text-slate-400 mt-1">Approval throughput</p>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Decisions List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Decision Case Files</h2>
              <p className="text-xs text-slate-500">Live feed of strategic decisions across teams</p>
            </div>
            <Link to="/decisions" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentDecisions.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No decision cases recorded yet.</p>
            ) : (
              recentDecisions.map((d) => (
                <div key={d.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/decisions/${d.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate block transition-colors"
                    >
                      {d.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span>By <strong className="text-slate-600 font-medium">{d.owner_name}</strong></span>
                      <span>?</span>
                      <span>{d.category?.name || 'General'}</span>
                      <span>?</span>
                      <span>v{d.current_version_no}</span>
                    </div>
                  </div>
                  <DecisionStatusBadge status={d.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar Widget: Actions or Audit Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              {isAdmin ? 'System Audit Trail' : (isManager || isReviewer ? 'Action Required' : 'Quick Actions')}
            </h2>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          {isAdmin ? (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-96">
              {stats?.activity_feed?.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No recent audit logs.</p>
              ) : (
                stats?.activity_feed?.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] block">
                      {a.action}
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">Entity: {a.entity_type}</span>
                    <span className="text-slate-400 text-[10px] block mt-1">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              <Link
                to="/decisions/new"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Record New Decision</h4>
                  <p className="text-[11px] text-slate-500">Initiate alternative analysis case</p>
                </div>
              </Link>

              <Link
                to="/repository"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Replay Past Decisions</h4>
                  <p className="text-[11px] text-slate-500">Search organizational knowledge</p>
                </div>
              </Link>

              <Link
                to="/reports"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Generate Audit Reports</h4>
                  <p className="text-[11px] text-slate-500">Export PDF & Excel case files</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
