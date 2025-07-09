/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  queryEditorReducer,
  QueryEditorSliceState,
  resetEditorMode,
  setEditorMode,
  setPromptModeIsAvailable,
  setQueryEditorState,
  setQueryStatus,
  toggleDualEditorMode,
  updateQueryStatus,
} from './query_editor_slice';
import { EditorMode, QueryExecutionStatus, QueryResultStatus } from '../../types';
import { DEFAULT_EDITOR_MODE } from '../../constants';

describe('QueryEditor Slice', () => {
  const initialState: QueryEditorSliceState = {
    queryStatus: {
      status: QueryExecutionStatus.UNINITIALIZED,
      elapsedMs: undefined,
      startTime: undefined,
      body: undefined,
    },
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
        queryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: 100,
          startTime: Date.now(),
          body: undefined,
        },
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

  describe('setQueryStatus', () => {
    it('should handle setQueryStatus action', () => {
      const newQueryStatus: QueryResultStatus = {
        status: QueryExecutionStatus.LOADING,
        elapsedMs: 150,
        startTime: Date.now(),
        body: undefined,
      };
      const action = setQueryStatus(newQueryStatus);

      expect(action.type).toBe('queryEditor/setQueryStatus');
      expect(action.payload).toEqual(newQueryStatus);

      const newState = queryEditorReducer(initialState, action);
      expect(newState.queryStatus).toEqual(newQueryStatus);
      expect(newState.editorMode).toBe(initialState.editorMode);
      expect(newState.promptModeIsAvailable).toBe(initialState.promptModeIsAvailable);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        queryStatus: {
          status: QueryExecutionStatus.UNINITIALIZED,
          elapsedMs: undefined,
          startTime: undefined,
          body: undefined,
        },
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: true,
      };

      const newQueryStatus: QueryResultStatus = {
        status: QueryExecutionStatus.LOADING,
        elapsedMs: 200,
        startTime: Date.now(),
        body: undefined,
      };

      const result = queryEditorReducer(existingState, setQueryStatus(newQueryStatus));

      expect(result.queryStatus).toEqual(newQueryStatus);
      expect(result.editorMode).toBe(EditorMode.DualPrompt);
      expect(result.promptModeIsAvailable).toBe(true);
    });
  });

  describe('updateQueryStatus', () => {
    it('should handle updateQueryStatus action', () => {
      const existingState: QueryEditorSliceState = {
        queryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: undefined,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: false,
      };

      const statusUpdate = {
        status: QueryExecutionStatus.READY,
        elapsedMs: 300,
      };

      const action = updateQueryStatus(statusUpdate);
      const result = queryEditorReducer(existingState, action);

      expect(action.type).toBe('queryEditor/updateQueryStatus');
      expect(action.payload).toEqual(statusUpdate);
      expect(result.queryStatus.status).toBe(QueryExecutionStatus.READY);
      expect(result.queryStatus.elapsedMs).toBe(300);
      expect(result.queryStatus.startTime).toBe(existingState.queryStatus.startTime);
      expect(result.queryStatus.body).toBe(existingState.queryStatus.body);
      expect(result.editorMode).toBe(existingState.editorMode);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
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
      expect(newState.queryStatus).toEqual(initialState.queryStatus);
      expect(newState.promptModeIsAvailable).toBe(initialState.promptModeIsAvailable);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        queryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: 100,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: true,
      };

      const result = queryEditorReducer(existingState, setEditorMode(EditorMode.DualPrompt));

      expect(result.editorMode).toBe(EditorMode.DualPrompt);
      expect(result.queryStatus).toEqual(existingState.queryStatus);
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
      expect(newState.queryStatus).toEqual(initialState.queryStatus);
      expect(newState.editorMode).toBe(initialState.editorMode);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        queryStatus: {
          status: QueryExecutionStatus.READY,
          elapsedMs: 250,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: false,
      };

      const result = queryEditorReducer(existingState, setPromptModeIsAvailable(true));

      expect(result.promptModeIsAvailable).toBe(true);
      expect(result.queryStatus).toEqual(existingState.queryStatus);
      expect(result.editorMode).toBe(EditorMode.DualQuery);
    });
  });

  describe('resetEditorMode', () => {
    it('should reset editor mode to default', () => {
      const existingState: QueryEditorSliceState = {
        queryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: 100,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: true,
      };

      const action = resetEditorMode();
      const result = queryEditorReducer(existingState, action);

      expect(action.type).toBe('queryEditor/resetEditorMode');
      expect(action.payload).toBeUndefined();
      expect(result.editorMode).toBe(DEFAULT_EDITOR_MODE);
      expect(result.queryStatus).toEqual(existingState.queryStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });
  });

  describe('toggleDualEditorMode', () => {
    it('should toggle from DualQuery to DualPrompt', () => {
      const existingState: QueryEditorSliceState = {
        queryStatus: {
          status: QueryExecutionStatus.READY,
          elapsedMs: 200,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: true,
      };

      const action = toggleDualEditorMode();
      const result = queryEditorReducer(existingState, action);

      expect(action.type).toBe('queryEditor/toggleDualEditorMode');
      expect(action.payload).toBeUndefined();
      expect(result.editorMode).toBe(EditorMode.DualPrompt);
      expect(result.queryStatus).toEqual(existingState.queryStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });

    it('should toggle from DualPrompt to DualQuery', () => {
      const existingState: QueryEditorSliceState = {
        queryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: undefined,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: false,
      };

      const result = queryEditorReducer(existingState, toggleDualEditorMode());

      expect(result.editorMode).toBe(EditorMode.DualQuery);
      expect(result.queryStatus).toEqual(existingState.queryStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });

    it('should not change mode when in SingleQuery', () => {
      const existingState: QueryEditorSliceState = {
        queryStatus: {
          status: QueryExecutionStatus.ERROR,
          elapsedMs: 500,
          startTime: Date.now(),
          body: { error: { error: 'Test error' } },
        },
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: true,
      };

      const result = queryEditorReducer(existingState, toggleDualEditorMode());

      expect(result.editorMode).toBe(EditorMode.SingleQuery);
      expect(result.queryStatus).toEqual(existingState.queryStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });

    it('should not change mode when in SinglePrompt', () => {
      const existingState: QueryEditorSliceState = {
        queryStatus: {
          status: QueryExecutionStatus.NO_RESULTS,
          elapsedMs: 150,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.SinglePrompt,
        promptModeIsAvailable: false,
      };

      const result = queryEditorReducer(existingState, toggleDualEditorMode());

      expect(result.editorMode).toBe(EditorMode.SinglePrompt);
      expect(result.queryStatus).toEqual(existingState.queryStatus);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });
  });
});
