import React from 'react';
import {
  Send,
  CheckCircle2,
  XCircle,
  MessageSquare,
  MessageCircle,
  FileText,
  Edit3,
  Bell,
} from 'lucide-react';

export function getNotificationIcon(type) {
  switch (type) {
    case 'DECISION_SUBMITTED':
      return <Send size={15} className="notif-icon notif-icon-submitted" />;
    case 'DECISION_APPROVED':
      return <CheckCircle2 size={15} className="notif-icon notif-icon-approved" />;
    case 'DECISION_REJECTED':
      return <XCircle size={15} className="notif-icon notif-icon-rejected" />;
    case 'DISCUSSION_CREATED':
      return <MessageSquare size={15} className="notif-icon notif-icon-discussion" />;
    case 'DISCUSSION_REPLY':
      return <MessageCircle size={15} className="notif-icon notif-icon-reply" />;
    case 'DOCUMENT_UPLOADED':
      return <FileText size={15} className="notif-icon notif-icon-document" />;
    case 'DECISION_UPDATED':
      return <Edit3 size={15} className="notif-icon notif-icon-updated" />;
    default:
      return <Bell size={15} className="notif-icon notif-icon-default" />;
  }
}
