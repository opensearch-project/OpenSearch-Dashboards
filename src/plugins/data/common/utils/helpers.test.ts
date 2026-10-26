/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFailedQueryMessage, handleQueryResults } from './helpers';

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

  it('uses the message of an object failure body on FAILED, as a failure at start does', async () => {
    const pollQueryResults = jest
      .fn()
      .mockResolvedValue({ status: 'FAILED', body: { error: { message: 'Access denied' } } });

    await expect(handleQueryResults({ pollQueryResults, interval: 1 })).rejects.toThrow(
      'Access denied'
    );
  });

  it('serializes an object failure body without a message on FAILED', async () => {
    const pollQueryResults = jest
      .fn()
      .mockResolvedValue({ status: 'failed', body: { error: { code: 'THROTTLED' } } });

    await expect(handleQueryResults({ pollQueryResults, interval: 1 })).rejects.toThrow(
      '{"code":"THROTTLED"}'
    );
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

describe('getFailedQueryMessage', () => {
  it('prefers a string error, then a message, then the serialized error', () => {
    expect(getFailedQueryMessage('boom')).toBe('boom');
    expect(getFailedQueryMessage({ message: 'Access denied', code: 1 })).toBe('Access denied');
    expect(getFailedQueryMessage({ code: 'THROTTLED' })).toBe('{"code":"THROTTLED"}');
  });

  it('falls back to a generic message', () => {
    expect(getFailedQueryMessage(undefined)).toBe('Query failed');
    expect(getFailedQueryMessage('')).toBe('Query failed');
    expect(getFailedQueryMessage({})).toBe('Query failed');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(getFailedQueryMessage(circular)).toBe('Query failed');
  });

  it('truncates a long serialized error', () => {
    const message = getFailedQueryMessage({ detail: 'x'.repeat(5000) });
    expect(message.length).toBe(1001);
    expect(message.endsWith('…')).toBe(true);
  });
});
