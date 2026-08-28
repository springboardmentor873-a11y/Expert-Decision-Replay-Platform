import React from 'react';
import { Plus, Check, CheckCircle2, Trash2 } from 'lucide-react';

export const AlternativesTab = ({
  decision,
  canEdit,
  setShowAddAltModal,
  handleSelectAlternative,
  handleDeleteAlternative,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Alternative Options Analysis</h2>
          <p className="text-xs text-slate-500">Record, compare, and select candidate technical or strategic solutions</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddAltModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Alternative</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decision.alternatives?.map((alt) => {
          const isSel = alt.is_selected || alt.id === decision.selected_alternative_id;
          return (
            <div
              key={alt.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all shadow-xs ${
                isSel ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/15' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{alt.title}</h3>
                  {isSel && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      SELECTED
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line min-h-[60px]">
                  {alt.description || 'No detailed description provided.'}
                </p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Calculated Weighted Score</span>
                  <span className="text-sm font-bold text-slate-900">
                    {alt.total_score !== null ? (
                      <span className="text-blue-600 text-base">{alt.total_score} <span className="text-xs text-slate-400">/ 100</span></span>
                    ) : (
                      'Not Scored'
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                {canEdit && !isSel ? (
                  <button
                    onClick={() => handleSelectAlternative(alt.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Select as Chosen</span>
                  </button>
                ) : isSel ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Active Choice
                  </span>
                ) : (
                  <div></div>
                )}

                {canEdit && (
                  <button
                    onClick={() => handleDeleteAlternative(alt.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete alternative"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
