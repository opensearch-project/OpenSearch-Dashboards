/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { onEditorRunActionCreator } from './on_editor_run';
import { callAgentActionCreator } from './call_agent';
import { runQueryActionCreator } from '../run_query';
import { clearLastExecutedData } from '../../../slices';
import { EditorMode } from '../../../types';
import { ExploreServices } from '../../../../../../types';
import { AppDispatch, RootState } from '../../../store';
import { createMockRootState } from '../../../__mocks__/store';
import { QueryExecutionButtonStatus } from '../../../slices/query_editor/query_editor_slice';

// Mock the dependencies
jest.mock('./call_agent', () => ({
  callAgentActionCreator: jest.fn(),
}));

jest.mock('../../../slices', () => ({
  clearLastExecutedData: jest.fn(),
}));

jest.mock('../run_query', () => ({
  runQueryActionCreator: jest.fn(),
}));

const mockCallAgentActionCreator = callAgentActionCreator as jest.MockedFunction<
  typeof callAgentActionCreator
>;
const mockClearLastExecutedData = clearLastExecutedData as jest.MockedFunction<
  typeof clearLastExecutedData
>;
const mockRunQueryActionCreator = runQueryActionCreator as jest.MockedFunction<
  typeof runQueryActionCreator
>;

describe('onEditorRunActionCreator', () => {
  let mockServices: ExploreServices;
  let mockDispatch: jest.MockedFunction<AppDispatch>;
  let mockGetState: jest.MockedFunction<() => RootState>;
  const testEditorText = 'Show me all users';

  // Helper function to create mock state with overrides
  const createTestState = (overrides: Partial<RootState['queryEditor']> = {}) => {
    return createMockRootState({
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      queryEditor: {
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'UNINITIALIZED' as any,
          elapsedMs: undefined,
          startTime: undefined,
        },
        editorMode: EditorMode.Query,
        promptModeIsAvailable: true,
        promptToQueryIsLoading: false,
        summaryAgentIsAvailable: false,
        lastExecutedPrompt: '',
        lastExecutedTranslatedQuery: '',
        queryExecutionButtonStatus: 'REFRESH' as QueryExecutionButtonStatus,
        dateRange: undefined,
        isQueryEditorDirty: false,
        ...overrides,
      },
    });
  };

  // Helper function to set mock state
  const setMockState = (overrides: Partial<RootState['queryEditor']> = {}) => {
    mockGetState.mockReturnValue(createTestState(overrides));
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    mockGetState = jest.fn();

    mockServices = ({
      notifications: {
        toasts: {
          addWarning: jest.fn(),
        },
      },
      data: {
        query: {
          queryString: {
            getQuery: jest.fn().mockReturnValue({
              query: '',
            }),
          },
        },
      },
    } as unknown) as ExploreServices;

    // Default state with REFRESH status
    setMockState();

    // Mock return values
    mockCallAgentActionCreator.mockReturnValue(jest.fn());
    mockClearLastExecutedData.mockReturnValue({
      type: 'queryEditor/clearLastExecutedData',
      payload: undefined,
    });
    mockRunQueryActionCreator.mockReturnValue(jest.fn());
  });

  it('should return early when queryExecutionButtonStatus is DISABLED', () => {
    mockGetState.mockReturnValue(
      createMockRootState({
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        queryEditor: {
          queryStatusMap: {},
          overallQueryStatus: {
            status: 'UNINITIALIZED' as any,
            elapsedMs: undefined,
            startTime: undefined,
          },
          editorMode: EditorMode.Query,
          promptModeIsAvailable: true,
          promptToQueryIsLoading: false,
          summaryAgentIsAvailable: false,
          lastExecutedPrompt: '',
          lastExecutedTranslatedQuery: '',
          queryExecutionButtonStatus: 'DISABLED',
          dateRange: undefined,
          isQueryEditorDirty: false,
        },
      })
    );

    const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
    actionCreator(mockDispatch, mockGetState);

    // Should not dispatch anything when disabled
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockClearLastExecutedData).not.toHaveBeenCalled();
    expect(mockRunQueryActionCreator).not.toHaveBeenCalled();
    expect(mockCallAgentActionCreator).not.toHaveBeenCalled();
  });

  it('should always dispatch clearLastExecutedData first when enabled', () => {
    mockGetState.mockReturnValue(
      createMockRootState({
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        queryEditor: {
          queryStatusMap: {},
          overallQueryStatus: {
            status: 'UNINITIALIZED' as any,
            elapsedMs: undefined,
            startTime: undefined,
          },
          editorMode: EditorMode.Query,
          promptModeIsAvailable: true,
          promptToQueryIsLoading: false,
          summaryAgentIsAvailable: false,
          lastExecutedPrompt: '',
          lastExecutedTranslatedQuery: '',
          queryExecutionButtonStatus: 'REFRESH' as QueryExecutionButtonStatus,
          dateRange: undefined,
          isQueryEditorDirty: false,
        },
      })
    );

    const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
    actionCreator(mockDispatch, mockGetState);

    expect(mockDispatch).toHaveBeenCalledWith(mockClearLastExecutedData());
  });

  describe('Prompt mode', () => {
    beforeEach(() => {
      setMockState({ editorMode: EditorMode.Prompt });
    });

    it('should dispatch callAgentActionCreator when prompt mode is available', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
      const mockCallAgentThunk = jest.fn();
      mockCallAgentActionCreator.mockReturnValue(mockCallAgentThunk);

      actionCreator(mockDispatch, mockGetState);

      expect(mockCallAgentActionCreator).toHaveBeenCalledWith({
        services: mockServices,
        editorText: testEditorText,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockCallAgentThunk);
    });

    it('should show warning when prompt mode is not available', () => {
      setMockState({
        editorMode: EditorMode.Prompt,
        promptModeIsAvailable: false,
      });

      const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockServices.notifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'Unavailable',
        text: 'Query assist feature is not enabled or configured.',
        id: 'queryAssist-not-available',
      });
      expect(mockCallAgentActionCreator).not.toHaveBeenCalled();
    });

    it('should still dispatch clearLastExecutedData even when prompt mode unavailable', () => {
      mockGetState.mockReturnValue(
        createMockRootState({
          // @ts-expect-error TS2741 TODO(ts-error): fixme
          queryEditor: {
            queryStatusMap: {},
            overallQueryStatus: {
              status: 'UNINITIALIZED' as any,
              elapsedMs: undefined,
              startTime: undefined,
            },
            editorMode: EditorMode.Prompt,
            promptModeIsAvailable: false,
            promptToQueryIsLoading: false,
            summaryAgentIsAvailable: false,
            lastExecutedPrompt: '',
            lastExecutedTranslatedQuery: '',
            queryExecutionButtonStatus: 'REFRESH' as QueryExecutionButtonStatus,
            dateRange: undefined,
            isQueryEditorDirty: false,
          },
        })
      );

      const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockDispatch).toHaveBeenCalledWith(mockClearLastExecutedData());
    });

    it('should return early in prompt mode when queryExecutionButtonStatus is DISABLED', () => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.Prompt,
          promptModeIsAvailable: true,
          queryExecutionButtonStatus: 'DISABLED',
        },
      } as RootState);

      const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockClearLastExecutedData).not.toHaveBeenCalled();
      expect(mockCallAgentActionCreator).not.toHaveBeenCalled();
    });

    it('should work with different editor text', () => {
      const customText = 'Find all errors in logs';
      const actionCreator = onEditorRunActionCreator(mockServices, customText);

      actionCreator(mockDispatch, mockGetState);

      expect(mockCallAgentActionCreator).toHaveBeenCalledWith({
        services: mockServices,
        editorText: customText,
      });
    });

    it('should work with empty editor text', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, '');

      actionCreator(mockDispatch, mockGetState);

      expect(mockCallAgentActionCreator).toHaveBeenCalledWith({
        services: mockServices,
        editorText: '',
      });
    });
  });

  describe('Query mode', () => {
    beforeEach(() => {
      setMockState(); // Uses default Query mode
    });

    it('should dispatch runQueryActionCreator with editor text', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
      const mockRunQueryThunk = jest.fn();
      mockRunQueryActionCreator.mockReturnValue(mockRunQueryThunk);

      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, testEditorText);
      expect(mockDispatch).toHaveBeenCalledWith(mockRunQueryThunk);
    });

    it('should work with different query text', () => {
      const queryText = '| where user_type="admin"';
      const actionCreator = onEditorRunActionCreator(mockServices, queryText);

      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, queryText);
    });

    it('should work with empty query text', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, '');

      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, '');
    });

    it('should work regardless of promptModeIsAvailable value', () => {
      setMockState({ promptModeIsAvailable: false });

      const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, testEditorText);
    });

    it('should return early in query mode when queryExecutionButtonStatus is DISABLED', () => {
      setMockState({ queryExecutionButtonStatus: 'DISABLED' as QueryExecutionButtonStatus });

      const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
      actionCreator(mockDispatch, mockGetState);

      // Should not dispatch anything when disabled
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockClearLastExecutedData).not.toHaveBeenCalled();
      expect(mockRunQueryActionCreator).not.toHaveBeenCalled();
    });
  });

  describe('execution flow', () => {
    it('should execute clearLastExecutedData before callAgent in Prompt mode', () => {
      const calls: string[] = [];

      setMockState({ editorMode: EditorMode.Prompt });

      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'queryEditor/clearLastExecutedData') {
          calls.push('clearLastExecutedData');
        } else if (typeof action === 'function') {
          calls.push('callAgent');
        }
      });

      const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(calls).toEqual(['clearLastExecutedData', 'callAgent']);
    });

    it('should execute clearLastExecutedData before runQuery in Query mode', () => {
      const calls: string[] = [];

      setMockState(); // Uses default Query mode

      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'queryEditor/clearLastExecutedData') {
          calls.push('clearLastExecutedData');
        } else if (typeof action === 'function') {
          calls.push('runQuery');
        }
      });

      const actionCreator = onEditorRunActionCreator(mockServices, testEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(calls).toEqual(['clearLastExecutedData', 'runQuery']);
    });
  });
});
