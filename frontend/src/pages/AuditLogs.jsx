import React, { useEffect, useState } from 'react';
import { decisionService } from '../services/decisionService';
import { ShieldAlert, Activity } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await decisionService.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  if (loading) return <div className="p-8">Loading audit logs...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-8 h-8 text-brand" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 mt-1">System-wide activity and compliance tracking</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">User ID</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Entity</th>
                <th className="py-3 px-4 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    <Activity className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{log.user_id || 'System'}</td>
                    <td className="py-3 px-4 text-brand font-semibold">{log.action}</td>
                    <td className="py-3 px-4 text-slate-600">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs" title={log.description}>{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
