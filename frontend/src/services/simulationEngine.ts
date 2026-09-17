import { AnalysisResult, Operation, Conflict, CandidateResult } from '../types';
import { SimulationStep, SimulationState } from '../types/simulation';

export function generateSimulationSteps(analysis: AnalysisResult): SimulationStep[] {
  const steps: Omit<SimulationStep, 'stepIndex' | 'totalSteps'>[] = [];

  const ops = analysis.operations || [];
  const conflicts = analysis.conflicts || [];
  const edges = analysis.precedence_graph?.edges || [];
  const cycles = analysis.cycles || [];
  const viewInfo = analysis.view_analysis;
  const candidates = viewInfo?.candidate_results || [];

  // Step 1: Parsing
  steps.push({
    state: 'PARSING',
    stageName: 'Stage 1: Parsing Schedule',
    title: 'Parsing Operations & Tokens',
    description: `Parsed ${ops.length} operation(s) across ${analysis.transaction_count} transaction(s).`,
    visibleEdgeIds: [],
    whyExplanation: 'Schedule parsing normalizes operation syntaxes (e.g. R1(X), W2(Y)) into structured data items and transaction tokens.'
  });

  // Step 2: Validation
  steps.push({
    state: 'VALIDATING',
    stageName: 'Stage 2: Schedule Validation',
    title: 'Validating Transactions & Items',
    description: `Verified ${analysis.transaction_count} transaction(s) (${analysis.transactions.join(', ')}) and data item(s) (${analysis.data_items.join(', ')}).`,
    visibleEdgeIds: [],
    whyExplanation: 'Validation checks syntax structure, transaction identifiers, and enforces safety bounds on transaction counts.'
  });

  // Step 3: Conflict Pair Scanning (Animate each detected conflict)
  const currentVisibleEdgeIds: string[] = [];

  if (conflicts.length === 0) {
    steps.push({
      state: 'FINDING_CONFLICTS',
      stageName: 'Stage 3: Conflict Scanning',
      title: 'Scanning Operation Pairs for Conflicts',
      description: 'Zero conflicting operation pairs were detected across transactions.',
      visibleEdgeIds: [],
      whyExplanation: 'Two operations conflict if they belong to different transactions, access the same data item, and at least one is a WRITE. No such pair exists here.'
    });
  } else {
    conflicts.forEach((c) => {
      // Find matching edge ID in graph
      const edge = edges.find(e => e.data.source === c.from_tx && e.data.target === c.to_tx);
      if (edge && !currentVisibleEdgeIds.includes(edge.data.id)) {
        currentVisibleEdgeIds.push(edge.data.id);
      }

      const op1 = ops.find(o => o.id === c.op1_id);
      const op2 = ops.find(o => o.id === c.op2_id);

      steps.push({
        state: 'FINDING_CONFLICTS',
        stageName: 'Stage 3: Conflict Pair Detected',
        title: `Conflict Pair: ${c.op1_raw} vs ${c.op2_raw}`,
        description: `Conflict detected on item ${c.data_item} (${c.conflict_type}). Precedence Edge ${c.from_tx} → ${c.to_tx} created.`,
        activeOp: op1,
        comparingOp: op2,
        activeConflict: c,
        visibleEdgeIds: [...currentVisibleEdgeIds],
        whyExplanation: `${c.op1_raw} and ${c.op2_raw} conflict because they access the same data item (${c.data_item}), belong to different transactions (${c.from_tx} and ${c.to_tx}), and ${c.op1_type === 'WRITE' || c.op2_type === 'WRITE' ? 'at least one operation is a WRITE' : 'a write dependency exists'}.`
      });
    });
  }

  // Step 4: Precedence Graph Built
  steps.push({
    state: 'BUILDING_GRAPH',
    stageName: 'Stage 4: Precedence Graph Complete',
    title: 'Constructed Serialization Graph',
    description: `Precedence graph contains ${analysis.transaction_count} nodes and ${currentVisibleEdgeIds.length} directed edge(s).`,
    visibleEdgeIds: [...currentVisibleEdgeIds],
    whyExplanation: 'The precedence graph represents directed execution constraints. Edge Ti → Tj forces Ti to complete before Tj in any conflict-equivalent serial schedule.'
  });

  // Step 5: Cycle Detection
  if (analysis.has_cycle) {
    const cycleStr = analysis.formatted_cycles.join(', ');
    steps.push({
      state: 'CHECKING_CYCLE',
      stageName: 'Stage 5: Directed Cycle Detected!',
      title: `Precedence Cycle Detected: ${cycleStr}`,
      description: `Graph contains circular dependency: ${cycleStr}. Conflict Serializability: NO.`,
      activeCycle: cycles[0] || [],
      visibleEdgeIds: [...currentVisibleEdgeIds],
      whyExplanation: `A directed cycle (${cycleStr}) means no topological ordering can satisfy all precedence constraints simultaneously.`
    });
  } else {
    steps.push({
      state: 'CHECKING_CYCLE',
      stageName: 'Stage 5: Checking Graph Cycles',
      title: 'Acyclic Precedence Graph Verified',
      description: 'Zero directed cycles found in the precedence graph. Conflict Serializability: YES.',
      visibleEdgeIds: [...currentVisibleEdgeIds],
      whyExplanation: 'Because the precedence graph contains no directed cycles, topological sorting can produce valid serial transaction orderings.'
    });
  }

  // Step 6: View Analysis - Initial Reads & Reads-From
  steps.push({
    state: 'VIEW_ANALYSIS',
    stageName: 'Stage 6: View Serializability Pipeline',
    title: 'Analyzing Initial Reads & Reads-From Dependencies',
    description: `Found ${viewInfo?.initial_reads.length || 0} initial read(s), ${viewInfo?.reads_from.length || 0} reads-from relationship(s), and ${viewInfo?.final_writes.length || 0} final write(s).`,
    visibleEdgeIds: [...currentVisibleEdgeIds],
    whyExplanation: 'View serializability checks whether candidate serial orders preserve initial reads, reads-from relationships, and final writes.'
  });

  // Step 7: Candidate Serial Orders Evaluation
  if (candidates.length > 0) {
    candidates.slice(0, 6).forEach((cand, idx) => {
      steps.push({
        state: 'CHECKING_VIEW_EQUIVALENCE',
        stageName: `Stage 7: Testing Candidate Order ${idx + 1}/${candidates.length}`,
        title: `Testing Order: ${cand.formatted_order}`,
        description: cand.is_equivalent
          ? `✓ Candidate ${cand.formatted_order} is View Equivalent! All initial reads, reads-from, and final writes match.`
          : `✕ Candidate ${cand.formatted_order} failed equivalence check (${!cand.match_initial_reads ? 'Initial Reads Mismatch' : !cand.match_reads_from ? 'Reads-From Mismatch' : 'Final Writes Mismatch'}).`,
        activeCandidate: cand,
        candidateIndex: idx + 1,
        visibleEdgeIds: [...currentVisibleEdgeIds],
        whyExplanation: `Testing serial order ${cand.formatted_order}: Initial Reads match=${cand.match_initial_reads ? 'YES' : 'NO'}, Reads-From match=${cand.match_reads_from ? 'YES' : 'NO'}, Final Writes match=${cand.match_final_writes ? 'YES' : 'NO'}.`
      });
    });
  }

  // Step 8: Completion Reveal
  const combined = analysis.combined_result;
  steps.push({
    state: 'COMPLETED',
    stageName: 'Stage 8: Simulation Complete',
    title: combined.headline,
    description: combined.summary,
    visibleEdgeIds: [...currentVisibleEdgeIds],
    whyExplanation: 'Analysis finished. Both Conflict and View serializability criteria have been verified using authoritative backend calculations.'
  });

  // Attach stepIndex and totalSteps to all steps
  const total = steps.length;
  return steps.map((s, idx) => ({
    ...s,
    stepIndex: idx,
    totalSteps: total
  }));
}
