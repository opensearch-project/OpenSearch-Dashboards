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
import { AppDispatch, RootState } from '../../store';

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
  let mockDispatch: jest.MockedFunction<AppDispatch>;
  let mockGetState: jest.MockedFunction<() => RootState>;

  const mockQueryState = {
    query: 'SELECT * FROM test',
    language: 'sql',
  };

  const mockRootState = {
    queryEditor: {
      editorMode: EditorMode.SingleQuery,
      promptModeIsAvailable: false,
      queryStatusMap: {},
      overallQueryStatus: {
        status: 'UNINITIALIZED' as any,
        elapsedMs: undefined,
        startTime: undefined,
        body: undefined,
      },
      promptToQueryIsLoading: false,
      lastExecutedPrompt: '',
    },
    query: {
      query: 'SELECT * FROM test',
      language: 'PPL',
      dataset: undefined,
    },
    ui: {
      activeTabId: 'test-tab',
      showFilterPanel: true,
      showHistogram: true,
    },
    results: {},
    tab: {
      logs: {},
      visualizations: {
        styleOptions: undefined,
        chartType: undefined,
        axesMapping: {},
      },
    },
    legacy: {
      columns: [],
      sort: [],
      interval: 'auto',
    },
  };

  beforeEach(() => {
    services = {
      data: {
        dataViews: {
          ensureDefaultDataView: jest.fn().mockResolvedValue(undefined),
          get: jest.fn().mockResolvedValue({ id: 'test-dataview' }),
          createFromDataset: jest.fn().mockResolvedValue({ id: 'test-dataview' }),
          getDefault: jest.fn().mockResolvedValue({ id: 'default-dataview' }),
          convertToDataset: jest
            .fn()
            .mockReturnValue({ id: 'test-dataset', type: 'INDEX_PATTERN' }),
        },
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
    expect(setQueryWithHistory).toHaveBeenCalledWith({
      ...mockQueryState,
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    });
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

  it('should set editor mode to SingleQuery when prompt mode is not available', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
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
      query: {
        query: 'SELECT * FROM test',
        language: 'PPL',
        dataset: undefined,
      },
      ui: {
        activeTabId: 'test-tab',
        showFilterPanel: true,
        showHistogram: true,
      },
      results: {},
      tab: {
        logs: {},
        visualizations: {
          styleOptions: undefined,
          chartType: undefined,
          axesMapping: {},
        },
      },
      legacy: {
        columns: [],
        sort: [],
        interval: 'auto',
      },
    };
    mockGetState.mockReturnValue(stateWithPromptMode);
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).toHaveBeenCalledWith(false);
  });

  it('should set editor mode to SingleEmpty when prompt mode is available', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(true);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setEditorMode).toHaveBeenCalledWith(EditorMode.SingleEmpty);
  });
});
