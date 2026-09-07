import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText
} from 'lucide-react';

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'png', 'jpg', 'jpeg'
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const DocumentUpload = ({ onUpload, loading = false, onClose = null }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    if (!file) return false;

    // Check empty
    if (file.size === 0) {
      setValidationError('Cannot upload an empty file (0 bytes).');
      return false;
    }

    // Check size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('File size exceeds the 10 MB maximum limit.');
      return false;
    }

    // Check extension
    const parts = file.name.split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError(
        `File format ".${ext}" is not supported. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`
      );
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError('Please select a file to upload.');
      return;
    }
    if (!validateFile(selectedFile)) return;

    try {
      await onUpload(selectedFile);
      handleClearSelection();
    } catch (err) {
      // Error handled by parent or displayed here
      setValidationError(err.message || 'Failed to upload document.');
    }
  };

  return (
    <div className="document-upload-container">
      <div className="upload-header-row">
        <h4 className="upload-section-heading">Attach Supporting Document</h4>
        {onClose && (
          <button
            type="button"
            className="btn-icon-close"
            onClick={onClose}
            aria-label="Close upload form"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {validationError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.65rem 1rem' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.85rem' }}>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!selectedFile ? (
          /* Drag & Drop Upload Zone */
          <div
            className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden-file-input"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
            />
            <div className="dropzone-icon-circle">
              <UploadCloud size={26} className="text-primary" />
            </div>
            <p className="dropzone-primary-text">
              <span className="dropzone-action-link">Click to browse</span> or drag and drop your document here
            </p>
            <p className="dropzone-secondary-text">
              PDF, DOCX, XLSX, PPTX, CSV, TXT, PNG, JPG (Max 10 MB)
            </p>
          </div>
        ) : (
          /* Selected File Preview Chip */
          <div className="selected-file-card">
            <div className="file-preview-left">
              <div className="file-preview-icon">
                <FileText size={22} className="text-primary" />
              </div>
              <div className="file-preview-details">
                <span className="file-preview-name" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                <span className="file-preview-size">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            </div>

            <div className="file-preview-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearSelection}
                disabled={loading}
              >
                <X size={14} />
                <span>Remove</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="spinner-rotate" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    <span>Upload Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
