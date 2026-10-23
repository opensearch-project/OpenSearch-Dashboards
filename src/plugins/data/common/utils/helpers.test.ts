/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { handleQueryResults } from './helpers';

describe('handleQueryResults', () => {
  it('polls until SUCCESS and resolves with the final response', async () => {
    const pollQueryResults = jest
      .fn()
      .mockResolvedValueOnce({ status: 'RUNNING' })
      .mockResolvedValueOnce({ status: 'success', body: { fields: [], size: 0 } });

    const result = await handleQueryResults({ pollQueryResults, interval: 1 });

    expect(pollQueryResults).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('success');
  });

  it('throws the body error on FAILED', async () => {
    const pollQueryResults = jest
      .fn()
      .mockResolvedValue({ status: 'failed', body: { error: 'boom' } });

    await expect(handleQueryResults({ pollQueryResults, interval: 1 })).rejects.toThrow('boom');
  });

  it('passes every non-terminal response to onPollResponse, but not the terminal one', async () => {
    const running1 = { status: 'Running', body: { fields: [], size: 1 } };
    const running2 = { status: 'Running', body: { fields: [], size: 2 } };
    const pollQueryResults = jest
      .fn()
      .mockResolvedValueOnce(running1)
      .mockResolvedValueOnce(running2)
      .mockResolvedValueOnce({ status: 'success', body: { fields: [], size: 3 } });
    const onPollResponse = jest.fn();

    await handleQueryResults({ pollQueryResults, interval: 1, onPollResponse });

    expect(onPollResponse.mock.calls).toEqual([[running1], [running2]]);
  });
});
