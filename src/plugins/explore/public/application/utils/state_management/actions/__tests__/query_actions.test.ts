/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern } from '../../../../../../../data/common';
import { dataPluginMock } from '../../../../../../../data/public/mocks';
import { indexPatternMock } from '../../../../legacy/discover/__mock__/index_pattern_mock';
import { ISearchResult } from '../../slices';
import { defaultPrepareQuery, histogramResultsProcessor } from '../query_actions';

describe('Query Actions', () => {
  describe('defaultPrepareQuery', () => {
    it('should remove stats pipe from query string', () => {
      const queryWithStats = 'source=logs | where level="error" | stats count by host';
      const result = defaultPrepareQuery(queryWithStats);
      expect(result).toBe('source=logs | where level="error"');
    });

    it('should handle query without stats pipe', () => {
      const queryWithoutStats = 'source=logs | where level="error"';
      const result = defaultPrepareQuery(queryWithoutStats);
      expect(result).toBe('source=logs | where level="error"');
    });

    it('should handle empty query string', () => {
      const result = defaultPrepareQuery('');
      expect(result).toBe('');
    });

    it('should handle case insensitive stats removal', () => {
      const queryWithStats = 'source=logs | STATS count by host';
      const result = defaultPrepareQuery(queryWithStats);
      expect(result).toBe('source=logs');
    });

    it('should handle stats with extra whitespace', () => {
      const queryWithStats = 'source=logs   |   stats count by host';
      const result = defaultPrepareQuery(queryWithStats);
      expect(result).toBe('source=logs');
    });
  });

  describe('histogramResultsProcessor', () => {
    const data = dataPluginMock.createStartContract(true);
    const searchResult: ISearchResult = {
      timed_out: false,
      _shards: {
        failed: 0,
        skipped: 0,
        successful: 1,
        total: 1,
      },
      took: 0,
      elapsedMs: 0,
      hits: {
        total: 1,
        max_score: 0,
        hits: [
          { _index: 'mock-index', _type: 'mock-type', _id: 'mock-id', _score: 0, _source: {} },
        ],
      },
      fieldSchema: [
        { name: '@timestamp', type: 'date' },
        { name: 'response', type: 'string' },
      ],
    };

    it('should not throw error without time field', async () => {
      expect(() =>
        histogramResultsProcessor(
          searchResult,
          { ...indexPatternMock, timeFieldName: undefined } as IndexPattern,
          data,
          'auto'
        )
      ).not.toThrow();
    });
  });
});
