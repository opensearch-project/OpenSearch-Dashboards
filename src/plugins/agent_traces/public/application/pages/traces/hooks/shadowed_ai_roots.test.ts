/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  aiRootCondition,
  resetAiRootFieldChecks,
  setAiRootFieldPresent,
  shadowedAiRootsOf,
} from '../../../utils/ai_root';
import {
  MARKED_SPANS_LIMIT,
  ensureShadowedAiRootsChecked,
  fetchShadowedAiRoots,
  resetShadowedAiRootChecks,
} from './shadowed_ai_roots';

const dataset = { id: 'ds-1', title: 'otel-v1-apm-span*', type: 'INDEX_PATTERN' } as any;
const source = 'source = otel-v1-apm-span*';
const spans = (...rows: Array<[string, string, string]>) => ({
  schema: [{ name: 'traceId' }, { name: 'spanId' }, { name: 'parentSpanId' }],
  datarows: rows,
});
const ids = (...traceIds: string[]) => ({
  schema: [{ name: 'traceId' }],
  datarows: traceIds.map((id) => [id]),
});

describe('fetchShadowedAiRoots', () => {
  beforeEach(() => {
    resetAiRootFieldChecks();
    resetShadowedAiRootChecks();
    setAiRootFieldPresent('ds-1', true);
  });

  it('hides marked spans of traces that also have a GenAI root', async () => {
    const executeQuery = jest
      .fn()
      .mockResolvedValueOnce(spans(['t-sdk', 'a', 'root'], ['t-http', 'b', 'http']))
      .mockResolvedValueOnce(ids('t-sdk'));

    expect(await fetchShadowedAiRoots({ executeQuery }, dataset, source)).toEqual({
      spanIds: ['a'],
      capped: false,
    });
    expect(executeQuery.mock.calls[0][1]).toBe(
      `source = otel-v1-apm-span* | where \`attributes.derived.gen_ai.is_root\` = true | fields traceId, spanId, parentSpanId | head ${
        MARKED_SPANS_LIMIT + 1
      }`
    );
    expect(executeQuery.mock.calls[1][1]).toContain('traceId in ("t-sdk", "t-http")');
    expect(executeQuery).toHaveBeenCalledTimes(2);
  });

  it('hides a marked span with a marked ancestor, and keeps parallel agents', async () => {
    const executeQuery = jest
      .fn()
      // t1: `outer` marked late above `inner`; t2: two parallel agents.
      .mockResolvedValueOnce(
        spans(['t1', 'outer', 'http'], ['t1', 'inner', 'llm'], ['t2', 'x', 'h2'], ['t2', 'y', 'h2'])
      )
      .mockResolvedValueOnce(ids())
      .mockResolvedValueOnce(
        spans(
          ['t1', 'http', ''],
          ['t1', 'outer', 'http'],
          ['t1', 'llm', 'outer'],
          ['t1', 'inner', 'llm'],
          ['t2', 'h2', ''],
          ['t2', 'x', 'h2'],
          ['t2', 'y', 'h2']
        )
      );

    expect(await fetchShadowedAiRoots({ executeQuery }, dataset, source)).toEqual({
      spanIds: ['inner'],
      capped: false,
    });
    expect(executeQuery.mock.calls[2][1]).toContain('traceId in ("t1", "t2")');
  });

  it('reports a capped lookup', async () => {
    const many = Array.from(
      { length: MARKED_SPANS_LIMIT + 1 },
      (_, i) => [`t${i}`, `s${i}`, ''] as [string, string, string]
    );
    const executeQuery = jest.fn().mockResolvedValueOnce(spans(...many));
    expect((await fetchShadowedAiRoots({ executeQuery }, dataset, source)).capped).toBe(true);
  });
});

describe('ensureShadowedAiRootsChecked', () => {
  beforeEach(() => {
    resetAiRootFieldChecks();
    resetShadowedAiRootChecks();
  });

  it('does nothing until the marker is mapped', async () => {
    const executeQuery = jest.fn();
    await ensureShadowedAiRootsChecked({ executeQuery }, dataset, source, 'now-1h');
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('excludes the shadowed spans from the AI-root condition, looked up once per time range', async () => {
    setAiRootFieldPresent('ds-1', true);
    const executeQuery = jest
      .fn()
      .mockResolvedValue(ids())
      .mockResolvedValueOnce(spans(['t-sdk', 'a', 'root']))
      .mockResolvedValueOnce(ids('t-sdk'));
    const ppl = { executeQuery };

    await Promise.all([
      ensureShadowedAiRootsChecked(ppl, dataset, source, 'now-1h'),
      ensureShadowedAiRootsChecked(ppl, dataset, source, 'now-1h'),
    ]);
    await ensureShadowedAiRootsChecked(ppl, dataset, source, 'now-1h');
    // Without a time range (Sessions), any recent lookup will do.
    await ensureShadowedAiRootsChecked(ppl, dataset, source);
    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(aiRootCondition('ds-1')).toContain('AND NOT spanId in ("a")');

    await ensureShadowedAiRootsChecked(ppl, dataset, source, 'now-24h');
    expect(executeQuery).toHaveBeenCalledTimes(3);
    expect(shadowedAiRootsOf('ds-1').spanIds).toEqual([]);
  });

  it('keeps the last result when a lookup fails', async () => {
    setAiRootFieldPresent('ds-1', true);
    const ppl = { executeQuery: jest.fn().mockRejectedValue(new Error('boom')) };
    await ensureShadowedAiRootsChecked(ppl, dataset, source, 'now-1h');
    expect(shadowedAiRootsOf('ds-1')).toEqual({ spanIds: [], capped: false });
  });
});
