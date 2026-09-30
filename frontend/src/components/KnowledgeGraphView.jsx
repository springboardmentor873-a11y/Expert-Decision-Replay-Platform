import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Users,
  Folder,
  Tag,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  ExternalLink,
  Filter,
  Info,
  ChevronRight,
  Shield,
  FileText,
  Download,
  Focus,
  Sliders,
} from 'lucide-react';

const NODE_COLORS = {
  decision: { fill: '#2563eb', stroke: '#1d4ed8', text: '#ffffff', icon: Layers, label: 'Decision' },
  team: { fill: '#0891b2', stroke: '#0e7490', text: '#ffffff', icon: Users, label: 'Team' },
  user: { fill: '#ea580c', stroke: '#c2410c', text: '#ffffff', icon: Users, label: 'Contributor' },
  document: { fill: '#475569', stroke: '#334155', text: '#ffffff', icon: Paperclip, label: 'Document' },
  tag: { fill: '#db2777', stroke: '#be185d', text: '#ffffff', icon: Tag, label: 'Topic / Tag' },
  category: { fill: '#7c3aed', stroke: '#6d28d9', text: '#ffffff', icon: Folder, label: 'Category' },
  state: { fill: '#10b981', stroke: '#059669', text: '#ffffff', icon: Shield, label: 'State / Status' },
  alternative: { fill: '#d97706', stroke: '#b45309', text: '#ffffff', icon: CheckCircle2, label: 'Alternative' },
};

export const KnowledgeGraphView = ({
  graphData,
  loading = false,
  onRefresh,
  focalDecisionId = null,
  onSelectFocalDecision,
  onDownloadDocument,
  compact = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(compact ? 0.85 : 1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const rawNodes = graphData?.nodes || [];
  const rawLinks = graphData?.links || [];
  const stats = graphData?.stats || {};
  const focalDecisions = graphData?.focal_decisions || [];

  // Reset selected node if graph data refreshes completely
  useEffect(() => {
    setSelectedNode(null);
  }, [focalDecisionId]);

  // Compute positioned graph layout
  const layout = useMemo(() => {
    if (!rawNodes.length) return { nodes: [], links: [] };

    // Filter nodes by type if specified
    const activeNodes = rawNodes.filter((n) => {
      if (selectedType !== 'ALL' && n.type !== selectedType) return false;
      if (searchTerm) {
        return (
          n.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.type?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    });

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));
    const activeLinks = rawLinks.filter(
      (l) => activeNodeIds.has(l.source) && activeNodeIds.has(l.target)
    );

    const decisions = activeNodes.filter((n) => n.type === 'decision');
    const categories = activeNodes.filter((n) => n.type === 'category');
    const teams = activeNodes.filter((n) => n.type === 'team');
    const alternatives = activeNodes.filter((n) => n.type === 'alternative');
    const documents = activeNodes.filter((n) => n.type === 'document');
    const tags = activeNodes.filter((n) => n.type === 'tag');
    const users = activeNodes.filter((n) => n.type === 'user');
    const states = activeNodes.filter((n) => n.type === 'state');

    const positioned = [];
    const centerX = compact ? 360 : 540;
    const centerY = compact ? 260 : 380;

    // RADIAL FOCAL LAYOUT: when viewing 1 focal decision
    if (decisions.length === 1) {
      const focal = decisions[0];
      positioned.push({
        ...focal,
        x: centerX,
        y: centerY,
        radius: compact ? 26 : 34,
        isFocal: true,
      });

      // Layer 1: Core metadata orbit (Category, Team, Contributor, State)
      const innerNodes = [...categories, ...teams, ...users, ...states];
      const innerCount = innerNodes.length || 1;
      const innerRadius = compact ? 120 : 170;

      innerNodes.forEach((node, idx) => {
        const angle = (idx / innerCount) * 2 * Math.PI - Math.PI / 2;
        positioned.push({
          ...node,
          x: centerX + innerRadius * Math.cos(angle),
          y: centerY + innerRadius * Math.sin(angle),
          radius: compact ? 15 : 19,
        });
      });

      // Layer 2: Extended orbit (Alternatives, Documents, Tags)
      const outerNodes = [...alternatives, ...documents, ...tags];
      const outerCount = outerNodes.length || 1;
      const outerRadius = compact ? 210 : 300;

      outerNodes.forEach((node, idx) => {
        const angle = (idx / outerCount) * 2 * Math.PI - Math.PI / 4;
        positioned.push({
          ...node,
          x: centerX + outerRadius * Math.cos(angle),
          y: centerY + outerRadius * Math.sin(angle),
          radius: compact ? 13 : 16,
        });
      });
    } else {
      // GLOBAL ARCHITECTURE LAYOUT
      const decCount = decisions.length || 1;
      const decRadius = Math.min(230, 80 + decCount * 22);

      decisions.forEach((d, idx) => {
        const angle = (idx / decCount) * 2 * Math.PI - Math.PI / 2;
        positioned.push({
          ...d,
          x: centerX + decRadius * Math.cos(angle),
          y: centerY + decRadius * Math.sin(angle),
          radius: compact ? 18 : 23,
        });
      });

      // Position Categories at top arch
      const catCount = categories.length || 1;
      categories.forEach((c, idx) => {
        const x = centerX + (idx - (catCount - 1) / 2) * (compact ? 120 : 160);
        const y = centerY - (compact ? 200 : 290);
        positioned.push({
          ...c,
          x,
          y: Math.max(50, y),
          radius: compact ? 14 : 17,
        });
      });

      // Position Teams along left column
      teams.forEach((t, idx) => {
        positioned.push({
          ...t,
          x: compact ? 80 : 120,
          y: centerY - 140 + idx * (compact ? 70 : 100),
          radius: compact ? 14 : 18,
        });
      });

      // Position Users on top-left
      users.forEach((u, idx) => {
        positioned.push({
          ...u,
          x: compact ? 120 + (idx % 2) * 55 : 160 + (idx % 2) * 75,
          y: 70 + Math.floor(idx / 2) * (compact ? 45 : 60),
          radius: compact ? 13 : 16,
        });
      });

      // Position Alternatives in a lower outer ring
      const altCount = alternatives.length || 1;
      alternatives.forEach((a, idx) => {
        const angle = (idx / altCount) * 2 * Math.PI;
        const r = decRadius + (compact ? 80 : 130);
        positioned.push({
          ...a,
          x: centerX + r * Math.cos(angle),
          y: centerY + r * Math.sin(angle) + 30,
          radius: compact ? 12 : 15,
        });
      });

      // Position Documents along right column
      documents.forEach((doc, idx) => {
        positioned.push({
          ...doc,
          x: compact ? 620 : 920,
          y: centerY - 140 + idx * (compact ? 65 : 85),
          radius: compact ? 13 : 16,
        });
      });

      // Position Tags along bottom
      tags.forEach((tg, idx) => {
        positioned.push({
          ...tg,
          x: (compact ? 160 : 240) + idx * (compact ? 60 : 85),
          y: centerY + (compact ? 200 : 280),
          radius: compact ? 11 : 14,
        });
      });

      // Position States around bottom right
      states.forEach((st, idx) => {
        positioned.push({
          ...st,
          x: (compact ? 550 : 820) + idx * 70,
          y: centerY + (compact ? 180 : 240),
          radius: compact ? 12 : 15,
        });
      });
    }

    const posMap = new Map(positioned.map((p) => [p.id, p]));

    const mappedLinks = activeLinks
      .map((l) => {
        const sourceNode = posMap.get(l.source);
        const targetNode = posMap.get(l.target);
        if (!sourceNode || !targetNode) return null;
        return {
          ...l,
          x1: sourceNode.x,
          y1: sourceNode.y,
          x2: targetNode.x,
          y2: targetNode.y,
        };
      })
      .filter(Boolean);

    return { nodes: positioned, links: mappedLinks };
  }, [rawNodes, rawLinks, selectedType, searchTerm, compact]);

  // Pan & Zoom handlers
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.id === 'graph-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, z + 0.2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.4, z - 0.2));
  const handleResetView = () => {
    setZoomLevel(compact ? 0.85 : 1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const canvasHeight = compact ? 480 : 660;

  return (
    <div
      className="knowledge-graph-container"
      style={{
        background: '#0f172a',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #1e293b',
        position: 'relative',
        minHeight: `${canvasHeight + 70}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header & Focal Selector Bar */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          zIndex: 10,
        }}
      >
        {/* Left: Focal Decision Node Dropdown & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Focus size={14} style={{ color: '#3b82f6' }} />
              Focal Decision Node:
            </span>
            <select
              value={focalDecisionId || ''}
              onChange={(e) => onSelectFocalDecision?.(e.target.value ? Number(e.target.value) : null)}
              style={{
                padding: '6px 12px',
                background: '#0f172a',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                color: '#60a5fa',
                fontSize: '0.85rem',
                fontWeight: 600,
                maxWidth: '280px',
                cursor: 'pointer',
              }}
            >
              <option value="">All Decisions (Global View)</option>
              {focalDecisions.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id} - {d.title} ({d.status || 'Active'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', width: '200px' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 10px 5px 28px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.825rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} style={{ color: '#94a3b8' }} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '5px 10px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.825rem',
              }}
            >
              <option value="ALL">All Types ({stats.total_nodes || rawNodes.length})</option>
              <option value="decision">Decisions ({stats.decision_nodes || 0})</option>
              <option value="category">Categories ({stats.category_nodes || 0})</option>
              <option value="team">Teams ({stats.team_nodes || 0})</option>
              <option value="user">Contributors ({stats.user_nodes || 0})</option>
              <option value="document">Documents ({stats.document_nodes || 0})</option>
              <option value="tag">Topics / Tags ({stats.tag_nodes || 0})</option>
              <option value="state">States ({stats.state_nodes || 0})</option>
              <option value="alternative">Alternatives ({stats.alternative_nodes || 0})</option>
            </select>
          </div>
        </div>

        {/* Right: Controls & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              padding: '6px 8px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              padding: '6px 8px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="Reset View"
            style={{
              padding: '6px 8px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <Maximize2 size={14} />
          </button>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh Graph"
              style={{
                padding: '6px 8px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Legend Badges Strip */}
      <div
        style={{
          padding: '0.4rem 1.25rem',
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>LEGEND:</span>
        {Object.entries(NODE_COLORS).map(([type, cfg]) => {
          const isFilterActive = selectedType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(isFilterActive ? 'ALL' : type)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.725rem',
                padding: '2px 8px',
                borderRadius: '12px',
                background: isFilterActive ? cfg.fill : '#1e293b',
                color: isFilterActive ? '#ffffff' : '#cbd5e1',
                border: `1px solid ${cfg.fill}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.fill }} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Main Graph SVG Canvas */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          minHeight: `${canvasHeight}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 30,
              color: '#60a5fa',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            Updating knowledge graph topology...
          </div>
        )}

        <svg
          ref={svgRef}
          width="100%"
          height={canvasHeight}
          style={{ display: 'block', background: 'radial-gradient(circle, #1e293b 10%, #0f172a 90%)' }}
        >
          <defs>
            <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.6" />
            </pattern>
            {/* Arrowhead marker */}
            <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
            </marker>
          </defs>

          {/* Grid Background */}
          <rect id="graph-bg" width="100%" height="100%" fill="url(#graph-grid)" />

          {/* Transformed Content Group */}
          <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
            {/* Render Links */}
            {layout.links.map((link, idx) => {
              const isSelectedSource =
                selectedNode && (selectedNode.id === link.source || selectedNode.id === link.target);
              return (
                <g key={`link-${idx}`}>
                  <line
                    x1={link.x1}
                    y1={link.y1}
                    x2={link.x2}
                    y2={link.y2}
                    stroke={isSelectedSource ? '#60a5fa' : link.is_selected ? '#10b981' : '#334155'}
                    strokeWidth={isSelectedSource ? 2.5 : link.is_selected ? 2 : 1.2}
                    strokeDasharray={link.relationship === 'tagged_with' ? '3,3' : undefined}
                    opacity={isSelectedSource ? 1 : 0.65}
                    markerEnd="url(#arrow)"
                  />
                  {link.label && !compact && (
                    <text
                      x={(link.x1 + link.x2) / 2}
                      y={(link.y1 + link.y2) / 2 - 4}
                      fill={isSelectedSource ? '#93c5fd' : '#64748b'}
                      fontSize="9"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {layout.nodes.map((node) => {
              const colorCfg = NODE_COLORS[node.type] || NODE_COLORS.decision;
              const isSelected = selectedNode?.id === node.id;
              const isDecision = node.type === 'decision';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle
                      r={node.radius + 6}
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="3"
                      strokeDasharray="4,3"
                    />
                  )}

                  {/* Focal Node Glow */}
                  {node.isFocal && (
                    <circle
                      r={node.radius + 8}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={node.radius}
                    fill={colorCfg.fill}
                    stroke={isSelected ? '#ffffff' : colorCfg.stroke}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                  />

                  {/* Status Indicator for Decisions */}
                  {isDecision && node.status && (
                    <circle
                      cx={node.radius * 0.7}
                      cy={-node.radius * 0.7}
                      r="6"
                      fill={
                        node.status === 'Approved'
                          ? '#10b981'
                          : node.status === 'Under Review'
                          ? '#f59e0b'
                          : '#64748b'
                      }
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Alternative Selected Star / Dot */}
                  {node.type === 'alternative' && node.status === 'SELECTED' && (
                    <circle
                      cx={node.radius * 0.7}
                      cy={-node.radius * 0.7}
                      r="5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  )}

                  {/* Node Label */}
                  <text
                    y={node.radius + 13}
                    textAnchor="middle"
                    fill={isSelected ? '#ffffff' : '#cbd5e1'}
                    fontSize={isDecision ? '11' : '10'}
                    fontWeight={isDecision ? '600' : '400'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label?.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '320px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '1.25rem',
              color: '#f8fafc',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              zIndex: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  color: NODE_COLORS[selectedNode.type]?.fill || '#94a3b8',
                }}
              >
                {selectedNode.type} Entity
              </span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  lineHeight: '1',
                }}
              >
                &times;
              </button>
            </div>

            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
              {selectedNode.label}
            </h4>

            {selectedNode.status && (
              <div style={{ marginBottom: '0.75rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background:
                      selectedNode.status === 'Approved' || selectedNode.status === 'SELECTED'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                    color:
                      selectedNode.status === 'Approved' || selectedNode.status === 'SELECTED'
                        ? '#34d399'
                        : '#fbbf24',
                    border: '1px solid currentColor',
                  }}
                >
                  {selectedNode.status}
                </span>
              </div>
            )}

            {/* Metadata Fields */}
            <div
              style={{
                fontSize: '0.825rem',
                color: '#cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '1rem',
              }}
            >
              {selectedNode.meta?.category && (
                <div>
                  <strong>Category:</strong> {selectedNode.meta.category}
                </div>
              )}
              {selectedNode.meta?.team && (
                <div>
                  <strong>Team:</strong> {selectedNode.meta.team}
                </div>
              )}
              {selectedNode.meta?.author && (
                <div>
                  <strong>Author:</strong> {selectedNode.meta.author}
                </div>
              )}
              {selectedNode.meta?.date && (
                <div>
                  <strong>Recorded:</strong> {selectedNode.meta.date}
                </div>
              )}
              {selectedNode.meta?.email && (
                <div>
                  <strong>Email:</strong> {selectedNode.meta.email}
                </div>
              )}
              {selectedNode.meta?.feasibility && (
                <div>
                  <strong>Feasibility:</strong> {selectedNode.meta.feasibility}
                </div>
              )}
              {selectedNode.meta?.file_size && (
                <div>
                  <strong>Size:</strong> {(selectedNode.meta.file_size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>

            {/* Action Buttons based on Node Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedNode.type === 'decision' && (
                <>
                  <Link
                    to={`/decisions/${selectedNode.meta?.id || selectedNode.id}`}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Replay Decision</span>
                    <ExternalLink size={13} />
                  </Link>

                  {focalDecisionId !== (selectedNode.meta?.id || selectedNode.id) && (
                    <button
                      type="button"
                      onClick={() => onSelectFocalDecision?.(selectedNode.meta?.id || selectedNode.id)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Focus size={13} />
                      <span>Focus Graph On This</span>
                    </button>
                  )}
                </>
              )}

              {selectedNode.type === 'document' && (
                <button
                  type="button"
                  onClick={() =>
                    onDownloadDocument?.(
                      selectedNode.meta?.decision_id,
                      selectedNode.meta?.id || selectedNode.id,
                      selectedNode.label
                    )
                  }
                  className="btn btn-primary btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Download size={13} />
                  <span>Download Document</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphView;
