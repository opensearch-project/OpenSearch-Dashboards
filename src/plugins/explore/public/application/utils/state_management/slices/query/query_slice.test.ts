/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  setQueryState,
  setQueryWithHistory,
  setQueryStringWithHistory,
  queryReducer,
  QueryState,
} from './query_slice';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../../common';
import { Query } from '../../../../../../../data/common';

describe('querySlice reducers', () => {
  const initialState: QueryState = {
    query: '',
    language: EXPLORE_DEFAULT_LANGUAGE,
    dataset: undefined,
  };

  describe('setQueryState', () => {
    it('setQueryState replaces the entire state', () => {
      const newQuery: Query = {
        query: 'foo',
        language: 'sql',
        dataset: {
          id: 'my-dataset',
          title: 'my dataset',
          type: 'INDEX_PATTERN',
        },
      };
      const state = queryReducer(initialState, setQueryState(newQuery));
      expect(state).toEqual({
        ...newQuery,
        query: 'foo', // Ensuring query is a string
      });
    });
  });

  describe('setQueryWithHistory', () => {
    it('should replace the entire state like setQueryState', () => {
      const newQuery: Query = {
        query: 'SELECT * FROM users',
        language: 'sql',
        dataset: {
          id: 'users-dataset',
          title: 'Users Dataset',
          type: 'INDEX_PATTERN',
        },
      };
      const state = queryReducer(initialState, setQueryWithHistory(newQuery));
      expect(state).toEqual({
        ...newQuery,
        query: 'SELECT * FROM users', // Ensuring query is a string
      });
    });

    it('should include meta flag for history tracking', () => {
      const newQuery: QueryState = {
        query: '| where status="active"',
        language: 'PPL',
        dataset: {
          id: 'logs-dataset',
          title: 'Application Logs',
          type: 'INDEX_PATTERN',
        },
      };
      const action = setQueryWithHistory(newQuery);

      expect(action.type).toBe('query/setQueryWithHistory');
      expect(action.payload).toEqual(newQuery);
      expect(action.meta).toEqual({ addToHistory: true });
    });
  });

  describe('setQueryStringWithHistory', () => {
    it('should update only the query string field', () => {
      const existingState: QueryState = {
        query: 'old query',
        language: 'SQL',
        dataset: {
          id: 'existing-dataset',
          title: 'Existing Dataset',
          type: 'INDEX_PATTERN',
        },
      };

      const newQueryString = 'SELECT COUNT(*) FROM users';
      const state = queryReducer(existingState, setQueryStringWithHistory(newQueryString));

      expect(state.query).toBe(newQueryString);
      expect(state.language).toBe(existingState.language);
      expect(state.dataset).toEqual(existingState.dataset);
    });

    it('should include meta flag for history tracking', () => {
      const queryString = '| head 100';
      const action = setQueryStringWithHistory(queryString);

      expect(action.type).toBe('query/setQueryStringWithHistory');
      expect(action.payload).toBe(queryString);
      expect(action.meta).toEqual({ addToHistory: true });
    });
  });
});
