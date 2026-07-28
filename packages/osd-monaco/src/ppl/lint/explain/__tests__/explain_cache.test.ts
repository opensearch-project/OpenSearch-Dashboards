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

  it('does not cache unsupported, so enabling Calcite is picked up', async () => {
    // `unsupported` reflects the cluster's engine settings, not the query, and
    // nothing in production invalidates this cache when an administrator toggles
    // Calcite — so caching it would pin the verdict for the whole session.
    const post = jest.fn().mockResolvedValueOnce({ root: {} }).mockResolvedValueOnce(okPlan);

    expect((await explainCache.resolveResult(http(post), 'q', 'ds-1')).status).toBe('unsupported');
    expect((await explainCache.resolveResult(http(post), 'q', 'ds-1')).status).toBe('ok');
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('still deduplicates concurrent requests that resolve to unsupported', async () => {
    // Not caching the verdict must not cost in-flight deduplication: several
    // passes over the same text within one window still make one request.
    let resolve!: (value: unknown) => void;
    const post = jest.fn().mockReturnValue(new Promise((r) => (resolve = r)));

    const first = explainCache.resolveResult(http(post), 'q', 'ds-1');
    const second = explainCache.resolveResult(http(post), 'q', 'ds-1');
    resolve({ root: {} });

    expect((await first).status).toBe('unsupported');
    expect((await second).status).toBe('unsupported');
    expect(post).toHaveBeenCalledTimes(1);
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

  describe('abort refcounting', () => {
    it('aborts the underlying request when the only subscriber aborts', async () => {
      let fetchSignal: AbortSignal | undefined;
      const post = jest.fn((_path: string, request: { signal?: AbortSignal }) => {
        fetchSignal = request.signal;
        return new Promise(() => {}); // never settles on its own
      });
      const caller = new AbortController();
      const result = explainCache.resolveResult(http(post as any), 'q', 'ds-1', {
        partition: 'probe',
        signal: caller.signal,
      });

      expect(fetchSignal?.aborted).toBe(false);
      caller.abort();
      expect(fetchSignal?.aborted).toBe(true);
      expect((await result).status).toBe('error');
    });

    it("one subscriber's abort does not destroy a co-subscriber's response", async () => {
      // Realistic trigger: a remounted editor joins the in-flight request, then
      // the old model's dispose aborts its own controller. The survivor must
      // still get the plan.
      let fetchSignal: AbortSignal | undefined;
      let resolveFetch!: (v: unknown) => void;
      const post = jest.fn((_path: string, request: { signal?: AbortSignal }) => {
        fetchSignal = request.signal;
        return new Promise((r) => (resolveFetch = r));
      });
      const first = new AbortController();
      const p1 = explainCache.resolveResult(http(post as any), 'q', 'ds-1', {
        signal: first.signal,
      });
      const second = new AbortController();
      const p2 = explainCache.resolveResult(http(post as any), 'q', 'ds-1', {
        signal: second.signal,
      });
      expect(post).toHaveBeenCalledTimes(1);

      first.abort();
      // The aborting caller gets an immediate error; the fetch stays alive for
      // the co-subscriber.
      expect((await p1).status).toBe('error');
      expect(fetchSignal?.aborted).toBe(false);

      resolveFetch(okPlan);
      expect((await p2).status).toBe('ok');
    });

    it('a signal-less subscriber pins the request open across a co-subscriber abort', async () => {
      let fetchSignal: AbortSignal | undefined;
      let resolveFetch!: (v: unknown) => void;
      const post = jest.fn((_path: string, request: { signal?: AbortSignal }) => {
        fetchSignal = request.signal;
        return new Promise((r) => (resolveFetch = r));
      });
      const pinned = explainCache.resolveResult(http(post as any), 'q', 'ds-1');
      const aborting = new AbortController();
      const cancelled = explainCache.resolveResult(http(post as any), 'q', 'ds-1', {
        signal: aborting.signal,
      });

      aborting.abort();
      expect((await cancelled).status).toBe('error');
      expect(fetchSignal?.aborted).toBe(false);

      resolveFetch(okPlan);
      expect((await pinned).status).toBe('ok');
    });

    it('an already-aborted signal returns an error without joining or fetching alone', async () => {
      const post = jest.fn().mockResolvedValue(okPlan);
      const aborted = new AbortController();
      aborted.abort();
      const result = await explainCache.resolveResult(http(post), 'q-solo', 'ds-1', {
        signal: aborted.signal,
      });
      expect(result.status).toBe('error');
    });

    it('all subscribers aborting cancels the fetch; a later pass retries cleanly', async () => {
      let fetchSignal: AbortSignal | undefined;
      const post = jest
        .fn()
        .mockImplementationOnce((_path: string, request: { signal?: AbortSignal }) => {
          fetchSignal = request.signal;
          return new Promise((_, reject) => {
            request.signal?.addEventListener('abort', () => reject(new Error('aborted by client')));
          });
        })
        .mockResolvedValueOnce(okPlan);
      const a = new AbortController();
      const b = new AbortController();
      const p1 = explainCache.resolveResult(http(post as any), 'q', 'ds-1', { signal: a.signal });
      const p2 = explainCache.resolveResult(http(post as any), 'q', 'ds-1', { signal: b.signal });

      a.abort();
      expect(fetchSignal?.aborted).toBe(false);
      b.abort();
      expect(fetchSignal?.aborted).toBe(true);
      expect((await p1).status).toBe('error');
      expect((await p2).status).toBe('error');

      // The aborted attempt was never cached; the next pass re-fetches.
      expect((await explainCache.resolveResult(http(post as any), 'q', 'ds-1')).status).toBe('ok');
      expect(post).toHaveBeenCalledTimes(2);
    });
  });
});
