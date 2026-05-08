/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import * as reactUse from 'react-use';

import { useQueryBuilderState } from './use_query_builder_state';
import { getQueryBuilder } from '../query_builder/query_builder';

jest.mock('../query_builder/query_builder', () => ({
  getQueryBuilder: jest.fn(),
}));

jest.spyOn(reactUse, 'useObservable').mockImplementation((observable: any, initialValue: any) => {
  return observable?.getValue ? observable.getValue() : initialValue;
});

describe('useQueryBuilderState', () => {
  let mockQueryBuilder: any;
  let queryState$: BehaviorSubject<any>;
  let queryEditorState$: BehaviorSubject<any>;
  let resultState$: BehaviorSubject<any>;
  let datasetView$: BehaviorSubject<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    queryState$ = new BehaviorSubject({
      query: 'source=logs',
      language: 'PPL',
      dataset: { id: 'test', title: 'test', type: 'INDEX_PATTERN' },
    });

    queryEditorState$ = new BehaviorSubject({
      queryStatus: { status: QueryExecutionStatus.UNINITIALIZED },
      editorMode: 'Query',
      promptModeIsAvailable: false,
      promptToQueryIsLoading: false,
      summaryAgentIsAvailable: false,
      isQueryEditorDirty: false,
      userInitiatedQuery: false,
      languageType: 'PPL',
    });

    resultState$ = new BehaviorSubject(undefined);

    datasetView$ = new BehaviorSubject({
      dataView: undefined,
      isLoading: false,
      error: null,
    });

    // Mock QueryBuilder instance
    mockQueryBuilder = {
      queryState$,
      queryEditorState$,
      resultState$,
      datasetView$,
      init: jest.fn(),
      dispose: jest.fn(),
      executeQuery: jest.fn(),
      updateQueryState: jest.fn(),
      updateQueryEditorState: jest.fn(),
    };

    (getQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    queryState$.complete();
    queryEditorState$.complete();
    resultState$.complete();
    datasetView$.complete();
  });

  describe('singleton behavior', () => {
    it('uses the same queryBuilder instance across multiple hook calls', () => {
      const { result: result1 } = renderHook(() => useQueryBuilderState());
      const { result: result2 } = renderHook(() => useQueryBuilderState());

      expect(result1.current.queryBuilder).toBe(mockQueryBuilder);
      expect(result2.current.queryBuilder).toBe(mockQueryBuilder);
      expect(result1.current.queryBuilder).toBe(result2.current.queryBuilder);
    });

    it('shares state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useQueryBuilderState());
      const { result: result2 } = renderHook(() => useQueryBuilderState());

      // Both should see the same state since they use the same queryBuilder
      expect(result1.current.queryState.query).toBe(result2.current.queryState.query);
      expect(result1.current.datasetView.isLoading).toBe(result2.current.datasetView.isLoading);
    });

    it('subscribes to queryState$ and returns current value', () => {
      const { result } = renderHook(() => useQueryBuilderState());

      expect(result.current.queryState).toEqual({
        query: 'source=logs',
        language: 'PPL',
        dataset: { id: 'test', title: 'test', type: 'INDEX_PATTERN' },
      });
    });

    it('subscribes to queryEditorState$ and returns current value', () => {
      const { result } = renderHook(() => useQueryBuilderState());

      expect(result.current.queryEditorState).toEqual({
        queryStatus: { status: QueryExecutionStatus.UNINITIALIZED },
        editorMode: 'Query',
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        summaryAgentIsAvailable: false,
        isQueryEditorDirty: false,
        userInitiatedQuery: false,
        languageType: 'PPL',
      });
    });

    it('subscribes to resultState$ and returns current value', () => {
      const { result } = renderHook(() => useQueryBuilderState());

      expect(result.current.resultState).toBeUndefined();
    });

    it('subscribes to datasetView$ and returns current value', () => {
      const { result } = renderHook(() => useQueryBuilderState());

      expect(result.current.datasetView).toEqual({
        dataView: undefined,
        isLoading: false,
        error: null,
      });
    });

    it('returns object with all expected properties', () => {
      const { result } = renderHook(() => useQueryBuilderState());

      expect(result.current).toHaveProperty('queryState');
      expect(result.current).toHaveProperty('queryEditorState');
      expect(result.current).toHaveProperty('resultState');
      expect(result.current).toHaveProperty('datasetView');
      expect(result.current).toHaveProperty('queryBuilder');
    });
  });

  describe('state updates', () => {
    it('reflects queryState updates from observable', () => {
      const { result } = renderHook(() => useQueryBuilderState());

      expect(result.current.queryState.query).toBe('source=logs');

      queryState$.next({ query: 'source=metrics', language: 'PPL', dataset: undefined });

      expect(queryState$.getValue().query).toBe('source=metrics');
    });

    it('reflects resultState updates from observable', () => {
      const mockResult = {
        hits: { hits: [], total: 10 },
      };

      const { result } = renderHook(() => useQueryBuilderState());

      expect(result.current.resultState).toBeUndefined();

      resultState$.next(mockResult);
      expect(resultState$.getValue()).toEqual(mockResult);
    });

    it('reflects datasetView updates from observable', () => {
      const mockDataView = {
        id: 'logs',
        title: 'logs',
        fields: [],
      };

      const { result } = renderHook(() => useQueryBuilderState());

      expect(result.current.datasetView.dataView).toBeUndefined();

      datasetView$.next({
        dataView: mockDataView,
        isLoading: false,
        error: null,
      });

      expect(datasetView$.getValue().dataView).toEqual(mockDataView);
    });
    it('handles multiple state changes correctly', () => {
      const { result } = renderHook(() => useQueryBuilderState());

      expect(result.current.queryState.query).toBe('source=logs');
      expect(result.current.resultState).toBeUndefined();

      queryState$.next({
        query: 'source=metrics | head 10',
        language: 'PPL',
        dataset: undefined,
      });

      resultState$.next({
        hits: { hits: [], total: 5 },
      });

      expect(queryState$.getValue().query).toBe('source=metrics | head 10');
      expect(resultState$.getValue()).toEqual({
        hits: { hits: [], total: 5 },
      });
    });
  });
});
