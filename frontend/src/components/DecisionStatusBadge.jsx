import React from 'react';
import { Clock, CheckCircle2, XCircle, Archive, FileEdit } from 'lucide-react';

export const DecisionStatusBadge = ({ status, size = "md" }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Approved':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Approved'
        };
      case 'Under Review':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <Clock className="w-3.5 h-3.5" />,
          label: 'Under Review'
        };
      case 'Rejected':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: <XCircle className="w-3.5 h-3.5" />,
          label: 'Rejected'
        };
      case 'Archived':
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: <Archive className="w-3.5 h-3.5" />,
          label: 'Archived'
        };
      case 'Draft':
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
          icon: <FileEdit className="w-3.5 h-3.5" />,
          label: status || 'Draft'
        };
    }
  };

  const style = getBadgeStyle();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center space-x-1.5 rounded-full border font-semibold tracking-wide ${style.bg} ${sizeClasses}`}>
      {style.icon}
      <span>{style.label}</span>
    </span>
  );
};

export default DecisionStatusBadge;
