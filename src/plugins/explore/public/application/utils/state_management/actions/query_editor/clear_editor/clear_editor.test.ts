/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { clearEditorActionCreator } from './clear_editor';
import { resetEditorMode } from '../../../slices';
import { EditorContextValue } from '../../../../../context';

// Mock the resetEditorMode action
jest.mock('../../../slices', () => ({
  resetEditorMode: jest.fn(),
}));

const mockResetEditorMode = resetEditorMode as jest.MockedFunction<typeof resetEditorMode>;

describe('clearEditorActionCreator', () => {
  let mockDispatch: jest.MockedFunction<any>;
  let mockEditorContext: EditorContextValue;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();

    mockEditorContext = {
      editorText: 'test text',
      setEditorText: jest.fn(),
      clearEditors: jest.fn(),
      clearEditorsAndSetText: jest.fn(),
      setBottomEditorText: jest.fn(),
      query: 'test query',
      prompt: 'test prompt',
    };

    // Mock the return value of resetEditorMode
    mockResetEditorMode.mockReturnValue({
      type: 'queryEditor/resetEditorMode',
      payload: undefined,
    });
  });

  it('should call clearEditors on the editor context', () => {
    const actionCreator = clearEditorActionCreator(mockEditorContext);

    actionCreator(mockDispatch);

    expect(mockEditorContext.clearEditors).toHaveBeenCalledTimes(1);
  });

  it('should dispatch resetEditorMode action', () => {
    const actionCreator = clearEditorActionCreator(mockEditorContext);

    actionCreator(mockDispatch);

    expect(mockResetEditorMode).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'queryEditor/resetEditorMode' });
  });

  it('should call clearEditors before dispatching resetEditorMode', () => {
    const calls: string[] = [];

    mockEditorContext.clearEditors = jest.fn(() => {
      calls.push('clearEditors');
    });

    mockDispatch.mockImplementation(() => {
      calls.push('dispatch');
    });

    const actionCreator = clearEditorActionCreator(mockEditorContext);
    actionCreator(mockDispatch);

    expect(calls).toEqual(['clearEditors', 'dispatch']);
  });
});
