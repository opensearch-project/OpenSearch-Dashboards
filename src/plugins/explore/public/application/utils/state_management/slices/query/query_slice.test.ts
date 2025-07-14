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
  queryInitialState,
} from './query_slice';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../../common';
import { Query, DataView } from '../../../../../../../data/common';

describe('querySlice reducers', () => {
  const initialState: QueryState = queryInitialState;

  describe('setQueryState', () => {
    it('should replace the entire state with string query', () => {
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
        query: 'foo',
        language: 'sql',
        dataset: {
          id: 'my-dataset',
          title: 'my dataset',
          type: 'INDEX_PATTERN',
        },
      });
    });

    it('should handle DataView dataset by converting to Dataset', () => {
      const mockDataView = ({
        id: 'dataview-id',
        title: 'DataView Title',
        toDataset: jest.fn().mockReturnValue({
          id: 'dataview-id',
          title: 'DataView Title',
          type: 'INDEX_PATTERN',
        }),
      } as unknown) as DataView;

      const newQuery = {
        query: 'SELECT * FROM table',
        language: 'sql',
        dataset: mockDataView,
      } as Query;

      const state = queryReducer(initialState, setQueryState(newQuery));

      expect(mockDataView.toDataset).toHaveBeenCalled();
      expect(state.dataset).toEqual({
        id: 'dataview-id',
        title: 'DataView Title',
        type: 'INDEX_PATTERN',
      });
    });

    it('should convert non-string query to string', () => {
      const newQuery = {
        query: { match_all: {} }, // Non-string query
        language: 'dsl',
      } as Query;

      const state = queryReducer(initialState, setQueryState(newQuery));
      expect(state.query).toBe('');
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
        query: 'SELECT * FROM users',
        language: 'sql',
        dataset: {
          id: 'users-dataset',
          title: 'Users Dataset',
          type: 'INDEX_PATTERN',
        },
      });
    });

    it('should include meta flag for history tracking', () => {
      const newQuery: Query = {
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
      expect(action.payload).toEqual({
        query: '| where status="active"',
        language: 'PPL',
        dataset: {
          id: 'logs-dataset',
          title: 'Application Logs',
          type: 'INDEX_PATTERN',
        },
      });
      expect(action.meta).toEqual({ addToHistory: true });
    });

    it('should handle DataView dataset by converting to Dataset', () => {
      const mockDataView = ({
        id: 'dataview-id',
        title: 'DataView Title',
        toDataset: jest.fn().mockReturnValue({
          id: 'dataview-id',
          title: 'DataView Title',
          type: 'INDEX_PATTERN',
        }),
      } as unknown) as DataView;

      const newQuery = {
        query: 'SELECT * FROM table',
        language: 'sql',
        dataset: mockDataView,
      } as Query;

      const state = queryReducer(initialState, setQueryWithHistory(newQuery));

      expect(mockDataView.toDataset).toHaveBeenCalled();
      expect(state.dataset).toEqual({
        id: 'dataview-id',
        title: 'DataView Title',
        type: 'INDEX_PATTERN',
      });
    });

    it('should convert non-string query to string', () => {
      const newQuery = {
        query: { match_all: {} }, // Non-string query
        language: 'dsl',
      } as Query;

      const state = queryReducer(initialState, setQueryWithHistory(newQuery));
      expect(state.query).toBe('');
    });

    describe('initial state', () => {
      it('should have correct initial state', () => {
        expect(queryInitialState).toEqual({
          query: '',
          language: EXPLORE_DEFAULT_LANGUAGE,
          dataset: undefined,
        });
      });
    });

    describe('edge cases', () => {
      it('should handle undefined dataset in setQueryState', () => {
        const newQuery: Query = {
          query: 'test query',
          language: 'sql',
          dataset: undefined,
        };
        const state = queryReducer(initialState, setQueryState(newQuery));
        expect(state.dataset).toBeUndefined();
      });

      it('should handle undefined dataset in setQueryWithHistory', () => {
        const newQuery: Query = {
          query: 'test query',
          language: 'sql',
          dataset: undefined,
        };
        const state = queryReducer(initialState, setQueryWithHistory(newQuery));
        expect(state.dataset).toBeUndefined();
      });

      it('should handle empty query string in setQueryStringWithHistory', () => {
        const state = queryReducer(initialState, setQueryStringWithHistory(''));
        expect(state.query).toBe('');
        expect(state.language).toBe(EXPLORE_DEFAULT_LANGUAGE);
        expect(state.dataset).toBeUndefined();
      });

      it('should preserve existing state when updating query string', () => {
        const existingState: QueryState = {
          query: 'old query',
          language: 'PPL',
          dataset: {
            id: 'test-dataset',
            title: 'Test Dataset',
            type: 'INDEX_PATTERN',
          },
        };

        const state = queryReducer(existingState, setQueryStringWithHistory('new query'));
        expect(state.query).toBe('new query');
        expect(state.language).toBe('PPL');
        expect(state.dataset).toEqual(existingState.dataset);
      });
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
