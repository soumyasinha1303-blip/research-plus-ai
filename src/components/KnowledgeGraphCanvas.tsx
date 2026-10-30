import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Search,
  BookOpen,
  Database,
  Cpu,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { GraphNode, GraphLink, KnowledgeGraphData } from "../types/index.ts";

interface KnowledgeGraphCanvasProps {
  graphData: KnowledgeGraphData;
}

export const KnowledgeGraphCanvas: React.FC<KnowledgeGraphCanvasProps> = ({ graphData }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({
    document: true,
    topic: true,
    methodology: true,
    dataset: true,
    citation: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute node layout coordinates using deterministic radial/force-inspired layout
  const positionedNodes = useMemo(() => {
    const nodes = graphData.nodes || [];
    const width = 850;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    const docs = nodes.filter((n) => n.type === "document");
    const others = nodes.filter((n) => n.type !== "document");

    const result: Record<string, { x: number; y: number }> = {};

    // Position documents in an inner ellipse
    docs.forEach((doc, idx) => {
      const angle = (idx / Math.max(docs.length, 1)) * 2 * Math.PI;
      const radiusX = 160;
      const radiusY = 120;
      result[doc.id] = {
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
      };
    });

    // Position other entities around their connected documents or in outer orbits
    others.forEach((node, idx) => {
      // Find connected document link
      const link = graphData.links.find(
        (l) => l.source === node.id || l.target === node.id
      );
      const connectedDocId = link
        ? link.source === node.id
          ? link.target
          : link.source
        : null;

      const parentPos = connectedDocId ? result[connectedDocId as string] : null;

      if (parentPos) {
        // Orbit around parent
        const offsetAngle = (idx * 1.37) % (2 * Math.PI);
        const dist = 90 + ((idx * 17) % 65);
        result[node.id] = {
          x: Math.min(Math.max(parentPos.x + dist * Math.cos(offsetAngle), 60), width - 60),
          y: Math.min(Math.max(parentPos.y + dist * Math.sin(offsetAngle), 60), height - 60),
        };
      } else {
        const angle = (idx / Math.max(others.length, 1)) * 2 * Math.PI;
        const outerRadius = 240;
        result[node.id] = {
          x: centerX + outerRadius * Math.cos(angle),
          y: centerY + outerRadius * Math.sin(angle),
        };
      }
    });

    return result;
  }, [graphData]);

  // Handle pan & dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === "circle" || (e.target as HTMLElement).tagName.toLowerCase() === "text") {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "document":
        return "#6366f1"; // indigo
      case "topic":
        return "#06b6d4"; // cyan
      case "methodology":
        return "#a855f7"; // purple
      case "dataset":
        return "#10b981"; // emerald
      case "citation":
        return "#f59e0b"; // amber
      default:
        return "#94a3b8";
    }
  };

  const toggleType = (type: string) => {
    setVisibleTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter((node) => {
      if (!visibleTypes[node.type]) return false;
      if (searchTerm.trim() && !node.label.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [graphData.nodes, visibleTypes, searchTerm]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return graphData.links.filter(
      (link) =>
        filteredNodeIds.has(link.source as string) && filteredNodeIds.has(link.target as string)
    );
  }, [graphData.links, filteredNodeIds]);

  return (
    <div className="relative flex h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Top Toolbar */}
      <div className="z-10 flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 backdrop-blur-md gap-3">
        {/* Search Input */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search entities, datasets, topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Legend / Filter toggles */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {[
            { type: "document", label: "Documents", color: "#6366f1" },
            { type: "topic", label: "Topics", color: "#06b6d4" },
            { type: "methodology", label: "Methodology", color: "#a855f7" },
            { type: "dataset", label: "Datasets", color: "#10b981" },
            { type: "citation", label: "Citations", color: "#f59e0b" },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => toggleType(item.type)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition border ${
                visibleTypes[item.type]
                  ? "bg-slate-900 text-slate-200 border-slate-700"
                  : "bg-slate-950/40 text-slate-500 border-slate-850 opacity-40"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Reset View"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 cursor-grab active:cursor-grabbing overflow-hidden relative select-none"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 850 550"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle Grid Pattern */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {filteredLinks.map((link, idx) => {
              const src = positionedNodes[link.source as string];
              const tgt = positionedNodes[link.target as string];
              if (!src || !tgt) return null;

              const isHighlighted =
                hoveredNodeId &&
                (link.source === hoveredNodeId || link.target === hoveredNodeId);

              return (
                <line
                  key={idx}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={isHighlighted ? "#818cf8" : "#334155"}
                  strokeWidth={isHighlighted ? 2.5 : 1.2}
                  strokeOpacity={isHighlighted ? 0.9 : 0.45}
                  strokeDasharray={link.label === "cites" ? "3,3" : undefined}
                />
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const pos = positionedNodes[node.id];
              if (!pos) return null;

              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              const radius = node.type === "document" ? 16 : node.type === "topic" ? 12 : 9;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer transition-transform"
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Outer pulse glow for documents */}
                  {node.type === "document" && (
                    <circle
                      r={radius + 6}
                      fill={getNodeColor(node.type)}
                      fillOpacity="0.15"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={radius}
                    fill={getNodeColor(node.type)}
                    stroke={isSelected || isHovered ? "#ffffff" : "#0f172a"}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-all hover:scale-125"
                  />

                  {/* Node Label */}
                  <text
                    y={radius + 12}
                    textAnchor="middle"
                    fill={isSelected || isHovered ? "#ffffff" : "#94a3b8"}
                    fontSize={node.type === "document" ? "10px" : "9px"}
                    fontWeight={node.type === "document" ? "bold" : "normal"}
                    className="pointer-events-none drop-shadow"
                  >
                    {node.label.length > 24 ? node.label.slice(0, 22) + "..." : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Entity Side Drawer */}
        {selectedNode && (
          <div className="absolute right-4 top-4 w-80 rounded-xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right">
            <div className="flex items-start justify-between">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: getNodeColor(selectedNode.type) }}
              >
                {selectedNode.type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h4 className="mt-2.5 font-bold text-sm text-slate-100">{selectedNode.label}</h4>

            {selectedNode.metadata?.summary && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Abstract Summary</p>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedNode.metadata.summary}
                </p>
              </div>
            )}

            {selectedNode.metadata?.fullMethodology && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Methodology</p>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {selectedNode.metadata.fullMethodology}
                </p>
              </div>
            )}

            {selectedNode.metadata?.fullCitation && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Referenced Citation</p>
                <p className="mt-1 text-xs text-slate-300 font-mono">
                  {selectedNode.metadata.fullCitation}
                </p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedNode(null)}
                className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-4 py-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span>{filteredNodes.length} Active Nodes</span>
          <span>•</span>
          <span>{filteredLinks.length} Connections</span>
        </div>
        <span>Click node to inspect entity details • Drag canvas to pan</span>
      </div>
    </div>
  );
};
