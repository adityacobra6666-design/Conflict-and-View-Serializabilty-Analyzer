import { AnalysisResult, Operation } from './index';

export interface OpDiff {
  position: number;
  change_type: 'UNCHANGED' | 'MODIFIED' | 'ADDED' | 'REMOVED';
  orig_raw: string | null;
  mod_raw: string | null;
  description: string;
}

export interface GraphDiffEdge {
  source: string;
  target: string;
  label: string;
  details: string;
}

export interface GraphDiff {
  unchanged: GraphDiffEdge[];
  added: GraphDiffEdge[];
  removed: GraphDiffEdge[];
  unchanged_count: number;
  added_count: number;
  removed_count: number;
}

export interface ConflictDiff {
  orig_conflict_serializable: boolean;
  mod_conflict_serializable: boolean;
  state_change: 'UNCHANGED' | 'IMPROVED' | 'DEGRADED';
  orig_conflict_count: number;
  mod_conflict_count: number;
}

export interface CycleDiff {
  orig_has_cycle: boolean;
  mod_has_cycle: boolean;
  orig_cycles: string[];
  mod_cycles: string[];
  state_change: 'UNCHANGED' | 'APPEARED' | 'DISAPPEARED' | 'MODIFIED' | 'NONE';
}

export interface ViewDiff {
  orig_view_serializable: boolean;
  mod_view_serializable: boolean;
  state_change: 'UNCHANGED' | 'IMPROVED' | 'DEGRADED';
  orig_equivalent_orders: string[];
  mod_equivalent_orders: string[];
}

export interface WhatIfComparisonResult {
  schedule_diffs: OpDiff[];
  modified_op_count: number;
  graph_diff: GraphDiff;
  conflict_diff: ConflictDiff;
  cycle_diff: CycleDiff;
  view_diff: ViewDiff;
  explanation: string;
}

export interface WhatIfExperiment {
  id: string;
  title: string;
  scheduleText: string;
  analysis: AnalysisResult | null;
  comparison: WhatIfComparisonResult | null;
  createdAt: string;
}
