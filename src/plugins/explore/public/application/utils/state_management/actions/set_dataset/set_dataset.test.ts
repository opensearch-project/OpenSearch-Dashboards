/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setDatasetActionCreator } from './set_dataset';
import { ExploreServices } from '../../../../../types';
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
  setActiveTab: jest.fn(),
}));

jest.mock('../../slices/query_editor/query_editor_slice', () => ({
  clearQueryStatusMap: jest.fn(),
}));

jest.mock('../query_actions', () => ({
  executeQueries: jest.fn(),
}));

jest.mock('../detect_optimal_tab', () => ({
  detectAndSetOptimalTab: jest.fn(),
}));

jest.mock('../../../get_prompt_mode_is_available', () => ({
  getPromptModeIsAvailable: jest.fn(),
}));

describe('setDatasetActionCreator', () => {
  let services: jest.Mocked<ExploreServices>;
  let mockClearEditors: jest.MockedFunction<any>;
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
    query: {
      query: 'SELECT * FROM test',
      language: 'PPL',
      dataset: undefined,
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

    mockClearEditors = jest.fn();

    mockDispatch = jest.fn();
    mockGetState = jest.fn().mockReturnValue(mockRootState);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should dispatch clearResults and setQueryWithHistory actions', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(clearResults).toHaveBeenCalledTimes(1);
    expect(setQueryWithHistory).toHaveBeenCalledWith(mockQueryState);
  });

  it('should dispatch setPromptModeIsAvailable when prompt mode availability changes', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(true);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).toHaveBeenCalledWith(true);
  });

  it('should not dispatch setPromptModeIsAvailable when prompt mode availability stays the same', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).not.toHaveBeenCalled();
  });

  it('should set editor mode to SingleQuery when prompt mode is not available and current mode is not SingleQuery', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    mockGetState.mockReturnValue({
      queryEditor: {
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: false,
      },
      query: {
        query: 'SELECT * FROM test',
        language: 'PPL',
        dataset: undefined,
      },
    });

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
  });

  it('should not dispatch set editor mode if editorMode is SingleQuery', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    mockGetState.mockReturnValue({
      queryEditor: {
        editorMode: EditorMode.SingleQuery,
      },
      query: {
        query: 'SELECT * FROM test',
        language: 'PPL',
        dataset: undefined,
      },
    });

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setEditorMode).not.toHaveBeenCalled();
  });

  it('should call clearEditors', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(mockClearEditors).toHaveBeenCalledTimes(1);
  });

  it('should dispatch executeQueries action', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(executeQueries).toHaveBeenCalledWith({ services });
  });

  it('should handle prompt mode availability change from true to false', async () => {
    const stateWithPromptMode = {
      queryEditor: {
        promptModeIsAvailable: true,
      },
      query: {
        query: 'SELECT * FROM test',
        language: 'PPL',
        dataset: undefined,
      },
    };
    mockGetState.mockReturnValue(stateWithPromptMode);
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).toHaveBeenCalledWith(false);
  });

  it('should set editor mode to SingleEmpty when prompt mode is available and current mode is not SingleEmpty', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(true);
    mockGetState.mockReturnValue({
      queryEditor: {
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: false,
      },
      query: {
        query: 'SELECT * FROM test',
        language: 'PPL',
        dataset: undefined,
      },
    });

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setEditorMode).toHaveBeenCalledWith(EditorMode.SingleEmpty);
  });

  it('should set editor mode to SingleQuery when prompt mode is available but current mode is SingleEmpty (fallback to else condition)', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(true);
    mockGetState.mockReturnValue({
      queryEditor: {
        editorMode: EditorMode.SingleEmpty,
        promptModeIsAvailable: false,
      },
      query: {
        query: 'SELECT * FROM test',
        language: 'PPL',
        dataset: undefined,
      },
    });

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    // This happens because the logic falls through to the else condition
    // since SingleEmpty !== SingleQuery
    expect(setEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
  });

  it('should not set editor mode when prompt mode is not available and current mode is already SingleQuery', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    mockGetState.mockReturnValue({
      queryEditor: {
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: false,
      },
      query: {
        query: 'SELECT * FROM test',
        language: 'PPL',
        dataset: undefined,
      },
    });

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setEditorMode).not.toHaveBeenCalled();
  });
});
