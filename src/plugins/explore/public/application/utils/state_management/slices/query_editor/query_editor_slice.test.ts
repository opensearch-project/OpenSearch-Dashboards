/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  queryEditorReducer,
  setQueryEditorState,
  setExecutionStatus,
  setEditorMode,
  setPromptModeIsAvailable,
  resetEditorMode,
  toggleDualEditorMode,
  QueryEditorSliceState,
} from './query_editor_slice';
import { QueryExecutionStatus, EditorMode } from '../../types';
import { DEFAULT_EDITOR_MODE } from '../../constants';

describe('QueryEditor Slice', () => {
  const initialState: QueryEditorSliceState = {
    executionStatus: QueryExecutionStatus.UNINITIALIZED,
    editorMode: DEFAULT_EDITOR_MODE,
    promptModeIsAvailable: false,
  };

  it('should return the initial state', () => {
    // @ts-ignore - passing undefined action
    expect(queryEditorReducer(undefined, {})).toEqual(initialState);
  });

  describe('setQueryEditorState', () => {
    it('should replace the entire state', () => {
      const newState: QueryEditorSliceState = {
        executionStatus: QueryExecutionStatus.LOADING,
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: true,
      };

      const action = setQueryEditorState(newState);
      const result = queryEditorReducer(initialState, action);

      expect(action.type).toBe('queryEditor/setQueryEditorState');
      expect(action.payload).toEqual(newState);
      expect(result).toEqual(newState);
    });
  });

  describe('setExecutionStatus', () => {
    it('should handle setExecutionStatus action', () => {
      const newStatus = QueryExecutionStatus.LOADING;
      const action = setExecutionStatus(newStatus);

      expect(action.type).toBe('queryEditor/setExecutionStatus');
      expect(action.payload).toBe(newStatus);

      const newState = queryEditorReducer(initialState, action);
      expect(newState.executionStatus).toBe(newStatus);
      expect(newState.editorMode).toBe(initialState.editorMode);
      expect(newState.promptModeIsAvailable).toBe(initialState.promptModeIsAvailable);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        executionStatus: QueryExecutionStatus.UNINITIALIZED,
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: true,
      };

      const result = queryEditorReducer(
        existingState,
        setExecutionStatus(QueryExecutionStatus.LOADING)
      );

      expect(result.executionStatus).toBe(QueryExecutionStatus.LOADING);
      expect(result.editorMode).toBe(EditorMode.DualPrompt);
      expect(result.promptModeIsAvailable).toBe(true);
    });
  });

  describe('setEditorMode', () => {
    it('should handle setEditorMode action', () => {
      const newMode = EditorMode.DualQuery;
      const action = setEditorMode(newMode);

      expect(action.type).toBe('queryEditor/setEditorMode');
      expect(action.payload).toBe(newMode);

      const newState = queryEditorReducer(initialState, action);
      expect(newState.editorMode).toBe(newMode);
      expect(newState.executionStatus).toBe(initialState.executionStatus);
      expect(newState.promptModeIsAvailable).toBe(initialState.promptModeIsAvailable);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        executionStatus: QueryExecutionStatus.LOADING,
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: true,
      };

      const result = queryEditorReducer(existingState, setEditorMode(EditorMode.DualPrompt));

      expect(result.editorMode).toBe(EditorMode.DualPrompt);
      expect(result.executionStatus).toBe(QueryExecutionStatus.LOADING);
      expect(result.promptModeIsAvailable).toBe(true);
    });
  });

  describe('setPromptModeIsAvailable', () => {
    it('should handle setPromptModeIsAvailable action', () => {
      const action = setPromptModeIsAvailable(true);

      expect(action.type).toBe('queryEditor/setPromptModeIsAvailable');
      expect(action.payload).toBe(true);

      const newState = queryEditorReducer(initialState, action);
      expect(newState.promptModeIsAvailable).toBe(true);
      expect(newState.executionStatus).toBe(initialState.executionStatus);
      expect(newState.editorMode).toBe(initialState.editorMode);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        executionStatus: QueryExecutionStatus.READY,
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: false,
      };

      const result = queryEditorReducer(existingState, setPromptModeIsAvailable(true));

      expect(result.promptModeIsAvailable).toBe(true);
      expect(result.executionStatus).toBe(QueryExecutionStatus.READY);
      expect(result.editorMode).toBe(EditorMode.DualQuery);
    });
  });

  describe('resetEditorMode', () => {
    it('should reset editor mode to default', () => {
      const existingState: QueryEditorSliceState = {
        executionStatus: QueryExecutionStatus.LOADING,
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: true,
      };

      const action = resetEditorMode();
      const result = queryEditorReducer(existingState, action);

      expect(action.type).toBe('queryEditor/resetEditorMode');
      expect(action.payload).toBeUndefined();
      expect(result.editorMode).toBe(DEFAULT_EDITOR_MODE);
      expect(result.executionStatus).toBe(existingState.executionStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });
  });

  describe('toggleDualEditorMode', () => {
    it('should toggle from DualQuery to DualPrompt', () => {
      const existingState: QueryEditorSliceState = {
        executionStatus: QueryExecutionStatus.READY,
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: true,
      };

      const action = toggleDualEditorMode();
      const result = queryEditorReducer(existingState, action);

      expect(action.type).toBe('queryEditor/toggleDualEditorMode');
      expect(action.payload).toBeUndefined();
      expect(result.editorMode).toBe(EditorMode.DualPrompt);
      expect(result.executionStatus).toBe(existingState.executionStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });

    it('should toggle from DualPrompt to DualQuery', () => {
      const existingState: QueryEditorSliceState = {
        executionStatus: QueryExecutionStatus.LOADING,
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: false,
      };

      const result = queryEditorReducer(existingState, toggleDualEditorMode());

      expect(result.editorMode).toBe(EditorMode.DualQuery);
      expect(result.executionStatus).toBe(existingState.executionStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });

    it('should not change mode when in SingleQuery', () => {
      const existingState: QueryEditorSliceState = {
        executionStatus: QueryExecutionStatus.ERROR,
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: true,
      };

      const result = queryEditorReducer(existingState, toggleDualEditorMode());

      expect(result.editorMode).toBe(EditorMode.SingleQuery);
      expect(result.executionStatus).toBe(existingState.executionStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });

    it('should not change mode when in SinglePrompt', () => {
      const existingState: QueryEditorSliceState = {
        executionStatus: QueryExecutionStatus.NO_RESULTS,
        editorMode: EditorMode.SinglePrompt,
        promptModeIsAvailable: false,
      };

      const result = queryEditorReducer(existingState, toggleDualEditorMode());

      expect(result.editorMode).toBe(EditorMode.SinglePrompt);
      expect(result.executionStatus).toBe(existingState.executionStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });
  });
});
