export interface Operation {
  id: number;
  transaction: string;
  type: 'READ' | 'WRITE';
  data_item: string;
  raw_text: string;
}

export interface Conflict {
  op1_id: number;
  op1_raw: string;
  op1_tx: string;
  op1_type: string;

  op2_id: number;
  op2_raw: string;
  op2_tx: string;
  op2_type: string;

  data_item: string;
  conflict_type: 'READ-WRITE' | 'WRITE-READ' | 'WRITE-WRITE';
  from_tx: string;
  to_tx: string;
  description: string;
}

export interface GraphNode {
  data: {
    id: string;
    label: string;
  };
}

export interface GraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    conflict_types: string[];
    data_items: string[];
    conflicts: Conflict[];
    explanation: string;
  };
}

export interface PrecedenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  transaction_list: string[];
  edge_count: number;
  node_count: number;
}

export interface InitialRead {
  data_item: string;
  transaction: string;
  op_id: number;
  raw_text: string;
}

export interface ReadsFrom {
  read_op_id: number;
  read_op_raw: string;
  reader_tx: string;
  data_item: string;
  writer_tx: string | null;
  writer_op_id: number | null;
  writer_op_raw: string | null;
}

export interface FinalWrite {
  data_item: string;
  transaction: string;
  op_id: number;
  raw_text: string;
}

export interface CandidateResult {
  order: string[];
  formatted_order: string;
  is_equivalent: boolean;
  match_initial_reads: boolean;
  match_reads_from: boolean;
  match_final_writes: boolean;
  serial_operations: Operation[];
}

export interface ViewAnalysis {
  view_serializable: boolean;
  initial_reads: InitialRead[];
  reads_from: ReadsFrom[];
  final_writes: FinalWrite[];
  equivalent_orders: string[];
  candidate_orders_count: number;
  candidate_results: CandidateResult[];
}

export interface CombinedResult {
  state_code: 'BOTH_SERIALIZABLE' | 'VIEW_ONLY_SERIALIZABLE' | 'NEITHER_SERIALIZABLE' | 'CORRECTNESS_ERROR';
  headline: string;
  summary: string;
  conflict_serializable: boolean;
  view_serializable: boolean;
  is_special_case: boolean;
}

export interface AnalysisResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
  schedule_text: string;
  operations: Operation[];
  transactions: string[];
  data_items: string[];
  operation_count: number;
  transaction_count: number;

  conflicts: Conflict[];
  conflict_count: number;

  precedence_graph: PrecedenceGraph;
  cycles: string[][];
  formatted_cycles: string[];
  has_cycle: boolean;
  conflict_serializable: boolean;

  topological_orders: string[][];
  formatted_topological_orders: string[];

  view_analysis: ViewAnalysis;
  view_serializable: boolean;

  combined_result: CombinedResult;
  history_id?: number;
}

export interface ExampleSchedule {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced' | 'Hard';
  schedule_text: string;
  expected_conflict: boolean;
  expected_view: boolean;
  description: string;
  theory_note: string;
}

export interface HistoryItem {
  id: number;
  schedule_text: string;
  transaction_count: number;
  operation_count: number;
  conflict_serializable: boolean;
  view_serializable: boolean;
  has_cycle: boolean;
  state_code: string;
  headline: string;
  created_at: string;
}
