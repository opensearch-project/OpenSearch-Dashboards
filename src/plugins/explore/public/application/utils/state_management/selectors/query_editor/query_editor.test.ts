/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  selectQueryStatusMap,
  selectQueryStatusMapByKey,
  selectOverallQueryStatus,
  selectQueryStatus,
  selectExecutionStatus,
  selectIsLoading,
  selectEditorMode,
  selectIsDualEditorMode,
  selectPromptModeIsAvailable,
  selectPromptToQueryIsLoading,
  selectTopEditorIsQueryMode,
} from './query_editor';
import { RootState } from '../../store';
import { EditorMode, QueryExecutionStatus, QueryResultStatus } from '../../types';

describe('query_editor selectors', () => {
  const createMockState = (queryEditorState: Partial<RootState['queryEditor']>): RootState => ({
    queryEditor: {
      queryStatusMap: {},
      overallQueryStatus: {
        status: QueryExecutionStatus.UNINITIALIZED,
        elapsedMs: undefined,
        startTime: undefined,
        error: undefined,
      },
      editorMode: EditorMode.SingleQuery,
      promptModeIsAvailable: false,
      promptToQueryIsLoading: false,
      lastExecutedPrompt: '',
      ...queryEditorState,
    },
    // Add other required state slices as minimal mocks
    ui: {} as any,
    results: {} as any,
    tab: {} as any,
    legacy: {} as any,
    query: {} as any,
  });

  describe('selectQueryStatusMap', () => {
    it('should return the queryStatusMap from queryEditor state', () => {
      const mockStatusMap = {
        query1: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: 100,
          startTime: Date.now(),
          body: undefined,
        },
        query2: {
          status: QueryExecutionStatus.READY,
          elapsedMs: 200,
          startTime: Date.now(),
          body: undefined,
        },
      };
      const state = createMockState({
        queryStatusMap: mockStatusMap,
      });

      const result = selectQueryStatusMap(state);

      expect(result).toEqual(mockStatusMap);
    });

    it('should return empty object when no queries in status map', () => {
      const state = createMockState({
        queryStatusMap: {},
      });

      const result = selectQueryStatusMap(state);

      expect(result).toEqual({});
    });
  });

  describe('selectQueryStatusMapByKey', () => {
    it('should return the status for a specific cache key', () => {
      const mockStatus: QueryResultStatus = {
        status: QueryExecutionStatus.LOADING,
        elapsedMs: 100,
        startTime: Date.now(),
        error: undefined,
      };
      const state = createMockState({
        queryStatusMap: {
          query1: mockStatus,
          query2: {
            status: QueryExecutionStatus.READY,
            elapsedMs: 200,
            startTime: Date.now(),
            error: undefined,
          },
        },
      });

      const result = selectQueryStatusMapByKey(state, 'query1');

      expect(result).toEqual(mockStatus);
    });

    it('should return undefined for non-existent cache key', () => {
      const state = createMockState({
        queryStatusMap: {
          query1: {
            status: QueryExecutionStatus.READY,
            elapsedMs: 100,
            startTime: Date.now(),
            error: undefined,
          },
        },
      });

      const result = selectQueryStatusMapByKey(state, 'nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('selectOverallQueryStatus', () => {
    it('should return the overallQueryStatus from queryEditor state', () => {
      const mockOverallStatus: QueryResultStatus = {
        status: QueryExecutionStatus.LOADING,
        elapsedMs: 100,
        startTime: Date.now(),
        error: undefined,
      };
      const state = createMockState({
        overallQueryStatus: mockOverallStatus,
      });

      const result = selectOverallQueryStatus(state);

      expect(result).toEqual(mockOverallStatus);
    });
  });

  describe('selectQueryStatus', () => {
    it('should return the same as selectOverallQueryStatus (alias)', () => {
      const mockOverallStatus: QueryResultStatus = {
        status: QueryExecutionStatus.LOADING,
        elapsedMs: 100,
        startTime: Date.now(),
        error: undefined,
      };
      const state = createMockState({
        overallQueryStatus: mockOverallStatus,
      });

      const overallResult = selectOverallQueryStatus(state);
      const queryResult = selectQueryStatus(state);

      expect(queryResult).toEqual(overallResult);
      expect(queryResult).toEqual(mockOverallStatus);
    });
  });

  describe('selectExecutionStatus', () => {
    it('should return the execution status from overallQueryStatus', () => {
      const state = createMockState({
        overallQueryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: undefined,
          startTime: undefined,
          error: undefined,
        },
      });

      const result = selectExecutionStatus(state);

      expect(result).toBe(QueryExecutionStatus.LOADING);
    });

    it('should return different statuses correctly', () => {
      const testCases = [
        QueryExecutionStatus.UNINITIALIZED,
        QueryExecutionStatus.LOADING,
        QueryExecutionStatus.READY,
        QueryExecutionStatus.ERROR,
        QueryExecutionStatus.NO_RESULTS,
      ];

      testCases.forEach((status) => {
        const state = createMockState({
          overallQueryStatus: {
            status,
            elapsedMs: undefined,
            startTime: undefined,
            error: undefined,
          },
        });

        const result = selectExecutionStatus(state);
        expect(result).toBe(status);
      });
    });
  });

  describe('selectIsLoading', () => {
    it('should return true when execution status === LOADING', () => {
      const state = createMockState({
        overallQueryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: undefined,
          startTime: undefined,
          error: undefined,
        },
      });

      const result = selectIsLoading(state);

      expect(result).toBe(true);
    });

    it('should return false when execution status !== LOADING', () => {
      const nonLoadingStatuses = [
        QueryExecutionStatus.UNINITIALIZED,
        QueryExecutionStatus.READY,
        QueryExecutionStatus.ERROR,
        QueryExecutionStatus.NO_RESULTS,
      ];

      nonLoadingStatuses.forEach((status) => {
        const state = createMockState({
          overallQueryStatus: {
            status,
            elapsedMs: 100,
            startTime: undefined,
            error: undefined,
          },
        });

        const result = selectIsLoading(state);
        expect(result).toBe(false);
      });
    });
  });

  describe('selectPromptModeIsAvailable', () => {
    it('should return true when promptModeIsAvailable is true', () => {
      const state = createMockState({
        promptModeIsAvailable: true,
      });

      const result = selectPromptModeIsAvailable(state);

      expect(result).toBe(true);
    });

    it('should return false when promptModeIsAvailable is false', () => {
      const state = createMockState({
        promptModeIsAvailable: false,
      });

      const result = selectPromptModeIsAvailable(state);

      expect(result).toBe(false);
    });
  });

  describe('selectPromptToQueryIsLoading', () => {
    it('should return true when promptToQueryIsLoading is true', () => {
      const state = createMockState({
        promptToQueryIsLoading: true,
      });

      const result = selectPromptToQueryIsLoading(state);

      expect(result).toBe(true);
    });

    it('should return false when promptToQueryIsLoading is false', () => {
      const state = createMockState({
        promptToQueryIsLoading: false,
      });

      const result = selectPromptToQueryIsLoading(state);

      expect(result).toBe(false);
    });
  });

  describe('selectEditorMode', () => {
    it('should return the correct editor mode', () => {
      const testModes = [
        EditorMode.SingleEmpty,
        EditorMode.SinglePrompt,
        EditorMode.SingleQuery,
        EditorMode.DualPrompt,
        EditorMode.DualQuery,
      ];

      testModes.forEach((mode) => {
        const state = createMockState({
          editorMode: mode,
        });

        const result = selectEditorMode(state);
        expect(result).toBe(mode);
      });
    });
  });

  describe('selectIsDualEditorMode', () => {
    it('should return true for DualQuery mode', () => {
      const state = createMockState({
        editorMode: EditorMode.DualQuery,
      });

      const result = selectIsDualEditorMode(state);

      expect(result).toBe(true);
    });

    it('should return true for DualPrompt mode', () => {
      const state = createMockState({
        editorMode: EditorMode.DualPrompt,
      });

      const result = selectIsDualEditorMode(state);

      expect(result).toBe(true);
    });

    it('should return false for single editor modes', () => {
      const singleModes = [EditorMode.SingleEmpty, EditorMode.SinglePrompt, EditorMode.SingleQuery];

      singleModes.forEach((mode) => {
        const state = createMockState({
          editorMode: mode,
        });

        const result = selectIsDualEditorMode(state);
        expect(result).toBe(false);
      });
    });
  });

  describe('selectTopEditorIsQueryMode', () => {
    it('should return true when promptModeIsAvailable is false regardless of editorMode', () => {
      const testModes = [
        EditorMode.SingleEmpty,
        EditorMode.SinglePrompt,
        EditorMode.SingleQuery,
        EditorMode.DualPrompt,
        EditorMode.DualQuery,
      ];

      testModes.forEach((mode) => {
        const state = createMockState({
          editorMode: mode,
          promptModeIsAvailable: false,
        });

        const result = selectTopEditorIsQueryMode(state);
        expect(result).toBe(true);
      });
    });

    it('should return true when promptModeIsAvailable is true and editorMode is SingleQuery', () => {
      const state = createMockState({
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: true,
      });

      const result = selectTopEditorIsQueryMode(state);

      expect(result).toBe(true);
    });

    it('should return false when promptModeIsAvailable is true and editorMode is SingleEmpty', () => {
      const state = createMockState({
        editorMode: EditorMode.SingleEmpty,
        promptModeIsAvailable: true,
      });

      const result = selectTopEditorIsQueryMode(state);

      expect(result).toBe(false);
    });

    it('should return false when promptModeIsAvailable is true and editorMode is SinglePrompt', () => {
      const state = createMockState({
        editorMode: EditorMode.SinglePrompt,
        promptModeIsAvailable: true,
      });

      const result = selectTopEditorIsQueryMode(state);

      expect(result).toBe(false);
    });

    it('should return false when promptModeIsAvailable is true and editorMode is DualPrompt', () => {
      const state = createMockState({
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: true,
      });

      const result = selectTopEditorIsQueryMode(state);

      expect(result).toBe(false);
    });

    it('should return false when promptModeIsAvailable is true and editorMode is DualQuery', () => {
      const state = createMockState({
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: true,
      });

      const result = selectTopEditorIsQueryMode(state);

      expect(result).toBe(false);
    });
  });
});
