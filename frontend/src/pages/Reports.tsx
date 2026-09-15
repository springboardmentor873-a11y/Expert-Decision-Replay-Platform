import { useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { api, ApiError } from "../lib/api";

interface ReportDef {
  key: string;
  label: string;
  description: string;
  excelPath?: string;
  pdfPath?: string;
}

const REPORTS: ReportDef[] = [
  {
    key: "decisions",
    label: "Decision report",
    description: "Every decision you can access, with status, category and owner.",
    excelPath: "/reports/decisions/export/excel",
    pdfPath: "/reports/decisions/export/pdf",
  },
  {
    key: "approvals",
    label: "Approval report",
    description: "Approval requests, reviewers and outcomes.",
    excelPath: "/reports/approvals/export/excel",
    pdfPath: "/reports/approvals/export/pdf",
  },
  {
    key: "teams",
    label: "Team report",
    description: "Team membership and department breakdown.",
    excelPath: "/reports/teams/export/excel",
    pdfPath: "/reports/teams/export/pdf",
  },
  {
    key: "audit",
    label: "Audit report",
    description: "Full audit trail export (Administrator / Manager only).",
    excelPath: "/reports/audit/export/excel",
    pdfPath: "/reports/audit/export/pdf",
  },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function Reports() {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (path: string, filename: string, key: string) => {
    setError(null);
    setBusyKey(key);
    try {
      const blob = await api.downloadBlob(path);
      downloadBlob(blob, filename);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Report generation failed");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <AppLayout title="Reports">
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p>Export real data from the platform as Excel or PDF.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {REPORTS.map((r) => (
          <div className="card" key={r.key}>
            <h3 className="section-title">{r.label}</h3>
            <p className="text-muted">{r.description}</p>
            <div className="inline-actions spacer-top">
              {r.excelPath && (
                <button
                  className="btn btn-primary"
                  disabled={busyKey === `${r.key}-xlsx`}
                  onClick={() =>
                    handleDownload(r.excelPath!, `${r.key}-report.xlsx`, `${r.key}-xlsx`)
                  }
                >
                  {busyKey === `${r.key}-xlsx` ? "Generating…" : "Download Excel"}
                </button>
              )}
              {r.pdfPath && (
                <button
                  className="btn btn-secondary"
                  disabled={busyKey === `${r.key}-pdf`}
                  onClick={() =>
                    handleDownload(r.pdfPath!, `${r.key}-report.pdf`, `${r.key}-pdf`)
                  }
                >
                  {busyKey === `${r.key}-pdf` ? "Generating…" : "Download PDF"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
