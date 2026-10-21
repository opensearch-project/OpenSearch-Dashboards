/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resetAiRootFieldChecks, setAiRootFieldPresent } from '../../../utils/ai_root';
import {
  COUNTS_EXCLUSION_LIMIT,
  LOOKUP_TRACES_LIMIT,
  nestedAiRunsAmong,
  shadowedAiRootsExclusion,
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
const link = (traceId: string, spanId: string, parentSpanId = '') => ({
  traceId,
  spanId,
  parentSpanId,
});

describe('nestedAiRunsAmong', () => {
  it('looks nothing up when no trace is listed twice', async () => {
    const executeQuery = jest.fn();
    const nested = await nestedAiRunsAmong({ executeQuery }, dataset, source, [
      link('t1', 'a', 'http'),
      link('t2', 'b', 'http'),
    ]);
    expect(nested.size).toBe(0);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('drops a run nested in another listed run, and keeps parallel agents', async () => {
    const executeQuery = jest.fn().mockResolvedValue(
      spans(
        // t1: `inner` was marked under `outer` (late parent); t2: two parallel agents.
        ['t1', 'http', ''],
        ['t1', 'outer', 'http'],
        ['t1', 'llm', 'outer'],
        ['t1', 'inner', 'llm'],
        ['t2', 'h2', ''],
        ['t2', 'x', 'h2'],
        ['t2', 'y', 'h2']
      )
    );
    const nested = await nestedAiRunsAmong({ executeQuery }, dataset, source, [
      link('t1', 'outer', 'http'),
      link('t1', 'inner', 'llm'),
      link('t2', 'x', 'h2'),
      link('t2', 'y', 'h2'),
    ]);
    expect([...nested]).toEqual(['inner']);
    const [usedDataset, query] = executeQuery.mock.calls[0];
    // The chains are read whatever the picked time range.
    expect(usedDataset).not.toHaveProperty('timeFieldName');
    expect(query).toContain('traceId in ("t1", "t2")');
  });

  it('keeps a nested run when the run above it is not among the rows', async () => {
    const executeQuery = jest
      .fn()
      .mockResolvedValue(
        spans(['t1', 'outer', 'http'], ['t1', 'inner', 'outer'], ['t1', 'x', 'http'])
      );
    // A filter matched `inner` and a parallel `x`, but not `outer`.
    const nested = await nestedAiRunsAmong({ executeQuery }, dataset, source, [
      link('t1', 'inner', 'outer'),
      link('t1', 'x', 'http'),
    ]);
    expect(nested.size).toBe(0);
  });

  it(`looks up at most ${LOOKUP_TRACES_LIMIT} traces`, async () => {
    const executeQuery = jest.fn().mockResolvedValue(spans());
    const rows = Array.from({ length: LOOKUP_TRACES_LIMIT + 10 }, (_, i) => [
      link(`t${i}`, 'a'),
      link(`t${i}`, 'b'),
    ]).flat();
    await nestedAiRunsAmong({ executeQuery }, dataset, source, rows);
    expect(executeQuery.mock.calls[0][1].match(/"t\d+"/g)).toHaveLength(LOOKUP_TRACES_LIMIT);
  });
});

describe('shadowedAiRootsExclusion', () => {
  beforeEach(() => resetAiRootFieldChecks());

  it('does nothing until the marker is mapped', async () => {
    const executeQuery = jest.fn();
    expect(await shadowedAiRootsExclusion({ executeQuery }, dataset, source)).toEqual({
      clause: '',
      capped: false,
    });
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('excludes marked spans under a GenAI root and marked spans under another marked span', async () => {
    setAiRootFieldPresent('ds-1', true);
    const executeQuery = jest
      .fn()
      // Traces with a marked span below the root, and those of them with a GenAI root.
      .mockResolvedValueOnce(ids('t-sdk', 't-late'))
      .mockResolvedValueOnce(ids('t-sdk'))
      // Traces with several marked spans, their marked spans, and their chains.
      .mockResolvedValueOnce(ids('t-sdk', 't-late'))
      .mockResolvedValueOnce(spans(['t-late', 'outer', 'http'], ['t-late', 'inner', 'llm']))
      .mockResolvedValueOnce(
        spans(
          ['t-late', 'http', ''],
          ['t-late', 'outer', 'http'],
          ['t-late', 'llm', 'outer'],
          ['t-late', 'inner', 'llm']
        )
      );

    const exclusion = await shadowedAiRootsExclusion({ executeQuery }, dataset, source);

    expect(exclusion).toEqual({
      clause: ' AND NOT (parentSpanId != "" AND traceId in ("t-sdk")) AND NOT spanId in ("inner")',
      capped: false,
    });
    // t-sdk is already excluded through its GenAI root, so only t-late's chains are read.
    expect(executeQuery.mock.calls[3][1]).toContain('traceId in ("t-late")');
  });

  it('reports a capped lookup', async () => {
    setAiRootFieldPresent('ds-1', true);
    const many = Array.from({ length: COUNTS_EXCLUSION_LIMIT + 1 }, (_, i) => `t${i}`);
    const executeQuery = jest
      .fn()
      .mockResolvedValueOnce(ids(...many))
      .mockResolvedValueOnce(ids())
      .mockResolvedValueOnce(ids());
    expect((await shadowedAiRootsExclusion({ executeQuery }, dataset, source)).capped).toBe(true);
  });

  it('counts without the exclusion, and says so, when a lookup fails', async () => {
    setAiRootFieldPresent('ds-1', true);
    const executeQuery = jest.fn().mockRejectedValue(new Error('boom'));
    expect(await shadowedAiRootsExclusion({ executeQuery }, dataset, source)).toEqual({
      clause: '',
      capped: true,
    });
  });
});
