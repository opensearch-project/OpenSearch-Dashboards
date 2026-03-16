/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../data/common';
import { prepareQueryForLanguage } from './prepare_query';
import { addPPLSourceClause } from './ppl';

jest.mock('./ppl', () => ({
  addPPLSourceClause: jest.fn(),
}));

describe('prepareQueryForLanguage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PPL language', () => {
    it('should call addPPLSourceClause for PPL queries', () => {
      const query: Query = {
        query: 'level="error"',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'PPL',
      };

      const expectedResult = {
        ...query,
        query: 'source = `test-dataset` level="error"',
      };

      (addPPLSourceClause as jest.Mock).mockReturnValue(expectedResult);

      const result = prepareQueryForLanguage(query);

      expect(addPPLSourceClause).toHaveBeenCalledWith(query);
      expect(addPPLSourceClause).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Error handling', () => {
    it('should throw error when query is not a string', () => {
      const query: Query = {
        query: { match: { field: 'value' } },
        language: 'DQL',
        dataset: { title: 'test', id: '404', type: 'INDEX_PATTERN' },
      };

      expect(() => prepareQueryForLanguage(query)).toThrow(
        'Cannot convert query to QueryWithQueryAsString'
      );
      expect(addPPLSourceClause).not.toHaveBeenCalled();
    });
  });

  describe('Unknown languages', () => {
    it('should return query as-is for unknown language', () => {
      const query: Query = {
        query: 'some custom query syntax',
        language: 'custom_lang',
        dataset: { title: 'test', id: '999', type: 'INDEX_PATTERN' },
      };

      const result = prepareQueryForLanguage(query);

      expect(addPPLSourceClause).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...query,
        query: 'some custom query syntax',
      });
    });
  });
});
