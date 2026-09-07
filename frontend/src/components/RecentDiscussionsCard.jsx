import React from 'react';
import { MessageSquare, MessageCircle, ArrowUpRight } from 'lucide-react';

export const RecentDiscussionsCard = () => {
  return (
    <div className="card recent-discussions-card">
      <div className="card-header-clean">
        <div className="chart-header-title">
          <MessageSquare size={18} className="chart-header-icon" />
          <h3>Recent Discussions</h3>
        </div>
        <span className="badge-upcoming-pill">Milestone 3</span>
      </div>

      <div className="placeholder-widget-body">
        <div className="placeholder-icon-halo">
          <MessageCircle size={24} className="placeholder-icon-inner" />
        </div>
        <h4 className="placeholder-title">No Active Discussions</h4>
        <p className="placeholder-desc">
          Collaborative decision review threads and stakeholder feedback channels will be linked here in Milestone 3.
        </p>

        <button
          className="btn btn-secondary btn-sm placeholder-action-btn"
          onClick={() => alert('Discussion channels are scheduled for Milestone 3.')}
        >
          <span>Explore Topics</span>
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
};
