import React from 'react';
import { Sparkles, Check, CheckCircle2 } from 'lucide-react';

export const OverviewTab = ({ decision, approvals, setActiveTab }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Problem Statement */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Problem Statement & Strategic Context
          </h3>
          <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
            {decision.problem_statement}
          </div>
        </div>

        {/* Selected Decision Outcome Rationale */}
        {decision.outcome_summary && (
          <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-800">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Final Outcome & Decision Rationale
              </h3>
            </div>
            <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-emerald-100">
              {decision.outcome_summary}
            </div>
            <div className="text-xs text-emerald-700 pt-1">
              Recorded on: {new Date(decision.outcome_recorded_at).toLocaleString()}
            </div>
          </div>
        )}

        {/* Alternatives Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Evaluated Alternatives ({decision.alternatives?.length || 0})
            </h3>
            <button
              onClick={() => setActiveTab('alternatives')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View Matrix &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {decision.alternatives?.map((alt) => {
              const isSel = alt.is_selected || alt.id === decision.selected_alternative_id;
              return (
                <div
                  key={alt.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSel
                      ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400/20'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSel && (
                        <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> SELECTED
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-slate-900">{alt.title}</h4>
                    </div>
                    {alt.total_score !== null && (
                      <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        Score: <strong className="text-blue-600">{alt.total_score}</strong>/100
                      </span>
                    )}
                  </div>
                  {alt.description && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{alt.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column Metadata */}
      <div className="space-y-6">
        {/* Stakeholders Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stakeholders</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900">{decision.owner_name}</span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Author</span>
            </div>
            {decision.stakeholders?.map((st) => (
              <div key={st.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-900">{st.display_name}</span>
                <span className="text-[10px] text-slate-500">{st.stakeholder_role || 'Contributor'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Approval Pipeline Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approval Progress</h3>
            <button onClick={() => setActiveTab('approvals')} className="text-xs text-blue-600 font-semibold hover:underline">
              Details
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {approvals?.steps?.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.status === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : step.status === 'pending'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step.status === 'approved' ? '?' : step.step_order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{step.step_name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{step.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        {decision.tags?.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {decision.tags.map((t) => (
                <span key={t.id} className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  #{t.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
