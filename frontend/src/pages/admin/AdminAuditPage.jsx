import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Calendar, User, Eye } from 'lucide-react';
import api from '../../api/client';

export const AdminAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;

      const res = await api.get('/audit', { params });
      setLogs(res.data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-evident, immutable records of all user actions, state transitions, and modifications
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="">All Actions</option>
          <option value="create_decision">Create Decision</option>
          <option value="update_decision">Update Decision</option>
          <option value="submit_for_review">Submit for Review</option>
          <option value="approve_decision_step">Approve Step</option>
          <option value="reject_decision">Reject Decision</option>
          <option value="request_decision_changes">Request Changes</option>
          <option value="record_outcome">Record Outcome</option>
          <option value="assign_user_role">Assign Role</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="">All Entity Types</option>
          <option value="decision">Decision</option>
          <option value="alternative">Alternative</option>
          <option value="criterion">Criterion</option>
          <option value="approval">Approval</option>
          <option value="user">User</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No audit records match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Timestamp (UTC)</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-6">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(l.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {l.actor_name || l.actor_email || 'System'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase text-[10px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] text-slate-700 font-semibold">
                      {l.entity_type} {l.entity_id ? `(${String(l.entity_id).slice(0, 8)})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{l.ip_address || '?'}</td>
                    <td className="py-3 px-6 text-slate-500 max-w-xs truncate text-[11px]">
                      {l.extra ? JSON.stringify(l.extra) : '?'}
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
