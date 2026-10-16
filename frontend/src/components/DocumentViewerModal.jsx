import { useState, useEffect } from "react";
import { downloadFile } from "../api";
import { useToast } from "../ToastContext.jsx";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function DocumentViewerModal({ attachment, onClose }) {
  const { showToast } = useToast();
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const filePath = attachment?.file_path || "";
  const filename = attachment?.filename || attachment?.file_name || "document";
  const contentType = attachment?.content_type || "";
  const fileSize = attachment?.file_size || 0;

  useEffect(() => {
    if (!filePath) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("edrp_token");
    const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;

    fetch(`${BASE_URL}${cleanPath}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load file (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Could not retrieve document");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [filePath]);

  const isImage =
    contentType.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);

  const isPdf =
    contentType === "application/pdf" ||
    /\.pdf$/i.test(filename);

  const formatSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    try {
      await downloadFile(filePath, filename);
      showToast(`Downloaded ${filename} successfully!`);
    } catch (err) {
      showToast(err.message || "Download failed", "error");
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(10px)",
        zIndex: 2500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0f172a",
          borderRadius: 20,
          border: "1px solid #334155",
          width: "95vw",
          maxWidth: 1100,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
          color: "#ffffff"
        }}
      >
        {/* Modal Header Bar */}
        <div
          style={{
            padding: "16px 24px",
            background: "#1e293b",
            borderBottom: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>📄</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#ffffff" }}>
                {filename}
              </h3>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                Size: {formatSize(fileSize)} · Type: {contentType || "Document Specification"}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isImage && (
              <div style={{ display: "flex", gap: 6, background: "#0f172a", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontWeight: 700 }}
                  title="Zoom Out"
                >
                  🔍-
                </button>
                <span style={{ fontSize: 12, color: "#cbd5e1", alignSelf: "center", padding: "0 4px" }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontWeight: 700 }}
                  title="Zoom In"
                >
                  🔍+
                </button>
                <button
                  onClick={() => { setZoom(1); setRotation(0); }}
                  style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 11, cursor: "pointer", fontWeight: 700, paddingLeft: 6 }}
                >
                  Reset
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  style={{ background: "none", border: "none", color: "#c084fc", fontSize: 12, cursor: "pointer", fontWeight: 700, paddingLeft: 6 }}
                >
                  🔄 90°
                </button>
              </div>
            )}

            <button
              onClick={handleDownload}
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              📥 Download File
            </button>

            <button
              onClick={onClose}
              style={{
                background: "#334155",
                color: "#ffffff",
                border: "none",
                width: 34,
                height: 34,
                borderRadius: "50%",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Viewport Content */}
        <div
          style={{
            flex: 1,
            padding: 24,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#020617",
            minHeight: 450
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#cbd5e1" }}>Retrieving document content...</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Decrypting securely from platform repository</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: 30, borderRadius: 14, border: "1px solid #7f1d1d" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{error}</div>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
                You can still retrieve the original file directly:
              </p>
              <button
                onClick={handleDownload}
                style={{ marginTop: 12, background: "#2563eb", color: "#ffffff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                📥 Retrieve & Download File
              </button>
            </div>
          ) : isImage ? (
            <div style={{ overflow: "auto", maxWidth: "100%", maxHeight: "100%", textAlign: "center" }}>
              <img
                src={blobUrl}
                alt={filename}
                style={{
                  maxWidth: "100%",
                  maxHeight: "72vh",
                  borderRadius: 10,
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease-out",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  objectFit: "contain"
                }}
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={blobUrl}
              title={filename}
              width="100%"
              height="100%"
              style={{ minHeight: "70vh", border: "none", borderRadius: 10, background: "#ffffff" }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#cbd5e1" }}>
              <span style={{ fontSize: 48 }}>📄</span>
              <h4 style={{ fontSize: 18, fontWeight: 800, margin: "14px 0 6px 0" }}>{filename}</h4>
              <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 450, margin: "0 auto 20px auto" }}>
                This specification document ({contentType || "file"}) is ready for download and retrieval.
              </p>
              <button
                onClick={handleDownload}
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                📥 Download & Retrieve File ({formatSize(fileSize)})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
