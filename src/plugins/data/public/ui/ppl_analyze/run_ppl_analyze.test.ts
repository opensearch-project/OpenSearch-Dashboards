/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @jest-environment node
 */

import { runPPLAnalyzeInBackground, cancelPPLAnalyze } from './run_ppl_analyze';
import {
  setPPLAnalyzeLoading,
  setPPLAnalyzeResult,
  isPPLAnalyzeOpen,
} from '../../query/ppl_analyze_state';

jest.mock('../../query/ppl_analyze_state', () => ({
  setPPLAnalyzeLoading: jest.fn(),
  setPPLAnalyzeResult: jest.fn(),
  isPPLAnalyzeOpen: jest.fn(() => false),
}));

const mockFetch = jest.fn();
const mockHttp = { fetch: mockFetch } as any;
const mockTimefilter = {
  getTime: () => ({ from: 'now-15m', to: 'now' }),
} as any;

const ANALYZE_PATH = '/api/enhancements/ppl/analyze';
const pplQuery = { query: 'source=accounts', language: 'PPL' };
const sqlQuery = { query: 'SELECT *', language: 'SQL' };

beforeEach(() => {
  // Drain any request left in-flight by a prior test before resetting call history,
  // so each test starts with a clean fetch mock and no leftover cancel is fired.
  cancelPPLAnalyze();
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({ profile: { summary: { total_time_ms: 10 } } });
});

describe('runPPLAnalyzeInBackground', () => {
  describe('language gating', () => {
    it('does nothing for non-PPL languages', () => {
      runPPLAnalyzeInBackground({ query: sqlQuery, http: mockHttp, timefilter: mockTimefilter });
      expect(mockFetch).not.toHaveBeenCalled();
      expect(setPPLAnalyzeLoading).not.toHaveBeenCalled();
    });

    it('does nothing when query string is empty', () => {
      runPPLAnalyzeInBackground({
        query: { query: '', language: 'PPL' },
        http: mockHttp,
        timefilter: mockTimefilter,
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fires request for PPL queries', () => {
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/api/enhancements/ppl/analyze',
        })
      );
    });
  });

  describe('onlyIfOpen flag', () => {
    it('does nothing when onlyIfOpen=true and panel is closed', () => {
      (isPPLAnalyzeOpen as jest.Mock).mockReturnValue(false);
      runPPLAnalyzeInBackground({
        query: pplQuery,
        http: mockHttp,
        timefilter: mockTimefilter,
        onlyIfOpen: true,
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fires request when onlyIfOpen=true and panel is open', () => {
      (isPPLAnalyzeOpen as jest.Mock).mockReturnValue(true);
      runPPLAnalyzeInBackground({
        query: pplQuery,
        http: mockHttp,
        timefilter: mockTimefilter,
        onlyIfOpen: true,
      });
      expect(mockFetch).toHaveBeenCalled();
    });

    it('fires request when onlyIfOpen is not set regardless of panel state', () => {
      (isPPLAnalyzeOpen as jest.Mock).mockReturnValue(false);
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('sets loading to true before the request', () => {
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      expect(setPPLAnalyzeLoading).toHaveBeenCalledWith(true);
    });

    it('discards results from superseded requests (race condition guard)', async () => {
      const slowFetch = new Promise<any>((resolve) =>
        setTimeout(() => resolve({ profile: {} }), 50)
      );
      const fastFetch = Promise.resolve({ profile: { summary: { total_time_ms: 1 } } });
      // Make the mock path-aware: cancel requests resolve silently, analyze
      // requests consume from a queue of pre-configured responses.
      const analyzeResponses = [slowFetch, fastFetch];
      mockFetch.mockImplementation((opts: any) => {
        if (opts.path?.includes('/cancel')) return Promise.resolve({ cancelled: true });
        return analyzeResponses.shift() || Promise.resolve({});
      });
      // First call — will resolve slowly (stale)
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      // Second call — resolves immediately (fresh); cancels the first in-flight
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      await fastFetch;
      await Promise.resolve();
      await Promise.resolve();
      // Only the fresh result should be committed
      expect(setPPLAnalyzeResult).toHaveBeenCalledTimes(1);
      expect(setPPLAnalyzeResult).toHaveBeenCalledWith(
        expect.objectContaining({ response: { profile: { summary: { total_time_ms: 1 } } } })
      );
    });

    it('sets result on success', async () => {
      const response = { profile: { summary: { total_time_ms: 5 } } };
      mockFetch.mockResolvedValue(response);
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      await Promise.resolve();
      await Promise.resolve();
      expect(setPPLAnalyzeResult).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'source=accounts',
          response,
        })
      );
    });

    it('commits the error body as the result when the request rejects', async () => {
      const errorBody = {
        statusCode: 400,
        error: 'Bad Request',
        message: '{"reason":"Invalid Query","details":"...","type":"SyntaxCheckException"}',
      };
      mockFetch.mockRejectedValue({ body: errorBody });
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      await Promise.resolve();
      await Promise.resolve();
      expect(setPPLAnalyzeResult).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'source=accounts',
          response: errorBody,
        })
      );
    });

    it('synthesizes an error response when the rejection has no body', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      await Promise.resolve();
      await Promise.resolve();
      expect(setPPLAnalyzeResult).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'source=accounts',
          response: expect.objectContaining({ message: 'network error' }),
        })
      );
    });
  });

  describe('queryId and cancellation', () => {
    it('includes a queryId in the analyze request body', () => {
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      const body = JSON.parse(mockFetch.mock.calls[0][0].body);
      expect(typeof body.queryId).toBe('string');
      expect(body.queryId.length).toBeGreaterThan(0);
    });

    it('cancels the in-flight request when a newer request supersedes it', () => {
      const cancelCalls = () =>
        mockFetch.mock.calls.filter((c: any[]) => c[0].path?.includes('/cancel'));

      // First request is now in-flight (fetch never resolves in this test).
      mockFetch.mockReturnValue(new Promise(() => {}));
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      const firstQueryId = JSON.parse(mockFetch.mock.calls[0][0].body).queryId;
      expect(cancelCalls()).toHaveLength(0);

      // Second request should cancel the first, posting its queryId to the cancel path.
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      const cancels = cancelCalls();
      expect(cancels).toHaveLength(1);
      expect(cancels[0][0]).toEqual(
        expect.objectContaining({ method: 'POST', path: '/api/enhancements/ppl/cancel' })
      );
      expect(JSON.parse(cancels[0][0].body).queryId).toBe(firstQueryId);
    });

    it('cancelPPLAnalyze posts the in-flight queryId to the cancel path', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      const queryId = JSON.parse(mockFetch.mock.calls[0][0].body).queryId;

      cancelPPLAnalyze();

      const cancelCall = mockFetch.mock.calls.find((c: any[]) => c[0].path?.includes('/cancel'));
      expect(cancelCall).toBeDefined();
      expect(JSON.parse(cancelCall![0].body).queryId).toBe(queryId);
    });

    it('cancelPPLAnalyze is a no-op when nothing is in flight', () => {
      // Settle any prior in-flight request from earlier tests, then clear the mock.
      cancelPPLAnalyze();
      mockFetch.mockClear();
      cancelPPLAnalyze();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('passes an abort signal to the analyze fetch', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      const analyzeCall = mockFetch.mock.calls.find((c: any[]) => c[0].path === ANALYZE_PATH);
      expect(analyzeCall![0].signal).toBeInstanceOf(AbortSignal);
    });

    it('aborts the in-flight fetch when cancelled', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      const signal = mockFetch.mock.calls.find((c: any[]) => c[0].path === ANALYZE_PATH)![0].signal;
      expect(signal.aborted).toBe(false);

      cancelPPLAnalyze();
      expect(signal.aborted).toBe(true);
    });

    it('does not commit a result when the fetch resolves after cancellation', async () => {
      // A response that resolves only after we have already cancelled must not
      // repopulate the panel (would defeat clearPPLAnalyzeResult on close).
      let resolveFetch: (v: any) => void = () => {};
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });

      cancelPPLAnalyze();
      resolveFetch({ profile: { summary: { total_time_ms: 9 } } });
      await Promise.resolve();
      await Promise.resolve();

      expect(setPPLAnalyzeResult).not.toHaveBeenCalled();
    });

    it('does not commit an error result when the fetch rejects with AbortError', async () => {
      const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
      mockFetch.mockRejectedValue(abortErr);
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      await Promise.resolve();
      await Promise.resolve();

      expect(setPPLAnalyzeResult).not.toHaveBeenCalled();
    });
  });

  describe('time filter injection', () => {
    it('injects time filter when timeFieldName is present', () => {
      const queryWithTimeField = {
        query: 'source=accounts',
        language: 'PPL',
        dataset: { timeFieldName: '@timestamp', id: 'accounts', title: 'accounts', type: 'INDEX' },
      };
      runPPLAnalyzeInBackground({
        query: queryWithTimeField,
        http: mockHttp,
        timefilter: mockTimefilter,
      });
      const body = JSON.parse(mockFetch.mock.calls[0][0].body);
      expect(body.query).toContain('WHERE');
      expect(body.query).toContain('@timestamp');
    });

    it('does not inject time filter when no timeFieldName', () => {
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      const body = JSON.parse(mockFetch.mock.calls[0][0].body);
      expect(body.query).toBe('source=accounts');
    });

    it('does not inject time filter for describe commands', () => {
      const describeQuery = {
        query: 'describe accounts',
        language: 'PPL',
        dataset: { timeFieldName: '@timestamp', id: 'accounts', title: 'accounts', type: 'INDEX' },
      };
      runPPLAnalyzeInBackground({
        query: describeQuery,
        http: mockHttp,
        timefilter: mockTimefilter,
      });
      const body = JSON.parse(mockFetch.mock.calls[0][0].body);
      expect(body.query).toBe('describe accounts');
      expect(body.query).not.toContain('WHERE');
    });

    it('does not inject time filter for show commands', () => {
      const showQuery = {
        query: 'show tables',
        language: 'PPL',
        dataset: { timeFieldName: '@timestamp', id: 'accounts', title: 'accounts', type: 'INDEX' },
      };
      runPPLAnalyzeInBackground({
        query: showQuery,
        http: mockHttp,
        timefilter: mockTimefilter,
      });
      const body = JSON.parse(mockFetch.mock.calls[0][0].body);
      expect(body.query).toBe('show tables');
      expect(body.query).not.toContain('WHERE');
    });

    it('escapes backticks in timeFieldName to prevent PPL injection', () => {
      const maliciousQuery = {
        query: 'source=accounts',
        language: 'PPL',
        dataset: {
          timeFieldName: 'field`; DROP TABLE accounts; --',
          id: 'accounts',
          title: 'accounts',
          type: 'INDEX',
        },
      };
      runPPLAnalyzeInBackground({
        query: maliciousQuery,
        http: mockHttp,
        timefilter: mockTimefilter,
      });
      const body = JSON.parse(mockFetch.mock.calls[0][0].body);
      // The backtick in the field name is doubled (escaped) so the entire value
      // stays inside the identifier quotes as a single token — the semicolon and
      // subsequent text cannot break out into a separate PPL command.
      expect(body.query).toContain('`field``; DROP TABLE accounts; --`');
      // Confirm the raw unescaped backtick form is NOT present (which would have closed the identifier early)
      expect(body.query).not.toContain('`field`; DROP TABLE');
    });
  });
});
