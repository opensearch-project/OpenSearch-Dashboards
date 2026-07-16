/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @jest-environment node
 */

import { runPPLAnalyzeInBackground } from './run_ppl_analyze';
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

const pplQuery = { query: 'source=accounts', language: 'PPL' };
const sqlQuery = { query: 'SELECT *', language: 'SQL' };

beforeEach(() => {
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

    it('sets loading to false on error', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      await Promise.resolve();
      await Promise.resolve();
      expect(setPPLAnalyzeLoading).toHaveBeenCalledWith(false);
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

    it('stores injectedTimeFilter in result', async () => {
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
      await Promise.resolve();
      await Promise.resolve();
      expect(setPPLAnalyzeResult).toHaveBeenCalledWith(
        expect.objectContaining({
          injectedTimeFilter: expect.stringContaining('@timestamp'),
        })
      );
    });

    it('does not inject time filter when no timeFieldName', () => {
      runPPLAnalyzeInBackground({ query: pplQuery, http: mockHttp, timefilter: mockTimefilter });
      const body = JSON.parse(mockFetch.mock.calls[0][0].body);
      expect(body.query).toBe('source=accounts');
    });
  });
});
