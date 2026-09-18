import React from 'react';
import { Download, FileSpreadsheet, PieChart } from 'lucide-react';
import api from '../api';

const Reports = () => {

  const handleDownloadDecisions = async () => {
    try {
      const response = await api.get('/reports/export-decisions', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'decisions_report.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to download report');
    }
  };

  const handleDownloadAuditLogs = async () => {
    try {
      const response = await api.get('/reports/export-audit-logs', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_logs_report.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to download report');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <PieChart className="w-8 h-8 text-brand" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Export</h1>
          <p className="text-slate-500 mt-1">Generate and download platform insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Decision Reports */}
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Decision Reports</h3>
              <p className="text-slate-500 text-sm mt-1">Export a complete history of all organizational decisions, including their statuses and meta information.</p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button onClick={handleDownloadDecisions} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>
        </div>

        {/* Audit Logs Report */}
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Audit Logs Report</h3>
              <p className="text-slate-500 text-sm mt-1">Download the full system audit trail for compliance and security auditing purposes.</p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button onClick={handleDownloadAuditLogs} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Reports;
