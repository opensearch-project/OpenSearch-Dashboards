/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resetAiRootFieldChecks, setAiRootFieldPresent } from '../../../utils/ai_root';
import { shadowedAiRootsExclusion } from './shadowed_ai_roots';

const dataset = { id: 'ds-1', title: 'otel-v1-apm-span*', type: 'INDEX_PATTERN' } as any;
const source = 'source = otel-v1-apm-span*';
const ids = (...traceIds: string[]) => ({
  schema: [{ name: 'traceId' }],
  datarows: traceIds.map((id) => [id]),
});

describe('shadowedAiRootsExclusion', () => {
  beforeEach(() => resetAiRootFieldChecks());

  it('does nothing until the marker is mapped', async () => {
    const ppl = { executeQuery: jest.fn() };
    expect(await shadowedAiRootsExclusion(ppl, dataset, source)).toBe('');
    expect(ppl.executeQuery).not.toHaveBeenCalled();
  });

  it('excludes marked spans of traces that also have a GenAI root', async () => {
    setAiRootFieldPresent('ds-1', true);
    const ppl = {
      executeQuery: jest
        .fn()
        .mockResolvedValueOnce(ids('t-sdk', 't-http'))
        .mockResolvedValueOnce(ids('t-sdk')),
    };

    const exclusion = await shadowedAiRootsExclusion(ppl, dataset, source);

    expect(exclusion).toBe(' AND NOT (parentSpanId != "" AND traceId in ("t-sdk"))');
    expect(ppl.executeQuery.mock.calls[0][1]).toBe(
      'source = otel-v1-apm-span* | where `attributes.derived.gen_ai.is_root` = true and parentSpanId != "" | stats count() by traceId | head 1000'
    );
    expect(ppl.executeQuery.mock.calls[1][1]).toContain('traceId in ("t-sdk", "t-http")');
  });

  it('skips the second lookup when nothing is marked below a root', async () => {
    setAiRootFieldPresent('ds-1', true);
    const ppl = { executeQuery: jest.fn().mockResolvedValueOnce(ids()) };
    expect(await shadowedAiRootsExclusion(ppl, dataset, source)).toBe('');
    expect(ppl.executeQuery).toHaveBeenCalledTimes(1);
  });

  it('falls back to no exclusion when a lookup fails', async () => {
    setAiRootFieldPresent('ds-1', true);
    const ppl = { executeQuery: jest.fn().mockRejectedValue(new Error('boom')) };
    expect(await shadowedAiRootsExclusion(ppl, dataset, source)).toBe('');
  });
});
