import { Operation, Conflict, GraphEdge, CandidateResult, AnalysisResult } from './index';

export type SimulationState =
  | 'IDLE'
  | 'PARSING'
  | 'VALIDATING'
  | 'FINDING_CONFLICTS'
  | 'BUILDING_GRAPH'
  | 'CHECKING_CYCLE'
  | 'GENERATING_SERIAL_ORDERS'
  | 'VIEW_ANALYSIS'
  | 'CHECKING_VIEW_EQUIVALENCE'
  | 'COMPLETED';

export interface SimulationStep {
  stepIndex: number;
  totalSteps: number;
  state: SimulationState;
  stageName: string;
  title: string;
  description: string;
  activeOp?: Operation;
  comparingOp?: Operation;
  activeConflict?: Conflict;
  visibleEdgeIds: string[];
  activeCycle?: string[];
  activeCandidate?: CandidateResult;
  candidateIndex?: number;
  whyExplanation: string;
}
