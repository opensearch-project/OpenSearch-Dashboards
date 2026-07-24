/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { explainCache, toExplainPlan } from '../explain_cache';
import type { PPLLintHttpClient } from '../../../lint_bridge';

describe('toExplainPlan', () => {
  it('maps a Calcite rel-tree response to a tree plan', () => {
    const plan = toExplainPlan({
      calcite: { physical: { rels: [{ relOp: 'X' }] }, logical: { rels: [] } },
    });
    expect(plan.isCalcite).toBe(true);
    expect(plan.physicalTree?.rels).toHaveLength(1);
    expect(plan.logicalTree?.rels).toEqual([]);
  });

  it('maps a legacy string-plan response to text fields', () => {
    const plan = toExplainPlan({ calcite: { physical: 'FILTER->...', logical: 'LogicalFilter' } });
    expect(plan.isCalcite).toBe(true);
    expect(plan.physicalText).toBe('FILTER->...');
    expect(plan.logicalText).toBe('LogicalFilter');
  });

  it('maps a non-Calcite v2 shape to an empty (isCalcite:false) plan', () => {
    expect(toExplainPlan({ root: { children: [] } }).isCalcite).toBe(false);
  });

  it('maps an error/string body or null to an empty plan', () => {
    expect(toExplainPlan('some error message').isCalcite).toBe(false);
    expect(toExplainPlan(null).isCalcite).toBe(false);
    expect(toExplainPlan({ calcite: {} }).isCalcite).toBe(false);
  });
});

describe('explainCache', () => {
  beforeEach(() => explainCache.clear());

  const okPlan = { calcite: { physical: { rels: [{ relOp: 'X' }] } } };

  function http(post: jest.Mock): PPLLintHttpClient {
    return { post } as unknown as PPLLintHttpClient;
  }

  it('returns an ok resolution for a Calcite plan and caches it (one network call)', async () => {
    const post = jest.fn().mockResolvedValue(okPlan);
    const first = await explainCache.resolveResult(http(post), 'source=t | head 1', 'ds-1');
    const second = await explainCache.resolveResult(http(post), 'source=t | head 1', 'ds-1');
    expect(first).toEqual({ status: 'ok', plan: expect.objectContaining({ isCalcite: true }) });
    expect(second).toBe(first); // same cached object
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('dedups concurrent in-flight requests for the same key', async () => {
    let resolve!: (v: unknown) => void;
    const post = jest.fn().mockReturnValue(new Promise((r) => (resolve = r)));
    const p1 = explainCache.resolveResult(http(post), 'q', 'ds-1');
    const p2 = explainCache.resolveResult(http(post), 'q', 'ds-1');
    resolve(okPlan);
    await Promise.all([p1, p2]);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('returns unsupported for a non-Calcite response', async () => {
    const post = jest.fn().mockResolvedValue({ root: {} });
    expect(await explainCache.resolveResult(http(post), 'q', 'ds-1')).toEqual({
      status: 'unsupported',
    });
  });

  it('returns an error resolution and does not cache it (retries next time)', async () => {
    const post = jest.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(okPlan);
    const first = await explainCache.resolveResult(http(post), 'q', 'ds-1');
    expect(first.status).toBe('error');
    const second = await explainCache.resolveResult(http(post), 'q', 'ds-1');
    expect(second.status).toBe('ok'); // not poisoned by the earlier failure
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('keys by (dataSourceId, query) so different sources do not collide', async () => {
    const post = jest.fn().mockResolvedValue(okPlan);
    await explainCache.resolveResult(http(post), 'q', 'ds-1');
    await explainCache.resolveResult(http(post), 'q', 'ds-2');
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('caches baseline and probe partitions independently for the same text', async () => {
    const post = jest.fn().mockResolvedValue(okPlan);
    await explainCache.resolveResult(http(post), 'q', 'ds-1');
    await explainCache.resolveResult(http(post), 'q', 'ds-1'); // baseline cache hit
    await explainCache.resolveResult(http(post), 'q', 'ds-1', { partition: 'probe' });
    await explainCache.resolveResult(http(post), 'q', 'ds-1', { partition: 'probe' }); // probe hit
    // One call per partition: the two partitions never share an entry.
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('forwards an abort signal to the http client', async () => {
    const post = jest.fn().mockResolvedValue(okPlan);
    const signal = new AbortController().signal;
    await explainCache.resolveResult(http(post), 'q', 'ds-1', { partition: 'probe', signal });
    expect(post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal }));
  });
});
