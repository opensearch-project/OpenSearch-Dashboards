/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { onEditorRunActionCreator } from './on_editor_run';
import { callAgentActionCreator } from './call_agent';
import { setEditorMode } from '../../../slices';
import { runQueryActionCreator } from '../run_query';
import { EditorMode } from '../../../types';
import { ExploreServices } from '../../../../../../types';
import { EditorContextValue } from '../../../../../context';
import { AppDispatch, RootState } from '../../../store';

// Mock the dependencies
jest.mock('./call_agent', () => ({
  callAgentActionCreator: jest.fn(),
}));

jest.mock('../../../slices', () => ({
  setEditorMode: jest.fn(),
}));

jest.mock('../run_query', () => ({
  runQueryActionCreator: jest.fn(),
}));

const mockCallAgentActionCreator = callAgentActionCreator as jest.MockedFunction<
  typeof callAgentActionCreator
>;
const mockSetEditorMode = setEditorMode as jest.MockedFunction<typeof setEditorMode>;
const mockRunQueryActionCreator = runQueryActionCreator as jest.MockedFunction<
  typeof runQueryActionCreator
>;

describe('onEditorRunActionCreator', () => {
  let mockServices: ExploreServices;
  let mockEditorContext: EditorContextValue;
  let mockDispatch: jest.MockedFunction<AppDispatch>;
  let mockGetState: jest.MockedFunction<() => RootState>;

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
    } as unknown) as ExploreServices;

    mockEditorContext = {
      editorText: 'some query',
      setEditorText: jest.fn(),
      clearEditors: jest.fn(),
      clearEditorsAndSetText: jest.fn(),
      setBottomEditorText: jest.fn(),
      query: 'some query',
      prompt: 'Show me all users',
    };

    // Mock return values
    mockCallAgentActionCreator.mockReturnValue(jest.fn());
    mockSetEditorMode.mockReturnValue({
      type: 'queryEditor/setEditorMode',
      payload: EditorMode.SingleQuery,
    });
    mockRunQueryActionCreator.mockReturnValue(jest.fn());
  });

  describe('SinglePrompt mode', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.SinglePrompt,
          promptModeIsAvailable: true,
        },
      } as RootState);
    });

    it('should dispatch callAgentActionCreator when prompt mode is available', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);
      const mockCallAgentThunk = jest.fn();
      mockCallAgentActionCreator.mockReturnValue(mockCallAgentThunk);

      actionCreator(mockDispatch, mockGetState);

      expect(mockCallAgentActionCreator).toHaveBeenCalledWith({
        services: mockServices,
        editorContext: mockEditorContext,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockCallAgentThunk);
    });

    it('should show warning when prompt mode is not available', () => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.SinglePrompt,
          promptModeIsAvailable: false,
        },
      } as RootState);

      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockServices.notifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'Unavailable',
        text: 'Query assist feature is not enabled or configured.',
        id: 'queryAssist-not-available',
      });
      expect(mockCallAgentActionCreator).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('DualPrompt mode', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.DualPrompt,
          promptModeIsAvailable: true,
        },
      } as RootState);
    });

    it('should dispatch callAgentActionCreator when prompt mode is available', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);
      const mockCallAgentThunk = jest.fn();
      mockCallAgentActionCreator.mockReturnValue(mockCallAgentThunk);

      actionCreator(mockDispatch, mockGetState);

      expect(mockCallAgentActionCreator).toHaveBeenCalledWith({
        services: mockServices,
        editorContext: mockEditorContext,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockCallAgentThunk);
    });

    it('should show warning when prompt mode is not available', () => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.DualPrompt,
          promptModeIsAvailable: false,
        },
      } as RootState);

      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockServices.notifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'Unavailable',
        text: 'Query assist feature is not enabled or configured.',
        id: 'queryAssist-not-available',
      });
      expect(mockCallAgentActionCreator).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('SingleQuery mode', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: true,
        },
      } as RootState);
    });

    it('should dispatch runQueryActionCreator with editor text', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);
      const mockRunQueryThunk = jest.fn();
      mockRunQueryActionCreator.mockReturnValue(mockRunQueryThunk);

      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(
        mockServices,
        mockEditorContext.editorText
      );
      expect(mockDispatch).toHaveBeenCalledWith(mockRunQueryThunk);
    });

    it('should not clear editors or change mode', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);

      actionCreator(mockDispatch, mockGetState);

      expect(mockEditorContext.clearEditorsAndSetText).not.toHaveBeenCalled();
      expect(mockSetEditorMode).not.toHaveBeenCalled();
    });

    it('should work with different query text', () => {
      mockEditorContext.editorText = '| where user_type="admin"';
      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);

      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(
        mockServices,
        '| where user_type="admin"'
      );
    });

    it('should work with empty query text', () => {
      mockEditorContext.editorText = '';
      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);

      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, '');
    });
  });

  describe('DualQuery mode', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.DualQuery,
          promptModeIsAvailable: true,
        },
      } as RootState);
    });

    it('should clear editors and set text with current editor text', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);

      actionCreator(mockDispatch, mockGetState);

      expect(mockEditorContext.clearEditorsAndSetText).toHaveBeenCalledWith(
        mockEditorContext.editorText
      );
    });

    it('should dispatch setEditorMode to change to SingleQuery', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);

      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleQuery,
      });
    });

    it('should dispatch runQueryActionCreator with editor text', () => {
      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);
      const mockRunQueryThunk = jest.fn();
      mockRunQueryActionCreator.mockReturnValue(mockRunQueryThunk);

      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(
        mockServices,
        mockEditorContext.editorText
      );
      expect(mockDispatch).toHaveBeenCalledWith(mockRunQueryThunk);
    });

    it('should execute actions in correct order', () => {
      const calls: string[] = [];

      mockEditorContext.clearEditorsAndSetText = jest.fn(() => {
        calls.push('clearEditorsAndSetText');
      });

      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'queryEditor/setEditorMode') {
          calls.push('setEditorMode');
        } else if (typeof action === 'function') {
          calls.push('runQuery');
        }
      });

      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(calls).toEqual(['clearEditorsAndSetText', 'setEditorMode', 'runQuery']);
    });
  });

  describe('unknown editor mode', () => {
    it('should throw error for unknown editor mode', () => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: 'UNKNOWN_MODE' as EditorMode,
          promptModeIsAvailable: true,
        },
      } as RootState);

      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);

      expect(() => {
        actionCreator(mockDispatch, mockGetState);
      }).toThrow('onEditorRunActionCreator encountered unknown editorMode: UNKNOWN_MODE');
    });

    it('should not dispatch any actions when throwing error', () => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: 'INVALID' as EditorMode,
          promptModeIsAvailable: true,
        },
      } as RootState);

      const actionCreator = onEditorRunActionCreator(mockServices, mockEditorContext);

      expect(() => {
        actionCreator(mockDispatch, mockGetState);
      }).toThrow();

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockCallAgentActionCreator).not.toHaveBeenCalled();
      expect(mockRunQueryActionCreator).not.toHaveBeenCalled();
    });
  });
});
