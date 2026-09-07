import React, { useState, useEffect } from 'react';
import { History, Loader2, AlertCircle, RefreshCw, GitCompare } from 'lucide-react';
import { getVersions } from '../services/decisionVersionService';
import { VersionHistoryItem } from './VersionHistoryItem';
import { VersionCompareModal } from './VersionCompareModal';
import { VersionViewModal } from './VersionViewModal';

export const VersionHistory = ({ decisionId, currentDecisionStatus }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVersionForView, setSelectedVersionForView] = useState(null);

  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareVersionA, setCompareVersionA] = useState(null);
  const [compareVersionB, setCompareVersionB] = useState(null);

  const fetchVersions = async () => {
    if (!decisionId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getVersions(decisionId);
      setVersions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load version history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [decisionId, currentDecisionStatus]);

  const handleOpenView = (version) => {
    setSelectedVersionForView(version);
    setViewModalOpen(true);
  };

  const handleOpenCompare = (version) => {
    // Default: compare selected version with the one directly preceding it, or with version 1
    const currentNum = version.version_number;
    const prevNum = currentNum > 1 ? currentNum - 1 : 1;
    setCompareVersionA(prevNum);
    setCompareVersionB(currentNum);
    setCompareModalOpen(true);
  };

  const handleQuickCompareLatest = () => {
    if (versions.length >= 2) {
      setCompareVersionA(versions[1].version_number);
      setCompareVersionB(versions[0].version_number);
      setCompareModalOpen(true);
    } else if (versions.length === 1) {
      setCompareVersionA(versions[0].version_number);
      setCompareVersionB(versions[0].version_number);
      setCompareModalOpen(true);
    }
  };

  const latestVersionNumber = versions.length > 0 ? versions[0].version_number : null;

  return (
    <section className="section-box version-history-section">
      <div className="section-box-header version-history-header">
        <div className="version-title-group">
          <History size={18} className="text-primary" />
          <h3 className="section-box-title">Version History</h3>
          <span className="version-count-pill">{versions.length}</span>
        </div>

        {versions.length >= 2 && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleQuickCompareLatest}
            title="Compare latest version with previous version"
          >
            <GitCompare size={14} />
            <span>Compare Latest</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger version-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm retry-btn"
            onClick={fetchVersions}
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="version-loading-state">
          <Loader2 size={24} className="spinner-icon text-primary" />
          <span>Loading version history...</span>
        </div>
      ) : versions.length === 0 ? (
        <div className="version-empty-state">
          <History size={32} className="text-muted" />
          <p>No version history available.</p>
        </div>
      ) : (
        <div className="version-timeline-list">
          {versions.map((ver) => (
            <VersionHistoryItem
              key={ver.id || ver.version_number}
              version={ver}
              isLatest={ver.version_number === latestVersionNumber}
              onView={handleOpenView}
              onCompare={handleOpenCompare}
            />
          ))}
        </div>
      )}

      {/* Read-Only Historical Snapshot Modal */}
      <VersionViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedVersionForView(null);
        }}
        version={selectedVersionForView}
        isLatest={selectedVersionForView?.version_number === latestVersionNumber}
      />

      {/* Compare Versions Modal */}
      <VersionCompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        decisionId={decisionId}
        versions={versions}
        initialVersionA={compareVersionA}
        initialVersionB={compareVersionB}
      />
    </section>
  );
};
