/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../core/public';
import {
  getAiAgentAvailableForDataSource,
  clearAiAgentAvailabilityCache,
} from './ai_agent_availability';

const makeHttp = (get: jest.Mock): HttpSetup => ({ get }) as unknown as HttpSetup;

describe('getAiAgentAvailableForDataSource', () => {
  afterEach(() => {
    clearAiAgentAvailabilityCache();
  });

  it('returns true when the probe reports available', async () => {
    const get = jest.fn().mockResolvedValue({ available: true });
    const available = await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-1');
    expect(available).toBe(true);
    expect(get).toHaveBeenCalledWith('/api/chat/agent_available', {
      query: { dataSourceId: 'ds-1' },
      signal: undefined,
    });
  });

  it('returns false when the probe reports the agent missing on the source', async () => {
    const get = jest.fn().mockResolvedValue({ available: false, reason: 'agent-missing' });
    expect(await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-2')).toBe(false);
  });

  it('omits the dataSourceId query when no source is selected (local cluster)', async () => {
    const get = jest.fn().mockResolvedValue({ available: true });
    await getAiAgentAvailableForDataSource(makeHttp(get), undefined);
    expect(get).toHaveBeenCalledWith('/api/chat/agent_available', { query: {}, signal: undefined });
  });

  it('fails open (true) when the request itself throws', async () => {
    const get = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-3')).toBe(true);
  });

  it('does not cache a fail-open guess: re-probes after a transient failure and recovers', async () => {
    const get = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ available: false, reason: 'no-agent-configured' });
    // First probe errors -> fails open to the caller, but nothing is cached.
    expect(await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-recover')).toBe(true);
    // Second call re-probes (the guess was not pinned) and gets the real answer.
    expect(await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-recover')).toBe(false);
    expect(get).toHaveBeenCalledTimes(2);
    // The real measurement IS cached, so a third call does not re-probe.
    expect(await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-recover')).toBe(false);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('fails open for deduped concurrent callers when the probe errors', async () => {
    let rejectGet: (e: Error) => void = () => {};
    const get = jest.fn().mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectGet = reject;
      })
    );
    const p1 = getAiAgentAvailableForDataSource(makeHttp(get), 'ds-concurrent-fail');
    const p2 = getAiAgentAvailableForDataSource(makeHttp(get), 'ds-concurrent-fail');
    rejectGet(new Error('offline'));
    // Neither the primary caller nor the deduped one may resolve to undefined.
    expect(await p1).toBe(true);
    expect(await p2).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('caches per data source so the probe runs once', async () => {
    const get = jest.fn().mockResolvedValue({ available: false });
    await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-4');
    await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-4');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent probes for the same source into one request', async () => {
    let resolveGet: (v: AgentResponse) => void = () => {};
    const get = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve;
      })
    );
    const p1 = getAiAgentAvailableForDataSource(makeHttp(get), 'ds-5');
    const p2 = getAiAgentAvailableForDataSource(makeHttp(get), 'ds-5');
    resolveGet({ available: true });
    expect(await p1).toBe(true);
    expect(await p2).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('probes different sources independently', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce({ available: true })
      .mockResolvedValueOnce({ available: false });
    expect(await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-a')).toBe(true);
    expect(await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-b')).toBe(false);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('aborts on timeout when one is supplied', async () => {
    const get = jest.fn().mockResolvedValue({ available: true });
    await getAiAgentAvailableForDataSource(makeHttp(get), 'ds-6', 3000);
    const callOptions = get.mock.calls[0][1];
    expect(callOptions.signal).toBeInstanceOf(AbortSignal);
  });
});

interface AgentResponse {
  available: boolean;
  reason?: string;
}
