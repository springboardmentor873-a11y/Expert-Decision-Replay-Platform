import React from 'react';
import { MessageSquare, Calendar, Compass } from 'lucide-react';

export const CommentTypeBadge = ({ type }) => {
  switch (type) {
    case 'meeting_note':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Calendar className="w-3 h-3" />
          <span>Meeting Note</span>
        </span>
      );
    case 'rationale':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Compass className="w-3 h-3" />
          <span>Decision Rationale</span>
        </span>
      );
    case 'general_comment':
    default:
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
          <MessageSquare className="w-3 h-3" />
          <span>General Comment</span>
        </span>
      );
  }
};

export default CommentTypeBadge;
