import React, { useState, useEffect } from 'react';
import { Plus, Check, CheckCircle2, Trash2, Save, Radio } from 'lucide-react';

export const AlternativesTab = ({
  decision,
  canEdit,
  setShowAddAltModal,
  handleSelectAlternative,
  handleDeleteAlternative,
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState(decision.selected_alternative_id || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedChoiceId(decision.selected_alternative_id || null);
  }, [decision.selected_alternative_id]);

  const hasUnsavedChange = selectedChoiceId && selectedChoiceId !== decision.selected_alternative_id;

  const handleSaveChoice = async (altId) => {
    const targetId = altId || selectedChoiceId;
    if (!targetId) return;
    setIsSaving(true);
    try {
      await handleSelectAlternative(targetId);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Alternative Options Analysis</h2>
          <p className="text-xs text-slate-500">Record, compare, and designate the selected candidate solution</p>
        </div>

        <div className="flex items-center gap-2.5">
          {canEdit && (
            <>
              {hasUnsavedChange && (
                <button
                  onClick={() => handleSaveChoice(selectedChoiceId)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs animate-pulse disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Choice...' : 'Save Chosen Option'}</span>
                </button>
              )}

              <button
                onClick={() => setShowAddAltModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Alternative</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decision.alternatives?.map((alt) => {
          const isSavedSelected = alt.id === decision.selected_alternative_id;
          const isLocallySelected = alt.id === selectedChoiceId;

          let cardBorder = 'border-slate-200 hover:border-slate-300';
          if (isSavedSelected) {
            cardBorder = 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/15';
          } else if (isLocallySelected) {
            cardBorder = 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20';
          }

          return (
            <div
              key={alt.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all shadow-xs ${cardBorder}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {canEdit && (
                      <input
                        type="radio"
                        name="selectedAlternative"
                        checked={isLocallySelected}
                        onChange={() => setSelectedChoiceId(alt.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Select this candidate option"
                      />
                    )}
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{alt.title}</h3>
                  </div>

                  {isSavedSelected && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      DESIGNATED CHOICE
                    </span>
                  )}
                  {!isSavedSelected && isLocallySelected && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      READY TO SAVE
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

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                {canEdit ? (
                  isSavedSelected ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Saved Selection</span>
                    </span>
                  ) : isLocallySelected ? (
                    <button
                      onClick={() => handleSaveChoice(alt.id)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-lg shadow-xs transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save this Option'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedChoiceId(alt.id);
                        handleSaveChoice(alt.id);
                      }}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-lg transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Choose & Save</span>
                    </button>
                  )
                ) : (
                  isSavedSelected ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Selected Choice</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Candidate option</span>
                  )
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
