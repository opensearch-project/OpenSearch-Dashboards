/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setDatasetActionCreator } from './set_dataset';
import { ExploreServices } from '../../../../../types';
import { EditorContextValue } from '../../../../context';
import { EditorMode } from '../../types';
import {
  clearResults,
  setEditorMode,
  setPromptModeIsAvailable,
  setQueryWithHistory,
} from '../../slices';
import { executeQueries } from '../query_actions';
import { getPromptModeIsAvailable } from '../../../get_prompt_mode_is_available';

// Mock dependencies
jest.mock('../../slices', () => ({
  clearResults: jest.fn(),
  setEditorMode: jest.fn(),
  setPromptModeIsAvailable: jest.fn(),
  setQueryWithHistory: jest.fn(),
}));

jest.mock('../query_actions', () => ({
  executeQueries: jest.fn(),
}));

jest.mock('../../../get_prompt_mode_is_available', () => ({
  getPromptModeIsAvailable: jest.fn(),
}));

describe('setDatasetActionCreator', () => {
  let services: jest.Mocked<ExploreServices>;
  let editorContext: jest.Mocked<EditorContextValue>;
  let mockDispatch: jest.MockedFunction<any>;
  let mockGetState: jest.MockedFunction<any>;

  const mockQueryState = {
    query: 'SELECT * FROM test',
    language: 'sql',
  };

  const mockRootState = {
    queryEditor: {
      editorMode: EditorMode.SingleQuery,
      promptModeIsAvailable: false,
    },
  };

  beforeEach(() => {
    services = {
      data: {
        query: {
          queryString: {
            getQuery: jest.fn().mockReturnValue(mockQueryState),
          },
        },
      },
    } as any;

    editorContext = {
      clearEditorsAndSetText: jest.fn(),
    } as any;

    mockDispatch = jest.fn();
    mockGetState = jest.fn().mockReturnValue(mockRootState);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should dispatch clearResults and setQueryWithHistory actions', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, editorContext);
    await actionCreator(mockDispatch, mockGetState);

    expect(clearResults).toHaveBeenCalledTimes(1);
    expect(setQueryWithHistory).toHaveBeenCalledWith(mockQueryState);
  });

  it('should dispatch setPromptModeIsAvailable when prompt mode availability changes', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(true);

    const actionCreator = setDatasetActionCreator(services, editorContext);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).toHaveBeenCalledWith(true);
  });

  it('should not dispatch setPromptModeIsAvailable when prompt mode availability stays the same', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, editorContext);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).not.toHaveBeenCalled();
  });

  it('should set editor mode to SingleQuery if editorMode is not SingleQuery', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    mockGetState.mockReturnValue({
      queryEditor: {
        editorMode: EditorMode.SinglePrompt,
      },
    });

    const actionCreator = setDatasetActionCreator(services, editorContext);
    await actionCreator(mockDispatch, mockGetState);

    expect(setEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
  });

  it('should not dispatch set editor mode if editorMode is SingleQuery', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    mockGetState.mockReturnValue({
      queryEditor: {
        editorMode: EditorMode.SingleQuery,
      },
    });

    const actionCreator = setDatasetActionCreator(services, editorContext);
    await actionCreator(mockDispatch, mockGetState);

    expect(setEditorMode).not.toHaveBeenCalled();
  });

  it('should clear editors and set text with query string', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, editorContext);
    await actionCreator(mockDispatch, mockGetState);

    expect(editorContext.clearEditorsAndSetText).toHaveBeenCalledWith(mockQueryState.query);
  });

  it('should dispatch executeQueries action', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, editorContext);
    await actionCreator(mockDispatch, mockGetState);

    expect(executeQueries).toHaveBeenCalledWith({ services });
  });

  it('should handle prompt mode availability change from true to false', async () => {
    const stateWithPromptMode = {
      queryEditor: {
        promptModeIsAvailable: true,
      },
    };
    mockGetState.mockReturnValue(stateWithPromptMode);
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, editorContext);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).toHaveBeenCalledWith(false);
  });
});
