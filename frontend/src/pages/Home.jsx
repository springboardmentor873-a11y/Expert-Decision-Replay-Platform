import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDecisions } from '../services/decisionService';
import {
  Layers,
  FileText,
  Send,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Compass,
  Clock,
  Eye
} from 'lucide-react';

export const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    drafts: 0,
    submitted: 0,
    approved: 0,
    loading: true
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const decisions = await getDecisions();
        const total = decisions.length;
        const drafts = decisions.filter(d => d.status === 'Draft').length;
        const submitted = decisions.filter(d => d.status === 'Submitted').length;
        const approved = decisions.filter(d => d.status === 'Approved').length;

        setStats({
          total,
          drafts,
          submitted,
          approved,
          loading: false
        });
      } catch (err) {
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchKPIs();
  }, []);

  const getRoleBadgeClass = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'administrator':
        return 'role-badge badge-admin';
      case 'manager':
        return 'role-badge badge-manager';
      case 'reviewer':
        return 'role-badge badge-reviewer';
      default:
        return 'role-badge badge-employee';
    }
  };

  return (
    <div className="home-dashboard-container">
      {/* Hero Welcome Banner */}
      <section className="hero-welcome-card">
        <div className="hero-text-side">
          <div className="hero-eyebrow">
            <Sparkles size={14} />
            <span>Enterprise Decision Platform</span>
          </div>
          <h1 className="hero-heading">
            Welcome back, {user?.full_name || 'User'}
          </h1>
          <p className="hero-subtext">
            Capture, review and replay expert decisions across your organization.
          </p>
        </div>

        <div className="hero-actions-side">
          <Link to="/decisions/new" className="btn btn-primary btn-lg">
            <PlusCircle size={18} />
            <span>Create New Decision</span>
          </Link>
          <Link to="/decisions" className="btn btn-secondary btn-lg">
            <Compass size={18} />
            <span>View Decisions</span>
          </Link>
        </div>
      </section>

      {/* KPI Metric Cards Grid */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-total">
            <Layers size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-number">{stats.loading ? '—' : stats.total}</span>
            <span className="kpi-label">Total Decisions</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-draft">
            <FileText size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-number">{stats.loading ? '—' : stats.drafts}</span>
            <span className="kpi-label">Draft</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-submitted">
            <Send size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-number">{stats.loading ? '—' : stats.submitted}</span>
            <span className="kpi-label">Submitted</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-approved">
            <CheckCircle2 size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-number">{stats.loading ? '—' : stats.approved}</span>
            <span className="kpi-label">Approved</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard 2-Column Section */}
      <div className="dashboard-main-columns">
        {/* Left: Decision Workflow */}
        <section className="card how-it-works-card">
          <div className="card-title-row">
            <RotateCcw size={20} className="text-primary" />
            <h3>Decision Workflow</h3>
          </div>

          <div className="workflow-steps-horizontal">
            <div className="step-card">
              <div className="step-num-pill">1</div>
              <span className="step-title">Capture</span>
              <p className="step-desc">Document problem, context, and reasoning</p>
            </div>

            <div className="step-card">
              <div className="step-num-pill">2</div>
              <span className="step-title">Submit</span>
              <p className="step-desc">Lock draft and send for evaluation</p>
            </div>

            <div className="step-card">
              <div className="step-num-pill">3</div>
              <span className="step-title">Review</span>
              <p className="step-desc">Multi-criteria alternative analysis</p>
            </div>

            <div className="step-card">
              <div className="step-num-pill">4</div>
              <span className="step-title">Approve</span>
              <p className="step-desc">Manager sign-off and outcome tracking</p>
            </div>

            <div className="step-card">
              <div className="step-num-pill">5</div>
              <span className="step-title">Replay</span>
              <p className="step-desc">Institutional knowledge archive</p>
            </div>
          </div>
        </section>

        {/* Right: Quick Actions & Account Card */}
        <aside className="card profile-overview-card">
          <div>
            <div className="card-title-row">
              <ShieldCheck size={20} />
              <h3>Quick Actions & Account</h3>
            </div>

            <div className="profile-rows-stack">
              <div className="profile-meta-row">
                <span className="profile-meta-label">User Name</span>
                <span className="profile-meta-val">{user?.full_name}</span>
              </div>
              <div className="profile-meta-row">
                <span className="profile-meta-label">Email</span>
                <span className="profile-meta-val">{user?.email}</span>
              </div>
              <div className="profile-meta-row">
                <span className="profile-meta-label">Role</span>
                <span className={getRoleBadgeClass(user?.role?.name)}>
                  {user?.role?.name || 'Employee'}
                </span>
              </div>
              <div className="profile-meta-row">
                <span className="profile-meta-label">Status</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Active</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
            <Link to="/decisions/new" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              <PlusCircle size={15} />
              <span>Create New Decision</span>
            </Link>
            <Link to="/decisions" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
              <Layers size={15} />
              <span>View Decisions</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};
