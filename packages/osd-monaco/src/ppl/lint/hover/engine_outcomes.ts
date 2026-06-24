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
      'Without sort, head picks rows based on shard layout and segment order — re-running the same query can return different rows.',
    failureClass: 'nondeterministic',
    safeToIgnoreWhen: 'you only need any N rows as a sample and row order does not matter.',
  },
  'division-by-zero': {
    engineBehavior:
      'x / 0 produces null (not an error) and the null propagates silently through downstream eval and stats expressions.',
    failureClass: 'silent-null',
    verifiedVersion: '3.7',
    safeToIgnoreWhen:
      'null propagation is intentional and handled downstream (e.g. coalesce(expr, 0)).',
  },
};

export function getRuleHoverContent(ruleId: string): RuleHoverContent | undefined {
  return ENGINE_OUTCOMES[ruleId];
}
