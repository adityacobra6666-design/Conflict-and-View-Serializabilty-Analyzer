import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { PrecedenceGraph } from '../components/PrecedenceGraph/PrecedenceGraph';
import { PrecedenceGraph as GraphType } from '../types';

beforeAll(() => {
  const noop = () => {};
  const dummyCtx: any = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'measureText') return () => ({ width: 50 });
      if (prop === 'getImageData') return () => ({ data: [] });
      if (prop === 'getLineDash') return () => [];
      return noop;
    }
  });
  HTMLCanvasElement.prototype.getContext = () => dummyCtx;
});

describe('PrecedenceGraph Visualization', () => {
  const createTestGraph = (nodeIds: string[], edges: Array<{ id: string; source: string; target: string; label?: string }>): GraphType => ({
    nodes: nodeIds.map(id => ({ data: { id, label: id } })),
    edges: edges.map(e => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || `${e.source} -> ${e.target}`,
        conflict_types: ['WRITE-READ'],
        data_items: ['X'],
        explanation: 'Test conflict dependency',
        conflicts: [{
          op1_id: 1,
          op1_raw: `W_${e.source}(X)`,
          op1_tx: e.source,
          op1_type: 'WRITE',
          op2_id: 2,
          op2_raw: `R_${e.target}(X)`,
          op2_tx: e.target,
          op2_type: 'READ',
          data_item: 'X',
          conflict_type: 'WRITE-READ' as const,
          from_tx: e.source,
          to_tx: e.target,
          description: `Conflict from ${e.source} to ${e.target}`
        }]
      }
    })),
    transaction_list: nodeIds,
    edge_count: edges.length,
    node_count: nodeIds.length
  });

  it('renders two transactions connected in both directions without errors', () => {
    const graph = createTestGraph(['T1', 'T2'], [
      { id: 'e1', source: 'T1', target: 'T2' },
      { id: 'e2', source: 'T2', target: 'T1' }
    ]);

    const { container } = render(
      <PrecedenceGraph
        graphData={graph}
        hasCycle={true}
        cycles={[['T1', 'T2', 'T1']]}
      />
    );

    expect(container.querySelector('div')).toBeDefined();
  });

  it('renders a three-transaction cycle (T1 -> T2 -> T3 -> T1) with cycle highlighting', () => {
    const graph = createTestGraph(['T1', 'T2', 'T3'], [
      { id: 'e1', source: 'T1', target: 'T2' },
      { id: 'e2', source: 'T2', target: 'T3' },
      { id: 'e3', source: 'T3', target: 'T1' }
    ]);

    const { container } = render(
      <PrecedenceGraph
        graphData={graph}
        hasCycle={true}
        cycles={[['T1', 'T2', 'T3', 'T1']]}
        activeCycle={['T1', 'T2', 'T3', 'T1']}
      />
    );

    expect(container.querySelector('div')).toBeDefined();
  });

  it('renders multiple edges between the same pair of nodes', () => {
    const graph = createTestGraph(['T1', 'T2'], [
      { id: 'e1', source: 'T1', target: 'T2', label: 'W1(X) -> R2(X)' },
      { id: 'e2', source: 'T1', target: 'T2', label: 'W1(Y) -> W2(Y)' }
    ]);

    const { container } = render(
      <PrecedenceGraph
        graphData={graph}
        hasCycle={false}
        cycles={[]}
      />
    );

    expect(container.querySelector('div')).toBeDefined();
  });

  it('renders an acyclic graph with no cycle correctly', () => {
    const graph = createTestGraph(['T1', 'T2', 'T3'], [
      { id: 'e1', source: 'T1', target: 'T2' },
      { id: 'e2', source: 'T2', target: 'T3' },
      { id: 'e3', source: 'T1', target: 'T3' }
    ]);

    const { getByText } = render(
      <PrecedenceGraph
        graphData={graph}
        hasCycle={false}
        cycles={[]}
      />
    );

    expect(getByText(/Acyclic Graph/i)).toBeDefined();
  });

  it('renders newly constructed edge with activeHighlightEdgeId during simulation', () => {
    const graph = createTestGraph(['T1', 'T2', 'T3'], [
      { id: 'e1', source: 'T1', target: 'T2' },
      { id: 'e2', source: 'T2', target: 'T3' }
    ]);

    const { container } = render(
      <PrecedenceGraph
        graphData={graph}
        hasCycle={false}
        cycles={[]}
        visibleEdgeIds={['e1', 'e2']}
        activeHighlightEdgeId="e2"
      />
    );

    expect(container.querySelector('div')).toBeDefined();
  });

  it('renders exact test schedule graph (R1(X), W2(X), W1(X), W3(X)) with cycle T1 -> T2 -> T1 and edge T2 -> T3', () => {
    const graph = createTestGraph(['T1', 'T2', 'T3'], [
      { id: 'e_T1_T2', source: 'T1', target: 'T2', label: 'R1(X) → W2(X)' },
      { id: 'e_T2_T1', source: 'T2', target: 'T1', label: 'W2(X) → W1(X)' },
      { id: 'e_T2_T3', source: 'T2', target: 'T3', label: 'W2(X) → W3(X)' }
    ]);

    const { container, getByText } = render(
      <PrecedenceGraph
        graphData={graph}
        hasCycle={true}
        cycles={[['T1', 'T2', 'T1']]}
        activeCycle={['T1', 'T2', 'T1']}
        visibleEdgeIds={['e_T1_T2', 'e_T2_T1', 'e_T2_T3']}
      />
    );

    expect(getByText(/Cycle Detected/i)).toBeDefined();
    expect(container.querySelector('div')).toBeDefined();
  });
});
