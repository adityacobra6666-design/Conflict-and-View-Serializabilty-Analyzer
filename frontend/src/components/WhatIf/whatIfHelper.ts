import { AnalysisResult, Operation, Conflict, PrecedenceGraph, GraphNode, GraphEdge } from '../../types';
import { WhatIfComparisonResult, OpDiff } from '../../types/whatif';

export function parseScheduleOps(scheduleText: string): Operation[] {
  if (!scheduleText || !scheduleText.trim()) return [];
  const regex = /([rwRW])\s*(\d+)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/g;
  const ops: Operation[] = [];
  let match;
  let id = 1;
  while ((match = regex.exec(scheduleText)) !== null) {
    const typeChar = match[1].toUpperCase();
    const txNum = match[2];
    const dataItem = match[3].toUpperCase();
    ops.push({
      id: id++,
      transaction: `T${txNum}`,
      type: typeChar === 'R' ? 'READ' : 'WRITE',
      data_item: dataItem,
      raw_text: `${typeChar}${txNum}(${dataItem})`
    });
  }
  return ops;
}

export function computeLocalAnalysis(scheduleText: string): AnalysisResult {
  const operations = parseScheduleOps(scheduleText);
  const txSet = new Set<string>();
  operations.forEach(op => txSet.add(op.transaction));
  const transaction_list = Array.from(txSet).sort();

  const conflicts: Conflict[] = [];
  const edgeMap = new Map<string, { source: string; target: string; items: Set<string>; types: Set<string>; confs: Conflict[] }>();

  for (let i = 0; i < operations.length; i++) {
    for (let j = i + 1; j < operations.length; j++) {
      const op1 = operations[i];
      const op2 = operations[j];

      if (op1.transaction !== op2.transaction && op1.data_item === op2.data_item) {
        if (op1.type === 'WRITE' || op2.type === 'WRITE') {
          const cType = op1.type === 'READ' ? 'READ-WRITE' : op2.type === 'READ' ? 'WRITE-READ' : 'WRITE-WRITE';
          const conf: Conflict = {
            op1_id: op1.id,
            op1_raw: op1.raw_text,
            op1_tx: op1.transaction,
            op1_type: op1.type,
            op2_id: op2.id,
            op2_raw: op2.raw_text,
            op2_tx: op2.transaction,
            op2_type: op2.type,
            data_item: op1.data_item,
            conflict_type: cType,
            from_tx: op1.transaction,
            to_tx: op2.transaction,
            description: `${op1.raw_text} before ${op2.raw_text} on ${op1.data_item}`
          };
          conflicts.push(conf);

          const edgeKey = `${op1.transaction}->${op2.transaction}`;
          if (!edgeMap.has(edgeKey)) {
            edgeMap.set(edgeKey, {
              source: op1.transaction,
              target: op2.transaction,
              items: new Set(),
              types: new Set(),
              confs: []
            });
          }
          const e = edgeMap.get(edgeKey)!;
          e.items.add(op1.data_item);
          e.types.add(cType);
          e.confs.push(conf);
        }
      }
    }
  }

  const nodes: GraphNode[] = transaction_list.map(tx => ({ data: { id: tx, label: tx } }));
  const edges: GraphEdge[] = Array.from(edgeMap.values()).map((e) => ({
    data: {
      id: `e_${e.source}_${e.target}`,
      source: e.source,
      target: e.target,
      label: `${e.source} → ${e.target}`,
      conflict_types: Array.from(e.types),
      data_items: Array.from(e.items),
      conflicts: e.confs,
      explanation: `Dependency ${e.source} → ${e.target} due to conflict on ${Array.from(e.items).join(', ')}`
    }
  }));

  const precedence_graph: PrecedenceGraph = {
    nodes,
    edges,
    transaction_list,
    edge_count: edges.length,
    node_count: nodes.length
  };

  // DFS Cycle Detection
  const adj = new Map<string, string[]>();
  transaction_list.forEach(tx => adj.set(tx, []));
  edges.forEach(e => {
    adj.get(e.data.source)?.push(e.data.target);
  });

  let has_cycle = false;
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(curr: string) {
    visited.add(curr);
    recStack.add(curr);
    path.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const nxt of neighbors) {
      if (!visited.has(nxt)) {
        dfs(nxt);
      } else if (recStack.has(nxt)) {
        has_cycle = true;
        const cycleStartIndex = path.indexOf(nxt);
        if (cycleStartIndex !== -1) {
          const cyclePath = path.slice(cycleStartIndex);
          cyclePath.push(nxt);
          cycles.push(cyclePath);
        }
      }
    }

    path.pop();
    recStack.delete(curr);
  }

  transaction_list.forEach(tx => {
    if (!visited.has(tx)) {
      dfs(tx);
    }
  });

  const conflict_serializable = !has_cycle;

  return {
    success: true,
    schedule_text: scheduleText,
    operations,
    transactions: transaction_list,
    data_items: Array.from(new Set(operations.map(o => o.data_item))),
    operation_count: operations.length,
    conflicts,
    conflict_count: conflicts.length,
    precedence_graph,
    has_cycle,
    cycles,
    formatted_cycles: cycles.map(c => c.join(' → ')),
    conflict_serializable,
    formatted_topological_orders: conflict_serializable ? [transaction_list.join(' → ')] : [],
    topological_orders: conflict_serializable ? [transaction_list] : [],
    view_serializable: conflict_serializable,
    view_analysis: {
      view_serializable: conflict_serializable,
      initial_reads: [],
      reads_from: [],
      final_writes: [],
      equivalent_orders: conflict_serializable ? [transaction_list.join(' → ')] : [],
      candidate_orders_count: 1,
      candidate_results: []
    },
    transaction_count: transaction_list.length,
    combined_result: {
      state_code: conflict_serializable ? 'BOTH_SERIALIZABLE' : 'NEITHER_SERIALIZABLE',
      headline: conflict_serializable ? 'Both Conflict & View Serializable' : 'Not Conflict Serializable',
      summary: conflict_serializable ? 'The schedule is conflict serializable.' : 'The schedule contains a cycle.',
      conflict_serializable,
      view_serializable: conflict_serializable,
      is_special_case: false
    }
  };
}

export function computeLocalComparison(orig: AnalysisResult, mod: AnalysisResult): WhatIfComparisonResult {
  const origOps = orig.operations || [];
  const modOps = mod.operations || [];
  const maxLen = Math.max(origOps.length, modOps.length);
  const diffs: OpDiff[] = [];
  let modified_op_count = 0;

  for (let i = 0; i < maxLen; i++) {
    const o = origOps[i];
    const m = modOps[i];
    if (o && m) {
      if (o.raw_text !== m.raw_text) {
        diffs.push({
          position: i + 1,
          change_type: 'MODIFIED',
          orig_raw: o.raw_text,
          mod_raw: m.raw_text,
          description: `Operation #${i + 1} changed from ${o.raw_text} to ${m.raw_text}`
        });
        modified_op_count++;
      } else {
        diffs.push({
          position: i + 1,
          change_type: 'UNCHANGED',
          orig_raw: o.raw_text,
          mod_raw: m.raw_text,
          description: `Operation #${i + 1} (${o.raw_text}) is unchanged`
        });
      }
    } else if (m) {
      diffs.push({
        position: i + 1,
        change_type: 'ADDED',
        orig_raw: null,
        mod_raw: m.raw_text,
        description: `Added operation ${m.raw_text}`
      });
      modified_op_count++;
    } else if (o) {
      diffs.push({
        position: i + 1,
        change_type: 'REMOVED',
        orig_raw: o.raw_text,
        mod_raw: null,
        description: `Removed operation ${o.raw_text}`
      });
      modified_op_count++;
    }
  }

  const origEdges = orig.precedence_graph?.edges || [];
  const modEdges = mod.precedence_graph?.edges || [];

  const origEdgeKeys = new Set(origEdges.map(e => `${e.data.source}->${e.data.target}`));
  const modEdgeKeys = new Set(modEdges.map(e => `${e.data.source}->${e.data.target}`));

  const unchangedEdges = modEdges.filter(e => origEdgeKeys.has(`${e.data.source}->${e.data.target}`)).map(e => ({
    source: e.data.source,
    target: e.data.target,
    label: `${e.data.source} → ${e.data.target}`,
    details: e.data.explanation || ''
  }));

  const addedEdges = modEdges.filter(e => !origEdgeKeys.has(`${e.data.source}->${e.data.target}`)).map(e => ({
    source: e.data.source,
    target: e.data.target,
    label: `${e.data.source} → ${e.data.target}`,
    details: e.data.explanation || ''
  }));

  const removedEdges = origEdges.filter(e => !modEdgeKeys.has(`${e.data.source}->${e.data.target}`)).map(e => ({
    source: e.data.source,
    target: e.data.target,
    label: `${e.data.source} → ${e.data.target}`,
    details: e.data.explanation || ''
  }));

  const conflictStateChange =
    orig.conflict_serializable === mod.conflict_serializable
      ? 'UNCHANGED'
      : mod.conflict_serializable
      ? 'IMPROVED'
      : 'DEGRADED';

  const viewStateChange =
    orig.view_serializable === mod.view_serializable
      ? 'UNCHANGED'
      : mod.view_serializable
      ? 'IMPROVED'
      : 'DEGRADED';

  const cycleStateChange =
    orig.has_cycle === mod.has_cycle
      ? 'UNCHANGED'
      : mod.has_cycle
      ? 'APPEARED'
      : 'DISAPPEARED';

  let explanation = 'Experimental schedule modification analysis complete.';
  if (modified_op_count > 0) {
    const changedOpsStr = diffs.filter(d => d.change_type !== 'UNCHANGED').map(d => d.description).join('; ');
    explanation = `Schedule modified (${changedOpsStr}). `;
    if (conflictStateChange === 'IMPROVED') {
      explanation += 'Conflict serializability IMPROVED from NOT SERIALIZABLE to SERIALIZABLE by removing cycle-creating dependencies.';
    } else if (conflictStateChange === 'DEGRADED') {
      explanation += 'Conflict serializability DEGRADED from SERIALIZABLE to NOT SERIALIZABLE due to introduced precedence graph cycle.';
    } else {
      explanation += `Conflict serializability remains ${mod.conflict_serializable ? 'SERIALIZABLE' : 'NOT SERIALIZABLE'}.`;
    }
  }

  return {
    schedule_diffs: diffs,
    modified_op_count,
    graph_diff: {
      unchanged: unchangedEdges,
      added: addedEdges,
      removed: removedEdges,
      unchanged_count: unchangedEdges.length,
      added_count: addedEdges.length,
      removed_count: removedEdges.length
    },
    conflict_diff: {
      orig_conflict_serializable: orig.conflict_serializable,
      mod_conflict_serializable: mod.conflict_serializable,
      state_change: conflictStateChange,
      orig_conflict_count: orig.conflict_count,
      mod_conflict_count: mod.conflict_count
    },
    cycle_diff: {
      orig_has_cycle: orig.has_cycle,
      mod_has_cycle: mod.has_cycle,
      orig_cycles: orig.formatted_cycles || [],
      mod_cycles: mod.formatted_cycles || [],
      state_change: cycleStateChange
    },
    view_diff: {
      orig_view_serializable: orig.view_serializable,
      mod_view_serializable: mod.view_serializable,
      state_change: viewStateChange,
      orig_equivalent_orders: orig.view_analysis?.equivalent_orders || [],
      mod_equivalent_orders: mod.view_analysis?.equivalent_orders || []
    },
    explanation
  };
}
