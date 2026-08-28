import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Download, FolderKanban, ShieldCheck } from 'lucide-react';
import api from '../api/client';

export const ReportsPage = () => {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const res = await api.get('/decisions');
        setDecisions(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDecisions();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Export Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Export full decision case files, audit artifacts, and executive summaries in PDF and XLSX formats
        </p>
      </div>

      {/* Global Executive Export Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 sm:p-8 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Executive Portfolio Audit</span>
          </div>
          <h2 className="text-xl font-bold">Enterprise Decisions Executive Summary Workbook</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Download a consolidated multi-sheet Excel spreadsheet containing all active, approved, and archived decision records with owners, categories, alternatives, and scores.
          </p>
        </div>
        <a
          href="/api/v1/reports/summary/excel"
          download
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-lg transition-colors flex-shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Download Summary (Excel)</span>
        </a>
      </div>

      {/* Individual Decision Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Individual Decision Case Reports</h3>
          <span className="text-xs text-slate-400">{decisions.length} Decisions Available</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {decisions.map((d) => (
              <div key={d.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{d.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-slate-400">
                    <span>By {d.owner_name}</span>
                    <span>?</span>
                    <span>v{d.current_version_no}</span>
                    <span>?</span>
                    <span className="capitalize">{d.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <a
                    href={`/api/v1/reports/decision/${d.id}/pdf`}
                    download
                    className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3.5 py-2 rounded-lg border border-rose-200 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Case PDF</span>
                  </a>

                  <a
                    href={`/api/v1/reports/decision/${d.id}/excel`}
                    download
                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3.5 py-2 rounded-lg border border-emerald-200 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Matrix Excel</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
