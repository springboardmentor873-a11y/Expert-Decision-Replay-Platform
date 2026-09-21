import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

const ENTITY_COLORS = {
  decision_approved: "#10b981", // Emerald green
  decision_review: "#f59e0b",   // Amber
  decision_draft: "#64748b",    // Slate
  decision_rejected: "#ef4444", // Rose red
  decision_archived: "#8b5cf6", // Purple
  category: "#6366f1",          // Indigo
  tag: "#06b6d4",               // Cyan
  author: "#f97316",             // Orange
  team: "#3b82f6",              // Blue
};

export default function KnowledgeGraphView({
  decisions = [],
  knowledgeTagsList = [],
  distinctCategories = [],
  openDecisionTimeline,
  handleViewDetails,
  API_URL = "http://localhost:8000",
}) {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedNode, setSelectedNode] = useState(null);
  const [layoutMode, setLayoutMode] = useState("organic"); // "organic" | "category" | "radial"
  const [isPhysicsRunning, setIsPhysicsRunning] = useState(true);

  // Filter toggles for entity types
  const [visibleTypes, setVisibleTypes] = useState({
    decision: true,
    category: true,
    tag: true,
    author: true,
    team: true,
  });

  // Zoom & Pan state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.95 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging node state
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const nodePositions = useRef({}); // nodeId -> { x, y, vx, vy }

  // 1. Fetch backend graph data with graceful client fallback
  useEffect(() => {
    let isMounted = true;
    async function loadGraph() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedStatus !== "ALL") queryParams.append("status", selectedStatus);
        if (selectedCategory !== "ALL") queryParams.append("category", selectedCategory);
        if (searchTerm) queryParams.append("q", searchTerm);

        const res = await fetch(`${API_URL}/knowledge/graph?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setGraphData(data);
            initNodePositions(data.nodes);
          }
        } else {
          fallbackLocalGraph();
        }
      } catch {
        fallbackLocalGraph();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    function fallbackLocalGraph() {
      const nodes = [];
      const edges = [];
      const seenNodes = new Set();

      const filteredDecisions = decisions.filter((d) => {
        if (selectedStatus !== "ALL" && (d.status || "").toUpperCase() !== selectedStatus.toUpperCase()) return false;
        if (selectedCategory !== "ALL" && (d.decision_type || "") !== selectedCategory) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const match = (d.title || "").toLowerCase().includes(q) ||
            (d.description || "").toLowerCase().includes(q) ||
            (d.rationale || "").toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });

      filteredDecisions.forEach((d) => {
        const dId = `decision-${d.id}`;
        if (!seenNodes.has(dId)) {
          seenNodes.add(dId);
          nodes.push({
            id: dId,
            entity_type: "decision",
            decision_id: d.id,
            label: d.title,
            title: d.title,
            description: d.description,
            category: d.decision_type || "General",
            status: d.status || "DRAFT",
            rationale: d.rationale || "",
            tags: Array.isArray(d.tags) ? d.tags : (d.tags ? d.tags.split(",").map(t => t.trim()).filter(Boolean) : []),
            team_name: d.team || "Core Team",
            author_name: d.author || "Lead Architect",
            created_at: d.created_date_formatted || "2025-01-01",
          });
        }

        const cat = d.decision_type || "General";
        const catId = `category-${cat}`;
        if (!seenNodes.has(catId)) {
          seenNodes.add(catId);
          nodes.push({ id: catId, entity_type: "category", label: cat, category: cat, count: 1 });
        }
        edges.push({
          id: `edge-cat-${d.id}-${cat}`,
          source: dId,
          target: catId,
          relation: "BELONGS_TO_CATEGORY",
          label: "category",
        });

        const dTags = Array.isArray(d.tags) ? d.tags : (d.tags ? d.tags.split(",").map(t => t.trim()).filter(Boolean) : []);
        dTags.forEach((t) => {
          const tagId = `tag-${t}`;
          if (!seenNodes.has(tagId)) {
            seenNodes.add(tagId);
            nodes.push({ id: tagId, entity_type: "tag", label: `#${t}`, tag: t, count: 1 });
          }
          edges.push({
            id: `edge-tag-${d.id}-${t}`,
            source: dId,
            target: tagId,
            relation: "TAGGED_WITH",
            label: "tag",
          });
        });

        if (d.team) {
          const teamId = `team-${d.team}`;
          if (!seenNodes.has(teamId)) {
            seenNodes.add(teamId);
            nodes.push({ id: teamId, entity_type: "team", label: d.team, count: 1 });
          }
          edges.push({
            id: `edge-team-${d.id}-${d.team}`,
            source: dId,
            target: teamId,
            relation: "ASSIGNED_TO_TEAM",
            label: "team",
          });
        }
      });

      const stats = {
        total_nodes: nodes.length,
        total_edges: edges.length,
        decisions_count: nodes.filter(n => n.entity_type === "decision").length,
        categories_count: nodes.filter(n => n.entity_type === "category").length,
        tags_count: nodes.filter(n => n.entity_type === "tag").length,
      };

      if (isMounted) {
        setGraphData({ nodes, edges, stats });
        initNodePositions(nodes);
      }
    }

    loadGraph();
    return () => { isMounted = false; };
  }, [API_URL, selectedStatus, selectedCategory, searchTerm, decisions]);

  // 2. Initialize node positions
  const initNodePositions = useCallback((nodes) => {
    const width = 960;
    const height = 620;
    const centerX = width / 2;
    const centerY = height / 2;

    const newPos = { ...nodePositions.current };
    const categories = nodes.filter(n => n.entity_type === "category");
    const decisionsList = nodes.filter(n => n.entity_type === "decision");
    const tags = nodes.filter(n => n.entity_type === "tag");
    const others = nodes.filter(n => !["category", "decision", "tag"].includes(n.entity_type));

    // Place categories in an inner circle
    categories.forEach((cat, idx) => {
      if (!newPos[cat.id]) {
        const angle = (idx / Math.max(1, categories.length)) * Math.PI * 2;
        const r = 160;
        newPos[cat.id] = {
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
        };
      }
    });

    // Place decisions in mid ring or around their categories
    decisionsList.forEach((d, idx) => {
      if (!newPos[d.id]) {
        const angle = (idx / Math.max(1, decisionsList.length)) * Math.PI * 2 + 0.15;
        const r = 290 + (idx % 3) * 35;
        newPos[d.id] = {
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
        };
      }
    });

    // Place tags in outer ring
    tags.forEach((tag, idx) => {
      if (!newPos[tag.id]) {
        const angle = (idx / Math.max(1, tags.length)) * Math.PI * 2 + 0.3;
        const r = 410 + (idx % 2) * 40;
        newPos[tag.id] = {
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
        };
      }
    });

    // Place authors / teams
    others.forEach((o, idx) => {
      if (!newPos[o.id]) {
        const angle = (idx / Math.max(1, others.length)) * Math.PI * 2 + 0.45;
        const r = 480;
        newPos[o.id] = {
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
        };
      }
    });

    nodePositions.current = newPos;
  }, []);

  // Filtered active nodes & edges based on visibility checkboxes
  const activeNodes = useMemo(() => {
    return graphData.nodes.filter(n => visibleTypes[n.entity_type] !== false);
  }, [graphData.nodes, visibleTypes]);

  const activeNodeIds = useMemo(() => {
    return new Set(activeNodes.map(n => n.id));
  }, [activeNodes]);

  const activeEdges = useMemo(() => {
    return graphData.edges.filter(
      e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target)
    );
  }, [graphData.edges, activeNodeIds]);

  // Connected node IDs of the currently selected node (for 1-hop highlighting)
  const connectedIds = useMemo(() => {
    if (!selectedNode) return null;
    const s = new Set([selectedNode.id]);
    activeEdges.forEach(e => {
      if (e.source === selectedNode.id) s.add(e.target);
      if (e.target === selectedNode.id) s.add(e.source);
    });
    return s;
  }, [selectedNode, activeEdges]);

  // 3. Layout modes application
  const applyLayout = useCallback((mode) => {
    const width = 960;
    const height = 620;
    const centerX = width / 2;
    const centerY = height / 2;
    const current = { ...nodePositions.current };

    if (mode === "category") {
      // Group decisions directly around their category node
      const categories = activeNodes.filter(n => n.entity_type === "category");
      categories.forEach((cat, cIdx) => {
        const cAngle = (cIdx / Math.max(1, categories.length)) * Math.PI * 2;
        const cX = centerX + Math.cos(cAngle) * 230;
        const cY = centerY + Math.sin(cAngle) * 230;
        current[cat.id] = { x: cX, y: cY, vx: 0, vy: 0 };

        const attachedDecisions = activeNodes.filter(
          n => n.entity_type === "decision" && (n.category === cat.category || n.category === cat.label)
        );
        attachedDecisions.forEach((d, dIdx) => {
          const dAngle = (dIdx / Math.max(1, attachedDecisions.length)) * Math.PI * 2;
          const dist = 110 + (dIdx % 2) * 30;
          current[d.id] = {
            x: cX + Math.cos(dAngle) * dist,
            y: cY + Math.sin(dAngle) * dist,
            vx: 0,
            vy: 0,
          };
        });
      });
    } else if (mode === "radial") {
      // Concentric rings: Center = Core, Ring 1 = Categories, Ring 2 = Decisions, Ring 3 = Tags
      const cats = activeNodes.filter(n => n.entity_type === "category");
      const decs = activeNodes.filter(n => n.entity_type === "decision");
      const tags = activeNodes.filter(n => n.entity_type === "tag");

      cats.forEach((c, idx) => {
        const a = (idx / Math.max(1, cats.length)) * Math.PI * 2;
        current[c.id] = { x: centerX + Math.cos(a) * 150, y: centerY + Math.sin(a) * 150, vx: 0, vy: 0 };
      });
      decs.forEach((d, idx) => {
        const a = (idx / Math.max(1, decs.length)) * Math.PI * 2;
        current[d.id] = { x: centerX + Math.cos(a) * 280, y: centerY + Math.sin(a) * 280, vx: 0, vy: 0 };
      });
      tags.forEach((t, idx) => {
        const a = (idx / Math.max(1, tags.length)) * Math.PI * 2;
        current[t.id] = { x: centerX + Math.cos(a) * 410, y: centerY + Math.sin(a) * 410, vx: 0, vy: 0 };
      });
    }

    nodePositions.current = current;
  }, [activeNodes]);

  useEffect(() => {
    if (layoutMode !== "organic") {
      applyLayout(layoutMode);
    }
  }, [layoutMode, applyLayout]);

  // 4. Force physics simulation tick
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isPhysicsRunning || layoutMode !== "organic") return;

    let animId;
    let stepCount = 0;
    const maxSteps = 220;

    const runSimulation = () => {
      const positions = nodePositions.current;
      const nodes = activeNodes;
      const edges = activeEdges;
      const centerX = 480;
      const centerY = 310;
      const k = 0.04;
      const damping = 0.85;

      // Center gravity & charge repulsion
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        const p1 = positions[n1.id];
        if (!p1 || n1.id === draggedNodeId) continue;

        // Gravity pull to center
        p1.vx += (centerX - p1.x) * 0.0018;
        p1.vy += (centerY - p1.y) * 0.0018;

        // Repulsion from other nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const p2 = positions[n2.id];
          if (!p2) continue;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = n1.entity_type === "category" || n2.entity_type === "category" ? 140 : 90;

          if (dist < minDist * 2) {
            const force = (minDist * minDist) / (dist * dist);
            const fx = (dx / dist) * force * 1.6;
            const fy = (dy / dist) * force * 1.6;

            if (n1.id !== draggedNodeId) {
              p1.vx -= fx;
              p1.vy -= fy;
            }
            if (n2.id !== draggedNodeId) {
              p2.vx += fx;
              p2.vy += fy;
            }
          }
        }
      }

      // Edge spring attraction
      for (let e of edges) {
        const pSource = positions[e.source];
        const pTarget = positions[e.target];
        if (!pSource || !pTarget) continue;

        const dx = pTarget.x - pSource.x;
        const dy = pTarget.y - pSource.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const idealDist = e.relation === "BELONGS_TO_CATEGORY" ? 130 : 160;

        const springForce = (dist - idealDist) * k;
        const fx = (dx / dist) * springForce;
        const fy = (dy / dist) * springForce;

        if (e.source !== draggedNodeId) {
          pSource.vx += fx;
          pSource.vy += fy;
        }
        if (e.target !== draggedNodeId) {
          pTarget.vx -= fx;
          pTarget.vy -= fy;
        }
      }

      // Apply velocity and damping
      for (let n of nodes) {
        if (n.id === draggedNodeId) continue;
        const p = positions[n.id];
        if (!p) continue;

        p.vx *= damping;
        p.vy *= damping;
        p.x += p.vx;
        p.y += p.vy;

        // Bounding clamp
        p.x = Math.max(60, Math.min(900, p.x));
        p.y = Math.max(60, Math.min(560, p.y));
      }

      stepCount++;
      setTick(t => t + 1);

      if (stepCount < maxSteps) {
        animId = requestAnimationFrame(runSimulation);
      }
    };

    animId = requestAnimationFrame(runSimulation);
    return () => cancelAnimationFrame(animId);
  }, [activeNodes, activeEdges, isPhysicsRunning, layoutMode, draggedNodeId]);

  // 5. Pan and Zoom Handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform(prev => {
      const newScale = Math.min(2.5, Math.max(0.4, prev.scale * zoomFactor));
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

      const p = nodePositions.current[draggedNodeId];
      if (p) {
        p.x = rawX;
        p.y = rawY;
        p.vx = 0;
        p.vy = 0;
        setTick(t => t + 1);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  const handleZoomIn = () => {
    setTransform(prev => ({ ...prev, scale: Math.min(2.5, prev.scale * 1.2) }));
  };

  const handleZoomOut = () => {
    setTransform(prev => ({ ...prev, scale: Math.max(0.4, prev.scale * 0.8) }));
  };

  const handleResetZoom = () => {
    setTransform({ x: 0, y: 0, scale: 0.95 });
  };

  // Node Color Resolver
  const getNodeColor = (node) => {
    if (node.entity_type === "category") return ENTITY_COLORS.category;
    if (node.entity_type === "tag") return ENTITY_COLORS.tag;
    if (node.entity_type === "author") return ENTITY_COLORS.author;
    if (node.entity_type === "team") return ENTITY_COLORS.team;
    if (node.entity_type === "decision") {
      const st = (node.status || "").toUpperCase();
      if (st === "APPROVED") return ENTITY_COLORS.decision_approved;
      if (st === "IN_REVIEW") return ENTITY_COLORS.decision_review;
      if (st === "REJECTED") return ENTITY_COLORS.decision_rejected;
      if (st === "ARCHIVED") return ENTITY_COLORS.decision_archived;
      return ENTITY_COLORS.decision_draft;
    }
    return "#94a3b8";
  };

  // Node Radius & Dimensions
  const getNodeDimensions = (node) => {
    switch (node.entity_type) {
      case "category":
        return { r: 36, shape: "circle" };
      case "decision":
        return { w: 140, h: 54, shape: "rect", r: 24 };
      case "tag":
        return { r: 22, shape: "tag" };
      case "author":
        return { r: 24, shape: "circle" };
      case "team":
        return { w: 100, h: 36, shape: "rect", r: 18 };
      default:
        return { r: 20, shape: "circle" };
    }
  };

  // Get full decision object for details/timeline action
  const getSelectedDecisionObj = () => {
    if (!selectedNode || selectedNode.entity_type !== "decision") return null;
    const dId = selectedNode.decision_id || (selectedNode.id && selectedNode.id.replace("decision-", ""));
    return decisions.find(d => String(d.id) === String(dId)) || selectedNode;
  };

  return (
    <div className="knowledge-graph-container">
      {/* 1. TOP CONTROL & FILTER BAR */}
      <div className="graph-toolbar-card">
        <div className="graph-toolbar-row">
          {/* Real-time Search */}
          <div className="graph-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search graph nodes by title, rationale, tag, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="graph-filter-item">
            <label>Decision Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="graph-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved Only</option>
              <option value="IN_REVIEW">Under Review</option>
              <option value="DRAFT">Draft</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="graph-filter-item">
            <label>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="graph-select"
            >
              <option value="ALL">All Categories</option>
              {distinctCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Layout Mode Selector */}
          <div className="graph-filter-item">
            <label>Layout Mode:</label>
            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value)}
              className="graph-select"
            >
              <option value="organic">Organic Network Physics</option>
              <option value="category">Category Orbit Clusters</option>
              <option value="radial">Concentric Radial Rings</option>
            </select>
          </div>

          {/* Canvas View Controls */}
          <div className="graph-canvas-controls">
            <button className="graph-ctrl-btn" onClick={handleZoomIn} title="Zoom In">
              ＋
            </button>
            <button className="graph-ctrl-btn" onClick={handleZoomOut} title="Zoom Out">
              －
            </button>
            <button className="graph-ctrl-btn" onClick={handleResetZoom} title="Reset Viewport">
              ⤢ Reset
            </button>
            <button
              className={`graph-ctrl-btn ${isPhysicsRunning ? "active" : ""}`}
              onClick={() => setIsPhysicsRunning(p => !p)}
              title={isPhysicsRunning ? "Pause Physics Simulation" : "Resume Physics Simulation"}
            >
              {isPhysicsRunning ? "⏸ Pause" : "▶ Physics"}
            </button>
          </div>
        </div>

        {/* Entity Type Filter Toggles & Stats */}
        <div className="graph-type-toggles-row">
          <div className="type-toggles-group">
            <span className="toggle-group-label">Show Entities:</span>
            <label className="type-toggle-chip">
              <input
                type="checkbox"
                checked={visibleTypes.decision}
                onChange={(e) => setVisibleTypes(p => ({ ...p, decision: e.target.checked }))}
              />
              <span className="chip-indicator" style={{ background: ENTITY_COLORS.decision_approved }}></span>
              Decisions ({graphData.nodes.filter(n => n.entity_type === "decision").length})
            </label>

            <label className="type-toggle-chip">
              <input
                type="checkbox"
                checked={visibleTypes.category}
                onChange={(e) => setVisibleTypes(p => ({ ...p, category: e.target.checked }))}
              />
              <span className="chip-indicator" style={{ background: ENTITY_COLORS.category }}></span>
              Categories ({graphData.nodes.filter(n => n.entity_type === "category").length})
            </label>

            <label className="type-toggle-chip">
              <input
                type="checkbox"
                checked={visibleTypes.tag}
                onChange={(e) => setVisibleTypes(p => ({ ...p, tag: e.target.checked }))}
              />
              <span className="chip-indicator" style={{ background: ENTITY_COLORS.tag }}></span>
              Tags ({graphData.nodes.filter(n => n.entity_type === "tag").length})
            </label>

            <label className="type-toggle-chip">
              <input
                type="checkbox"
                checked={visibleTypes.author}
                onChange={(e) => setVisibleTypes(p => ({ ...p, author: e.target.checked }))}
              />
              <span className="chip-indicator" style={{ background: ENTITY_COLORS.author }}></span>
              Authors ({graphData.nodes.filter(n => n.entity_type === "author").length})
            </label>

            <label className="type-toggle-chip">
              <input
                type="checkbox"
                checked={visibleTypes.team}
                onChange={(e) => setVisibleTypes(p => ({ ...p, team: e.target.checked }))}
              />
              <span className="chip-indicator" style={{ background: ENTITY_COLORS.team }}></span>
              Teams ({graphData.nodes.filter(n => n.entity_type === "team").length})
            </label>
          </div>

          <div className="graph-stats-summary">
            <span><strong>{activeNodes.length}</strong> Nodes</span>
            <span className="divider">•</span>
            <span><strong>{activeEdges.length}</strong> Relationships</span>
            {selectedNode && (
              <>
                <span className="divider">•</span>
                <span className="selected-tag">Selected: {selectedNode.label || selectedNode.id}</span>
                <button
                  className="btn-clear-selection"
                  onClick={() => setSelectedNode(null)}
                >
                  Deselect
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. GRAPH CANVAS & SIDEBAR WRAPPER */}
      <div className="graph-viewport-wrapper">
        <div
          className="graph-canvas-box"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {loading ? (
            <div className="graph-loading-overlay">
              <div className="graph-spinner"></div>
              <span>Generating Knowledge Graph & Relationship Topology...</span>
            </div>
          ) : activeNodes.length === 0 ? (
            <div className="graph-empty-state">
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>🕸️</div>
              <h4>No entities match your filter criteria</h4>
              <p>Adjust your search query, status, or category filter to reveal connected nodes.</p>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("ALL");
                  setSelectedCategory("ALL");
                  setVisibleTypes({ decision: true, category: true, tag: true, author: true, team: true });
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="graph-svg"
              width="100%"
              height="620"
              viewBox="0 0 960 620"
            >
              <defs>
                {/* Arrow markers for directed edges */}
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(148, 163, 184, 0.4)" />
                </marker>
                <marker
                  id="arrow-highlight"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                </marker>

                {/* Node Gradients & Glows */}
                <radialGradient id="categoryGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
                </radialGradient>
                <radialGradient id="decisionGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </radialGradient>
              </defs>

              <rect className="graph-bg" width="100%" height="100%" fill="transparent" />

              {/* Pan & Zoom Group */}
              <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                {/* EDGES LAYER */}
                <g className="graph-edges-layer">
                  {activeEdges.map((edge) => {
                    const sourcePos = nodePositions.current[edge.source];
                    const targetPos = nodePositions.current[edge.target];
                    if (!sourcePos || !targetPos) return null;

                    const isHighlighted =
                      selectedNode &&
                      (edge.source === selectedNode.id || edge.target === selectedNode.id);
                    const isDimmed = selectedNode && !isHighlighted;

                    // Subtle curve for visual beauty
                    const dx = targetPos.x - sourcePos.x;
                    const dy = targetPos.y - sourcePos.y;
                    const midX = (sourcePos.x + targetPos.x) / 2 - dy * 0.08;
                    const midY = (sourcePos.y + targetPos.y) / 2 + dx * 0.08;

                    return (
                      <g key={edge.id} className="graph-edge-group">
                        <path
                          d={`M ${sourcePos.x} ${sourcePos.y} Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}`}
                          fill="none"
                          stroke={isHighlighted ? "#38bdf8" : "rgba(148, 163, 184, 0.22)"}
                          strokeWidth={isHighlighted ? 2.5 : 1.4}
                          strokeDasharray={edge.relation === "RELATED_TO" ? "4,4" : "none"}
                          opacity={isDimmed ? 0.12 : 1}
                          markerEnd={isHighlighted ? "url(#arrow-highlight)" : "url(#arrow-default)"}
                          className="graph-edge-path"
                        />
                      </g>
                    );
                  })}
                </g>

                {/* NODES LAYER */}
                <g className="graph-nodes-layer">
                  {activeNodes.map((node) => {
                    const pos = nodePositions.current[node.id] || { x: 480, y: 310 };
                    const isSelected = selectedNode && selectedNode.id === node.id;
                    const isConnected = connectedIds ? connectedIds.has(node.id) : true;
                    const isDimmed = selectedNode && !isConnected;
                    const color = getNodeColor(node);
                    const dims = getNodeDimensions(node);

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className={`graph-node-group ${isSelected ? "selected" : ""} ${isDimmed ? "dimmed" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(node);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDraggedNodeId(node.id);
                        }}
                        style={{ cursor: "grab" }}
                      >
                        {/* Selected halo ring */}
                        {isSelected && (
                          <circle
                            r={node.entity_type === "category" ? 48 : 34}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth={3}
                            strokeDasharray="4,4"
                            className="selection-halo"
                          />
                        )}

                        {/* CATEGORY NODE */}
                        {node.entity_type === "category" && (
                          <>
                            <circle r="42" fill="url(#categoryGlow)" />
                            <circle
                              r="32"
                              fill="#1e1b4b"
                              stroke={color}
                              strokeWidth={isSelected ? 3 : 2}
                              filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"
                            />
                            <text
                              textAnchor="middle"
                              dy="-6"
                              fill="#e0e7ff"
                              fontSize="12px"
                              fontWeight="700"
                            >
                              📁 {node.label.length > 12 ? node.label.substring(0, 11) + "…" : node.label}
                            </text>
                            <text
                              textAnchor="middle"
                              dy="14"
                              fill="#a5b4fc"
                              fontSize="10px"
                              fontWeight="600"
                            >
                              {node.count || 1} records
                            </text>
                          </>
                        )}

                        {/* DECISION NODE (Rounded Card / Badge) */}
                        {node.entity_type === "decision" && (
                          <>
                            <rect
                              x="-65"
                              y="-24"
                              width="130"
                              height="48"
                              rx="10"
                              fill="#0f172a"
                              stroke={color}
                              strokeWidth={isSelected ? 2.5 : 1.5}
                              filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
                            />
                            {/* Status Accent Bar */}
                            <rect
                              x="-65"
                              y="-24"
                              width="5"
                              height="48"
                              rx="2"
                              fill={color}
                            />
                            <text
                              x="-52"
                              y="-6"
                              fill="#f8fafc"
                              fontSize="11px"
                              fontWeight="600"
                            >
                              {node.label.length > 15 ? node.label.substring(0, 14) + "…" : node.label}
                            </text>
                            <text
                              x="-52"
                              y="12"
                              fill="#94a3b8"
                              fontSize="9.5px"
                            >
                              #{node.decision_id || node.id.replace("decision-", "")} • {node.status}
                            </text>
                          </>
                        )}

                        {/* TAG NODE */}
                        {node.entity_type === "tag" && (
                          <>
                            <rect
                              x="-38"
                              y="-14"
                              width="76"
                              height="28"
                              rx="14"
                              fill="#083344"
                              stroke={color}
                              strokeWidth={isSelected ? 2.5 : 1.2}
                            />
                            <text
                              textAnchor="middle"
                              dy="4"
                              fill="#a5f3fc"
                              fontSize="10px"
                              fontWeight="600"
                            >
                              {node.label.length > 11 ? node.label.substring(0, 10) + "…" : node.label}
                            </text>
                          </>
                        )}

                        {/* AUTHOR NODE */}
                        {node.entity_type === "author" && (
                          <>
                            <circle
                              r="20"
                              fill="#431407"
                              stroke={color}
                              strokeWidth={isSelected ? 2.5 : 1.5}
                            />
                            <text
                              textAnchor="middle"
                              dy="4"
                              fill="#fed7aa"
                              fontSize="11px"
                              fontWeight="700"
                            >
                              👤 {node.label.substring(0, 3)}
                            </text>
                            <text
                              textAnchor="middle"
                              dy="32"
                              fill="#fdba74"
                              fontSize="9.5px"
                              fontWeight="500"
                            >
                              {node.label.length > 10 ? node.label.substring(0, 9) + "…" : node.label}
                            </text>
                          </>
                        )}

                        {/* TEAM NODE */}
                        {node.entity_type === "team" && (
                          <>
                            <rect
                              x="-45"
                              y="-15"
                              width="90"
                              height="30"
                              rx="6"
                              fill="#172554"
                              stroke={color}
                              strokeWidth={isSelected ? 2.5 : 1.2}
                            />
                            <text
                              textAnchor="middle"
                              dy="4"
                              fill="#bfdbfe"
                              fontSize="10px"
                              fontWeight="600"
                            >
                              👥 {node.label.length > 11 ? node.label.substring(0, 10) + "…" : node.label}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
          )}

          {/* Graph Helper Legend (bottom left) */}
          <div className="graph-bottom-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: ENTITY_COLORS.decision_approved }}></span> Approved</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: ENTITY_COLORS.decision_review }}></span> In Review</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: ENTITY_COLORS.decision_draft }}></span> Draft</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: ENTITY_COLORS.category }}></span> Category Hub</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: ENTITY_COLORS.tag }}></span> Tag</span>
            <span className="legend-tip">💡 Tip: Drag nodes to position. Click to inspect & replay.</span>
          </div>
        </div>

        {/* 3. SLIDE-OUT / PINNED NODE INSPECTOR DRAWER */}
        {selectedNode && (
          <div className="graph-inspector-drawer">
            <div className="drawer-header">
              <div className="drawer-entity-badge" style={{ borderColor: getNodeColor(selectedNode) }}>
                {selectedNode.entity_type.toUpperCase()}
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setSelectedNode(null)}
                title="Close Inspector"
              >
                ✕
              </button>
            </div>

            <div className="drawer-title">{selectedNode.title || selectedNode.label}</div>

            {/* DECISION SPECIFIC DETAILS */}
            {selectedNode.entity_type === "decision" && (
              <div className="drawer-body">
                <div className="drawer-meta-row">
                  <span className="badge-category">{selectedNode.category}</span>
                  <span className={`badge-status ${selectedNode.status?.toLowerCase()}`}>
                    {selectedNode.status}
                  </span>
                </div>

                {selectedNode.description && (
                  <div className="drawer-section">
                    <label>Description & Context:</label>
                    <p>{selectedNode.description}</p>
                  </div>
                )}

                {selectedNode.rationale && (
                  <div className="drawer-section rationale-box">
                    <label>Decision Rationale:</label>
                    <p>{selectedNode.rationale}</p>
                  </div>
                )}

                {selectedNode.tags && selectedNode.tags.length > 0 && (
                  <div className="drawer-section">
                    <label>Associated Tags:</label>
                    <div className="drawer-tags-wrap">
                      {selectedNode.tags.map((t) => (
                        <span
                          key={t}
                          className="drawer-tag-pill"
                          onClick={() => {
                            const tagNode = activeNodes.find(n => n.entity_type === "tag" && (n.tag === t || n.label === `#${t}`));
                            if (tagNode) setSelectedNode(tagNode);
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="drawer-section meta-grid">
                  <div>
                    <label>Author</label>
                    <div>👤 {selectedNode.author_name || "Lead Architect"}</div>
                  </div>
                  <div>
                    <label>Team</label>
                    <div>👥 {selectedNode.team_name || "Core Team"}</div>
                  </div>
                  {selectedNode.created_at && (
                    <div>
                      <label>Created</label>
                      <div>📅 {selectedNode.created_at}</div>
                    </div>
                  )}
                </div>

                {/* PRIMARY ACTION BUTTONS: REPLAY DECISION & VIEW DETAILS */}
                <div className="drawer-actions">
                  {openDecisionTimeline && (
                    <button
                      className="btn-replay-action"
                      style={{ width: "100%", justifyContent: "center", marginBottom: "8px" }}
                      onClick={() => {
                        const dId = selectedNode.decision_id || selectedNode.id.replace("decision-", "");
                        openDecisionTimeline(Number(dId));
                      }}
                    >
                      <span>🔄 Replay Decision Timeline</span>
                    </button>
                  )}

                  {handleViewDetails && (
                    <button
                      className="btn-secondary"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => {
                        const decObj = getSelectedDecisionObj();
                        if (decObj) handleViewDetails(decObj);
                      }}
                    >
                      Inspect Full Specification
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CATEGORY / TAG / AUTHOR / TEAM DETAILS */}
            {selectedNode.entity_type !== "decision" && (
              <div className="drawer-body">
                <div className="drawer-section">
                  <label>Cluster Entity:</label>
                  <p style={{ color: "#94a3b8", margin: "4px 0 12px 0" }}>
                    This hub links institutional decisions sharing {selectedNode.entity_type === "category" ? "the category classification" : selectedNode.entity_type === "tag" ? "the topic tag" : "this relationship"}.
                  </p>
                </div>

                <div className="drawer-section">
                  <label>Connected Decisions:</label>
                  <div className="drawer-connected-list">
                    {activeEdges
                      .filter(e => e.target === selectedNode.id || e.source === selectedNode.id)
                      .map(e => {
                        const otherId = e.source === selectedNode.id ? e.target : e.source;
                        const otherNode = activeNodes.find(n => n.id === otherId);
                        if (!otherNode || otherNode.entity_type !== "decision") return null;

                        return (
                          <div
                            key={otherNode.id}
                            className="connected-decision-item"
                            onClick={() => setSelectedNode(otherNode)}
                          >
                            <div className="item-title">{otherNode.title || otherNode.label}</div>
                            <div className="item-meta">
                              <span>#{otherNode.decision_id || otherNode.id.replace("decision-", "")}</span>
                              <span className={`item-status ${otherNode.status?.toLowerCase()}`}>{otherNode.status}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="drawer-actions">
                  <button
                    className="btn-secondary"
                    style={{ width: "100%" }}
                    onClick={() => {
                      if (selectedNode.entity_type === "category") {
                        setSelectedCategory(selectedNode.category || selectedNode.label);
                      } else if (selectedNode.entity_type === "tag") {
                        setSearchTerm(selectedNode.tag || selectedNode.label.replace("#", ""));
                      }
                    }}
                  >
                    Filter Graph by this {selectedNode.entity_type}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
