import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, downloadFile } from "../api";
import { useToast } from "../ToastContext.jsx";
import UploadDocumentModal from "../components/UploadDocumentModal.jsx";
import DocumentViewerModal from "../components/DocumentViewerModal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Repository() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTeam = searchParams.get("team") || "all";

  const { showToast } = useToast();
  const [decisions, setDecisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(initialTeam);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedNode, setSelectedNode] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [focalDecisionId, setFocalDecisionId] = useState(null);
  const [allAttachmentsMap, setAllAttachmentsMap] = useState({});
  const [isFullscreenGraph, setIsFullscreenGraph] = useState(false);
  const [layoutMode, setLayoutMode] = useState("split"); // "split" or "full-width"

  async function fetchData() {
    setLoading(true);
    try {
      const [decRes, teamRes] = await Promise.all([
        api.listDecisions(),
        api.listTeams().catch(() => []),
      ]);
      const loadedDecs = decRes || [];
      setDecisions(loadedDecs);
      setTeams(teamRes || []);

      if (loadedDecs.length > 0 && !focalDecisionId) {
        setFocalDecisionId(loadedDecs[0].id);
      }

      // Load attachments across all decisions for complete team graph rendering
      const attachMap = {};
      await Promise.all(
        loadedDecs.map(async (d) => {
          try {
            const atts = await api.listAttachments(d.id);
            if (atts && atts.length > 0) attachMap[d.id] = atts;
          } catch {
            // ignore error
          }
        })
      );
      setAllAttachmentsMap(attachMap);
    } catch (err) {
      showToast(err.message || "Failed to load repository data", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Sync selectedTeam with URL query parameter
  const handleTeamChange = (newTeam) => {
    setSelectedTeam(newTeam);
    if (newTeam === "all") {
      searchParams.delete("team");
    } else {
      searchParams.set("team", newTeam);
    }
    setSearchParams(searchParams);
  };

  // Filtered decisions list based on search, team, and category
  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.rationale && d.rationale.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.category && d.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const teamId = d.creator_team_id || d.team_id;
      const matchesTeam = selectedTeam === "all" || String(teamId) === String(selectedTeam);
      const matchesCategory = selectedCategory === "all" || d.category === selectedCategory;

      return matchesSearch && matchesTeam && matchesCategory;
    });
  }, [decisions, searchTerm, selectedTeam, selectedCategory]);

  // Metrics
  const totalDocs = decisions.length;
  const approvedDocs = decisions.filter((d) => d.status === "Approved").length;
  const inReviewDocs = decisions.filter((d) => d.status === "Under Review").length;
  const categories = Array.from(new Set(decisions.map((d) => d.category).filter(Boolean)));

  const truncate = (text, n = 18) =>
    !text ? "" : text.length > n ? text.slice(0, n - 1) + "…" : text;

  // Compute spacious graph nodes and links layout (Team-Specific OR Cross-Team Network)
  // Designed for viewBox="0 0 750 550"
  const graphNodes = useMemo(() => {
    const nodes = [];
    const links = [];

    const canvasWidth = 750;
    const canvasHeight = 550;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    if (selectedTeam !== "all") {
      // DEDICATED SINGLE TEAM KNOWLEDGE GRAPH
      const targetTeam = teams.find((t) => String(t.id) === String(selectedTeam));
      const teamName = targetTeam ? targetTeam.name : `Team #${selectedTeam}`;
      const teamDecs = filteredDecisions.filter(
        (d) => String(d.creator_team_id || d.team_id) === String(selectedTeam)
      );

      // Central Team Hub Node
      const centerNodeId = `team-hub-${selectedTeam}`;
      nodes.push({
        id: centerNodeId,
        type: "team-root",
        name: teamName,
        teamId: selectedTeam,
        x: centerX,
        y: centerY,
        color: "#8b5cf6",
      });

      const decCount = teamDecs.length;
      teamDecs.forEach((d, idx) => {
        const angle = decCount === 1 ? 0 : (idx * (2 * Math.PI / decCount));
        const dist = decCount > 4 ? 175 : 145;
        const dx = Math.round(centerX + Math.cos(angle) * dist);
        const dy = Math.round(centerY + Math.sin(angle) * dist);

        const dNodeId = `dec-${d.id}`;
        nodes.push({
          id: dNodeId,
          type: "decision",
          data: d,
          x: dx,
          y: dy,
          isFocal: d.id === focalDecisionId,
        });

        // Link Team Hub -> Decision Node
        links.push({ from: centerNodeId, to: dNodeId, color: "#8b5cf6", width: 2.5 });

        // Supported Documents nodes for decision
        const atts = allAttachmentsMap[d.id] || [];
        atts.forEach((att, aIdx) => {
          const aAngle = angle + (aIdx + 1) * 0.42 - 0.2;
          const aDist = 70;
          const ax = Math.round(dx + Math.cos(aAngle) * aDist);
          const ay = Math.round(dy + Math.sin(aAngle) * aDist);
          const attNodeId = `att-${att.id}`;

          nodes.push({
            id: attNodeId,
            type: "attachment",
            data: att,
            decisionId: d.id,
            x: ax,
            y: ay,
          });

          // Link Decision Node -> Supported Document Attachment Node
          links.push({ from: dNodeId, to: attNodeId, color: "#2dd4bf", dash: true, width: 1.5 });
        });
      });
    } else {
      // CROSS-TEAM NETWORK GRAPH (Team Hubs + Category Hubs + Decisions + Supported Docs)
      const catPositions = {
        Architecture: { x: 180, y: 130, color: "#3b82f6" },
        Infrastructure: { x: 570, y: 130, color: "#8b5cf6" },
        Security: { x: 180, y: 410, color: "#ef4444" },
        Process: { x: 570, y: 410, color: "#f59e0b" },
      };

      // Add Team Hub Nodes
      teams.forEach((t, tIdx) => {
        const tx = tIdx % 2 === 0 ? 120 : 630;
        const ty = 90 + Math.floor(tIdx / 2) * 140;
        nodes.push({
          id: `team-hub-${t.id}`,
          type: "team-root",
          name: t.name,
          teamId: t.id,
          x: tx,
          y: ty,
          color: "#8b5cf6",
        });
      });

      // Category Hubs
      Object.keys(catPositions).forEach((cat) => {
        const pos = catPositions[cat];
        nodes.push({
          id: `cat-${cat}`,
          type: "category",
          name: cat,
          x: pos.x,
          y: pos.y,
          color: pos.color,
        });
      });

      // Decision Nodes & Supported Document Nodes
      const decList = filteredDecisions.slice(0, 12);
      decList.forEach((d, idx) => {
        const catPos = catPositions[d.category] || { x: centerX, y: centerY, color: "#3b82f6" };
        const angle = (idx * (2 * Math.PI / decList.length));
        const dist = 95;
        const dx = Math.round(catPos.x + Math.cos(angle) * dist);
        const dy = Math.round(catPos.y + Math.sin(angle) * dist);

        const dNodeId = `dec-${d.id}`;
        nodes.push({
          id: dNodeId,
          type: "decision",
          data: d,
          x: dx,
          y: dy,
          isFocal: d.id === focalDecisionId,
        });

        links.push({ from: `cat-${d.category}`, to: dNodeId, color: catPos.color, width: 2 });

        const dTeamId = d.creator_team_id || d.team_id;
        if (dTeamId) {
          const teamNodeId = `team-hub-${dTeamId}`;
          if (nodes.some((n) => n.id === teamNodeId)) {
            links.push({ from: teamNodeId, to: dNodeId, color: "#8b5cf6", dash: true, width: 1.5 });
          }
        }

        // Supported Documents nodes for decision
        const atts = allAttachmentsMap[d.id] || [];
        atts.forEach((att, aIdx) => {
          const aAngle = angle + (aIdx + 1) * 0.48 - 0.2;
          const ax = Math.round(dx + Math.cos(aAngle) * 55);
          const ay = Math.round(dy + Math.sin(aAngle) * 55);
          const attNodeId = `att-${att.id}`;

          nodes.push({
            id: attNodeId,
            type: "attachment",
            data: att,
            decisionId: d.id,
            x: ax,
            y: ay,
          });

          links.push({ from: dNodeId, to: attNodeId, color: "#2dd4bf", dash: true, width: 1.5 });
        });
      });
    }

    return { nodes, links };
  }, [filteredDecisions, focalDecisionId, allAttachmentsMap, selectedTeam, teams]);

  const currentTeamName = useMemo(() => {
    if (selectedTeam === "all") return "All Teams (Cross-Network)";
    const t = teams.find((tm) => String(tm.id) === String(selectedTeam));
    return t ? t.name : `Team #${selectedTeam}`;
  }, [selectedTeam, teams]);

  // Render SVG Graph Function for reutilization (inline & fullscreen modal)
  const renderSvgCanvas = (viewBox = "0 0 750 550") => (
    <svg width="100%" height="100%" viewBox={viewBox} style={{ display: "block" }}>
      <defs>
        <pattern id="graph-grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#graph-grid)" />

      {/* Graph Edges / Links */}
      {graphNodes.links.map((link, lIdx) => {
        const sourceNode = graphNodes.nodes.find((n) => n.id === link.from);
        const targetNode = graphNodes.nodes.find((n) => n.id === link.to);
        if (!sourceNode || !targetNode) return null;

        return (
          <line
            key={`edge-${lIdx}`}
            x1={sourceNode.x}
            y1={sourceNode.y}
            x2={targetNode.x}
            y2={targetNode.y}
            stroke={link.color || "#475569"}
            strokeWidth={link.width || 1.8}
            strokeDasharray={link.dash ? "4 4" : undefined}
            opacity="0.85"
          />
        );
      })}

      {/* Graph Nodes */}
      {graphNodes.nodes.map((node) => {
        if (node.type === "team-root") {
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedNode({ type: "team", id: node.teamId, name: node.name })}
            >
              <circle r="34" fill="#8b5cf6" opacity="0.25" />
              <circle r="26" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2.5" />
              <text textAnchor="middle" dy="6" fill="#ffffff" fontSize="16">👥</text>
              <text x="0" y="42" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="bold">
                {truncate(node.name, 18)}
              </text>
            </g>
          );
        }

        if (node.type === "category") {
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`} style={{ cursor: "pointer" }} onClick={() => setSelectedNode({ type: "category", name: node.name })}>
              <circle r="26" fill={node.color} opacity="0.25" />
              <circle r="19" fill={node.color} stroke="#ffffff" strokeWidth="2" />
              <text textAnchor="middle" dy="4.5" fill="#ffffff" fontSize="10" fontWeight="bold">
                {node.name.slice(0, 5).toUpperCase()}
              </text>
            </g>
          );
        }

        if (node.type === "decision") {
          const isFocal = node.data.id === focalDecisionId;
          return (
            <g key={node.id}>
              <g
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setFocalDecisionId(node.data.id);
                  setSelectedNode({ type: "decision", data: node.data });
                }}
              >
                {isFocal && <circle r="26" fill="#2563eb" opacity="0.4" />}
                <circle r="17" fill={isFocal ? "#2563eb" : "#3b82f6"} stroke={isFocal ? "#ffffff" : "#bfdbfe"} strokeWidth={isFocal ? 2.5 : 1.5} />
                <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="10" fontWeight="bold">ADR</text>
              </g>
              <text x={node.x} y={node.y + 28} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight={isFocal ? "bold" : "600"}>
                {truncate(node.data.title, 14)}
              </text>
            </g>
          );
        }

        if (node.type === "attachment") {
          return (
            <g key={node.id}>
              <g
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedNode({ type: "attachment", data: node.data, decisionId: node.decisionId });
                  setPreviewAttachment(node.data);
                }}
              >
                <circle r="13" fill="#0d9488" stroke="#2dd4bf" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="10">📄</text>
              </g>
              <text x={node.x} y={node.y + 23} textAnchor="middle" fill="#2dd4bf" fontSize="9" fontWeight="700">
                {truncate(node.data.filename || node.data.file_name, 12)}
              </text>
            </g>
          );
        }

        return null;
      })}
    </svg>
  );

  return (
    <div className="repository-page" style={{ padding: "24px 32px", maxWidth: 1500, margin: "0 auto" }}>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "24px 32px",
          borderRadius: 16,
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
          color: "#ffffff"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>📚</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.02em" }}>
              Knowledge Repository & Team Knowledge Graphs
            </h1>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "6px 0 0 40px", maxWidth: 750 }}>
            Inspect dedicated high-resolution Knowledge Graphs for each team, explore team decision trees, and access connected supporting document specifications.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowUploadModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 10,
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
            cursor: "pointer"
          }}
        >
          <span style={{ fontSize: 18 }}>+</span> Document Decision
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
          marginBottom: 28
        }}
      >
        <div className="metric-card" style={{ background: "#ffffff", padding: 20, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Documents</span>
            <span style={{ fontSize: 22 }}>📂</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>{totalDocs}</div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4, fontWeight: 600 }}>↑ Live Database Sync</div>
        </div>

        <div className="metric-card" style={{ background: "#ffffff", padding: 20, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase" }}>Active Teams</span>
            <span style={{ fontSize: 22 }}>👥</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#7c3aed", marginTop: 8 }}>{teams.length}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Separate Graphs Available</div>
        </div>

        <div className="metric-card" style={{ background: "#ffffff", padding: 20, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0d9488", textTransform: "uppercase" }}>Supported Files</span>
            <span style={{ fontSize: 22 }}>📎</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#0f766e", marginTop: 8 }}>
            {Object.values(allAttachmentsMap).reduce((acc, curr) => acc + curr.length, 0)}
          </div>
          <div style={{ fontSize: 12, color: "#0d9488", marginTop: 4, fontWeight: 600 }}>Graph Attached Specs</div>
        </div>

        <div className="metric-card" style={{ background: "#ffffff", padding: 20, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>Approved Specs</span>
            <span style={{ fontSize: 22 }}>✅</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#15803d", marginTop: 8 }}>{approvedDocs}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0}% of repository</div>
        </div>
      </div>

      {/* Filter & View Control Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: 16,
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, flex: "1 1 500px", alignItems: "center" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
            <input
              type="text"
              placeholder="Search documents by title, rationale, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, outline: "none" }}
            />
          </div>

          <select
            value={selectedTeam}
            onChange={(e) => handleTeamChange(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "#ffffff", color: "#334155", cursor: "pointer" }}
          >
            <option value="all">🌐 All Teams Network</option>
            {teams.map((t) => (
              <option key={t.id} value={String(t.id)}>👥 Team: {t.name}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "#ffffff", color: "#334155", cursor: "pointer" }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(searchTerm || selectedTeam !== "all" || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                handleTeamChange("all");
                setSelectedCategory("all");
              }}
              style={{ background: "none", border: "none", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 12px" }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Layout Mode Toggles */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setLayoutMode(layoutMode === "split" ? "full-width" : "split")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {layoutMode === "split" ? "🗺️ Full Width Graph" : "🖼️ Split Grid View"}
          </button>
          <button
            onClick={() => setIsFullscreenGraph(true)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "#8b5cf6",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(139, 92, 246, 0.3)"
            }}
          >
            🔍 Fullscreen View
          </button>
        </div>
      </div>

      {/* Main Grid or Full Width Layout */}
      <div style={{ display: "grid", gridTemplateColumns: layoutMode === "split" ? "1fr 1.2fr" : "1fr", gap: 24, alignItems: "start" }}>
        
        {/* Dedicated Interactive Large Knowledge Graph */}
        <div style={{ order: layoutMode === "full-width" ? 1 : 2 }}>
          <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 4px 14px rgba(0,0,0,0.04)", position: layoutMode === "split" ? "sticky" : "static", top: 20 }}>
            
            {/* Knowledge Graph Header & Mode Switcher */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>🕸️</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {selectedTeam !== "all" ? `${currentTeamName} Knowledge Graph` : "Cross-Team Knowledge Graph Network"}
                </h3>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="status-pill blue" style={{ fontSize: 11 }}>
                  {selectedTeam !== "all" ? "Team Central Hub" : "Full Network"}
                </span>
                <button
                  onClick={() => setIsFullscreenGraph(true)}
                  style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  🔍 Expand Fullscreen
                </button>
              </div>
            </div>

            {/* Dedicated Team Selector Pill Bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>
                Select Separate Team Knowledge Graph:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 110, overflowY: "auto" }}>
                <button
                  onClick={() => handleTeamChange("all")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 18,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    background: selectedTeam === "all" ? "#8b5cf6" : "#f1f5f9",
                    color: selectedTeam === "all" ? "#ffffff" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  🌐 All Teams Network
                </button>
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTeamChange(String(t.id))}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 18,
                      fontSize: 12,
                      fontWeight: 700,
                      border: "none",
                      background: String(selectedTeam) === String(t.id) ? "#2563eb" : "#f1f5f9",
                      color: String(selectedTeam) === String(t.id) ? "#ffffff" : "#475569",
                      cursor: "pointer"
                    }}
                  >
                    👥 {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Large SVG Canvas Container (Unobstructed View) */}
            <div
              style={{
                width: "100%",
                height: layoutMode === "full-width" ? 620 : 560,
                background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
                borderRadius: 14,
                position: "relative",
                overflow: "hidden",
                border: "1px solid #334155"
              }}
            >
              {renderSvgCanvas("0 0 750 550")}
            </div>

            {/* Docked Non-Blocking Inspector Box Below Canvas */}
            {selectedNode && (
              <div style={{ marginTop: 14, background: "#0f172a", border: "1px solid #3b82f6", padding: "14px 16px", borderRadius: 12, color: "#ffffff", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    {selectedNode.type === "team" && (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#c084fc" }}>👥 Team Hub Node: {selectedNode.name}</div>
                        <div style={{ color: "#cbd5e1", marginTop: 4, fontSize: 12 }}>
                          Central knowledge hub connecting decisions and supported document specifications for this team.
                        </div>
                      </div>
                    )}

                    {selectedNode.type === "decision" && (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#60a5fa" }}>{selectedNode.data.title}</div>
                        <div style={{ color: "#cbd5e1", marginTop: 4, lineHeight: "1.4" }}>
                          {selectedNode.data.problem_statement || selectedNode.data.rationale || "No detailed statement."}
                        </div>
                        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                          <Link to={`/decisions/${selectedNode.data.id}`} style={{ padding: "6px 14px", background: "#2563eb", color: "#ffffff", borderRadius: 6, textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                            Open Decision Page →
                          </Link>
                        </div>
                      </>
                    )}

                    {selectedNode.type === "attachment" && (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#2dd4bf" }}>📄 Supported Document Node</div>
                        <div style={{ color: "#ffffff", fontWeight: 700, marginTop: 4, fontSize: 13.5 }}>{selectedNode.data.filename || selectedNode.data.file_name}</div>
                        <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                          Size: {Math.round((selectedNode.data.file_size || 0) / 1024)} KB · {selectedNode.data.content_type || "file"}
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                          <button
                            onClick={() => setPreviewAttachment(selectedNode.data)}
                            style={{ background: "#0d9488", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            👁️ Retrieve & View Document
                          </button>
                          <button
                            onClick={async () => {
                              try { await downloadFile(selectedNode.data.file_path, selectedNode.data.filename); } catch (err) { showToast(err.message, "error"); }
                            }}
                            style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            📥 Download File
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === "category" && (
                      <>
                        <div style={{ fontWeight: 800, color: "#fbbf24", fontSize: 14 }}>Category Cluster Node</div>
                        <div style={{ color: "#e2e8f0", marginTop: 4 }}>
                          Category: <strong>{selectedNode.name}</strong> ({decisions.filter((d) => d.category === selectedNode.name).length} decisions)
                        </div>
                      </>
                    )}
                  </div>

                  <button onClick={() => setSelectedNode(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>✕</button>
                </div>
              </div>
            )}

            {/* Graph Legend */}
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: "#64748b", background: "#f8fafc", padding: "10px 14px", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#8b5cf6" }}></span>
                <span style={{ fontWeight: 600 }}>Team Hub Node</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#2563eb" }}></span>
                <span style={{ fontWeight: 600 }}>Decision Node (ADR)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#2dd4bf" }}></span>
                <span style={{ fontWeight: 600 }}>Supported Document Attachment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div style={{ order: layoutMode === "full-width" ? 2 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Repository Documents ({filteredDecisions.length})
            </h3>
            <span style={{ fontSize: 12, color: "#64748b" }}>Showing indexed items</span>
          </div>

          {loading ? (
            <div className="loading-state" style={{ padding: 40, textAlign: "center" }}>Loading repository documents...</div>
          ) : filteredDecisions.length === 0 ? (
            <div style={{ background: "#ffffff", padding: 40, borderRadius: 14, textAlign: "center", border: "1px dashed #cbd5e1" }}>
              <span style={{ fontSize: 36 }}>🔍</span>
              <h4 style={{ margin: "12px 0 6px 0", color: "#334155" }}>No matching documents found</h4>
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Try selecting another team or clearing search filters.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredDecisions.map((doc) => {
                const teamId = doc.creator_team_id || doc.team_id;
                const teamName = teams.find((t) => String(t.id) === String(teamId))?.name || "Architecture Team";
                const isSelectedFocal = doc.id === focalDecisionId;
                const docAtts = allAttachmentsMap[doc.id] || [];

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setFocalDecisionId(doc.id);
                      setSelectedNode({ type: "decision", data: doc });
                    }}
                    style={{
                      background: isSelectedFocal ? "#f8fafc" : "#ffffff",
                      borderRadius: 14,
                      border: isSelectedFocal ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      padding: 18,
                      boxShadow: isSelectedFocal ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "0 2px 6px rgba(0,0,0,0.02)",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                        📄
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <Link
                            to={`/decisions/${doc.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", textDecoration: "none" }}
                          >
                            {doc.title}
                          </Link>
                          <StatusBadge status={doc.status} />
                        </div>

                        <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 10px 0", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {doc.rationale || doc.problem_statement || "No detailed rationale provided."}
                        </p>

                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 12, color: "#64748b" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 4 }}>
                              👥 {teamName}
                            </span>
                            <span>Category: <strong>{doc.category}</strong></span>
                            {docAtts.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewAttachment(docAtts[0]);
                                }}
                                style={{ background: "#ccfbf1", color: "#0f766e", border: "none", padding: "2px 8px", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}
                              >
                                📎 View {docAtts.length} Attachment{docAtts.length > 1 ? "s" : ""}
                              </button>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFocalDecisionId(doc.id);
                              setSelectedNode({ type: "decision", data: doc });
                            }}
                            style={{ background: isSelectedFocal ? "#2563eb" : "#f1f5f9", color: isSelectedFocal ? "#ffffff" : "#334155", border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            {isSelectedFocal ? "🕸️ Focal Node" : "🕸️ Inspect Node"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN IMMERSIVE KNOWLEDGE GRAPH MODAL */}
      {isFullscreenGraph && (
        <div
          onClick={() => setIsFullscreenGraph(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(12px)",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            padding: 24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f172a",
              borderRadius: 20,
              border: "1px solid #334155",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7)"
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e293b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>🕸️</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#ffffff" }}>
                    {currentTeamName} — Immersive Fullscreen Knowledge Graph
                  </h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#94a3b8" }}>
                    High-definition interactive view of team decision networks and connected document attachments.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFullscreenGraph(false)}
                style={{ background: "#334155", border: "none", color: "#ffffff", width: 36, height: 36, borderRadius: "50%", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Graph Viewport */}
            <div style={{ flex: 1, position: "relative", background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>
              {renderSvgCanvas("0 0 750 550")}
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL FOR FULL VISIBILITY AND RETRIEVAL */}
      {previewAttachment && (
        <DocumentViewerModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}

      {showUploadModal && (
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onUploaded={() => {
            fetchData();
            showToast("Document specification uploaded to Knowledge Repository!");
          }}
        />
      )}
    </div>
  );
}
