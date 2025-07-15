/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  queryEditorReducer,
  queryEditorInitialState,
  QueryEditorSliceState,
  setQueryEditorState,
  setIndividualQueryStatus,
  setOverallQueryStatus,
  updateOverallQueryStatus,
  clearQueryStatusMapByKey,
  clearQueryStatusMap,
  setQueryStatus,
  updateQueryStatus,
  setEditorMode,
  setPromptModeIsAvailable,
  setPromptToQueryIsLoading,
  setLastExecutedPrompt,
} from './query_editor_slice';
import { EditorMode, QueryExecutionStatus, QueryResultStatus } from '../../types';
import { DEFAULT_EDITOR_MODE } from '../../constants';

describe('QueryEditor Slice', () => {
  const initialState: QueryEditorSliceState = {
    queryStatusMap: {},
    overallQueryStatus: {
      status: QueryExecutionStatus.UNINITIALIZED,
      elapsedMs: undefined,
      startTime: undefined,
      body: undefined,
    },
    editorMode: DEFAULT_EDITOR_MODE,
    promptModeIsAvailable: false,
    promptToQueryIsLoading: false,
    lastExecutedPrompt: '',
  };

  it('should return the initial state', () => {
    // @ts-ignore - passing undefined action
    expect(queryEditorReducer(undefined, {})).toEqual(initialState);
  });

  it('should match exported initial state', () => {
    expect(queryEditorInitialState).toEqual(initialState);
  });

  describe('setQueryEditorState', () => {
    it('should replace the entire state', () => {
      const newState: QueryEditorSliceState = {
        queryStatusMap: {
          'cache-key-1': {
            status: QueryExecutionStatus.LOADING,
            elapsedMs: 100,
            startTime: Date.now(),
            body: undefined,
          },
        },
        overallQueryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: 100,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: true,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: 'test prompt',
      };

      const action = setQueryEditorState(newState);
      const result = queryEditorReducer(initialState, action);

      expect(action.type).toBe('queryEditor/setQueryEditorState');
      expect(action.payload).toEqual(newState);
      expect(result).toEqual(newState);
    });
  });

  describe('setIndividualQueryStatus', () => {
    it('should set status for a specific cache key', () => {
      const cacheKey = 'test-cache-key';
      const status: QueryResultStatus = {
        status: QueryExecutionStatus.LOADING,
        elapsedMs: 150,
        startTime: Date.now(),
        body: undefined,
      };

      const action = setIndividualQueryStatus({ cacheKey, status });
      const result = queryEditorReducer(initialState, action);

      expect(action.type).toBe('queryEditor/setIndividualQueryStatus');
      expect(action.payload).toEqual({ cacheKey, status });
      expect(result.queryStatusMap[cacheKey]).toEqual(status);
      expect(result.overallQueryStatus).toEqual(initialState.overallQueryStatus);
    });

    it('should update existing cache key status', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        queryStatusMap: {
          key1: {
            status: QueryExecutionStatus.LOADING,
            elapsedMs: undefined,
            startTime: Date.now(),
            body: undefined,
          },
          key2: {
            status: QueryExecutionStatus.READY,
            elapsedMs: 200,
            startTime: Date.now(),
            body: undefined,
          },
        },
      };

      const newStatus: QueryResultStatus = {
        status: QueryExecutionStatus.READY,
        elapsedMs: 300,
        startTime: Date.now(),
        body: {
          error: {
            error: 'test error',
            message: {
              error: 'test message',
              status: 500,
            },
            statusCode: 500,
          },
        },
      };

      const result = queryEditorReducer(
        existingState,
        setIndividualQueryStatus({ cacheKey: 'key1', status: newStatus })
      );

      expect(result.queryStatusMap.key1).toEqual(newStatus);
      expect(result.queryStatusMap.key2).toEqual(existingState.queryStatusMap.key2);
    });
  });

  describe('setOverallQueryStatus', () => {
    it('should set the overall query status', () => {
      const newStatus: QueryResultStatus = {
        status: QueryExecutionStatus.LOADING,
        elapsedMs: 150,
        startTime: Date.now(),
        body: undefined,
      };

      const action = setOverallQueryStatus(newStatus);
      const result = queryEditorReducer(initialState, action);

      expect(action.type).toBe('queryEditor/setOverallQueryStatus');
      expect(action.payload).toEqual(newStatus);
      expect(result.overallQueryStatus).toEqual(newStatus);
      expect(result.queryStatusMap).toEqual(initialState.queryStatusMap);
    });
  });

  describe('updateOverallQueryStatus', () => {
    it('should partially update the overall query status', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        overallQueryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: undefined,
          startTime: Date.now(),
          body: undefined,
        },
      };

      const statusUpdate = {
        status: QueryExecutionStatus.READY,
        elapsedMs: 300,
      };

      const action = updateOverallQueryStatus(statusUpdate);
      const result = queryEditorReducer(existingState, action);

      expect(action.type).toBe('queryEditor/updateOverallQueryStatus');
      expect(action.payload).toEqual(statusUpdate);
      expect(result.overallQueryStatus.status).toBe(QueryExecutionStatus.READY);
      expect(result.overallQueryStatus.elapsedMs).toBe(300);
      expect(result.overallQueryStatus.startTime).toBe(existingState.overallQueryStatus.startTime);
      expect(result.overallQueryStatus.body).toBe(existingState.overallQueryStatus.body);
    });
  });

  describe('clearQueryStatusMapByKey', () => {
    it('should remove a specific cache key from queryStatusMap', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        queryStatusMap: {
          key1: {
            status: QueryExecutionStatus.LOADING,
            elapsedMs: undefined,
            startTime: Date.now(),
            body: undefined,
          },
          key2: {
            status: QueryExecutionStatus.READY,
            elapsedMs: 200,
            startTime: Date.now(),
            body: undefined,
          },
        },
      };

      const action = clearQueryStatusMapByKey('key1');
      const result = queryEditorReducer(existingState, action);

      expect(action.type).toBe('queryEditor/clearQueryStatusMapByKey');
      expect(action.payload).toBe('key1');
      expect(result.queryStatusMap.key1).toBeUndefined();
      expect(result.queryStatusMap.key2).toEqual(existingState.queryStatusMap.key2);
    });

    it('should handle clearing non-existent key gracefully', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        queryStatusMap: {
          key1: {
            status: QueryExecutionStatus.READY,
            elapsedMs: 200,
            startTime: Date.now(),
            body: undefined,
          },
        },
      };

      const result = queryEditorReducer(existingState, clearQueryStatusMapByKey('non-existent'));

      expect(result.queryStatusMap).toEqual(existingState.queryStatusMap);
    });
  });

  describe('clearQueryStatusMap', () => {
    it('should clear the entire queryStatusMap and reset overallQueryStatus', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        queryStatusMap: {
          key1: {
            status: QueryExecutionStatus.LOADING,
            elapsedMs: undefined,
            startTime: Date.now(),
            body: undefined,
          },
          key2: {
            status: QueryExecutionStatus.READY,
            elapsedMs: 200,
            startTime: Date.now(),
            body: undefined,
          },
        },
        overallQueryStatus: {
          status: QueryExecutionStatus.READY,
          elapsedMs: 500,
          startTime: Date.now(),
          body: {
            error: {
              error: 'test error',
              message: {
                error: 'test message',
                status: 500,
              },
              statusCode: 500,
            },
          },
        },
      };

      const action = clearQueryStatusMap();
      const result = queryEditorReducer(existingState, action);

      expect(action.type).toBe('queryEditor/clearQueryStatusMap');
      expect(result.queryStatusMap).toEqual({});
      expect(result.overallQueryStatus).toEqual({
        status: QueryExecutionStatus.UNINITIALIZED,
        elapsedMs: undefined,
        startTime: undefined,
        body: undefined,
      });
      expect(result.editorMode).toBe(existingState.editorMode);
      expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
    });
  });

  describe('Legacy actions', () => {
    describe('setQueryStatus', () => {
      it('should handle setQueryStatus action (legacy)', () => {
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
        expect(newState.overallQueryStatus).toEqual(newQueryStatus);
        expect(newState.editorMode).toBe(initialState.editorMode);
        expect(newState.promptModeIsAvailable).toBe(initialState.promptModeIsAvailable);
      });

      it('should preserve other state properties', () => {
        const existingState: QueryEditorSliceState = {
          ...initialState,
          editorMode: EditorMode.DualPrompt,
          promptModeIsAvailable: true,
          lastExecutedPrompt: 'existing prompt',
        };

        const newQueryStatus: QueryResultStatus = {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: 200,
          startTime: Date.now(),
          body: undefined,
        };

        const result = queryEditorReducer(existingState, setQueryStatus(newQueryStatus));

        expect(result.overallQueryStatus).toEqual(newQueryStatus);
        expect(result.editorMode).toBe(EditorMode.DualPrompt);
        expect(result.promptModeIsAvailable).toBe(true);
      });
    });

    describe('updateQueryStatus', () => {
      it('should handle updateQueryStatus action (legacy)', () => {
        const existingState: QueryEditorSliceState = {
          ...initialState,
          overallQueryStatus: {
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
        expect(result.overallQueryStatus.status).toBe(QueryExecutionStatus.READY);
        expect(result.overallQueryStatus.elapsedMs).toBe(300);
        expect(result.overallQueryStatus.startTime).toBe(
          existingState.overallQueryStatus.startTime
        );
        expect(result.overallQueryStatus.body).toBe(existingState.overallQueryStatus.body);
        expect(result.editorMode).toBe(existingState.editorMode);
        expect(result.promptModeIsAvailable).toBe(existingState.promptModeIsAvailable);
      });
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
      expect(newState.overallQueryStatus).toEqual(initialState.overallQueryStatus);
      expect(newState.promptModeIsAvailable).toBe(initialState.promptModeIsAvailable);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        overallQueryStatus: {
          status: QueryExecutionStatus.LOADING,
          elapsedMs: 100,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: true,
        lastExecutedPrompt: 'original prompt',
      };

      const result = queryEditorReducer(existingState, setEditorMode(EditorMode.DualPrompt));

      expect(result.editorMode).toBe(EditorMode.DualPrompt);
      expect(result.overallQueryStatus).toEqual(existingState.overallQueryStatus);
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
      expect(newState.overallQueryStatus).toEqual(initialState.overallQueryStatus);
      expect(newState.editorMode).toBe(initialState.editorMode);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        overallQueryStatus: {
          status: QueryExecutionStatus.READY,
          elapsedMs: 250,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: false,
        lastExecutedPrompt: 'some prompt',
      };

      const result = queryEditorReducer(existingState, setPromptModeIsAvailable(true));

      expect(result.promptModeIsAvailable).toBe(true);
      expect(result.overallQueryStatus).toEqual(existingState.overallQueryStatus);
      expect(result.editorMode).toBe(EditorMode.DualQuery);
    });
  });

  describe('setPromptToQueryIsLoading', () => {
    it('should handle setPromptToQueryIsLoading action', () => {
      const action = setPromptToQueryIsLoading(true);

      expect(action.type).toBe('queryEditor/setPromptToQueryIsLoading');
      expect(action.payload).toBe(true);

      const newState = queryEditorReducer(initialState, action);
      expect(newState.promptToQueryIsLoading).toBe(true);
      expect(newState.overallQueryStatus).toEqual(initialState.overallQueryStatus);
      expect(newState.editorMode).toBe(initialState.editorMode);
      expect(newState.promptModeIsAvailable).toBe(initialState.promptModeIsAvailable);
    });

    it('should set loading to false', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        promptToQueryIsLoading: true,
      };

      const action = setPromptToQueryIsLoading(false);
      const result = queryEditorReducer(existingState, action);

      expect(result.promptToQueryIsLoading).toBe(false);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        overallQueryStatus: {
          status: QueryExecutionStatus.READY,
          elapsedMs: 300,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: true,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: 'test prompt',
      };

      const result = queryEditorReducer(existingState, setPromptToQueryIsLoading(true));

      expect(result.promptToQueryIsLoading).toBe(true);
      expect(result.overallQueryStatus).toEqual(existingState.overallQueryStatus);
      expect(result.editorMode).toBe(EditorMode.DualPrompt);
      expect(result.promptModeIsAvailable).toBe(true);
      expect(result.lastExecutedPrompt).toBe('test prompt');
    });
  });

  describe('setLastExecutedPrompt', () => {
    it('should handle setLastExecutedPrompt action', () => {
      const newPrompt = 'source=logs | where level="error"';
      const action = setLastExecutedPrompt(newPrompt);

      expect(action.type).toBe('queryEditor/setLastExecutedPrompt');
      expect(action.payload).toBe(newPrompt);

      const newState = queryEditorReducer(initialState, action);
      expect(newState.lastExecutedPrompt).toBe(newPrompt);
      expect(newState.overallQueryStatus).toEqual(initialState.overallQueryStatus);
      expect(newState.editorMode).toBe(initialState.editorMode);
      expect(newState.promptModeIsAvailable).toBe(initialState.promptModeIsAvailable);
    });

    it('should preserve other state properties', () => {
      const existingState: QueryEditorSliceState = {
        ...initialState,
        overallQueryStatus: {
          status: QueryExecutionStatus.READY,
          elapsedMs: 300,
          startTime: Date.now(),
          body: undefined,
        },
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: true,
        lastExecutedPrompt: 'old prompt',
      };

      const newPrompt = 'source=users | head 10';
      const result = queryEditorReducer(existingState, setLastExecutedPrompt(newPrompt));

      expect(result.lastExecutedPrompt).toBe(newPrompt);
      expect(result.overallQueryStatus).toEqual(existingState.overallQueryStatus);
      expect(result.editorMode).toBe(EditorMode.DualPrompt);
      expect(result.promptModeIsAvailable).toBe(true);
    });
  });
});
