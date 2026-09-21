/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useStreamingStatus } from './use_streaming_status';

let mockPrepareThrows = false;

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: () => {
    if (mockPrepareThrows) {
      // Real behaviour: it throws for any language it does not handle, e.g. the initial 'kuery'.
      throw new Error('defaultPrepareQueryString encountered unhandled language: kuery');
    }
    return 'results-key';
  },
}));

const statusMap: Record<string, unknown> = {
  'results-key': { streaming: { isPolling: true, fractionDone: 0.4 } },
  'tab-key': { status: 'ready' },
};

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useMemo: (factory: () => unknown) => factory(),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      query: { query: 'source=logs', language: 'PPL' },
      queryEditor: { queryStatusMap: statusMap },
    }),
}));

describe('useStreamingStatus', () => {
  beforeEach(() => {
    mockPrepareThrows = false;
  });

  it('follows the results query by default, which is the one that streams', () => {
    const { cacheKey, isPolling } = useStreamingStatus();

    expect(cacheKey).toBe('results-key');
    expect(isPolling).toBe(true);
  });

  it('follows an overridden key, so a consumer can track the query whose numbers it shows', () => {
    // The Statistics and Visualization tabs display a different query; annotating their counts with
    // the results query's progress would describe the wrong query.
    const { cacheKey, streaming, isPolling } = useStreamingStatus('tab-key');

    expect(cacheKey).toBe('tab-key');
    expect(streaming).toBeUndefined();
    expect(isPolling).toBe(false);
  });

  it('reports nothing for a key with no status entry at all', () => {
    expect(useStreamingStatus('absent-key').isPolling).toBe(false);
  });

  it('returns an inert value instead of throwing for an unsupported language', () => {
    mockPrepareThrows = true;

    const { cacheKey, isPolling } = useStreamingStatus();

    expect(cacheKey).toBeUndefined();
    expect(isPolling).toBe(false);
  });
});
