/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLLintContext } from '@osd/monaco';
import type { PrepareExplainQuery } from '@osd/monaco';
import { verifyPerformanceFixOutcome } from './verify_performance_fix_outcome';
import type { PerformanceFixDiagnostic } from './verify_performance_fix_outcome';
import { buildPerformanceFixProbeQueries } from './performance_fix_revalidation';

// The unit under test resolves plans through the SAME explain cache the lint pass
// uses; drive it directly so we can assert both what text it explains and how it
// keys the cache. hasExplainOutcome is stubbed to a simple substring check keyed
// on the isolated treatment text, so the outcome verdict is deterministic.
jest.mock('@osd/monaco/target/ppl/lint/explain/explain_cache', () => ({
  explainCache: { resolveResult: jest.fn() },
}));
jest.mock('@osd/monaco/target/ppl/lint/explain/explain_outcomes', () => ({
  hasExplainOutcome: jest.fn(),
}));
// The probe builder walks the parse tree; that path is covered by
// performance_fix_revalidation.test.ts. Here we only care that the two
// treatments it returns are prepared before they reach the explain cache.
jest.mock('./performance_fix_revalidation', () => ({
  buildPerformanceFixProbeQueries: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { explainCache } = require('@osd/monaco/target/ppl/lint/explain/explain_cache');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { hasExplainOutcome } = require('@osd/monaco/target/ppl/lint/explain/explain_outcomes');

const mockResolveResult = explainCache.resolveResult as jest.Mock;
const mockHasExplainOutcome = hasExplainOutcome as jest.Mock;
const mockBuildProbes = buildPerformanceFixProbeQueries as jest.Mock;

const OK = (plan: unknown) => ({ status: 'ok', plan });

const makeContext = (prepareExplainQuery?: PrepareExplainQuery): PPLLintContext =>
  ({
    http: { post: jest.fn() },
    dataSourceId: 'ds-1',
    prepareExplainQuery,
  }) as unknown as PPLLintContext;

const filterScriptDiagnostic: PerformanceFixDiagnostic = {
  operation: 'filter',
  outcome: 'filter:script',
};

beforeEach(() => {
  mockResolveResult.mockReset();
  mockHasExplainOutcome.mockReset();
  mockBuildProbes.mockReset();
});

describe('verifyPerformanceFixOutcome', () => {
  it('prepares both treatments (source-prepend) before explaining, so source-less probes still explain', async () => {
    // Explore authors source-less queries; the probes are built from raw editor
    // offsets, so without preparation a leading-pipe probe reaches _explain
    // without a `source=` and is rejected — the bug this fix closes.
    const originalTreatment = '| where bytes - 1000 > 5000';
    const fixedTreatment = '| where bytes > 6000';
    mockBuildProbes.mockResolvedValue({ originalTreatment, fixedTreatment });

    const prepare: PrepareExplainQuery = (raw) => ({
      query: `source = logs ${raw}`,
      cacheKey: `source = logs ${raw}`,
    });

    // A source-less body reaching resolveResult is exactly the bug: fail loud.
    mockResolveResult.mockImplementation((_http, query: string) => {
      if (!query.startsWith('source = logs')) {
        return Promise.reject(new Error(`sourceless explain: ${query}`));
      }
      return Promise.resolve(OK({ text: query }));
    });
    // The original still has the scripted filter; the fix clears it.
    mockHasExplainOutcome.mockImplementation((plan: { text: string }) =>
      plan.text.includes('bytes - 1000 > 5000')
    );

    const result = await verifyPerformanceFixOutcome(
      '| where bytes - 1000 > 5000',
      '| where bytes > 6000',
      filterScriptDiagnostic,
      makeContext(prepare),
      () => true
    );

    expect(result).toBe(true);
    // Every explained body carried the prepared (sourced) text.
    for (const call of mockResolveResult.mock.calls) {
      expect(String(call[1])).toMatch(/^source = logs /);
    }
  });

  it('passes the prepared cacheKey through to the explain cache for both treatments', async () => {
    mockBuildProbes.mockResolvedValue({
      originalTreatment: '| where bytes - 1000 > 5000',
      fixedTreatment: '| where bytes > 6000',
    });
    const prepare: PrepareExplainQuery = (raw) => ({
      query: `source = logs ${raw}`,
      cacheKey: `KEY:${raw}`,
    });
    mockResolveResult.mockResolvedValue(OK({ text: 'plan' }));
    mockHasExplainOutcome.mockReturnValueOnce(true).mockReturnValueOnce(false);

    await verifyPerformanceFixOutcome(
      '| where bytes - 1000 > 5000',
      '| where bytes > 6000',
      filterScriptDiagnostic,
      makeContext(prepare),
      () => true
    );

    const originalCall = mockResolveResult.mock.calls.find((c) =>
      String(c[1]).includes('bytes - 1000 > 5000')
    );
    const fixedCall = mockResolveResult.mock.calls.find((c) =>
      String(c[1]).includes('bytes > 6000')
    );
    expect(originalCall?.[3]).toEqual({
      partition: 'probe',
      cacheKey: 'KEY:| where bytes - 1000 > 5000',
    });
    expect(fixedCall?.[3]).toEqual({ partition: 'probe', cacheKey: 'KEY:| where bytes > 6000' });
  });

  it('falls back to explaining the raw text (keyed on itself) when no preparer is registered', async () => {
    const originalTreatment = 'source=logs | where bytes - 1000 > 5000';
    const fixedTreatment = 'source=logs | where bytes > 6000';
    mockBuildProbes.mockResolvedValue({ originalTreatment, fixedTreatment });
    mockResolveResult.mockResolvedValue(OK({ text: 'plan' }));
    mockHasExplainOutcome.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const result = await verifyPerformanceFixOutcome(
      'source=logs | where bytes - 1000 > 5000',
      'source=logs | where bytes > 6000',
      filterScriptDiagnostic,
      makeContext(undefined),
      () => true
    );

    expect(result).toBe(true);
    const originalCall = mockResolveResult.mock.calls.find((c) =>
      String(c[1]).includes('bytes - 1000 > 5000')
    );
    // No preparer: query is explained verbatim and the cacheKey defaults to it.
    expect(originalCall?.[1]).toBe(originalTreatment);
    expect(originalCall?.[3]).toEqual({ partition: 'probe', cacheKey: originalTreatment });
  });

  it('fails safe (over-rejects) when an already-sourced original stays unsupported', async () => {
    // Both probes are prepared identically, so a non-ok result on either side
    // means the comparison cannot confirm the fix — it must NOT accept.
    mockBuildProbes.mockResolvedValue({
      originalTreatment: 'source=logs | where bytes - 1000 > 5000',
      fixedTreatment: 'source=logs | where bytes > 6000',
    });
    mockResolveResult.mockResolvedValue({ status: 'unsupported' });
    mockHasExplainOutcome.mockReturnValue(false);

    const result = await verifyPerformanceFixOutcome(
      'source=logs | where bytes - 1000 > 5000',
      'source=logs | where bytes > 6000',
      filterScriptDiagnostic,
      makeContext((raw) => ({ query: raw, cacheKey: raw })),
      () => true
    );

    expect(result).toBe(false);
  });

  it('short-circuits to true for a non-performance outcome without explaining', async () => {
    const result = await verifyPerformanceFixOutcome(
      'source=logs | where bytes > 1',
      'source=logs | where bytes > 2',
      { operation: 'filter', outcome: 'filter:native' },
      makeContext((raw) => ({ query: raw, cacheKey: raw })),
      () => true
    );
    expect(result).toBe(true);
    expect(mockBuildProbes).not.toHaveBeenCalled();
    expect(mockResolveResult).not.toHaveBeenCalled();
  });
});
