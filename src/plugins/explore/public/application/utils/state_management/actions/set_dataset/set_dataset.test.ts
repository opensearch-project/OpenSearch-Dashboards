/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setDatasetActionCreator } from './set_dataset';
import { ExploreServices } from '../../../../../types';
import { EditorMode } from '../../types';
import {
  clearResults,
  setPromptModeIsAvailable,
  setQueryWithHistory,
  setActiveTab,
  clearLastExecutedData,
  setSummaryAgentIsAvailable,
} from '../../slices';
import { clearQueryStatusMap, setEditorMode } from '../../slices/query_editor/query_editor_slice';
import { detectAndSetOptimalTab } from '../detect_optimal_tab';
import { executeQueries } from '../query_actions';
import { getPromptModeIsAvailable } from '../../../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../../get_summary_agent_is_available';
import { AppDispatch, RootState } from '../../store';

// Mock dependencies
jest.mock('../../slices', () => ({
  clearResults: jest.fn(),
  setPromptModeIsAvailable: jest.fn(),
  setQueryWithHistory: jest.fn(),
  setActiveTab: jest.fn(),
  clearLastExecutedData: jest.fn(),
  setSummaryAgentIsAvailable: jest.fn(),
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

jest.mock('../../../get_summary_agent_is_available', () => ({
  getSummaryAgentIsAvailable: jest.fn(),
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
      editorMode: EditorMode.Query,
      promptModeIsAvailable: false,
      summaryAgentIsAvailable: false,
      queryStatusMap: {},
      overallQueryStatus: {
        status: 'UNINITIALIZED' as any,
        elapsedMs: undefined,
        startTime: undefined,
        body: undefined,
      },
      promptToQueryIsLoading: false,
      lastExecutedPrompt: '',
      lastExecutedTranslatedQuery: '',
    },
    query: {
      query: 'SELECT * FROM test',
      language: 'PPL',
      dataset: {
        id: 'test-dataset',
        type: 'INDEX_PATTERN',
        dataSource: { id: 'test-datasource' },
      },
    },
    ui: {
      activeTabId: 'test-tab',
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
            .mockReturnValue({ id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' }),
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

  it('should dispatch all initial cleanup actions', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setActiveTab).toHaveBeenCalledWith('');
    expect(clearResults).toHaveBeenCalledTimes(1);
    expect(clearQueryStatusMap).toHaveBeenCalledTimes(1);
    expect(clearLastExecutedData).toHaveBeenCalledTimes(1);
  });

  it('should dispatch setQueryWithHistory with dataset', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setQueryWithHistory).toHaveBeenCalledWith({
      ...mockQueryState,
      dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
    });
  });

  it('should dispatch setPromptModeIsAvailable when prompt mode availability changes', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(true);
    (getSummaryAgentIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).toHaveBeenCalledWith(true);
  });

  it('should not dispatch setPromptModeIsAvailable when prompt mode availability stays the same', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    (getSummaryAgentIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).not.toHaveBeenCalled();
  });

  it('should call clearEditors', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    (getSummaryAgentIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(mockClearEditors).toHaveBeenCalledTimes(1);
  });

  it('should dispatch executeQueries and detectAndSetOptimalTab actions', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    (getSummaryAgentIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(executeQueries).toHaveBeenCalledWith({ services });
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services });
  });

  it('should handle prompt mode availability change from true to false', async () => {
    const stateWithPromptMode = {
      queryEditor: {
        promptModeIsAvailable: true,
        summaryAgentIsAvailable: false,
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'UNINITIALIZED' as any,
          elapsedMs: undefined,
          startTime: undefined,
          body: undefined,
        },
        editorMode: EditorMode.Prompt,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: '',
        lastExecutedTranslatedQuery: '',
      },
      query: {
        query: 'SELECT * FROM test',
        language: 'PPL',
        dataset: undefined,
      },
      ui: {
        activeTabId: 'test-tab',
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
    (getSummaryAgentIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setPromptModeIsAvailable).toHaveBeenCalledWith(false);
  });

  it('should handle dataset creation from existing dataset query', async () => {
    const stateWithDataset = {
      ...mockRootState,
      query: {
        ...mockRootState.query,
        dataset: { id: 'existing-dataset', title: 'existing-dataset', type: 'INDEX_PATTERN' },
      },
    };
    mockGetState.mockReturnValue(stateWithDataset);
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(services.data.dataViews.get).toHaveBeenCalledWith('existing-dataset', false);
  });

  it('should dispatch setSummaryAgentIsAvailable when summary agent availability changes', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    (getSummaryAgentIsAvailable as jest.MockedFunction<any>).mockResolvedValue(true);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setSummaryAgentIsAvailable).toHaveBeenCalledWith(true);
  });

  it('should not dispatch setSummaryAgentIsAvailable when summary agent availability stays the same', async () => {
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    (getSummaryAgentIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(setSummaryAgentIsAvailable).not.toHaveBeenCalled();
  });

  it('should call Promise.allSettled to run availability checks in parallel', async () => {
    const promiseAllSettledSpy = jest.spyOn(Promise, 'allSettled');
    (getPromptModeIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);
    (getSummaryAgentIsAvailable as jest.MockedFunction<any>).mockResolvedValue(false);

    const actionCreator = setDatasetActionCreator(services, mockClearEditors);
    await actionCreator(mockDispatch, mockGetState);

    expect(promiseAllSettledSpy).toHaveBeenCalled();
    const callArgs = promiseAllSettledSpy.mock.calls[0][0];
    expect(Array.isArray(callArgs)).toBe(true);
    expect((callArgs as any).length).toBe(2);
    promiseAllSettledSpy.mockRestore();
  });
});
