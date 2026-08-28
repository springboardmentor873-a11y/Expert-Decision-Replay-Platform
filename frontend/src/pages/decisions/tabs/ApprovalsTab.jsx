import React from 'react';
import { DecisionStatusBadge } from '../../../components/ui/StatusBadge';

export const ApprovalsTab = ({ approvals }) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Governance & Approval Sign-offs</h2>
          <p className="text-xs text-slate-500">Multi-tier verification ensuring rigorous peer evaluation and management sign-off</p>
        </div>

        <div className="space-y-6 pt-2">
          {approvals?.steps?.map((st) => {
            const isApproved = st.status === 'approved';
            const isPending = st.status === 'pending';
            const isRejected = st.status === 'rejected';

            return (
              <div key={st.id} className="relative pl-8 pb-6 last:pb-0 border-l-2 border-slate-200 last:border-transparent">
                <div
                  className={`absolute -left-3.5 top-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                    isApproved
                      ? 'bg-emerald-600 text-white'
                      : isPending
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                      : isRejected
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isApproved ? '?' : st.step_order}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Step {st.step_order}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{st.step_name}</h4>
                    </div>
                    <DecisionStatusBadge status={st.status} />
                  </div>

                  <div className="text-xs text-slate-600 pt-1">
                    <span>Required Authority: <strong className="font-semibold uppercase">{st.required_role_code}</strong></span>
                    {st.actor_name && (
                      <span className="block mt-1">
                        Acted by: <strong className="text-slate-800">{st.actor_name}</strong> on{' '}
                        {new Date(st.acted_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {st.comment && (
                    <div className="mt-2 p-3 rounded-lg bg-white border border-slate-200 text-xs italic text-slate-700">
                      "{st.comment}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
