import { describe, it, expect } from 'vitest';
import { parseScheduleOps, computeLocalAnalysis, computeLocalComparison } from '../components/WhatIf/whatIfHelper';

describe('What-If Simulator Helper Tests', () => {
  it('parses operations correctly from schedule text', () => {
    const ops = parseScheduleOps('R1(X), W2(X), W1(X)');
    expect(ops).toHaveLength(3);
    expect(ops[0]).toEqual({
      id: 1,
      transaction: 'T1',
      type: 'READ',
      data_item: 'X',
      raw_text: 'R1(X)'
    });
    expect(ops[1]).toEqual({
      id: 2,
      transaction: 'T2',
      type: 'WRITE',
      data_item: 'X',
      raw_text: 'W2(X)'
    });
  });

  it('detects conflicts and cycles accurately for cyclic schedule', () => {
    // R1(X), W2(X), R2(Y), W1(Y) produces cycle T1->T2 on X and T2->T1 on Y
    const res = computeLocalAnalysis('R1(X), W2(X), R2(Y), W1(Y)');
    expect(res.success).toBe(true);
    expect(res.conflicts.length).toBeGreaterThan(0);
    expect(res.has_cycle).toBe(true);
    expect(res.conflict_serializable).toBe(false);
  });

  it('detects acyclic serializable schedule', () => {
    // R1(X), W1(X), R2(X), W2(X) has dependency T1->T2 (acyclic)
    const res = computeLocalAnalysis('R1(X), W1(X), R2(X), W2(X)');
    expect(res.has_cycle).toBe(false);
    expect(res.conflict_serializable).toBe(true);
  });

  it('computes comparison between baseline and experimental schedules', () => {
    const orig = computeLocalAnalysis('R1(X), W2(X), R2(Y), W1(Y)');
    const mod = computeLocalAnalysis('R1(X), W1(X), R2(Y), W2(Y)');
    const comp = computeLocalComparison(orig, mod);

    expect(comp.modified_op_count).toBeGreaterThan(0);
    expect(comp.conflict_diff.orig_conflict_serializable).toBe(false);
    expect(comp.conflict_diff.mod_conflict_serializable).toBe(true);
    expect(comp.conflict_diff.state_change).toBe('IMPROVED');
  });
});
