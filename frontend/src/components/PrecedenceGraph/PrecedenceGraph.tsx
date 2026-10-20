import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { PrecedenceGraph as GraphType } from '../../types';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrecedenceGraphProps {
  graphData: GraphType;
  hasCycle: boolean;
  cycles: string[][];
  visibleEdgeIds?: string[];
  activeCycle?: string[];
  activeHighlightEdgeId?: string;
}

export const PrecedenceGraph: React.FC<PrecedenceGraphProps> = ({
  graphData,
  hasCycle,
  cycles,
  visibleEdgeIds,
  activeCycle,
  activeHighlightEdgeId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedEdgeInfo, setSelectedEdgeInfo] = useState<any | null>(null);

  // Initialize and update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current || !graphData || graphData.nodes.length === 0) return;

    // Track cycle edges only when a cycle is actually detected/active
    const cycleEdgePairs = new Set<string>();
    const activeCyclePairs = new Set<string>();

    if (hasCycle && cycles && cycles.length > 0) {
      cycles.forEach(cycle => {
        for (let i = 0; i < cycle.length - 1; i++) {
          cycleEdgePairs.add(`${cycle[i]}->${cycle[i+1]}`);
        }
      });
    }

    if (activeCycle && activeCycle.length > 1) {
      for (let i = 0; i < activeCycle.length - 1; i++) {
        activeCyclePairs.add(`${activeCycle[i]}->${activeCycle[i+1]}`);
      }
    }

    // Sort transaction nodes consistently (e.g. T1, T2, T3...)
    const sortedNodes = [...graphData.nodes].sort((a, b) => {
      const numA = parseInt(a.data.id.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.data.id.replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.data.id.localeCompare(b.data.id);
    });

    const nodeOrderMap = new Map<string, number>();
    sortedNodes.forEach((n, idx) => {
      nodeOrderMap.set(n.data.id, idx);
    });

    // Pre-scan full graphData.edges to check if mutual opposite-direction edges exist
    // between any node pair in the final graph. This ensures stable curvature throughout simulation!
    const fullPairHasMutual: Record<string, boolean> = {};
    const fullPairForward: Record<string, boolean> = {};
    const fullPairReverse: Record<string, boolean> = {};

    graphData.edges.forEach(e => {
      const srcIdx = nodeOrderMap.get(e.data.source) ?? 0;
      const tgtIdx = nodeOrderMap.get(e.data.target) ?? 0;
      const pairKey = srcIdx < tgtIdx ? `${e.data.source}:${e.data.target}` : `${e.data.target}:${e.data.source}`;
      if (srcIdx < tgtIdx) fullPairForward[pairKey] = true;
      else if (srcIdx > tgtIdx) fullPairReverse[pairKey] = true;
      if (fullPairForward[pairKey] && fullPairReverse[pairKey]) {
        fullPairHasMutual[pairKey] = true;
      }
    });

    // Compute stable layout positions for ALL nodes in advance
    const containerWidth = containerRef.current.clientWidth || 640;
    const containerHeight = Math.max(containerRef.current.clientHeight || 340, 340);
    const nodeCount = sortedNodes.length;

    const nodePositions: Record<string, { x: number; y: number }> = {};

    if (nodeCount <= 4) {
      // Horizontal linear layout with generous spacing
      const spacing = Math.min(220, Math.max(160, (containerWidth - 140) / Math.max(1, nodeCount - 1)));
      const startX = (containerWidth - (nodeCount - 1) * spacing) / 2;
      const centerY = containerHeight / 2;

      sortedNodes.forEach((node, idx) => {
        nodePositions[node.data.id] = {
          x: Math.round(startX + idx * spacing),
          y: Math.round(centerY)
        };
      });
    } else {
      // Circular polygon layout for 5+ transactions
      const radius = Math.min(containerWidth, containerHeight) * 0.36;
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      sortedNodes.forEach((node, idx) => {
        const angle = (2 * Math.PI * idx) / nodeCount - Math.PI / 2;
        nodePositions[node.data.id] = {
          x: Math.round(centerX + radius * Math.cos(angle)),
          y: Math.round(centerY + radius * Math.sin(angle))
        };
      });
    }

    // Determine nodes participating in cycles to highlight ONLY those nodes
    const cycleNodesSet = new Set<string>();
    if (hasCycle) {
      if (activeCycle && activeCycle.length > 1) {
        activeCycle.forEach(id => cycleNodesSet.add(id));
      } else if (cycles && cycles.length > 0) {
        cycles.forEach(c => c.forEach(id => cycleNodesSet.add(id)));
      }
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Add Nodes with permanent preset positions so they NEVER jump between steps
    sortedNodes.forEach(n => {
      const isCycleNode = cycleNodesSet.has(n.data.id);
      elements.push({
        data: { id: n.data.id, label: n.data.label },
        position: nodePositions[n.data.id],
        classes: isCycleNode ? 'cycle-node' : 'normal-node'
      });
    });

    // Filter edges to only those that should be visible at current step
    const edgesToRender = graphData.edges.filter(e => {
      if (visibleEdgeIds && !visibleEdgeIds.includes(e.data.id)) return false;
      return true;
    });

    const forwardSeen: Record<string, number> = {};
    const reverseSeen: Record<string, number> = {};

    edgesToRender.forEach(e => {
      const edgeKey = `${e.data.source}->${e.data.target}`;
      const isCycleEdge = hasCycle && (
        activeCycle && activeCycle.length > 1 
          ? activeCyclePairs.has(edgeKey) 
          : cycleEdgePairs.has(edgeKey)
      );
      const isHighlighted = activeHighlightEdgeId === e.data.id;
      const isSelfLoop = e.data.source === e.data.target;

      const srcIdx = nodeOrderMap.get(e.data.source) ?? 0;
      const tgtIdx = nodeOrderMap.get(e.data.target) ?? 0;
      const pairKey = srcIdx < tgtIdx ? `${e.data.source}:${e.data.target}` : `${e.data.target}:${e.data.source}`;
      const isMutual = Boolean(fullPairHasMutual[pairKey]);

      let edgeClass = 'normal-edge';
      let controlDistance = -42;

      if (isSelfLoop) {
        edgeClass = 'self-loop';
      } else if (srcIdx < tgtIdx) {
        // FORWARD EDGE (Left to Right in linear layout):
        // Curve ABOVE the nodes (negative distance bends to left of travel, i.e. UPWARDS)
        const forwardIdx = forwardSeen[pairKey] || 0;
        forwardSeen[pairKey] = forwardIdx + 1;
        const span = tgtIdx - srcIdx;

        if (span > 1) {
          // Span skips over intermediate node(s) (e.g. T1 -> T3 skipping T2)
          // Curve high above intermediate node boxes and adjacent edges
          controlDistance = -135 - (span - 2) * 35 - forwardIdx * 28;
        } else {
          // Adjacent nodes (span == 1, e.g. T1 -> T2)
          controlDistance = (isMutual ? -64 : -44) - forwardIdx * 24;
        }
        edgeClass = 'curved-edge';
      } else {
        // REVERSE EDGE (Right to Left in linear layout):
        // Curve BELOW the nodes (Cytoscape inverts normal on swapped pair edge, pushing it DOWNWARDS)
        const reverseIdx = reverseSeen[pairKey] || 0;
        reverseSeen[pairKey] = reverseIdx + 1;
        const span = srcIdx - tgtIdx;

        if (span > 1) {
          // Backward span skips over intermediate node(s) (e.g. T3 -> T1 skipping T2)
          // Curve deep below intermediate node boxes and adjacent edges
          controlDistance = -135 - (span - 2) * 35 - reverseIdx * 28;
        } else {
          // Adjacent reverse nodes (span == 1, e.g. T2 -> T1)
          controlDistance = (isMutual ? -64 : -44) - reverseIdx * 24;
        }
        edgeClass = 'curved-edge';
      }

      if (isCycleEdge) {
        edgeClass += ' cycle-edge';
      } else if (isHighlighted) {
        edgeClass += ' highlight-newest';
      }

      const conflictCount = e.data.conflicts?.length || 1;
      const cleanLabel = conflictCount === 1 
        ? `${e.data.conflicts[0]?.op1_raw} → ${e.data.conflicts[0]?.op2_raw}` 
        : `${conflictCount} conflicts`;

      elements.push({
        data: {
          id: e.data.id,
          source: e.data.source,
          target: e.data.target,
          label: cleanLabel,
          explanation: e.data.explanation,
          conflicts: e.data.conflicts,
          isCycle: isCycleEdge,
          controlDistance: controlDistance
        },
        classes: edgeClass
      });
    });

    const isDarkMode = document.documentElement.classList.contains('dark');

    // Preserve previous pan and zoom if cyRef already exists so user won't get disoriented
    let prevZoom: number | null = null;
    let prevPan: cytoscape.Position | null = null;
    if (cyRef.current && !cyRef.current.destroyed()) {
      prevZoom = cyRef.current.zoom();
      prevPan = cyRef.current.pan();
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'round-rectangle',
            'background-color': isDarkMode ? '#1e293b' : '#ffffff',
            'border-color': isDarkMode ? '#3b82f6' : '#2563eb',
            'border-width': 2.5,
            'color': isDarkMode ? '#f8fafc' : '#0f172a',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-family': 'Inter, system-ui, sans-serif',
            'font-weight': 700,
            'font-size': '13px',
            'width': 68,
            'height': 40,
            'padding': '6px',
            'overlay-opacity': 0,
            'z-index': 10
          }
        },
        {
          selector: 'node.cycle-node',
          style: {
            'border-color': '#ef4444',
            'border-width': 3,
            'background-color': isDarkMode ? '#450a0a' : '#fef2f2',
            'color': isDarkMode ? '#fca5a5' : '#b91c1c',
            'z-index': 20
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2.2,
            'line-color': isDarkMode ? '#64748b' : '#475569',
            'target-arrow-color': isDarkMode ? '#64748b' : '#475569',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.6,
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'font-weight': 600,
            'color': isDarkMode ? '#e2e8f0' : '#1e293b',
            'text-background-color': isDarkMode ? '#0f172a' : '#ffffff',
            'text-background-opacity': 0.95,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-color': isDarkMode ? '#475569' : '#cbd5e1',
            'text-border-width': 1,
            'text-border-opacity': 0.9,
            'text-rotation': 'autorotate',
            'target-distance-from-node': 6,
            'source-distance-from-node': 6
          }
        },
        {
          selector: 'edge.curved-edge',
          style: {
            'curve-style': 'unbundled-bezier',
            'control-point-distances': 'data(controlDistance)',
            'control-point-weights': 0.5
          }
        },
        {
          selector: 'edge.self-loop',
          style: {
            'curve-style': 'bezier',
            'loop-direction': '-45deg',
            'loop-sweep': '-90deg',
            'control-point-step-size': 50
          }
        },
        {
          selector: 'edge.highlight-newest',
          style: {
            'width': 3.5,
            'line-color': '#2563eb',
            'target-arrow-color': '#2563eb',
            'color': '#2563eb',
            'arrow-scale': 1.8,
            'z-index': 50
          }
        },
        {
          selector: 'edge.cycle-edge',
          style: {
            'width': 3.5,
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'color': '#ef4444',
            'arrow-scale': 1.8,
            'z-index': 100
          }
        },
        {
          selector: ':selected',
          style: {
            'border-color': '#0284c7',
            'border-width': 3,
            'line-color': '#0284c7',
            'target-arrow-color': '#0284c7'
          }
        }
      ],
      layout: {
        name: 'preset',
        positions: nodePositions,
        fit: false
      } as any
    });

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      setSelectedEdgeInfo({
        source: edge.data('source'),
        target: edge.data('target'),
        label: edge.data('label'),
        explanation: edge.data('explanation'),
        conflicts: edge.data('conflicts')
      });
    });

    cyRef.current = cy;

    // Restore previous pan/zoom if applicable, otherwise fit gracefully
    if (prevZoom !== null && prevPan !== null) {
      cy.zoom(prevZoom);
      cy.pan(prevPan);
    } else {
      setTimeout(() => {
        if (cyRef.current && !cyRef.current.destroyed()) {
          cyRef.current.resize();
          cyRef.current.fit(undefined, 35);
        }
      }, 30);
    }

  }, [graphData, hasCycle, cycles, visibleEdgeIds, activeCycle, activeHighlightEdgeId]);

  // ResizeObserver for container bounds changes
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      cyRef.current.resize();
      cyRef.current.fit(undefined, 35);
    }
  };
  const handleReset = () => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      cyRef.current.reset();
      cyRef.current.fit(undefined, 35);
    }
  };

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        No graph data available.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            Precedence Dependency Graph
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Directed dependencies derived from conflicting operation pairs</p>
        </div>

        {/* Status Badge & Controls */}
        <div className="flex items-center gap-2">
          {hasCycle ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" /> Cycle Detected
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" /> Acyclic Graph
            </span>
          )}

          {/* Graph Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 gap-0.5">
            <button onClick={handleZoomIn} className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={handleZoomOut} className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
            <button onClick={handleFit} className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" title="Fit to Container"><Maximize2 className="w-3.5 h-3.5" /></button>
            <button onClick={handleReset} className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" title="Reset Layout"><RotateCcw className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Graph Viewport */}
      <div className="relative w-full h-[340px] bg-slate-50/60 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
          💡 Click edge to inspect conflict details
        </div>
      </div>

      {/* Edge Details Inspector */}
      <AnimatePresence>
        {selectedEdgeInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                Precedence Edge Dependency: <code className="text-blue-600 font-mono font-bold">{selectedEdgeInfo.source} → {selectedEdgeInfo.target}</code>
              </span>
              <button onClick={() => setSelectedEdgeInfo(null)} className="text-xs text-slate-400 hover:text-slate-700">✕ Close</button>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-500">Conflicts causing this dependency:</span>
              {selectedEdgeInfo.conflicts && selectedEdgeInfo.conflicts.map((c: any, idx: number) => (
                <div key={idx} className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-[11px]">
                  <span>{c.op1_raw} → {c.op2_raw}</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">{c.conflict_type} (Item: {c.data_item})</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
