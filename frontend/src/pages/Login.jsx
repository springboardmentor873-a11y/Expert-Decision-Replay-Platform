import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Brain, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex font-['Inter']">
      
      {/* Left Side - Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-60"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative z-10">
              <div className="flex items-center gap-3 mb-16 group cursor-pointer w-max">
            <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/30 group-hover:shadow-brand/50 transition-all duration-300">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight text-white transition-colors">Expert Decision</h1>
              <p className="text-sm text-brand-hover font-medium">Intelligence Platform</p>
            </div>
          </div>
          
          <div className="max-w-md mt-12">
            <div className="inline-block px-3 py-1 mb-6 rounded-full bg-brand/10 border border-brand/20 text-brand-hover text-sm font-semibold tracking-wide backdrop-blur-md">
              NEW RELEASE 2.0
            </div>
            <h2 className="text-5xl font-extrabold leading-[1.15] mb-6 text-white">
              Unlock the power of Enterprise Decision Intelligence.
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed font-light">
              Streamline your workflows, analyze outcomes, and explore your knowledge graph with our next-generation platform.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-sm text-slate-400 font-medium">
          <span>&copy; {new Date().getFullYear()} Expert Decision Inc.</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 sm:p-12 relative">
        <div className="w-full max-w-[420px]">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-900">Expert Decision</h1>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Welcome back</h2>
            <p className="text-slate-500 font-medium text-base">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-8 bg-red-50/50 border border-red-200/60 p-4 rounded-2xl flex items-start gap-3 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
              <p className="text-sm font-medium text-red-800 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-12"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-sm font-semibold text-brand hover:text-brand-hover transition-colors">Forgot password?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="btn-primary w-full py-4 text-base"
              >
                Sign in to platform
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="mt-12 text-center text-sm font-medium text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand hover:text-brand-hover transition-colors hover:underline underline-offset-4">
              Sign up for access
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Login;
