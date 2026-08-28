import React from 'react';
import { Plus, AlertTriangle, Trash2 } from 'lucide-react';

export const RisksTab = ({ decision, canEdit, setShowAddRiskModal, handleDeleteRisk }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Risk Assessment & Mitigation Strategy</h2>
          <p className="text-xs text-slate-500">Document architectural, operational, security, and financial risks</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddRiskModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Risk</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {decision.risks?.map((r) => (
          <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <h4 className="font-bold text-sm text-slate-900">{r.title}</h4>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleDeleteRisk(r.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">
                Severity: {r.severity}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
                Likelihood: {r.likelihood}
              </span>
            </div>

            {r.description && <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>}

            {r.mitigation && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <strong className="text-slate-700 font-bold block mb-0.5">Mitigation:</strong>
                <span className="text-slate-600">{r.mitigation}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
