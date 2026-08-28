import React from 'react';

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
                step="0.1"
                min="0.1"
                value={critForm.weight}
                onChange={(e) => setCritForm({ ...critForm, weight: parseFloat(e.target.value) || 1.0 })}
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Diff Comparison: v{diffModal.v1} &rarr; v{diffModal.v2}
              </h3>
              <button
                onClick={() => setDiffModal({ open: false, v1: 1, v2: 2, data: null })}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ?
              </button>
            </div>

            <div className="space-y-3">
              {Object.keys(diffModal.data?.differences || {}).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No field differences found between these versions.</p>
              ) : (
                Object.entries(diffModal.data?.differences || {}).map(([key, diff]) => (
                  <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">{key}</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="p-2 rounded bg-rose-50 border border-rose-100 text-rose-800">
                        <strong className="block text-[10px] text-rose-500 font-mono">v{diffModal.v1} (OLD):</strong>
                        <span>{JSON.stringify(diff.old || diff.removed || '?')}</span>
                      </div>
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-emerald-800">
                        <strong className="block text-[10px] text-emerald-500 font-mono">v{diffModal.v2} (NEW):</strong>
                        <span>{JSON.stringify(diff.new || diff.added || '?')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
