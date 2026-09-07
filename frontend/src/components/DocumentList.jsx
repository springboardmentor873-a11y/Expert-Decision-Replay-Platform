import React from 'react';
import {
  FileText,
  Download,
  Trash2,
  FileSpreadsheet,
  FileCode,
  Image,
  Paperclip,
  Clock,
  User,
  Loader2
} from 'lucide-react';

export const DocumentList = ({
  documents = [],
  canDelete = false,
  onDownload,
  onDelete,
  actionLoadingId = null
}) => {
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileIcon = (filename, contentType) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) {
      return <FileText size={20} className="file-icon-pdf" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet size={20} className="file-icon-excel" />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText size={20} className="file-icon-word" />;
    }
    if (['png', 'jpg', 'jpeg'].includes(ext)) {
      return <Image size={20} className="file-icon-image" />;
    }
    return <FileText size={20} className="file-icon-generic" />;
  };

  const getFileTypeBadge = (filename) => {
    const ext = filename?.split('.').pop()?.toUpperCase() || 'FILE';
    return <span className="doc-type-badge">{ext}</span>;
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="documents-empty-box">
        <Paperclip size={36} className="empty-icon-muted" />
        <h4 className="empty-title">No documents attached to this decision yet</h4>
        <p className="empty-subtitle">
          Attach architectural diagrams, RFCs, benchmark spreadsheets, or vendor documents to preserve supporting evidence.
        </p>
      </div>
    );
  }

  return (
    <div className="documents-table-wrapper">
      <table className="enterprise-documents-table">
        <thead>
          <tr>
            <th style={{ width: '42%' }}>Document Name</th>
            <th style={{ width: '12%' }}>Type</th>
            <th style={{ width: '12%' }}>Size</th>
            <th style={{ width: '16%' }}>Uploaded By</th>
            <th style={{ width: '10%' }}>Date</th>
            <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const isLoading = actionLoadingId === doc.id;
            const uploaderName = doc.uploader?.full_name || `User #${doc.uploaded_by}`;

            return (
              <tr key={doc.id} className="document-row">
                <td>
                  <div className="doc-name-cell">
                    <div className="doc-icon-box">
                      {getFileIcon(doc.original_filename, doc.content_type)}
                    </div>
                    <span className="doc-filename" title={doc.original_filename}>
                      {doc.original_filename}
                    </span>
                  </div>
                </td>
                <td>{getFileTypeBadge(doc.original_filename)}</td>
                <td>
                  <span className="doc-size-text">
                    {formatFileSize(doc.file_size)}
                  </span>
                </td>
                <td>
                  <div className="doc-uploader-cell">
                    <span className="uploader-avatar-mini">
                      {uploaderName[0]?.toUpperCase() || 'U'}
                    </span>
                    <span className="uploader-name-text" title={uploaderName}>
                      {uploaderName}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="doc-date-text">
                    {formatDate(doc.created_at)}
                  </span>
                </td>
                <td>
                  <div className="doc-actions-cluster">
                    <button
                      type="button"
                      className="btn-action-download"
                      onClick={() => onDownload(doc)}
                      title={`Download ${doc.original_filename}`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 size={15} className="spinner-rotate" />
                      ) : (
                        <Download size={15} />
                      )}
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => onDelete(doc)}
                        title={`Delete ${doc.original_filename}`}
                        disabled={isLoading}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
