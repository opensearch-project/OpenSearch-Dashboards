/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { clearEditorActionCreator } from './clear_editor';
import { setEditorMode } from '../../../slices';
import { EditorMode } from '../../../types';
import { AppDispatch, RootState } from '../../../store';

// Mock the setEditorMode action
jest.mock('../../../slices', () => ({
  setEditorMode: jest.fn(),
}));

const mockSetEditorMode = setEditorMode as jest.MockedFunction<typeof setEditorMode>;

describe('clearEditorActionCreator', () => {
  let mockClearEditors = jest.fn();
  let mockDispatch: jest.MockedFunction<AppDispatch>;
  let mockGetState: jest.MockedFunction<() => RootState>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    mockGetState = jest.fn();

    // Mock the return value of setEditorMode
    mockSetEditorMode.mockReturnValue({
      type: 'queryEditor/setEditorMode',
      payload: EditorMode.SingleEmpty,
    });
  });

  it('should call clearEditors on the editor context', () => {
    mockGetState.mockReturnValue({
      queryEditor: {
        promptModeIsAvailable: true,
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'UNINITIALIZED' as any,
          elapsedMs: undefined,
          startTime: undefined,
          body: undefined,
        },
        editorMode: EditorMode.SingleEmpty,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: '',
      },
    } as any);

    const actionCreator = clearEditorActionCreator(mockClearEditors);
    actionCreator(mockDispatch, mockGetState);

    expect(mockClearEditors).toHaveBeenCalledTimes(1);
  });

  it('should dispatch setEditorMode with SingleEmpty when promptModeIsAvailable is true', () => {
    mockGetState.mockReturnValue({
      queryEditor: {
        promptModeIsAvailable: true,
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'UNINITIALIZED' as any,
          elapsedMs: undefined,
          startTime: undefined,
          body: undefined,
        },
        editorMode: EditorMode.SingleEmpty,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: '',
      },
    } as any);

    const actionCreator = clearEditorActionCreator(mockClearEditors);
    actionCreator(mockDispatch, mockGetState);

    expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleEmpty);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'queryEditor/setEditorMode',
      payload: EditorMode.SingleEmpty,
    });
  });

  it('should dispatch setEditorMode with SingleQuery when promptModeIsAvailable is false', () => {
    mockGetState.mockReturnValue({
      queryEditor: {
        promptModeIsAvailable: false,
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'UNINITIALIZED' as any,
          elapsedMs: undefined,
          startTime: undefined,
          body: undefined,
        },
        editorMode: EditorMode.SingleQuery,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: '',
      },
    } as any);

    mockSetEditorMode.mockReturnValue({
      type: 'queryEditor/setEditorMode',
      payload: EditorMode.SingleQuery,
    });

    const actionCreator = clearEditorActionCreator(mockClearEditors);
    actionCreator(mockDispatch, mockGetState);

    expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'queryEditor/setEditorMode',
      payload: EditorMode.SingleQuery,
    });
  });

  it('should call clearEditors before dispatching setEditorMode', () => {
    const calls: string[] = [];

    mockGetState.mockReturnValue({
      queryEditor: {
        promptModeIsAvailable: true,
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'UNINITIALIZED' as any,
          elapsedMs: undefined,
          startTime: undefined,
          body: undefined,
        },
        editorMode: EditorMode.SingleEmpty,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: '',
      },
    } as any);

    mockClearEditors = jest.fn(() => {
      calls.push('clearEditors');
    });

    mockDispatch.mockImplementation(() => {
      calls.push('dispatch');
    });

    const actionCreator = clearEditorActionCreator(mockClearEditors);
    actionCreator(mockDispatch, mockGetState);

    expect(calls).toEqual(['clearEditors', 'dispatch']);
  });
});
