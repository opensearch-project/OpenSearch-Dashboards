/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  selectQueryStatus,
  selectExecutionStatus,
  selectIsLoading,
  selectEditorMode,
  selectIsDualEditorMode,
  selectPromptModeIsAvailable,
} from './query_editor';
import { RootState } from '../../store';
import { EditorMode, QueryExecutionStatus } from '../../types';

describe('query_editor selectors', () => {
  const createMockState = (queryEditorState: Partial<RootState['queryEditor']>): RootState => ({
    queryEditor: {
      queryStatus: {
        status: QueryExecutionStatus.UNINITIALIZED,
        elapsedMs: undefined,
        startTime: undefined,
        body: undefined,
      },
      editorMode: EditorMode.SingleQuery,
      promptModeIsAvailable: false,
      ...queryEditorState,
    },
    // Add other required state slices as minimal mocks
    ui: {} as any,
    results: {} as any,
    tab: {} as any,
    legacy: {} as any,
    query: {} as any,
  });

  describe('selectQueryStatus', () => {
    it('should return the full queryStatus from queryEditor state', () => {
      const mockQueryStatus = {
        status: QueryExecutionStatus.LOADING,
        elapsedMs: 100,
        startTime: Date.now(),
        body: undefined,
      };
      const state = createMockState({
        queryStatus: mockQueryStatus,
      });

      const result = selectQueryStatus(state);

      expect(result).toEqual(mockQueryStatus);
    });
  });

  describe('selectExecutionStatus', () => {
    it('should return the execution status from queryEditor state', () => {
      const state = createMockState({
        queryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: undefined,
          startTime: undefined,
          body: undefined,
        },
      });

      const result = selectExecutionStatus(state);

      expect(result).toBe(QueryExecutionStatus.LOADING);
    });
  });

  describe('selectIsLoading', () => {
    it('should return true when execution status === LOADING', () => {
      const state = createMockState({
        queryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: undefined,
          startTime: undefined,
          body: undefined,
        },
      });

      const result = selectIsLoading(state);

      expect(result).toBe(true);
    });

    it('should return false when execution status !== LOADING', () => {
      const state = createMockState({
        queryStatus: {
          status: QueryExecutionStatus.READY,
          elapsedMs: 100,
          startTime: undefined,
          body: undefined,
        },
      });

      const result = selectIsLoading(state);

      expect(result).toBe(false);
    });
  });

  describe('selectPromptModeIsAvailable', () => {
    it('should return true if true', () => {
      const state = createMockState({
        promptModeIsAvailable: true,
      });

      const result = selectPromptModeIsAvailable(state);

      expect(result).toBe(true);
    });
  });

  describe('selectEditorMode', () => {
    it('should return correct mode', () => {
      const state = createMockState({
        editorMode: EditorMode.SingleQuery,
      });

      const result = selectEditorMode(state);

      expect(result).toBe(EditorMode.SingleQuery);
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

    it('should return false for SingleQuery mode', () => {
      const state = createMockState({
        editorMode: EditorMode.SingleQuery,
      });

      const result = selectIsDualEditorMode(state);

      expect(result).toBe(false);
    });
  });
});
