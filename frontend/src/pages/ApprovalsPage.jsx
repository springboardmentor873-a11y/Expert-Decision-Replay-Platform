import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import api from '../api/client';

export const ApprovalsPage = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const res = await api.get('/approvals/pending');
        setApprovals(res.data);
      } catch (err) {
        console.error('Error loading pending approvals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Approvals Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Decisions that have passed technical review and require executive management sign-off
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-slate-400 mt-2">Loading approvals queue...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="py-16 text-center px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">All sign-offs completed!</h3>
            <p className="text-xs text-slate-400 mt-1">There are no decisions pending executive authorization at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Decision Title</th>
                  <th className="py-3.5 px-4">Approval Stage</th>
                  <th className="py-3.5 px-4">Lead Author</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 min-w-[280px]">
                      <Link to={`/decisions/${a.decision_id}`} className="font-bold text-slate-900 hover:text-blue-600">
                        {a.decision_title}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-xs text-slate-800">{a.step_name}</span>
                      <span className="block text-[10px] text-slate-400 uppercase">Tier {a.step_order}</span>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-700">
                      {a.decision_owner_name}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/decisions/${a.decision_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
                      >
                        <span>Authorize</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
