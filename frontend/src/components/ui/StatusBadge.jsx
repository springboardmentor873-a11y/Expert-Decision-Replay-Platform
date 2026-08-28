import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  FileEdit, 
  Archive, 
  RotateCcw,
  PlayCircle,
  PauseCircle,
  CheckCheck
} from 'lucide-react';

export const DecisionStatusBadge = ({ status }) => {
  const s = (status || 'draft').toLowerCase();

  const config = {
    draft: {
      label: 'Draft',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: FileEdit,
    },
    in_review: {
      label: 'In Peer Review',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    in_approval: {
      label: 'In Management Approval',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
    },
    approved: {
      label: 'Approved',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
    },
    changes_requested: {
      label: 'Changes Requested',
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: RotateCcw,
    },
    implementing: {
      label: 'Implementing',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: PlayCircle,
    },
    implemented: {
      label: 'Implemented',
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: CheckCheck,
    },
    closed: {
      label: 'Closed / Archived',
      bg: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: Archive,
    },
  };

  const item = config[s] || { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: AlertCircle };
  const Icon = item.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {item.label}
    </span>
  );
};

export const ImplementationStatusBadge = ({ status }) => {
  const s = (status || 'not_started').toLowerCase();

  const config = {
    not_started: { label: 'Not Started', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    blocked: { label: 'Blocked', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    completed: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-gray-100 text-gray-600 border-gray-200' },
  };

  const item = config[s] || { label: status, bg: 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.bg}`}>
      {item.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const r = (role || 'employee').toLowerCase();
  const config = {
    administrator: { label: 'Administrator', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
    manager: { label: 'Manager', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
    reviewer: { label: 'Reviewer', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
    employee: { label: 'Employee', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  };
  const item = config[r] || { label: role, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${item.bg}`}>
      {item.label}
    </span>
  );
};
