import React from 'react';
import { PrecedenceGraph as GraphType } from '../../types';

interface SimplePrecedenceGraphProps {
  graphData?: GraphType;
  hasCycle?: boolean;
  cycles?: string[][];
  visibleEdgeIds?: string[];
  activeCycle?: string[];
}

export const SimplePrecedenceGraph: React.FC<SimplePrecedenceGraphProps> = ({
  graphData,
  hasCycle = false,
  cycles = [],
  visibleEdgeIds = [],
  activeCycle
}) => {
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  if (nodes.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 font-mono bg-slate-950 rounded-2xl border border-slate-800">
        No transaction nodes to display.
      </div>
    );
  }

  // Node position calculation
  const width = 360;
  const height = 240;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;

  const nodePositions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, idx) => {
    const angle = (2 * Math.PI * idx) / nodes.length - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodePositions.set(n.data.id, { x, y });
  });

  return (
    <div className="flex flex-col gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-100">
      <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
        <span className="font-bold text-purple-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          SIMULATION PRECEDENCE GRAPH (SVG)
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hasCycle ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
          {hasCycle ? '🔴 Cyclic' : '🟢 Acyclic'}
        </span>
      </div>

      <div className="relative w-full overflow-hidden flex justify-center items-center py-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[400px] h-[220px]">
          <defs>
            <marker
              id="arrow-normal"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
            </marker>
            <marker
              id="arrow-cycle"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Render Edges */}
          {edges.map(edge => {
            const src = nodePositions.get(edge.data.source);
            const tgt = nodePositions.get(edge.data.target);
            if (!src || !tgt) return null;

            const isVisible = visibleEdgeIds.length === 0 || visibleEdgeIds.includes(edge.data.id);
            if (!isVisible) return null;

            const isCycleEdge = hasCycle || (activeCycle && activeCycle.includes(edge.data.source) && activeCycle.includes(edge.data.target));
            const color = isCycleEdge ? '#ef4444' : '#a855f7';
            const markerId = isCycleEdge ? 'url(#arrow-cycle)' : 'url(#arrow-normal)';

            // Control point for subtle quadratic curve if multiple nodes
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <g key={edge.data.id}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={color}
                  strokeWidth={isCycleEdge ? "2.5" : "2"}
                  strokeDasharray={isCycleEdge ? "4 2" : undefined}
                  markerEnd={markerId}
                />
                <text
                  x={midX}
                  y={midY - 6}
                  fill={color}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {edge.data.data_items?.join(',') || 'conflict'}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map(node => {
            const pos = nodePositions.get(node.data.id);
            if (!pos) return null;

            const isInCycle = hasCycle || (activeCycle && activeCycle.includes(node.data.id));

            return (
              <g key={node.data.id} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle
                  r="18"
                  fill={isInCycle ? '#881337' : '#3b0764'}
                  stroke={isInCycle ? '#f43f5e' : '#c084fc'}
                  strokeWidth="2.5"
                />
                <text
                  y="4"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {node.data.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
        <span>Nodes: {nodes.length}</span>
        <span>Edges: {edges.length}</span>
        <span className="text-purple-400 font-bold">{hasCycle ? 'Cycle Detected' : 'Topological Order Available'}</span>
      </div>
    </div>
  );
};
