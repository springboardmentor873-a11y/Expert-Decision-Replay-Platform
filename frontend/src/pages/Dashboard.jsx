import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { decisionService } from "../services/decisionService";
import {
  ShieldCheck,
  Briefcase,
  Activity,
  Database,
  Brain,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

const Dashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      decisionService.getDecisions()
        .then(data => {
          setDecisions(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load decisions", err);
          setLoading(false);
        });
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-slate-900">
        <ShieldCheck className="w-14 h-14 text-brand mb-4" />

        <h2 className="text-2xl font-bold mb-2">
          Unauthorized Access
        </h2>

        <p className="text-slate-500 mb-6">
          Please log in to access the dashboard.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="btn-primary"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <p className="text-sm text-brand font-semibold tracking-wide uppercase mb-1">
          Welcome back 👋
        </p>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {user.full_name}
        </h2>
        <p className="text-slate-500 mt-2">
          Here's what's happening with your decision intelligence platform.
        </p>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* Decisions */}
        <div className="card !p-6 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center group-hover:bg-brand transition-colors duration-300">
              <Brain className="w-6 h-6 text-brand group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <p className="text-sm text-slate-500">Total Decisions</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">{loading ? "..." : decisions.length}</h3>
          <p className="text-xs text-slate-400 mt-2">{decisions.length === 0 ? "No decisions recorded yet" : "Across the organization"}</p>
        </div>

        {/* Knowledge Graph */}
        <div className="card !p-6 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center group-hover:bg-brand transition-colors duration-300">
              <Database className="w-6 h-6 text-brand group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <p className="text-sm text-slate-500">Knowledge Nodes</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">0</h3>
          <p className="text-xs text-slate-400 mt-2">Knowledge graph is ready</p>
        </div>

        {/* Activity */}
        <div className="card !p-6 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center group-hover:bg-brand transition-colors duration-300">
              <Activity className="w-6 h-6 text-brand group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <p className="text-sm text-slate-500">Recent Activities</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">0</h3>
          <p className="text-xs text-slate-400 mt-2">Waiting for activity</p>
        </div>

        {/* Account */}
        <div className="card !p-6 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center group-hover:bg-brand transition-colors duration-300">
              <ShieldCheck className="w-6 h-6 text-brand group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <p className="text-sm text-slate-500">Account Status</p>
          <h3 className="text-xl font-bold text-brand mt-2">
            {user.is_active ? "Active" : "Inactive"}
          </h3>
          <p className="text-xs text-slate-400 mt-2">Account verified</p>
        </div>
      </div>

      {/* ================= SECOND ROW ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="card !p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">Profile</h3>
            <button className="text-sm text-brand hover:text-brand-hover font-bold transition-colors">
              Edit Profile
            </button>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-brand flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-brand/30 mb-2">
              {user.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-4">{user.full_name}</h3>
            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-brand" />
                  <span className="text-sm text-slate-600">Role</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{user.role}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-brand" />
                  <span className="text-sm text-slate-600">Status</span>
                </div>
                <span className="text-sm font-semibold text-brand">
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="xl:col-span-2 card !p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Recent Activity</h3>
              <p className="text-sm text-slate-500 mt-1">Latest platform activity and decision events</p>
            </div>
            <button className="text-sm text-brand font-medium hover:text-brand-hover transition-colors">
              View all
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-brand" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">Decision Intelligence</p>
                <p className="text-sm text-slate-500">Your decision workspace is ready.</p>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Now
              </span>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-brand" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">Knowledge Graph</p>
                <p className="text-sm text-slate-500">Knowledge management module is available.</p>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-brand" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">Account Verified</p>
                <p className="text-sm text-slate-500">Your account is currently active.</p>
              </div>
              <span className="text-xs text-brand font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button className="group text-left bg-brand text-white rounded-3xl p-8 shadow-lg shadow-brand/20 hover:shadow-2xl hover:shadow-brand/40 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-6 border border-white/10">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h4 className="font-extrabold text-xl mb-2">Create Decision</h4>
            <p className="text-white/80 text-sm leading-relaxed mb-6">Create and analyze a new business decision.</p>
            <div className="flex items-center gap-2 text-sm font-bold bg-white/10 w-max px-4 py-2 rounded-xl backdrop-blur-sm group-hover:bg-white group-hover:text-brand transition-colors">
              Get Started
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>
          
          <button className="group text-left bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:shadow-brand/10 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30">
            <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand transition-colors duration-300">
              <Database className="w-7 h-7 text-brand group-hover:text-white transition-colors duration-300" />
            </div>
            <h4 className="font-extrabold text-xl text-slate-900 mb-2">Explore Knowledge</h4>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">Explore relationships and knowledge graph data.</p>
            <div className="flex items-center gap-2 text-sm font-bold text-brand bg-brand/10 w-max px-4 py-2 rounded-xl group-hover:bg-brand/20 transition-colors">
              Explore Now
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>
          
          <button className="group text-left bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:shadow-brand/10 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30">
            <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand transition-colors duration-300">
              <BarChart3 className="w-7 h-7 text-brand group-hover:text-white transition-colors duration-300" />
            </div>
            <h4 className="font-extrabold text-xl text-slate-900 mb-2">View Analytics</h4>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">Analyze outcomes and decision performance.</p>
            <div className="flex items-center gap-2 text-sm font-bold text-brand bg-brand/10 w-max px-4 py-2 rounded-xl group-hover:bg-brand/20 transition-colors">
              View Analytics
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
