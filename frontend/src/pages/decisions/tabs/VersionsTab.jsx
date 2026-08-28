import React from 'react';
import { GitCompare } from 'lucide-react';

export const VersionsTab = ({ versions, handleOpenDiff }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Immutable Version Snapshots</h2>
        <p className="text-xs text-slate-500">Audit trail of every snapshot created upon detail modifications and state changes</p>
      </div>

      <div className="space-y-4">
        {versions.map((ver, idx) => (
          <div key={ver.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                  v{ver.version_no}
                </span>
                <h4 className="font-bold text-slate-900">{ver.reason}</h4>
              </div>
              <p className="text-slate-500 text-[11px]">
                Created by <strong className="text-slate-700">{ver.created_by_name}</strong> on {new Date(ver.created_at).toLocaleString()}
              </p>
            </div>

            {idx < versions.length - 1 && (
              <button
                onClick={() => handleOpenDiff(versions[idx + 1].version_no, ver.version_no)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare with v{versions[idx + 1].version_no}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
