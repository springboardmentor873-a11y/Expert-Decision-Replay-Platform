import React from 'react';
import { Clock, Send, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export const DecisionStatusBadge = ({ status }) => {
  const getStatusConfig = (statusStr) => {
    switch (statusStr?.toLowerCase()) {
      case 'draft':
        return {
          className: 'status-badge status-badge-draft',
          icon: <Clock size={13} strokeWidth={2.3} />,
          label: 'Draft'
        };
      case 'submitted':
        return {
          className: 'status-badge status-badge-submitted',
          icon: <Send size={13} strokeWidth={2.3} />,
          label: 'Submitted'
        };
      case 'under review':
        return {
          className: 'status-badge status-badge-under-review',
          icon: <AlertCircle size={13} strokeWidth={2.3} />,
          label: 'Under Review'
        };
      case 'approved':
        return {
          className: 'status-badge status-badge-approved',
          icon: <CheckCircle2 size={13} strokeWidth={2.3} />,
          label: 'Approved'
        };
      case 'rejected':
        return {
          className: 'status-badge status-badge-rejected',
          icon: <XCircle size={13} strokeWidth={2.3} />,
          label: 'Rejected'
        };
      default:
        return {
          className: 'status-badge status-badge-default',
          icon: <span className="status-dot"></span>,
          label: statusStr || 'Draft'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={config.className}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
