/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type FailureClass =
  | 'silent-null'
  | 'silent-empty'
  | 'engine-throw'
  | 'nondeterministic'
  | 'fallback'
  | 'advisory'
  // query returns correct results, but on a slower execution path (a coordinator
  // fallback or a per-document script); the cost grows with index size.
  | 'slow-path';

export interface RuleHoverContent {
  engineBehavior: string;
  failureClass: FailureClass;
  safeToIgnoreWhen?: string;
  verifiedVersion?: string;
}

export const ENGINE_OUTCOMES: Record<string, RuleHoverContent> = {
  'head-without-sort': {
    engineBehavior:
      'Without sort, head picks rows based on shard layout and segment order — re-running the same query can return different rows.',
    failureClass: 'nondeterministic',
    safeToIgnoreWhen: 'you only need any N rows as a sample and row order does not matter.',
  },
  'division-by-zero': {
    engineBehavior:
      'x / 0 and x % 0 produce null (not an error) and the null propagates silently through downstream eval and stats expressions.',
    failureClass: 'silent-null',
    verifiedVersion: '3.7',
    safeToIgnoreWhen:
      'null propagation is intentional and handled downstream (e.g. coalesce(expr, 0)).',
  },
  'invalid-capture-group-name': {
    engineBehavior:
      'rex capture-group names must match the Java group-name rule; underscores and leading digits are rejected when the regex runs.',
    failureClass: 'engine-throw',
  },
  'operation-not-pushed': {
    engineBehavior:
      "OpenSearch can't evaluate this operation on the data nodes, so it fetches the matching rows to the coordinator and finishes the work there — filters and sorts run after a full scan, aggregations run in memory.",
    failureClass: 'slow-path',
    safeToIgnoreWhen:
      'the number of rows reaching this operation is small, so the extra coordinator pass is negligible.',
  },
  'operation-pushed-as-script': {
    engineBehavior:
      'OpenSearch compiles a small Painless script and runs it per document instead of using the index directly, so the cost scales with the number of documents scanned.',
    failureClass: 'slow-path',
    safeToIgnoreWhen:
      'the query already matches few documents, so running the script per document is cheap.',
  },
};

export function getRuleHoverContent(ruleId: string): RuleHoverContent | undefined {
  return ENGINE_OUTCOMES[ruleId];
}
