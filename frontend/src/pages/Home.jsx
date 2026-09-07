import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDecisions } from '../services/decisionService';
import { DecisionsStatusChart } from '../components/DecisionsStatusChart';
import { RecentDecisionsTable } from '../components/RecentDecisionsTable';
import { TeamActivityCard } from '../components/TeamActivityCard';
import { MyTeamsCard } from '../components/MyTeamsCard';
import { RecentDiscussionsCard } from '../components/RecentDiscussionsCard';
import {
  Layers,
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Compass,
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const Home = () => {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDecisions();
      setDecisions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute real statistics from fetched decisions
  const total = decisions.length;
  const drafts = decisions.filter((d) => d.status === 'Draft').length;
  const submitted = decisions.filter((d) => d.status === 'Submitted').length;
  const underReview = decisions.filter((d) => d.status === 'Under Review').length;
  const approved = decisions.filter((d) => d.status === 'Approved').length;
  const rejected = decisions.filter((d) => d.status === 'Rejected').length;

  const stats = {
    total,
    drafts,
    submitted,
    underReview,
    approved,
    rejected
  };

  return (
    <div className="home-dashboard-container">
      {/* Welcome & Platform Overview Hero Card */}
      <section className="dashboard-hero-banner">
        <div className="hero-banner-content">
          <div className="hero-pill-badge">
            <Sparkles size={14} />
            <span>Enterprise Decision Replay Platform</span>
          </div>
          <h1 className="hero-banner-title">
            Welcome back, {user?.full_name || 'Expert'}
          </h1>
          <p className="hero-banner-subtitle">
            Document architectural trade-offs, evaluate competing alternatives, and retain institutional decision memory.
          </p>
        </div>

        <div className="hero-banner-actions">
          <Link to="/decisions/new" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Create Decision</span>
          </Link>
          <Link to="/decisions" className="btn btn-secondary">
            <Compass size={18} />
            <span>Browse All Decisions</span>
          </Link>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn btn-sm btn-secondary ml-auto" onClick={fetchDashboardData}>
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 5 KPI Metric Cards Grid */}
      <section className="dashboard-kpi-grid">
        {/* Total Decisions */}
        <div className="kpi-metric-card">
          <div className="kpi-icon-container icon-kpi-total">
            <Layers size={22} />
          </div>
          <div className="kpi-metric-details">
            <span className="kpi-metric-val">{loading ? '—' : total}</span>
            <span className="kpi-metric-title">Total Decisions</span>
          </div>
        </div>

        {/* Drafts */}
        <div className="kpi-metric-card">
          <div className="kpi-icon-container icon-kpi-draft">
            <FileEdit size={22} />
          </div>
          <div className="kpi-metric-details">
            <span className="kpi-metric-val">{loading ? '—' : drafts}</span>
            <span className="kpi-metric-title">Drafts</span>
          </div>
        </div>

        {/* Under Review / Submitted */}
        <div className="kpi-metric-card">
          <div className="kpi-icon-container icon-kpi-review">
            <Clock size={22} />
          </div>
          <div className="kpi-metric-details">
            <span className="kpi-metric-val">{loading ? '—' : submitted + underReview}</span>
            <span className="kpi-metric-title">Under Review</span>
          </div>
        </div>

        {/* Approved */}
        <div className="kpi-metric-card">
          <div className="kpi-icon-container icon-kpi-approved">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-metric-details">
            <span className="kpi-metric-val">{loading ? '—' : approved}</span>
            <span className="kpi-metric-title">Approved</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="kpi-metric-card">
          <div className="kpi-icon-container icon-kpi-rejected">
            <XCircle size={22} />
          </div>
          <div className="kpi-metric-details">
            <span className="kpi-metric-val">{loading ? '—' : rejected}</span>
            <span className="kpi-metric-title">Rejected</span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Content Grid */}
      <div className="dashboard-content-grid">
        {/* Left Column (Wider): Recent Decisions & Team Activity */}
        <div className="dashboard-col-left">
          <RecentDecisionsTable decisions={decisions} />
          <TeamActivityCard decisions={decisions} />
        </div>

        {/* Right Column (Sidebar Widgets): Status Donut Chart, Teams, Discussions */}
        <div className="dashboard-col-right">
          <DecisionsStatusChart stats={stats} />
          <MyTeamsCard />
          <RecentDiscussionsCard />
        </div>
      </div>
    </div>
  );
};
