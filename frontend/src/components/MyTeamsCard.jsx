import React from 'react';
import { Users, Plus, Shield } from 'lucide-react';

export const MyTeamsCard = () => {
  return (
    <div className="card my-teams-card">
      <div className="card-header-clean">
        <div className="chart-header-title">
          <Users size={18} className="chart-header-icon" />
          <h3>My Teams</h3>
        </div>
        <span className="badge-upcoming-pill">Milestone 3</span>
      </div>

      <div className="placeholder-widget-body">
        <div className="placeholder-icon-halo">
          <Shield size={24} className="placeholder-icon-inner" />
        </div>
        <h4 className="placeholder-title">No Teams Joined Yet</h4>
        <p className="placeholder-desc">
          Organizational teams, peer groups, and reviewer assignments will be activated in Milestone 3.
        </p>

        <button
          className="btn btn-secondary btn-sm placeholder-action-btn"
          onClick={() => alert('Team management is scheduled for Milestone 3.')}
        >
          <Plus size={14} />
          <span>Create Workspace</span>
        </button>
      </div>
    </div>
  );
};
