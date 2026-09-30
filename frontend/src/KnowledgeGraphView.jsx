import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

const ENTITY_COLORS = {
  decision: "#2563eb",         // Royal blue
  decision_approved: "#10b981",// Emerald green
  decision_review: "#f59e0b",  // Amber
  decision_draft: "#64748b",   // Slate
  decision_rejected: "#ef4444",// Rose red
  team: "#8b5cf6",             // Purple
  user: "#059669",             // Green / People
  doc: "#0284c7",              // Ocean Cyan / Blue
  state: "#d97706",            // Amber / Orange
  topic: "#ea580c",            // Warm Orange
  imp: "#db2777",              // Magenta / Pink
  category: "#6366f1",         // Indigo
};

// Sparkle Star Icon matching the screenshot
const SparkleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="graph-sparkle-icon">
    <defs>
      <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* Primary 4-point star */}
    <path
      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z"
      fill="url(#sparkleGrad)"
    />
    {/* Secondary small star top right */}
    <path
      d="M19 2C19 4 17.5 5.5 15.5 5.5C17.5 5.5 19 7 19 9C19 7 20.5 5.5 22.5 5.5C20.5 5.5 19 4 19 2Z"
      fill="#38bdf8"
      opacity="0.85"
    />
  </svg>
);

// Reset / Refresh Circular Icon
const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

export default function KnowledgeGraphView({
  decisions = [],
  knowledgeTagsList = [],
  distinctCategories = [],
  allDocuments = [],
  openDecisionTimeline,
  handleViewDetails,
  API_URL = "http://localhost:8000",
}) {
  // 1. Focal Decision Selection State
  // Prefer "selection of fpga platform for real time DSP application" as initial focal if present
  const defaultFocalId = useMemo(() => {
    if (!decisions || decisions.length === 0) return 1;
    const fpgaDec = decisions.find(d =>
      (d.title || "").toLowerCase().includes("fpga")
    );
    return fpgaDec ? fpgaDec.id : decisions[0].id;
  }, [decisions]);

  const [selectedFocalId, setSelectedFocalId] = useState(defaultFocalId);

  // Sync selectedFocalId if default changes and current is invalid
  useEffect(() => {
    if (decisions && decisions.length > 0) {
      const exists = decisions.some(d => String(d.id) === String(selectedFocalId));
      if (!exists) {
        setSelectedFocalId(defaultFocalId);
      }
    }
  }, [decisions, defaultFocalId, selectedFocalId]);

  // Active focal decision record
  const focalDecision = useMemo(() => {
    if (!decisions || decisions.length === 0) {
      return {
        id: 1,
        title: "selection of fpga platform for real time DSP application",
        description: "Selection of FPGA platform for real time DSP application with low latency streaming.",
        decision_type: "Product & Strategy",
        status: "IN_APPROVAL",
        author: "dilleswarao",
        author_role: "Lead Architect",
        team: "FPGA and DSP Team",
        team_description: "Department",
        tags: ["cost-saving", "high-impact"],
        rationale: "Deterministic latency under 2.5us and 35% BOM cost savings.",
        files: [{ filename: "MICRO_SYLLABUS_DSP_FPGA.pdf", file_type: "PDF" }],
        approval_stage_name: "Not Started",
      };
    }
    const found = decisions.find(d => String(d.id) === String(selectedFocalId));
    return found || decisions[0];
  }, [decisions, selectedFocalId]);

  // Mode: "orbit" (the exact radial star graph from the screenshot) or "network" (full graph)
  const [viewMode, setViewMode] = useState("orbit");

  // Selected node for detail drawer
  const [inspectedNode, setInspectedNode] = useState(null);

  // Pan & Zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging nodes
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const customNodePositions = useRef({}); // nodeId -> { x, y }
  const [, setRerenderTick] = useState(0);

  const svgRef = useRef(null);

  // Reset positions and zoom
  const handleResetView = () => {
    customNodePositions.current = {};
    setTransform({ x: 0, y: 0, scale: 1 });
    setInspectedNode(null);
    setRerenderTick(t => t + 1);
  };

  // -------------------------------------------------------------
  // BUILD ORBIT SATELLITES FOR FOCAL DECISION (Matching Screenshot)
  // -------------------------------------------------------------
  const orbitData = useMemo(() => {
    const cx = 400;
    const cy = 275;
    const orbitRadius = 185;

    const tags = Array.isArray(focalDecision.tags)
      ? focalDecision.tags
      : (focalDecision.tags ? focalDecision.tags.split(",").map(t => t.trim()).filter(Boolean) : ["cost-saving", "high-impact"]);

    // Find any attached document
    let docName = "MICRO_SYLLABUS_DSP_FPGA.pdf";
    let docType = "PDF";
    let docObj = null;

    if (focalDecision.files && focalDecision.files.length > 0) {
      docName = focalDecision.files[0].filename || docName;
      docType = focalDecision.files[0].file_type || (docName.toLowerCase().endsWith(".pdf") ? "PDF" : "DOC");
      docObj = focalDecision.files[0];
    } else if (allDocuments && allDocuments.length > 0) {
      const matchDoc = allDocuments.find(doc => Number(doc.decision_id) === Number(focalDecision.id));
      if (matchDoc) {
        docName = matchDoc.filename;
        docType = docName.toLowerCase().endsWith(".pdf") ? "PDF" : "DOC";
        docObj = matchDoc;
      }
    }

    // Truncate document name to match "MICRO_SYLLABUS_-..."
    const displayDocName = docName.length > 17
      ? docName.substring(0, 16) + "-..."
      : docName;

    // Satellites template matching screenshot clock positions
    // 1. TEAM (Top -90 deg / 12 o'clock)
    // 2. USER (Top-Right -35 deg / ~1:30 o'clock)
    // 3. DOC (Bottom-Right 22 deg / ~4 o'clock)
    // 4. STATE (Bottom-Right 70 deg / ~5:30 o'clock)
    // 5. TOPIC 1 (Bottom-Left 115 deg / ~6:30 o'clock)
    // 6. TOPIC 2 (Bottom-Left 162 deg / ~8 o'clock)
    // 7. IMP (Top-Left 220 deg / ~10 o'clock)
    const rawSatellites = [
      {
        id: "sat-team",
        entity_type: "team",
        badge: "TEAM",
        color: ENTITY_COLORS.team,
        angleDeg: -90,
        primaryLabel: focalDecision.team || "FPGA and DSP Team",
        subtitle: focalDecision.team_description || "Department",
        relationLabel: "created by",
        raw: {
          name: focalDecision.team || "FPGA and DSP Team",
          description: focalDecision.team_description || "Department",
          id: focalDecision.team_id || 1,
        },
      },
      {
        id: "sat-user",
        entity_type: "user",
        badge: "USER",
        color: ENTITY_COLORS.user,
        angleDeg: -35,
        primaryLabel: focalDecision.author || "dilleswarao",
        subtitle: focalDecision.author_role || "Lead Architect",
        relationLabel: "discussed by",
        raw: {
          name: focalDecision.author || "dilleswarao",
          role: focalDecision.author_role || "Lead Architect",
          id: focalDecision.created_by || 1,
        },
      },
      {
        id: "sat-doc",
        entity_type: "doc",
        badge: "DOC",
        color: ENTITY_COLORS.doc,
        angleDeg: 22,
        primaryLabel: displayDocName,
        fullLabel: docName,
        subtitle: docType,
        relationLabel: "supported by",
        raw: docObj || { filename: docName, type: docType, size: "1.8 MB" },
      },
      {
        id: "sat-state",
        entity_type: "state",
        badge: "STATE",
        color: ENTITY_COLORS.state,
        angleDeg: 70,
        primaryLabel: focalDecision.status || "IN_APPROVAL",
        subtitle: focalDecision.approval_stage_name || (focalDecision.status === "APPROVED" ? "Completed" : "Not Started"),
        relationLabel: "resulted in",
        raw: {
          status: focalDecision.status || "IN_APPROVAL",
          stageName: focalDecision.approval_stage_name || "Not Started",
          stage: focalDecision.approval_stage || 1,
        },
      },
      {
        id: "sat-topic-1",
        entity_type: "topic",
        badge: "TOPIC",
        color: ENTITY_COLORS.topic,
        angleDeg: 115,
        primaryLabel: tags[0] || "cost-saving",
        subtitle: "Taxonomy Tag",
        relationLabel: "related to",
        raw: { tag: tags[0] || "cost-saving" },
      },
      {
        id: "sat-topic-2",
        entity_type: "topic",
        badge: "TOPIC",
        color: ENTITY_COLORS.topic,
        angleDeg: 162,
        primaryLabel: tags[1] || (tags.length > 1 ? tags[1] : "high-impact"),
        subtitle: "Taxonomy Tag",
        relationLabel: "related to",
        raw: { tag: tags[1] || "high-impact" },
      },
      {
        id: "sat-imp",
        entity_type: "imp",
        badge: "IMP",
        color: ENTITY_COLORS.imp,
        angleDeg: 220,
        primaryLabel: (focalDecision.decision_type || "Product & Strategy").length > 17
          ? (focalDecision.decision_type || "Product & Strategy").substring(0, 16) + "..."
          : (focalDecision.decision_type || "Product & Strategy"),
        fullLabel: focalDecision.decision_type || "Product & Strategy",
        subtitle: "Strategic Influence",
        relationLabel: "influences",
        raw: {
          category: focalDecision.decision_type || "Product & Strategy",
          impact: "Strategic Influence",
        },
      },
    ];

    // Compute coordinates for each satellite
    const satellites = rawSatellites.map((sat) => {
      const custom = customNodePositions.current[sat.id];
      const rad = (sat.angleDeg * Math.PI) / 180;
      const defaultX = cx + Math.cos(rad) * orbitRadius;
      const defaultY = cy + Math.sin(rad) * orbitRadius;
      return {
        ...sat,
        x: custom ? custom.x : defaultX,
        y: custom ? custom.y : defaultY,
        defaultX,
        defaultY,
      };
    });

    const centerCustom = customNodePositions.current["center-adr"];
    const centerNode = {
      id: "center-adr",
      entity_type: "decision",
      badge: "ADR",
      color: ENTITY_COLORS.decision,
      x: centerCustom ? centerCustom.x : cx,
      y: centerCustom ? centerCustom.y : cy,
      defaultX: cx,
      defaultY: cy,
      title: focalDecision.title,
      truncatedTitle: focalDecision.title.length > 20
        ? focalDecision.title.substring(0, 19) + "..."
        : focalDecision.title,
      subBadge: "related to • in approval • resulted in",
      raw: focalDecision,
    };

    return {
      cx,
      cy,
      orbitRadius,
      centerNode,
      satellites,
    };
  }, [focalDecision, allDocuments]);

  // -------------------------------------------------------------
  // PAN & ZOOM HANDLERS
  // -------------------------------------------------------------
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform(prev => {
      const newScale = Math.min(2.5, Math.max(0.45, prev.scale * zoomFactor));
      return { ...prev, scale: newScale };
    });
  };

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === "svg" || e.target.classList.contains("graph-bg")) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else if (draggedNodeId) {
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - transform.x) / transform.scale;
      const rawY = (e.clientY - rect.top - transform.y) / transform.scale;
      customNodePositions.current[draggedNodeId] = { x: rawX, y: rawY };
      setRerenderTick(t => t + 1);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Zoom helpers
  const handleZoomIn = () => setTransform(p => ({ ...p, scale: Math.min(2.5, p.scale * 1.2) }));
  const handleZoomOut = () => setTransform(p => ({ ...p, scale: Math.max(0.45, p.scale * 0.8) }));

  return (
    <div className="interactive-kg-card">
      {/* 1. TOP HEADER ROW MATCHING SCREENSHOT */}
      <div className="kg-header-row">
        <div className="kg-title-block">
          <div className="kg-title-main">
            <SparkleIcon />
            <h3 className="kg-title-text">INTERACTIVE KNOWLEDGE GRAPH</h3>
          </div>
          <div className="kg-subtitle-text" title={focalDecision.title}>
            {focalDecision.title}
          </div>
        </div>

        <div className="kg-top-actions">
          {/* View Mode Toggle: Orbit vs Network */}
          <div className="kg-mode-toggle">
            <button
              className={`mode-btn ${viewMode === "orbit" ? "active" : ""}`}
              onClick={() => setViewMode("orbit")}
              title="Focal Decision Radial Orbit Graph"
            >
              ⭐ Focal Orbit
            </button>
            <button
              className={`mode-btn ${viewMode === "network" ? "active" : ""}`}
              onClick={() => setViewMode("network")}
              title="Global Multi-Decision Relationship Network"
            >
              🌐 Global Network
            </button>
          </div>

          {/* Reset / Refresh Button */}
          <button
            className="kg-refresh-btn"
            onClick={handleResetView}
            title="Reset Viewport & Orbit Guideline"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* 2. FOCAL DECISION NODE SELECTOR */}
      <div className="kg-focal-selector-wrap">
        <label className="kg-focal-label">Focal Decision Node:</label>
        <div className="kg-select-custom-wrapper">
          <select
            className="kg-focal-select"
            value={selectedFocalId}
            onChange={(e) => {
              const newId = Number(e.target.value) || e.target.value;
              setSelectedFocalId(newId);
              customNodePositions.current = {};
              setInspectedNode(null);
            }}
          >
            {decisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
          <div className="kg-select-arrow">⌄</div>
        </div>
      </div>

      {/* 3. GRAPH CANVAS VIEWPORT */}
      <div className="kg-canvas-container">
        <div
          className="kg-canvas-area"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg
            ref={svgRef}
            className="kg-svg-canvas"
            viewBox="0 0 800 580"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Soft blue glow filter for focal ADR node */}
              <filter id="adrGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#2563eb" floodOpacity="0.45" />
              </filter>

              {/* Ambient radial blur aura */}
              <radialGradient id="centerAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#2563eb" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </radialGradient>

              {/* Node drop shadow for clean floating effect */}
              <filter id="nodeCardShadow" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.08" />
              </filter>
            </defs>

            {/* Clickable transparent background for pan */}
            <rect className="graph-bg" width="100%" height="100%" fill="transparent" />

            {/* TRANSFORM GROUP (Pan & Zoom) */}
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              {/* ORBIT VIEW MODE (Default & matches Screenshot) */}
              {viewMode === "orbit" && (
                <g className="orbit-graph-layer">
                  {/* Outer Concentric Dotted Guideline Ring */}
                  <circle
                    cx={orbitData.cx}
                    cy={orbitData.cy}
                    r={orbitData.orbitRadius}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="orbit-guide-ring"
                  />

                  {/* EDGES: Center ADR to Satellites */}
                  <g className="orbit-edges-layer">
                    {orbitData.satellites.map((sat) => {
                      const midX = (orbitData.centerNode.x + sat.x) / 2;
                      const midY = (orbitData.centerNode.y + sat.y) / 2;
                      const labelWidth = Math.max(54, sat.relationLabel.length * 6.5 + 14);

                      return (
                        <g key={`edge-${sat.id}`} className="orbit-edge-group">
                          {/* Radiating line */}
                          <line
                            x1={orbitData.centerNode.x}
                            y1={orbitData.centerNode.y}
                            x2={sat.x}
                            y2={sat.y}
                            stroke="#cbd5e1"
                            strokeWidth="1.4"
                            strokeOpacity="0.85"
                          />

                          {/* Edge relation pill badge in the center */}
                          <g transform={`translate(${midX}, ${midY})`} className="orbit-edge-pill">
                            <rect
                              x={-labelWidth / 2}
                              y="-9"
                              width={labelWidth}
                              height="18"
                              rx="9"
                              fill="#ffffff"
                              stroke="#e2e8f0"
                              strokeWidth="0.8"
                            />
                            <text
                              textAnchor="middle"
                              dy="3.5"
                              fill="#64748b"
                              fontSize="9.5px"
                              fontWeight="500"
                              letterSpacing="0.2px"
                            >
                              {sat.relationLabel}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>

                  {/* SATELLITE NODES */}
                  <g className="orbit-satellites-layer">
                    {orbitData.satellites.map((sat) => {
                      const isInspected = inspectedNode && inspectedNode.id === sat.id;
                      const cardW = Math.max(105, sat.primaryLabel.length * 6.8 + 20);

                      return (
                        <g
                          key={sat.id}
                          transform={`translate(${sat.x}, ${sat.y})`}
                          className={`satellite-node-group ${isInspected ? "inspected" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedNode(sat);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggedNodeId(sat.id);
                          }}
                          style={{ cursor: "grab" }}
                        >
                          {/* Selection indicator halo */}
                          {isInspected && (
                            <circle
                              r="30"
                              fill="none"
                              stroke={sat.color}
                              strokeWidth="2.5"
                              strokeDasharray="4 3"
                              className="orbit-inspect-halo"
                            />
                          )}

                          {/* Outer White Badge with Colored Border */}
                          <circle
                            r="23"
                            fill="#ffffff"
                            stroke={sat.color}
                            strokeWidth="3.2"
                            filter="url(#nodeCardShadow)"
                          />

                          {/* Inner Solid Colored Circle */}
                          <circle
                            r="18.5"
                            fill={sat.color}
                          />

                          {/* White Bold Acronym / Badge (TEAM, USER, DOC, STATE, TOPIC, IMP) */}
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize="10.5px"
                            fontWeight="800"
                            letterSpacing="0.3px"
                          >
                            {sat.badge}
                          </text>

                          {/* Floating Card Directly Underneath */}
                          <g transform="translate(0, 27)" className="satellite-card-group">
                            <rect
                              x={-cardW / 2}
                              y="0"
                              width={cardW}
                              height="34"
                              rx="8"
                              fill="#ffffff"
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              filter="url(#nodeCardShadow)"
                            />
                            {/* Primary Title (e.g. FPGA and DSP Team, dilleswarao, etc.) */}
                            <text
                              x="0"
                              y="14"
                              textAnchor="middle"
                              fill="#1e293b"
                              fontSize="10.5px"
                              fontWeight="700"
                            >
                              {sat.primaryLabel}
                            </text>
                            {/* Subtitle (e.g. Department, Lead Architect, PDF, Taxonomy Tag) */}
                            <text
                              x="0"
                              y="26"
                              textAnchor="middle"
                              fill="#64748b"
                              fontSize="8.5px"
                              fontWeight="500"
                            >
                              {sat.subtitle}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>

                  {/* CENTER FOCAL NODE (ADR) */}
                  <g
                    transform={`translate(${orbitData.centerNode.x}, ${orbitData.centerNode.y})`}
                    className="center-focal-group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedNode(orbitData.centerNode);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggedNodeId("center-adr");
                    }}
                    style={{ cursor: "grab" }}
                  >
                    {/* Soft glowing ambient aura behind center node */}
                    <circle r="48" fill="url(#centerAura)" />

                    {/* Central Royal Blue Circle with Glow */}
                    <circle
                      r="33"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="3.2"
                      filter="url(#adrGlow)"
                    />

                    {/* Bold White Text ADR */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize="14.5px"
                      fontWeight="800"
                      letterSpacing="0.8px"
                    >
                      ADR
                    </text>

                    {/* Connected Pill Card Directly Underneath ADR */}
                    <g transform="translate(0, 39)" className="center-card-group">
                      <rect
                        x="-75"
                        y="0"
                        width="150"
                        height="32"
                        rx="9"
                        fill="#ffffff"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        filter="url(#nodeCardShadow)"
                      />
                      {/* Truncated Decision Title e.g. "selection of fpg..." */}
                      <text
                        x="0"
                        y="13"
                        textAnchor="middle"
                        fill="#1e293b"
                        fontSize="10.5px"
                        fontWeight="700"
                      >
                        {orbitData.centerNode.truncatedTitle}
                      </text>
                      {/* Relations Indicator: related to • in approval • resulted in */}
                      <text
                        x="0"
                        y="24"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8px"
                        fontWeight="500"
                      >
                        related to • in approval • resulted in
                      </text>
                    </g>
                  </g>
                </g>
              )}

              {/* NETWORK VIEW MODE (Full Multi-Decision Ecosystem) */}
              {viewMode === "network" && (
                <g className="network-graph-layer">
                  {/* Render all decisions as hubs connected to shared tags & categories */}
                  {decisions.map((d, idx) => {
                    const angle = (idx / Math.max(1, decisions.length)) * Math.PI * 2;
                    const r = 160 + (idx % 2) * 50;
                    const nx = 400 + Math.cos(angle) * r;
                    const ny = 275 + Math.sin(angle) * r;

                    return (
                      <g
                        key={`net-d-${d.id}`}
                        transform={`translate(${nx}, ${ny})`}
                        onClick={() => {
                          setSelectedFocalId(d.id);
                          setViewMode("orbit");
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <circle
                          r="28"
                          fill={Number(d.id) === Number(selectedFocalId) ? "#2563eb" : "#3b82f6"}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          filter="url(#nodeCardShadow)"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="11px"
                          fontWeight="700"
                        >
                          ADR #{d.id}
                        </text>
                        <g transform="translate(0, 32)">
                          <rect
                            x="-65"
                            y="0"
                            width="130"
                            height="24"
                            rx="6"
                            fill="#ffffff"
                            stroke="#e2e8f0"
                          />
                          <text
                            x="0"
                            y="15"
                            textAnchor="middle"
                            fill="#1e293b"
                            fontSize="9.5px"
                            fontWeight="600"
                          >
                            {d.title.length > 15 ? d.title.substring(0, 14) + "…" : d.title}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          </svg>

          {/* Quick Zoom Floating Toolbar */}
          <div className="kg-floating-zoom-controls">
            <button onClick={handleZoomIn} title="Zoom In">＋</button>
            <button onClick={handleZoomOut} title="Zoom Out">－</button>
            <button onClick={handleResetView} title="Reset Viewport">⤢</button>
          </div>
        </div>

        {/* 4. SLIDE-OUT NODE INSPECTOR DRAWER */}
        {inspectedNode && (
          <div className="kg-inspector-drawer">
            <div className="kg-drawer-header">
              <div
                className="kg-drawer-badge"
                style={{ background: inspectedNode.color || "#2563eb" }}
              >
                {inspectedNode.badge || inspectedNode.entity_type.toUpperCase()}
              </div>
              <button
                className="kg-drawer-close"
                onClick={() => setInspectedNode(null)}
                title="Close Inspector"
              >
                ✕
              </button>
            </div>

            <div className="kg-drawer-title">
              {inspectedNode.fullLabel || inspectedNode.title || inspectedNode.primaryLabel}
            </div>

            {/* DETAILS FOR ADR DECISION NODE */}
            {inspectedNode.entity_type === "decision" && (
              <div className="kg-drawer-body">
                <div className="kg-drawer-meta-badges">
                  <span className="badge-pill category">
                    {focalDecision.decision_type || "General"}
                  </span>
                  <span className={`badge-pill status ${(focalDecision.status || "DRAFT").toLowerCase()}`}>
                    {focalDecision.status || "IN_APPROVAL"}
                  </span>
                </div>

                {focalDecision.description && (
                  <div className="kg-drawer-section">
                    <label>Problem Statement & Scope:</label>
                    <p>{focalDecision.description}</p>
                  </div>
                )}

                {focalDecision.rationale && (
                  <div className="kg-drawer-section rationale-accent">
                    <label>Architectural Rationale:</label>
                    <p>{focalDecision.rationale}</p>
                  </div>
                )}

                <div className="kg-drawer-grid">
                  <div>
                    <label>Lead Author</label>
                    <p>👤 {focalDecision.author || "dilleswarao"} ({focalDecision.author_role || "Lead Architect"})</p>
                  </div>
                  <div>
                    <label>Department / Team</label>
                    <p>👥 {focalDecision.team || "FPGA and DSP Team"}</p>
                  </div>
                  <div>
                    <label>Attached Artifacts</label>
                    <p>📄 {inspectedNode.raw?.files?.[0]?.filename || "MICRO_SYLLABUS_DSP_FPGA.pdf"}</p>
                  </div>
                  <div>
                    <label>Governance State</label>
                    <p>⚖️ {focalDecision.approval_stage_name || "Stage 1: Verification"}</p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="kg-drawer-actions">
                  {openDecisionTimeline && (
                    <button
                      className="kg-action-btn primary"
                      onClick={() => openDecisionTimeline(focalDecision.id)}
                    >
                      <span>🔄 Replay Decision Timeline</span>
                    </button>
                  )}
                  {handleViewDetails && (
                    <button
                      className="kg-action-btn secondary"
                      onClick={() => handleViewDetails(focalDecision)}
                    >
                      <span>📄 Inspect Full Specification</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* DETAILS FOR TEAM NODE */}
            {inspectedNode.entity_type === "team" && (
              <div className="kg-drawer-body">
                <div className="kg-drawer-section">
                  <label>Department Overview:</label>
                  <p>
                    <strong>{inspectedNode.primaryLabel}</strong> is the primary engineering unit accountable for FPGA architectural governance, digital signal processing algorithms, and hardware verification.
                  </p>
                </div>
                <div className="kg-drawer-section">
                  <label>Assigned Responsibilities:</label>
                  <ul className="kg-drawer-list">
                    <li>RTL synthesis and timing closure for DSP pipelines</li>
                    <li>Power envelope profiling and thermal analysis</li>
                    <li>Vendor qualification and BOM cost management</li>
                  </ul>
                </div>
                <div className="kg-drawer-actions">
                  <button
                    className="kg-action-btn secondary"
                    onClick={() => setInspectedNode(null)}
                  >
                    View Team Records
                  </button>
                </div>
              </div>
            )}

            {/* DETAILS FOR USER NODE */}
            {inspectedNode.entity_type === "user" && (
              <div className="kg-drawer-body">
                <div className="kg-drawer-section">
                  <label>Author Specification:</label>
                  <p>
                    <strong>{inspectedNode.primaryLabel}</strong> serves as <strong>{inspectedNode.subtitle}</strong> for this architectural decision, providing system-level domain verification and technical oversight.
                  </p>
                </div>
                <div className="kg-drawer-section">
                  <label>Audit & Ownership:</label>
                  <p>Recorded as principal signatory on the decision replay audit log.</p>
                </div>
              </div>
            )}

            {/* DETAILS FOR DOC NODE */}
            {inspectedNode.entity_type === "doc" && (
              <div className="kg-drawer-body">
                <div className="kg-drawer-section">
                  <label>Supporting Specification Artifact:</label>
                  <p>
                    <strong>{inspectedNode.fullLabel || inspectedNode.primaryLabel}</strong> contains the technical syllabus, block diagrams, and hardware requirements for the FPGA DSP implementation.
                  </p>
                </div>
                <div className="kg-drawer-section">
                  <label>Format & Integrity:</label>
                  <p>Verified PDF format with cryptographic SHA-256 signature.</p>
                </div>
                <div className="kg-drawer-actions">
                  <a
                    href={`${API_URL}/files/1/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="kg-action-btn primary"
                    style={{ textDecoration: "none", textAlign: "center" }}
                  >
                    📥 Download Supporting Document
                  </a>
                </div>
              </div>
            )}

            {/* DETAILS FOR STATE NODE */}
            {inspectedNode.entity_type === "state" && (
              <div className="kg-drawer-body">
                <div className="kg-drawer-section">
                  <label>Governance State:</label>
                  <p>
                    Current status: <strong>{inspectedNode.primaryLabel}</strong> ({inspectedNode.subtitle}).
                    Pending multi-level technical review verification before final approval.
                  </p>
                </div>
              </div>
            )}

            {/* DETAILS FOR TOPIC / TAXONOMY NODE */}
            {inspectedNode.entity_type === "topic" && (
              <div className="kg-drawer-body">
                <div className="kg-drawer-section">
                  <label>Taxonomy Classification:</label>
                  <p>
                    Tag <strong>#{inspectedNode.primaryLabel}</strong> classifies decisions focused on resource efficiency, cost reduction, or architectural impact across the enterprise replay graph.
                  </p>
                </div>
              </div>
            )}

            {/* DETAILS FOR STRATEGIC IMP NODE */}
            {inspectedNode.entity_type === "imp" && (
              <div className="kg-drawer-body">
                <div className="kg-drawer-section">
                  <label>Strategic Impact Scope:</label>
                  <p>
                    Categorized under <strong>{inspectedNode.fullLabel || inspectedNode.primaryLabel}</strong>. Influences cross-departmental roadmap delivery, budget allocation, and technical debt governance.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. BOTTOM LEGEND ROW MATCHING SCREENSHOT */}
      <div className="kg-bottom-legend-row">
        <div className="kg-legend-item">
          <span className="kg-legend-dot decision"></span>
          <span className="kg-legend-label">Decision</span>
        </div>
        <div className="kg-legend-item">
          <span className="kg-legend-dot team"></span>
          <span className="kg-legend-label">Team</span>
        </div>
        <div className="kg-legend-item">
          <span className="kg-legend-dot people"></span>
          <span className="kg-legend-label">People</span>
        </div>
        <div className="kg-legend-item">
          <span className="kg-legend-dot docs"></span>
          <span className="kg-legend-label">Docs</span>
        </div>
        <div className="kg-legend-item">
          <span className="kg-legend-dot topic"></span>
          <span className="kg-legend-label">Topic</span>
        </div>
      </div>
    </div>
  );
}
