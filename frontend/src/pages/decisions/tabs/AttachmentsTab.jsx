import React from 'react';
import { Paperclip, Download } from 'lucide-react';

export const AttachmentsTab = ({
  attachments,
  uploadFile,
  setUploadFile,
  uploading,
  handleFileUpload,
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">File Attachments & Documents</h2>
          <p className="text-xs text-slate-500">Upload benchmarks, architecture diagrams, compliance specs, and contracts</p>
        </div>
      </div>

      <form onSubmit={handleFileUpload} className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between gap-4">
        <input
          type="file"
          required
          onChange={(e) => setUploadFile(e.target.files[0])}
          className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="submit"
          disabled={uploading || !uploadFile}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>

      <div className="divide-y divide-slate-100">
        {attachments.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No attachments uploaded yet.</p>
        ) : (
          attachments.map((att) => (
            <div key={att.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="font-bold text-slate-900">{att.file_name}</span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    {(att.byte_size / 1024).toFixed(1)} KB ? Uploaded by {att.uploaded_by_name}
                  </span>
                </div>
              </div>
              <a
                href={`/api/v1/attachments/${att.id}/download`}
                download
                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
