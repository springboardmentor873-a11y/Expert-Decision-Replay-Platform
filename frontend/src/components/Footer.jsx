import React from 'react';
import { Brain } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();

  // Hide footer on dashboard and auth pages where it's either not needed or fullscreen
  if (['/dashboard', '/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <footer className="bg-slate-950 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">DecisionAI</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Next-generation enterprise decision intelligence platform. Streamline workflows and analyze outcomes efficiently.
            </p>
            <div className="flex gap-4">
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-6 uppercase tracking-wider text-xs">Product</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Features</a></li>
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Integrations</a></li>
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Pricing</a></li>
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-6 uppercase tracking-wider text-xs">Company</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-6 uppercase tracking-wider text-xs">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Cookie Policy</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} DecisionAI Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Made with</span>
            <span className="text-red-500">♥</span>
            <span>for enterprise</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
