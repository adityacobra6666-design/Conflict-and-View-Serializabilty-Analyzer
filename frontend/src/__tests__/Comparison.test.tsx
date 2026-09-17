import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Comparison } from '../components/Comparison/Comparison';
import { AnalysisResult } from '../types';

describe('Comparison Component', () => {
  const dummyAnalysis: AnalysisResult = {
    success: true,
    schedule_text: 'R1(X), W2(X), W1(X), W3(X)',
    operations: [],
    transactions: ['T1', 'T2', 'T3'],
    data_items: ['X'],
    operation_count: 4,
    transaction_count: 3,
    conflicts: [],
    conflict_count: 0,
    precedence_graph: { nodes: [], edges: [], transaction_list: ['T1', 'T2', 'T3'], edge_count: 0, node_count: 3 },
    cycles: [['T1', 'T2', 'T1']],
    formatted_cycles: ['T1 → T2 → T1'],
    has_cycle: true,
    conflict_serializable: false,
    topological_orders: [],
    formatted_topological_orders: [],
    view_analysis: {
      view_serializable: true,
      initial_reads: [],
      reads_from: [],
      final_writes: [],
      equivalent_orders: ['T1 → T2 → T3'],
      candidate_orders_count: 6,
      candidate_results: []
    },
    view_serializable: true,
    combined_result: {
      state_code: 'VIEW_ONLY_SERIALIZABLE',
      headline: 'View Serializable but NOT Conflict Serializable',
      summary: 'Test summary statement',
      conflict_serializable: false,
      view_serializable: true,
      is_special_case: true
    }
  };

  it('renders headline and special case banner for blind write schedule', () => {
    render(<Comparison analysis={dummyAnalysis} />);

    expect(screen.getByText(/View Serializable but NOT Conflict Serializable/i)).toBeDefined();
    expect(screen.getByText(/Educational Highlight/i)).toBeDefined();
    expect(screen.getByText(/Why Conflict Result\?/i)).toBeDefined();
    expect(screen.getByText(/Why View Result\?/i)).toBeDefined();
  });
});
