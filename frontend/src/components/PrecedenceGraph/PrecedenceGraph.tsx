import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { PrecedenceGraph as GraphType } from '../../types';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

cytoscape.use(dagre);

interface PrecedenceGraphProps {
  graphData: GraphType;
  hasCycle: boolean;
  cycles: string[][];
  visibleEdgeIds?: string[];
  activeCycle?: string[];
}

export const PrecedenceGraph: React.FC<PrecedenceGraphProps> = ({
  graphData,
  hasCycle,
  cycles,
  visibleEdgeIds,
  activeCycle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedEdgeInfo, setSelectedEdgeInfo] = useState<any | null>(null);

  // Initialize and update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current || !graphData || graphData.nodes.length === 0) return;

    const cycleEdgePairs = new Set<string>();
    const activeCyclePairs = new Set<string>();

    cycles.forEach(cycle => {
      for (let i = 0; i < cycle.length - 1; i++) {
        cycleEdgePairs.add(`${cycle[i]}->${cycle[i+1]}`);
      }
    });

    if (activeCycle && activeCycle.length > 1) {
      for (let i = 0; i < activeCycle.length - 1; i++) {
        activeCyclePairs.add(`${activeCycle[i]}->${activeCycle[i+1]}`);
      }
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Add Nodes
    graphData.nodes.forEach(n => {
      elements.push({
        data: { id: n.data.id, label: n.data.label }
      });
    });

    // Add Edges (filter by visibleEdgeIds if provided)
    graphData.edges.forEach(e => {
      if (visibleEdgeIds && !visibleEdgeIds.includes(e.data.id)) return;

      const edgeKey = `${e.data.source}->${e.data.target}`;
      const isCycleEdge = cycleEdgePairs.has(edgeKey) || activeCyclePairs.has(edgeKey);
      const conflictCount = e.data.conflicts?.length || 1;
      const cleanLabel = conflictCount === 1 ? `${e.data.conflicts[0]?.op1_raw} → ${e.data.conflicts[0]?.op2_raw}` : `${conflictCount} conflicts`;

      elements.push({
        data: {
          id: e.data.id,
          source: e.data.source,
          target: e.data.target,
          label: cleanLabel,
          explanation: e.data.explanation,
          conflicts: e.data.conflicts,
          isCycle: isCycleEdge
        }
      });
    });

    const isDarkMode = document.documentElement.classList.contains('dark');

    // Destroy existing instance safely before re-creating
    if (cyRef.current) {
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
            'border-color': hasCycle ? '#ef4444' : '#2563eb',
            'border-width': 2,
            'color': isDarkMode ? '#f8fafc' : '#0f172a',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-family': 'Inter, system-ui, sans-serif',
            'font-weight': 700,
            'font-size': '13px',
            'width': 64,
            'height': 38,
            'padding': '8px',
            'overlay-opacity': 0
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2.5,
            'line-color': isDarkMode ? '#64748b' : '#475569',
            'target-arrow-color': isDarkMode ? '#64748b' : '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'font-family': 'Inter, monospace',
            'color': isDarkMode ? '#cbd5e1' : '#334155',
            'text-background-color': isDarkMode ? '#0f172a' : '#ffffff',
            'text-background-opacity': 0.95,
            'text-background-padding': '3px',
            'text-rotation': 'autorotate'
          }
        },
        {
          selector: 'edge[?isCycle]',
          style: {
            'width': 3.5,
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'color': '#dc2626'
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
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 60,
        rankSep: 90,
        padding: 40
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

    // Automatically fit to viewport after render
    setTimeout(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 40);
      }
    }, 50);

  }, [graphData, hasCycle, cycles, visibleEdgeIds, activeCycle]);

  // ResizeObserver for container bounds changes
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 40);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.resize();
      cyRef.current.fit(undefined, 40);
    }
  };
  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.reset();
      cyRef.current.fit(undefined, 40);
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
      <div className="relative w-full h-[260px] bg-slate-50/60 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
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
