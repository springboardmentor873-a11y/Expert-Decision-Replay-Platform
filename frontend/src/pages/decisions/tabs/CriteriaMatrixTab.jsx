import React from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';

export const CriteriaMatrixTab = ({
  matrix,
  canEdit,
  editingScores,
  savingMatrix,
  setShowAddCritModal,
  handleSaveEvaluationMatrix,
  handleScoreChange,
  handleDeleteCriterion,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Weighted Evaluation & Decision Matrix</h2>
          <p className="text-xs text-slate-500">Assign criteria weights and score each candidate alternative from 0 to 100</p>
        </div>
        <div className="flex items-center gap-2.5">
          {canEdit && (
            <>
              <button
                onClick={() => setShowAddCritModal(true)}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Criterion</span>
              </button>

              <button
                onClick={handleSaveEvaluationMatrix}
                disabled={savingMatrix}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{savingMatrix ? 'Saving Scores...' : 'Save Matrix Scores'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="py-3.5 px-6 min-w-[200px]">Evaluation Criterion</th>
                <th className="py-3.5 px-4 w-28 text-center">Weight</th>
                {matrix?.alternatives?.map((alt) => (
                  <th key={alt.id} className="py-3.5 px-4 text-center min-w-[160px]">
                    <span className="font-bold text-slate-900 block truncate">{alt.title}</span>
                    {alt.total_score !== null && (
                      <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
                        Composite: {alt.total_score}
                      </span>
                    )}
                  </th>
                ))}
                {canEdit && <th className="py-3.5 px-4 w-12 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix?.criteria?.map((crit) => (
                <tr key={crit.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6">
                    <span className="font-bold text-slate-900 block text-xs">{crit.name}</span>
                    {crit.description && <span className="text-[11px] text-slate-400 block mt-0.5">{crit.description}</span>}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700 text-xs">
                    {crit.weight}x
                  </td>
                  {matrix.alternatives.map((alt) => {
                    const cellKey = `${alt.id}_${crit.id}`;
                    const currentVal = editingScores[cellKey] ?? '';
                    return (
                      <td key={alt.id} className="py-3 px-4 text-center">
                        {canEdit ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentVal}
                            onChange={(e) => handleScoreChange(alt.id, crit.id, e.target.value)}
                            className="w-20 bg-slate-50 border border-slate-200 text-center font-bold text-xs py-1.5 px-2 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <span className="font-bold text-xs text-slate-900">{currentVal || '?'}</span>
                        )}
                      </td>
                    );
                  })}
                  {canEdit && (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteCriterion(crit.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete Criterion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="bg-blue-50/50 font-bold border-t-2 border-slate-200">
                <td className="py-4 px-6 text-xs text-slate-900 uppercase tracking-wider">
                  Weighted Total Score
                </td>
                <td className="py-4 px-4 text-center text-xs text-slate-500">100%</td>
                {matrix?.alternatives?.map((alt) => (
                  <td key={alt.id} className="py-4 px-4 text-center text-sm font-bold text-blue-700">
                    {alt.total_score !== null ? `${alt.total_score} / 100` : '?'}
                  </td>
                ))}
                {canEdit && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
