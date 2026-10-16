import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";

export default function VersionsTab({ decisionId }) {
  const { showToast } = useToast();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1500);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await api.listVersions(decisionId);
        // Sort chronologically v1, v2, v3...
        const sorted = (list || []).sort((a, b) => a.version - b.version);
        setVersions(sorted);
        if (sorted.length > 0) {
          setActiveStepIndex(sorted.length - 1);
        }
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [decisionId]);

  // Decision Replay Animation Timer
  useEffect(() => {
    if (!isPlaying || versions.length === 0) return;

    const timer = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev >= versions.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, versions, playbackSpeed]);

  if (loading) return <div className="loading-text">Loading decision replay timeline…</div>;

  if (versions.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Replay Snapshots Available</h3>
        <p>No historical versions recorded for this decision yet.</p>
      </div>
    );
  }

  const currentVersion = versions[activeStepIndex] || versions[versions.length - 1];

  return (
    <div style={{ marginTop: 10 }}>
      {/* Interactive Decision Replay Controls */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: 16,
          padding: "20px 24px",
          color: "#ffffff",
          boxShadow: "0 8px 20px rgba(15,23,42,0.25)",
          marginBottom: 24,
          border: "1px solid #334155"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>⏪</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#ffffff" }}>
                Decision Replay Engine
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                Step-by-step playback of historical rationale, status updates, and modifications.
              </p>
            </div>
          </div>

          {/* Speed Selection Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: "#cbd5e1" }}>Speed:</span>
            {[
              { label: "1x", delay: 2000 },
              { label: "2x", delay: 1000 },
              { label: "4x", delay: 500 },
            ].map((spd) => (
              <button
                key={spd.label}
                onClick={() => setPlaybackSpeed(spd.delay)}
                style={{
                  background: playbackSpeed === spd.delay ? "#2563eb" : "none",
                  border: "none",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls & Progress Scrubber */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? "#ef4444" : "#10b981",
              color: "#ffffff",
              border: "none",
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}
          >
            {isPlaying ? "⏸️ Pause Replay" : "▶️ Play Replay"}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setActiveStepIndex(Math.max(0, activeStepIndex - 1));
            }}
            disabled={activeStepIndex === 0}
            style={{
              background: "#334155",
              color: activeStepIndex === 0 ? "#64748b" : "#ffffff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: activeStepIndex === 0 ? "not-allowed" : "pointer"
            }}
          >
            ⏮️ Step Back
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setActiveStepIndex(Math.min(versions.length - 1, activeStepIndex + 1));
            }}
            disabled={activeStepIndex === versions.length - 1}
            style={{
              background: "#334155",
              color: activeStepIndex === versions.length - 1 ? "#64748b" : "#ffffff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: activeStepIndex === versions.length - 1 ? "not-allowed" : "pointer"
            }}
          >
            ⏭️ Step Forward
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setActiveStepIndex(0);
            }}
            style={{
              background: "none",
              border: "1px solid #475569",
              color: "#cbd5e1",
              padding: "7px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            🔄 Reset
          </button>
        </div>

        {/* Visual Timeline Nodes Bar */}
        <div style={{ display: "flex", alignItems: "center", position: "relative", padding: "10px 0 6px 0" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 4, background: "#334155", top: 22, zIndex: 1 }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              width: `${(activeStepIndex / Math.max(1, versions.length - 1)) * 100}%`,
              height: 4,
              background: "#3b82f6",
              top: 22,
              zIndex: 2,
              transition: "width 0.3s ease"
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", zIndex: 3 }}>
            {versions.map((v, idx) => {
              const isActive = idx === activeStepIndex;
              const isPassed = idx <= activeStepIndex;

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStepIndex(idx);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                >
                  <div
                    style={{
                      width: isActive ? 28 : 20,
                      height: isActive ? 28 : 20,
                      borderRadius: "50%",
                      background: isActive ? "#2563eb" : isPassed ? "#3b82f6" : "#475569",
                      border: isActive ? "3px solid #ffffff" : "2px solid #1e293b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#ffffff",
                      transition: "all 0.2s ease"
                    }}
                  >
                    v{v.version}
                  </div>
                  <span style={{ fontSize: 10, color: isActive ? "#60a5fa" : "#94a3b8", marginTop: 4, fontWeight: isActive ? 700 : 400 }}>
                    {v.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Snapshot Inspection Card */}
      {currentVersion && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            padding: 20,
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontWeight: 800,
                  fontSize: 13,
                  padding: "4px 10px",
                  borderRadius: 6
                }}
              >
                Snapshot v{currentVersion.version}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                {currentVersion.change_summary || "Version update recorded"}
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {new Date(currentVersion.created_at).toLocaleString()}
            </span>
          </div>

          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
              Problem Statement & Rationale Snapshot
            </div>
            <p style={{ margin: "0 0 10px 0", fontSize: 13.5, color: "#1e293b", lineHeight: 1.5 }}>
              {currentVersion.rationale || currentVersion.problem_statement || "No detailed text recorded in this version snapshot."}
            </p>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#64748b" }}>
              <span>Status in Snapshot: <strong style={{ color: "#2563eb" }}>{currentVersion.status}</strong></span>
              <span>• Modified by System Auditor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
