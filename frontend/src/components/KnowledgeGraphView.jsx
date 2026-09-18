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
} from 'lucide-react';

const NODE_COLORS = {
  decision: { fill: '#2563eb', stroke: '#1d4ed8', text: '#ffffff', icon: Layers, label: 'Decision' },
  team: { fill: '#0891b2', stroke: '#0e7490', text: '#ffffff', icon: Users, label: 'Team' },
  category: { fill: '#7c3aed', stroke: '#6d28d9', text: '#ffffff', icon: Folder, label: 'Category' },
  alternative: { fill: '#059669', stroke: '#047857', text: '#ffffff', icon: CheckCircle2, label: 'Alternative' },
  document: { fill: '#475569', stroke: '#334155', text: '#ffffff', icon: Paperclip, label: 'Document' },
  tag: { fill: '#db2777', stroke: '#be185d', text: '#ffffff', icon: Tag, label: 'Tag' },
  user: { fill: '#ea580c', stroke: '#c2410c', text: '#ffffff', icon: Users, label: 'Author' },
};

export const KnowledgeGraphView = ({ graphData, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const rawNodes = graphData?.nodes || [];
  const rawLinks = graphData?.links || [];
  const stats = graphData?.stats || {};

  // Compute positioned graph layout
  const layout = useMemo(() => {
    if (!rawNodes.length) return { nodes: [], links: [] };

    // Filter nodes by type if specified
    const activeNodes = rawNodes.filter((n) => {
      if (selectedType !== 'ALL' && n.type !== selectedType) return false;
      if (searchTerm) {
        return n.label.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));
    const activeLinks = rawLinks.filter(
      (l) => activeNodeIds.has(l.source) && activeNodeIds.has(l.target)
    );

    // Group nodes by type for clustered positioning
    const decisions = activeNodes.filter((n) => n.type === 'decision');
    const categories = activeNodes.filter((n) => n.type === 'category');
    const teams = activeNodes.filter((n) => n.type === 'team');
    const alternatives = activeNodes.filter((n) => n.type === 'alternative');
    const documents = activeNodes.filter((n) => n.type === 'document');
    const tags = activeNodes.filter((n) => n.type === 'tag');
    const users = activeNodes.filter((n) => n.type === 'user');

    const positioned = [];
    const centerX = 500;
    const centerY = 400;

    // Position Decisions in a central ring
    const decCount = decisions.length || 1;
    const decRadius = Math.min(220, 60 + decCount * 25);
    decisions.forEach((d, idx) => {
      const angle = (idx / decCount) * 2 * Math.PI - Math.PI / 2;
      positioned.push({
        ...d,
        x: centerX + decRadius * Math.cos(angle),
        y: centerY + decRadius * Math.sin(angle),
        radius: 24,
      });
    });

    // Position Categories at top arch
    const catCount = categories.length || 1;
    categories.forEach((c, idx) => {
      const angle = Math.PI + (idx / Math.max(1, catCount - 1)) * Math.PI;
      const x = centerX + (idx - (catCount - 1) / 2) * 160;
      const y = centerY - 320;
      positioned.push({
        ...c,
        x,
        y: Math.max(60, y),
        radius: 18,
      });
    });

    // Position Teams along left column
    teams.forEach((t, idx) => {
      positioned.push({
        ...t,
        x: 100,
        y: centerY - 150 + idx * 120,
        radius: 20,
      });
    });

    // Position Users on top-left
    users.forEach((u, idx) => {
      positioned.push({
        ...u,
        x: 140 + (idx % 2) * 70,
        y: 80 + Math.floor(idx / 2) * 60,
        radius: 16,
      });
    });

    // Position Alternatives in a lower outer ring
    const altCount = alternatives.length || 1;
    alternatives.forEach((a, idx) => {
      const angle = (idx / altCount) * 2 * Math.PI;
      const r = decRadius + 140;
      positioned.push({
        ...a,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle) + 40,
        radius: 15,
      });
    });

    // Position Documents along right column
    documents.forEach((doc, idx) => {
      positioned.push({
        ...doc,
        x: 900,
        y: centerY - 140 + idx * 90,
        radius: 16,
      });
    });

    // Position Tags along bottom
    tags.forEach((tg, idx) => {
      positioned.push({
        ...tg,
        x: 200 + idx * 80,
        y: centerY + 320,
        radius: 14,
      });
    });

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
  }, [rawNodes, rawLinks, selectedType, searchTerm]);

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
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  return (
    <div className="knowledge-graph-container" style={{ background: '#0f172a', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e293b', position: 'relative', minHeight: '680px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Toolbar */}
      <div style={{ padding: '0.875rem 1.25rem', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', zIndex: 10 }}>
        {/* Left: Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: '#94a3b8' }} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '6px 10px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.85rem',
              }}
            >
              <option value="ALL">All Entity Types ({stats.total_nodes || rawNodes.length})</option>
              <option value="decision">Decisions ({stats.decision_nodes || 0})</option>
              <option value="category">Categories ({stats.category_nodes || 0})</option>
              <option value="team">Teams ({stats.team_nodes || 0})</option>
              <option value="alternative">Alternatives ({stats.alternative_nodes || 0})</option>
              <option value="document">Documents ({stats.document_nodes || 0})</option>
              <option value="tag">Tags ({stats.tag_nodes || 0})</option>
              <option value="user">Authors ({stats.user_nodes || 0})</option>
            </select>
          </div>
        </div>

        {/* Center: Type Legend Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(NODE_COLORS).map(([type, cfg]) => (
            <span
              key={type}
              onClick={() => setSelectedType(selectedType === type ? 'ALL' : type)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '12px',
                background: selectedType === type ? cfg.fill : '#0f172a',
                color: selectedType === type ? '#fff' : '#cbd5e1',
                border: `1px solid ${cfg.fill}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.fill }} />
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Right: Controls & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            style={{ padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{ padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
          >
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="Reset View"
            style={{ padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
          >
            <Maximize2 size={15} />
          </button>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh Graph"
              style={{ padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Graph Area with SVG & Side Inspector */}
      <div
        style={{ flex: 1, position: 'relative', cursor: isDragging ? 'grabbing' : 'grab', overflow: 'hidden' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="620"
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
              const isSelectedSource = selectedNode && (selectedNode.id === link.source || selectedNode.id === link.target);
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
                  {link.label && (
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
                      className="animate-spin"
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
                      fill={node.status === 'Approved' ? '#10b981' : node.status === 'Under Review' ? '#f59e0b' : '#64748b'}
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
                    y={node.radius + 14}
                    textAnchor="middle"
                    fill={isSelected ? '#ffffff' : '#cbd5e1'}
                    fontSize={isDecision ? '11' : '10'}
                    fontWeight={isDecision ? '600' : '400'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
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
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
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
                    background: selectedNode.status === 'Approved' || selectedNode.status === 'SELECTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: selectedNode.status === 'Approved' || selectedNode.status === 'SELECTED' ? '#34d399' : '#fbbf24',
                    border: '1px solid currentColor',
                  }}
                >
                  {selectedNode.status}
                </span>
              </div>
            )}

            {/* Metadata Fields */}
            <div style={{ fontSize: '0.825rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
              {selectedNode.meta?.category && (
                <div><strong>Category:</strong> {selectedNode.meta.category}</div>
              )}
              {selectedNode.meta?.team && (
                <div><strong>Team:</strong> {selectedNode.meta.team}</div>
              )}
              {selectedNode.meta?.author && (
                <div><strong>Author:</strong> {selectedNode.meta.author}</div>
              )}
              {selectedNode.meta?.date && (
                <div><strong>Recorded:</strong> {selectedNode.meta.date}</div>
              )}
              {selectedNode.meta?.email && (
                <div><strong>Email:</strong> {selectedNode.meta.email}</div>
              )}
              {selectedNode.meta?.feasibility && (
                <div><strong>Feasibility:</strong> {selectedNode.meta.feasibility}</div>
              )}
              {selectedNode.meta?.file_size && (
                <div><strong>Size:</strong> {(selectedNode.meta.file_size / 1024).toFixed(1)} KB</div>
              )}
            </div>

            {/* If Decision, provide link to full replay */}
            {selectedNode.type === 'decision' && selectedNode.meta?.id && (
              <Link
                to={`/decisions/${selectedNode.meta.id}`}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Replay Decision</span>
                <ExternalLink size={13} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphView;
