/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  validateCandidateFix,
  tokenOverlap,
  ValidateCandidateDeps,
  CandidateLintFacts,
} from '../validate_candidate_fix';

// A stub lint/shape pair driven by a per-query table so each test controls the
// exact facts the validator sees, with no Monaco/grammar dependency.
function makeDeps(
  table: Record<string, { ruleIds: string[]; syntaxClean?: boolean; shape: string[] }>
): ValidateCandidateDeps {
  return {
    lint: (q: string): CandidateLintFacts => {
      const e = table[q.trim()];
      return e
        ? { ruleIds: e.ruleIds, syntaxClean: e.syntaxClean !== false }
        : { ruleIds: [], syntaxClean: true };
    },
    pipelineShape: (q: string) => table[q.trim()]?.shape ?? [],
  };
}

describe('tokenOverlap', () => {
  it('is 1 when the candidate keeps every original token', () => {
    expect(tokenOverlap('source=a | where x = 1', 'source=a | where x = 2')).toBeCloseTo(
      // 'source','a','where','x' kept; the redacted literal differs — but most kept.
      0.8,
      1
    );
  });

  it('is low when the candidate shares few tokens (regeneration)', () => {
    expect(
      tokenOverlap('source=accounts | where age > 5', 'source=other | stats count()')
    ).toBeLessThan(0.5);
  });

  it('treats an empty original as full overlap', () => {
    expect(tokenOverlap('', 'anything')).toBe(1);
  });
});

describe('validateCandidateFix', () => {
  const original = 'source=accounts | where age = "thirty"';
  const ruleId = 'type-mismatch-numeric';

  it('accepts a minimal repair that clears the diagnostic and preserves shape', () => {
    const candidate = 'source=accounts | where age = 30';
    const deps = makeDeps({
      [original]: { ruleIds: [ruleId], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'whereCommand'] },
    });
    expect(validateCandidateFix(original, candidate, ruleId, deps)).toEqual({ accepted: true });
  });

  it('rejects an empty candidate', () => {
    const deps = makeDeps({});
    expect(validateCandidateFix(original, '   ', ruleId, deps)).toEqual({
      accepted: false,
      reason: 'empty',
    });
  });

  it('rejects a candidate that fails to parse', () => {
    const candidate = 'source=accounts | wherr age = 30';
    const deps = makeDeps({
      [original]: { ruleIds: [ruleId], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: { ruleIds: [], syntaxClean: false, shape: [] },
    });
    expect(validateCandidateFix(original, candidate, ruleId, deps).reason).toBe('syntax-error');
  });

  it('rejects a candidate that still raises the original diagnostic', () => {
    const candidate = 'source=accounts | where age = "still-bad"';
    const deps = makeDeps({
      [original]: { ruleIds: [ruleId], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: { ruleIds: [ruleId], shape: ['searchCommand', 'whereCommand'] },
    });
    expect(validateCandidateFix(original, candidate, ruleId, deps).reason).toBe(
      'diagnostic-not-cleared'
    );
  });

  it('rejects a candidate that introduces a NEW diagnostic', () => {
    const candidate = 'source=accounts | where age = 30 | head 5';
    const deps = makeDeps({
      [original]: { ruleIds: [ruleId], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: {
        ruleIds: ['head-without-sort'],
        shape: ['searchCommand', 'whereCommand', 'headCommand'],
      },
    });
    // New diagnostic check fires before shape (it iterates ruleIds first).
    expect(validateCandidateFix(original, candidate, ruleId, deps).reason).toBe('new-diagnostic');
  });

  it('rejects a candidate that changes the pipeline shape', () => {
    const candidate = 'source=accounts | where age = 30 | stats count()';
    const deps = makeDeps({
      [original]: { ruleIds: [ruleId], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: {
        ruleIds: [],
        shape: ['searchCommand', 'whereCommand', 'statsCommand'],
      },
    });
    expect(validateCandidateFix(original, candidate, ruleId, deps).reason).toBe('shape-changed');
  });

  // The canonical head-without-sort repair inserts a `sort` before `head`; the
  // exact-equality shape check used to reject it as 'shape-changed', which made
  // "Apply to editor" silently no-op for the single most common lint rule.
  it('accepts a fix that inserts a sort (the head-without-sort repair)', () => {
    const headOriginal = 'source=logs | head 10';
    const candidate = 'source=logs | sort @timestamp | head 10';
    const deps = makeDeps({
      [headOriginal]: {
        ruleIds: ['head-without-sort'],
        shape: ['searchCommand', 'headCommand'],
      },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'sortCommand', 'headCommand'] },
    });
    expect(validateCandidateFix(headOriginal, candidate, 'head-without-sort', deps)).toEqual({
      accepted: true,
    });
  });

  // A sort inserted at the front (before search would be invalid PPL, but the
  // guard only cares that every original command survives in order) is fine.
  it('accepts a sort inserted anywhere as long as original commands stay in order', () => {
    const headOriginal = 'source=logs | where status = 500 | head 10';
    const candidate = 'source=logs | where status = 500 | sort @timestamp | head 10';
    const deps = makeDeps({
      [headOriginal]: {
        ruleIds: ['head-without-sort'],
        shape: ['searchCommand', 'whereCommand', 'headCommand'],
      },
      [candidate]: {
        ruleIds: [],
        shape: ['searchCommand', 'whereCommand', 'sortCommand', 'headCommand'],
      },
    });
    expect(validateCandidateFix(headOriginal, candidate, 'head-without-sort', deps)).toEqual({
      accepted: true,
    });
  });

  // Only a row-reordering `sort` may be inserted — a filter/aggregation changes
  // the result contents and must still be rejected.
  it('rejects a fix that inserts a non-sort command (e.g. where)', () => {
    const headOriginal = 'source=logs | head 10';
    const candidate = 'source=logs | where status = 500 | head 10';
    const deps = makeDeps({
      [headOriginal]: {
        ruleIds: ['head-without-sort'],
        shape: ['searchCommand', 'headCommand'],
      },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'whereCommand', 'headCommand'] },
    });
    expect(validateCandidateFix(headOriginal, candidate, 'head-without-sort', deps).reason).toBe(
      'shape-changed'
    );
  });

  // Dropping an original command (a regeneration that loses the user's where)
  // is still caught even though the survivors are in order.
  it('rejects a fix that drops an original command', () => {
    const whereOriginal = 'source=logs | where status = 500 | head 10';
    const candidate = 'source=logs | sort @timestamp | head 10';
    const deps = makeDeps({
      [whereOriginal]: {
        ruleIds: ['head-without-sort'],
        shape: ['searchCommand', 'whereCommand', 'headCommand'],
      },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'sortCommand', 'headCommand'] },
    });
    expect(validateCandidateFix(whereOriginal, candidate, 'head-without-sort', deps).reason).toBe(
      'shape-changed'
    );
  });

  // Reordering original commands (search after head) breaks the subsequence and
  // is rejected.
  it('rejects a fix that reorders original commands', () => {
    const reorderOriginal = 'source=logs | where a = 1 | head 10';
    const candidate = 'source=logs | head 10 | where a = 1';
    const deps = makeDeps({
      [reorderOriginal]: {
        ruleIds: [],
        shape: ['searchCommand', 'whereCommand', 'headCommand'],
      },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'headCommand', 'whereCommand'] },
    });
    expect(validateCandidateFix(reorderOriginal, candidate, 'head-without-sort', deps).reason).toBe(
      'shape-changed'
    );
  });

  it('rejects a whole-query regeneration with the same shape but few shared tokens', () => {
    const candidate = 'source=different | where balance = 99';
    const deps = makeDeps({
      [original]: { ruleIds: [ruleId], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'whereCommand'] },
    });
    expect(validateCandidateFix(original, candidate, ruleId, deps).reason).toBe('low-overlap');
  });

  // Issue 8: operator inversion the lint rules can't see (range operators are
  // excluded from type-mismatch-numeric) and token-overlap/shape are blind to.
  it('rejects a predicate inversion (> → <) that keeps every token and shape', () => {
    const rangeOriginal = 'source=accounts | where age > 5';
    const candidate = 'source=accounts | where age < 5';
    // Both lint clean and share the same shape — only the operator differs, so
    // every prior check passes; the inversion check is the only one that fires.
    const deps = makeDeps({
      [rangeOriginal]: { ruleIds: [], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'whereCommand'] },
    });
    expect(validateCandidateFix(rangeOriginal, candidate, 'head-without-sort', deps).reason).toBe(
      'operator-inverted'
    );
  });

  it('rejects an equality inversion (= → !=)', () => {
    const eqOriginal = 'source=accounts | where state = "CA"';
    const candidate = 'source=accounts | where state != "CA"';
    const deps = makeDeps({
      [eqOriginal]: { ruleIds: [], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'whereCommand'] },
    });
    expect(validateCandidateFix(eqOriginal, candidate, 'head-without-sort', deps).reason).toBe(
      'operator-inverted'
    );
  });

  it('accepts a legitimate repair that does not invert an operator', () => {
    // The classic type-mismatch fix changes the VALUE, not the operator.
    const candidate = 'source=accounts | where age = 30';
    const deps = makeDeps({
      [original]: { ruleIds: [ruleId], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'whereCommand'] },
    });
    expect(validateCandidateFix(original, candidate, ruleId, deps)).toEqual({ accepted: true });
  });

  it('accepts a same-direction boundary tweak (> → >=, not an inversion)', () => {
    const rangeOriginal = 'source=accounts | where age > 5';
    const candidate = 'source=accounts | where age >= 5';
    const deps = makeDeps({
      [rangeOriginal]: { ruleIds: [], shape: ['searchCommand', 'whereCommand'] },
      [candidate]: { ruleIds: [], shape: ['searchCommand', 'whereCommand'] },
    });
    expect(validateCandidateFix(rangeOriginal, candidate, 'head-without-sort', deps)).toEqual({
      accepted: true,
    });
  });
});
