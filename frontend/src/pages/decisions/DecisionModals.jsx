import React, { useState } from 'react';
import { X, Layers, Award, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Check, Info } from 'lucide-react';

export const DecisionModals = ({
  actionModal,
  setActionModal,
  handleApprovalAction,
  showAddAltModal,
  setShowAddAltModal,
  altForm,
  setAltForm,
  handleAddAlternative,
  showAddCritModal,
  setShowAddCritModal,
  critForm,
  setCritForm,
  handleAddCriterion,
  showAddRiskModal,
  setShowAddRiskModal,
  riskForm,
  setRiskForm,
  handleAddRisk,
  showOutcomeModal,
  setShowOutcomeModal,
  outcomeForm,
  setOutcomeForm,
  handleSaveOutcome,
  diffModal,
  setDiffModal,
  showAddDiscModal,
  setShowAddDiscModal,
  newDiscussionTitle,
  setNewDiscussionTitle,
  handleCreateDiscussion,
  showAddNoteModal,
  setShowAddNoteModal,
  noteForm,
  setNoteForm,
  handleAddMeetingNote,
}) => {
  return (
    <>
      {/* Approval / Rejection Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">{actionModal.title}</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Comments / Rationale
              </label>
              <textarea
                rows={3}
                value={actionModal.comment}
                onChange={(e) => setActionModal({ ...actionModal, comment: e.target.value })}
                placeholder="Enter sign-off comments, feedback, or justification..."
                className="w-full bg-slate-50 border border-slate-200 text-sm p-3 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionModal({ open: false, type: '', title: '', comment: '' })}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalAction}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Alternative Modal */}
      {showAddAltModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddAlternative} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add Alternative Option</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Option Title *</label>
              <input
                type="text"
                required
                value={altForm.title}
                onChange={(e) => setAltForm({ ...altForm, title: e.target.value })}
                placeholder="e.g. Option B: AWS Lambda Serverless"
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Trade-off Description</label>
              <textarea
                rows={3}
                value={altForm.description}
                onChange={(e) => setAltForm({ ...altForm, description: e.target.value })}
                placeholder="Feasibility, cost implications, and pros/cons..."
                className="w-full bg-slate-50 border border-slate-200 text-sm p-3 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAltModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs"
              >
                Add Option
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Criterion Modal */}
      {showAddCritModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddCriterion} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add Evaluation Criterion</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Criterion Name *</label>
              <input
                type="text"
                required
                value={critForm.name}
                onChange={(e) => setCritForm({ ...critForm, name: e.target.value })}
                placeholder="e.g. Total Cost of Ownership (TCO)"
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Relative Weight</label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={critForm.weight}
                placeholder="1"
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCritForm({ ...critForm, weight: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCritModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs"
              >
                Add Criterion
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Risk Modal */}
      {showAddRiskModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddRisk} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add Risk Assessment</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Risk Title *</label>
              <input
                type="text"
                required
                value={riskForm.title}
                onChange={(e) => setRiskForm({ ...riskForm, title: e.target.value })}
                placeholder="e.g. Vendor API Rate Limit Throttling"
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Severity</label>
                <select
                  value={riskForm.severity}
                  onChange={(e) => setRiskForm({ ...riskForm, severity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Likelihood</label>
                <select
                  value={riskForm.likelihood}
                  onChange={(e) => setRiskForm({ ...riskForm, likelihood: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Mitigation Strategy</label>
              <textarea
                rows={2}
                value={riskForm.mitigation}
                onChange={(e) => setRiskForm({ ...riskForm, mitigation: e.target.value })}
                placeholder="How will this risk be controlled or mitigated?"
                className="w-full bg-slate-50 border border-slate-200 text-sm p-2.5 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddRiskModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs"
              >
                Add Risk
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Outcome Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveOutcome} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Record Final Outcome & Retrospective Rationale</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Outcome Summary & Rationale *</label>
              <textarea
                required
                rows={4}
                value={outcomeForm.outcome_summary}
                onChange={(e) => setOutcomeForm({ ...outcomeForm, outcome_summary: e.target.value })}
                placeholder="Explain why this option was executed, the benchmark results, and subsequent impact..."
                className="w-full bg-slate-50 border border-slate-200 text-sm p-3 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Implementation Status</label>
              <select
                value={outcomeForm.implementation_status}
                onChange={(e) => setOutcomeForm({ ...outcomeForm, implementation_status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-sm p-2.5 rounded-lg"
              >
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOutcomeModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs"
              >
                Save Outcome
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Diff Modal */}
      {diffModal.open && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                    v{diffModal.v1}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    v{diffModal.v2}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 ml-1">
                    Decision Version Comparison & Rationale Diff
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>v{diffModal.v1}: <strong className="text-slate-700">{diffModal.data?.v1_reason || 'Previous version'}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>v{diffModal.v2}: <strong className="text-slate-700">{diffModal.data?.v2_reason || 'Target version'}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setDiffModal({ open: false, v1: 1, v2: 2, data: null })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close Diff Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Differences Sections */}
            <div className="space-y-6">
              {/* 1. Status & Governance Changes */}
              {(diffModal.data?.differences?.status ||
                diffModal.data?.differences?.implementation_status ||
                diffModal.data?.differences?.title ||
                diffModal.data?.differences?.problem_statement ||
                diffModal.data?.differences?.outcome_summary) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Governance Status & Core Metadata Changes</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(diffModal.data?.differences || {})
                      .filter(([k]) => ['status', 'implementation_status', 'title', 'problem_statement', 'outcome_summary', 'category'].includes(k))
                      .map(([key, diff]) => (
                        <div key={key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                            {diff.field_name || key.replace('_', ' ')}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-rose-50/80 border border-rose-100 text-rose-900 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                                v{diffModal.v1} (Previous)
                              </span>
                              <p className="whitespace-pre-line leading-relaxed font-medium">
                                {typeof diff.old === 'object' ? JSON.stringify(diff.old) : String(diff.old || 'None')}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-100 text-emerald-900 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                                v{diffModal.v2} (Updated)
                              </span>
                              <p className="whitespace-pre-line leading-relaxed font-medium">
                                {typeof diff.new === 'object' ? JSON.stringify(diff.new) : String(diff.new || 'None')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 2. Candidate Alternatives & Pros/Cons Comparison */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Candidate Alternatives & Trade-offs (Pros, Cons, Advantages)</span>
                  </div>
                  {diffModal.data?.differences?.alternatives && (
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      Alternatives Modified
                    </span>
                  )}
                </div>

                {/* Modified Alternatives */}
                {diffModal.data?.differences?.alternatives?.modified?.length > 0 && (
                  <div className="space-y-3">
                    {diffModal.data.differences.alternatives.modified.map((alt, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white border border-indigo-200 ring-1 ring-indigo-100 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">{alt.title}</h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Description / Selection Modified
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          <div className="p-3 rounded-lg bg-rose-50/80 border border-rose-100 text-rose-900 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                              <span>v{diffModal.v1} Trade-offs & Pros/Cons</span>
                              {alt.old_selected && <span className="bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded font-bold">SELECTED</span>}
                            </div>
                            <p className="whitespace-pre-line leading-relaxed text-slate-700 mt-1">
                              {alt.old_description}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-100 text-emerald-900 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                              <span>v{diffModal.v2} Trade-offs & Pros/Cons</span>
                              {alt.new_selected && <span className="bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">SELECTED</span>}
                            </div>
                            <p className="whitespace-pre-line leading-relaxed text-slate-700 mt-1">
                              {alt.new_description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Added Alternatives */}
                {diffModal.data?.differences?.alternatives?.added?.length > 0 && (
                  <div className="space-y-2">
                    {diffModal.data.differences.alternatives.added.map((alt, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">ADDED IN v{diffModal.v2}</span>
                          <span className="font-bold text-slate-900 text-sm">{alt.title}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line pt-1">{alt.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Removed Alternatives */}
                {diffModal.data?.differences?.alternatives?.removed?.length > 0 && (
                  <div className="space-y-2">
                    {diffModal.data.differences.alternatives.removed.map((alt, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded">REMOVED AFTER v{diffModal.v1}</span>
                          <span className="font-bold text-slate-900 text-sm">{alt.title}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line pt-1">{alt.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* If no alternative field changed, show side-by-side snapshot summary */}
                {!diffModal.data?.differences?.alternatives && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          v{diffModal.v1} Alternatives ({diffModal.data?.v1_snapshot?.alternatives?.length || 0})
                        </span>
                        <div className="space-y-2">
                          {diffModal.data?.v1_snapshot?.alternatives?.map((a, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{a.title}</span>
                                {a.is_selected && <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">SELECTED</span>}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2">{a.description || 'No description'}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          v{diffModal.v2} Alternatives ({diffModal.data?.v2_snapshot?.alternatives?.length || 0})
                        </span>
                        <div className="space-y-2">
                          {diffModal.data?.v2_snapshot?.alternatives?.map((a, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{a.title}</span>
                                {a.is_selected && <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">SELECTED</span>}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2">{a.description || 'No description'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Evaluation Criteria & Scores Matrix Diff */}
              {(diffModal.data?.differences?.criteria || diffModal.data?.differences?.evaluations) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>Evaluation Criteria & Scoring Matrix Changes</span>
                  </div>

                  {diffModal.data.differences.criteria && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <span className="font-bold text-slate-800 block">Criteria Modifications:</span>
                      {diffModal.data.differences.criteria.modified?.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                          <span className="font-semibold text-slate-800">{c.name}</span>
                          <span className="text-slate-500">Weight: <strong className="text-rose-600">{c.old_weight}x</strong> &rarr; <strong className="text-emerald-600">{c.new_weight}x</strong></span>
                        </div>
                      ))}
                    </div>
                  )}

                  {diffModal.data.differences.evaluations && (
                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-2">
                      <span className="font-bold text-blue-900 block">
                        Matrix Scores Updated ({diffModal.data.differences.evaluations.changed_count} score values changed)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Risks & Mitigation Diff */}
              {diffModal.data?.differences?.risks && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Risk Assessment & Mitigation Updates</span>
                  </div>

                  <div className="space-y-2">
                    {diffModal.data.differences.risks.added?.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span>+ {r.title}</span>
                          <span className="uppercase text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">ADDED RISK</span>
                        </div>
                        <p className="text-slate-600">{r.description || 'No description'}</p>
                        {r.mitigation && <p className="text-emerald-800 italic">Mitigation: {r.mitigation}</p>}
                      </div>
                    ))}

                    {diffModal.data.differences.risks.modified?.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{r.title}</span>
                          <span className="text-slate-500">
                            Severity: <span className="text-rose-600">{r.old_severity}</span> &rarr; <span className="text-emerald-600">{r.new_severity}</span>
                          </span>
                        </div>
                        <div className="pt-1 text-slate-600">
                          <p><strong>Old Mitigation:</strong> {r.old_mitigation || 'None'}</p>
                          <p className="text-emerald-700"><strong>New Mitigation:</strong> {r.new_mitigation || 'None'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDiffModal({ open: false, v1: 1, v2: 2, data: null })}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Start Discussion Modal */}
      {showAddDiscModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateDiscussion} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Start Discussion Thread</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Thread Title *</label>
              <input
                type="text"
                required
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
                placeholder="e.g. Architecture Security Review & Threat Modeling"
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddDiscModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs"
              >
                Create Thread
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Meeting Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddMeetingNote} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Record Stakeholder Meeting Note</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Meeting Title *</label>
              <input
                type="text"
                required
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                placeholder="e.g. Architecture Review Board Consensus"
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Meeting Date & Time</label>
              <input
                type="datetime-local"
                required
                value={noteForm.occurred_at}
                onChange={(e) => setNoteForm({ ...noteForm, occurred_at: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Minutes / Key Takeaways *</label>
              <textarea
                required
                rows={3}
                value={noteForm.body}
                onChange={(e) => setNoteForm({ ...noteForm, body: e.target.value })}
                placeholder="Summary of agreements, concerns raised, and decisions reached..."
                className="w-full bg-slate-50 border border-slate-200 text-sm p-3 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddNoteModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs"
              >
                Record Note
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
