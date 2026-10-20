import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TransactionViewEquivalenceTable } from '../components/ViewAnalysis/TransactionViewEquivalenceTable';
import { AnalysisResult } from '../types';

const mockAnalysis: AnalysisResult = {
  success: true,
  schedule_text: "R1(X), W2(X), W1(X), W3(X)",
  operations: [
    { id: 1, transaction: "T1", type: "READ", data_item: "X", raw_text: "R1(X)" },
    { id: 2, transaction: "T2", type: "WRITE", data_item: "X", raw_text: "W2(X)" },
    { id: 3, transaction: "T1", type: "WRITE", data_item: "X", raw_text: "W1(X)" },
    { id: 4, transaction: "T3", type: "WRITE", data_item: "X", raw_text: "W3(X)" }
  ],
  transactions: ["T1", "T2", "T3"],
  data_items: ["X"],
  operation_count: 4,
  transaction_count: 3,
  conflicts: [],
  conflict_count: 2,
  precedence_graph: {
    nodes: [],
    edges: [],
    transaction_list: ["T1", "T2", "T3"],
    edge_count: 2,
    node_count: 3
  },
  cycles: [["T1", "T2", "T1"]],
  formatted_cycles: ["T1 → T2 → T1"],
  has_cycle: true,
  conflict_serializable: false,
  topological_orders: [],
  formatted_topological_orders: [],
  view_serializable: true,
  view_analysis: {
    view_serializable: true,
    initial_reads: [
      { data_item: "X", transaction: "T1", op_id: 1, raw_text: "R1(X)" }
    ],
    reads_from: [
      { read_op_id: 1, read_op_raw: "R1(X)", reader_tx: "T1", data_item: "X", writer_tx: null, writer_op_id: null, writer_op_raw: null }
    ],
    final_writes: [
      { data_item: "X", transaction: "T3", op_id: 4, raw_text: "W3(X)" }
    ],
    equivalent_orders: ["T1 → T2 → T3"],
    candidate_orders_count: 6,
    candidate_results: []
  },
  combined_result: {
    state_code: "VIEW_ONLY_SERIALIZABLE",
    headline: "View Serializable but NOT Conflict Serializable",
    summary: "Schedule has a cycle due to blind writes but is view equivalent.",
    conflict_serializable: false,
    view_serializable: true,
    is_special_case: true
  }
};

describe('TransactionViewEquivalenceTable', () => {
  it('renders all required columns and transaction details accurately', () => {
    render(<TransactionViewEquivalenceTable analysis={mockAnalysis} />);

    expect(screen.getByText(/Transaction and View-Equivalence Analysis/i)).toBeDefined();
    expect(screen.getByText('Transaction')).toBeDefined();
    expect(screen.getByText('Read Operations')).toBeDefined();
    expect(screen.getByText('Read-From Relationships')).toBeDefined();
    expect(screen.getByText('Write Operations')).toBeDefined();
    expect(screen.getByText('Final Write')).toBeDefined();
    expect(screen.getByText('View-Equivalence Notes')).toBeDefined();

    // Verify transactions are listed
    expect(screen.getByText('T1')).toBeDefined();
    expect(screen.getByText('T2')).toBeDefined();
    expect(screen.getByText('T3')).toBeDefined();

    // Verify final write detection for T3
    expect(screen.getByText('✓ Final Writer')).toBeDefined();
    expect(screen.getAllByText(/Overwritten by T3/i).length).toBeGreaterThan(0);

    // Verify dual verdict conclusion
    expect(screen.getByText(/NOT CONFLICT SERIALIZABLE/i)).toBeDefined();
    expect(screen.getByText(/VIEW SERIALIZABLE/i)).toBeDefined();
    expect(screen.getByText(/T1 → T2 → T3/i)).toBeDefined();
  });
});
