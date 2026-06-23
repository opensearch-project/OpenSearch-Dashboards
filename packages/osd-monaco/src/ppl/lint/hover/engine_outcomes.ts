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
  | 'advisory';

export interface RuleHoverContent {
  engineBehavior: string;
  failureClass: FailureClass;
  safeToIgnoreWhen?: string;
  verifiedVersion?: string;
}

export const ENGINE_OUTCOMES: Record<string, RuleHoverContent> = {
  'head-without-sort': {
    engineBehavior:
      'head with no preceding sort returns nondeterministic rows: the set depends on shard assignment and segment order, and can change between identical re-runs.',
    failureClass: 'nondeterministic',
    safeToIgnoreWhen:
      'you only need any N rows (a sample), not the top N — and row order does not matter.',
  },
  'division-by-zero': {
    engineBehavior:
      'x / 0 evaluates to null (HTTP 200, result [[null]], type double) with no error — the null then propagates through downstream eval/stats.',
    failureClass: 'silent-null',
    verifiedVersion: '3.7',
    safeToIgnoreWhen:
      'null propagation is intentional and handled downstream (e.g. with coalesce(...)).',
  },
};

export function getRuleHoverContent(ruleId: string): RuleHoverContent | undefined {
  return ENGINE_OUTCOMES[ruleId];
}
