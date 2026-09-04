import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Zap, Shield, LineChart } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-slate-50 min-h-screen font-['Inter']">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent opacity-70"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] opacity-20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand-hover text-sm font-semibold tracking-wide backdrop-blur-md mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
            INTRODUCING EXPERT DECISION 2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
            The intelligent operating system for your enterprise.
          </h1>
          
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Unify your data, streamline decision-making, and build an intelligent knowledge graph with our secure, scalable platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register"
              className="btn-primary w-full sm:w-auto px-8 py-4 text-base"
            >
              Create New Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link 
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center"
            >
              Sign In to Platform
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-brand font-semibold tracking-wide uppercase text-sm mb-3">Enterprise Capabilities</h2>
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">Everything you need to scale decisions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand transition-colors duration-300">
                <Brain className="w-7 h-7 text-brand group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Knowledge Graph</h4>
              <p className="text-slate-600 leading-relaxed">
                Connect disparate data points into a unified, intelligent graph that understands the context of your business.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand transition-colors duration-300">
                <Zap className="w-7 h-7 text-brand group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Real-time Analytics</h4>
              <p className="text-slate-600 leading-relaxed">
                Analyze outcomes as they happen with our lightning-fast processing engine and beautiful, responsive dashboards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand transition-colors duration-300">
                <Shield className="w-7 h-7 text-brand group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Enterprise Security</h4>
              <p className="text-slate-600 leading-relaxed">
                Bank-grade encryption, role-based access control, and comprehensive audit logs keep your data safe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight">
            Ready to transform your operations?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of enterprises already using Expert Decision to build the future of their industry.
          </p>
          <Link 
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      
    </div>
  );
};

export default Home;
