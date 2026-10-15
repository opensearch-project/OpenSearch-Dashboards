/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import {
  aiRootCondition,
  dropShadowedAiRoots,
  ensureAiRootFieldChecked,
  GENAI_ROOT_CONDITION,
  hasAiRootField,
  isMarkedAiRoot,
  resetAiRootFieldChecks,
  setAiRootFieldPresent,
  useAiRootFieldVersion,
} from './ai_root';
import { prepareRootSpansQuery } from '../tab_queries';

const dataset = { id: 'ds-1', title: 'otel-v1-apm-span*', type: 'INDEX_PATTERN' };

describe('ai_root', () => {
  beforeEach(() => resetAiRootFieldChecks());

  it('only lists GenAI roots until the marker is known to be mapped', () => {
    expect(aiRootCondition('ds-1')).toBe(GENAI_ROOT_CONDITION);

    setAiRootFieldPresent('ds-1', true);
    expect(aiRootCondition('ds-1')).toBe(
      `(${GENAI_ROOT_CONDITION}) OR \`attributes.derived.gen_ai.is_root\` = true`
    );
    expect(aiRootCondition('ds-2')).toBe(GENAI_ROOT_CONDITION);
  });

  it('puts the condition in the Traces query', () => {
    const query = { query: '', language: 'PPL', dataset } as any;
    expect(prepareRootSpansQuery(query)).toContain(`where ${GENAI_ROOT_CONDITION}`);
    setAiRootFieldPresent('ds-1', true);
    expect(prepareRootSpansQuery(query)).toContain('`attributes.derived.gen_ai.is_root` = true');
  });

  it('probes the mapping once per dataset', async () => {
    const executeQuery = jest.fn().mockResolvedValue({});
    const ppl = { executeQuery };
    await Promise.all([
      ensureAiRootFieldChecked(ppl, dataset as any, 'source = otel-v1-apm-span*'),
      ensureAiRootFieldChecked(ppl, dataset as any, 'source = otel-v1-apm-span*'),
    ]);
    await ensureAiRootFieldChecked(ppl, dataset as any, 'source = otel-v1-apm-span*');

    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(executeQuery.mock.calls[0][1]).toBe(
      'source = otel-v1-apm-span* | where isnotnull(`attributes.derived.gen_ai.is_root`) | head 1'
    );
    expect(hasAiRootField('ds-1')).toBe(true);
  });

  it('treats a failed probe (unmapped field) as absent', async () => {
    const ppl = { executeQuery: jest.fn().mockRejectedValue(new Error("can't resolve Symbol")) };
    await ensureAiRootFieldChecked(ppl, dataset as any, 'source = otel-v1-apm-span*');
    expect(hasAiRootField('ds-1')).toBe(false);
  });

  it('reads the marker from flat, nested and top-level forms', () => {
    expect(isMarkedAiRoot({ attributes: { 'derived.gen_ai.is_root': true } })).toBe(true);
    expect(isMarkedAiRoot({ attributes: { derived: { gen_ai: { is_root: 'true' } } } })).toBe(true);
    expect(isMarkedAiRoot({ 'attributes.derived.gen_ai.is_root': true })).toBe(true);
    expect(isMarkedAiRoot({ attributes: { derived: { fault: 'false' } } })).toBe(false);
    expect(isMarkedAiRoot(undefined)).toBe(false);
  });

  it('drops a marked span whose trace is listed through its GenAI root', () => {
    const hits = [
      { _source: { traceId: 't1', parentSpanId: '' } },
      { _source: { traceId: 't1', parentSpanId: 'p' } },
      { _source: { traceId: 't2', parentSpanId: 'http' } },
      { _source: { traceId: 't2', parentSpanId: 'http' } },
    ];
    // t1 keeps only its root; t2 has no GenAI root, so both parallel agents stay.
    expect(dropShadowedAiRoots(hits)).toEqual([hits[0], hits[2], hits[3]]);
  });

  it('bumps the version only when a check changes the condition', () => {
    const { result } = renderHook(() => useAiRootFieldVersion());
    const start = result.current;
    act(() => setAiRootFieldPresent('ds-1', true));
    expect(result.current).toBe(start + 1);
    act(() => setAiRootFieldPresent('ds-1', true));
    expect(result.current).toBe(start + 1);
  });
});
