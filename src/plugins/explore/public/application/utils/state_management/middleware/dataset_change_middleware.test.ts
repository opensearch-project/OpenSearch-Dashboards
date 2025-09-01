/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createDatasetChangeMiddleware } from './dataset_change_middleware';
import {
  setQueryState,
  setQueryWithHistory,
  clearResults,
  setActiveTab,
  setPromptModeIsAvailable,
  setSummaryAgentIsAvailable,
  clearLastExecutedData,
  setPatternsField,
  setUsingRegexPatterns,
} from '../slices';
import { clearQueryStatusMap } from '../slices/query_editor/query_editor_slice';
import { createMockExploreServices, createMockStore, MockStore } from '../__mocks__';
import { DEFAULT_DATA } from '../../../../../../data/common';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../get_summary_agent_is_available';
import * as queryActions from '../actions/query_actions';
import * as tabActions from '../actions/detect_optimal_tab';
import * as resetLegacyStateActions from '../actions/reset_legacy_state';

jest.mock('../../get_prompt_mode_is_available', () => ({
  getPromptModeIsAvailable: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../get_summary_agent_is_available', () => ({
  getSummaryAgentIsAvailable: jest.fn().mockResolvedValue(true),
}));

jest.mock('../actions/query_actions', () => ({
  executeQueries: jest.fn().mockReturnValue({ type: 'mock/executeQueries' }),
}));

jest.mock('../actions/detect_optimal_tab', () => ({
  detectAndSetOptimalTab: jest.fn().mockReturnValue({ type: 'mock/detectOptimalTab' }),
}));

jest.mock('../actions/reset_legacy_state', () => ({
  resetLegacyStateActionCreator: jest.fn().mockReturnValue({ type: 'mock/resetLegacyState' }),
}));

const mockedExecuteQueries = queryActions.executeQueries as jest.MockedFunction<
  typeof queryActions.executeQueries
>;
const mockedDetectAndSetOptimalTab = tabActions.detectAndSetOptimalTab as jest.MockedFunction<
  typeof tabActions.detectAndSetOptimalTab
>;
const mockedGetPromptModeIsAvailable = getPromptModeIsAvailable as jest.MockedFunction<
  typeof getPromptModeIsAvailable
>;
const mockedGetSummaryAgentIsAvailable = getSummaryAgentIsAvailable as jest.MockedFunction<
  typeof getSummaryAgentIsAvailable
>;
const mockedResetLegacyStateActionCreator = resetLegacyStateActions.resetLegacyStateActionCreator as jest.MockedFunction<
  typeof resetLegacyStateActions.resetLegacyStateActionCreator
>;

describe('createDatasetChangeMiddleware', () => {
  let mockServices: ReturnType<typeof createMockExploreServices>;
  let mockStore: MockStore;
  let mockNext: jest.MockedFunction<(action: any) => any>;
  let middleware: (action: any) => any;
  let mockCacheDataset: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheDataset = jest.fn();
    mockServices = createMockExploreServices();
    mockServices.data.query.queryString.getDatasetService = jest.fn().mockReturnValue({
      cacheDataset: mockCacheDataset,
    });

    mockStore = createMockStore();
    mockStore.getState = jest.fn().mockReturnValue({
      query: {
        dataset: { id: 'test-dataset', type: 'index_pattern' },
      },
      queryEditor: {
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      },
    });

    mockStore.dispatch = jest.fn();
    mockNext = jest.fn().mockImplementation((action) => action);
    middleware = createDatasetChangeMiddleware(mockServices)(mockStore)(mockNext);
  });

  it('should pass action to next middleware', async () => {
    const action = { type: 'some/otherAction' };
    await middleware(action);
    expect(mockNext).toHaveBeenCalledWith(action);
  });

  it('should trigger side effects when dataset changes with setQueryState', async () => {
    // Setup a new dataset that's different from the current one
    const newDataset = { id: 'new-dataset', type: 'index_pattern' };
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: newDataset },
      queryEditor: {
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      },
    });

    const action = setQueryState({ query: 'source=hello', language: 'PPL' });
    await middleware(action);

    // Verify the clearing actions were dispatched
    expect(mockStore.dispatch).toHaveBeenCalledWith(setActiveTab(''));
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearResults());
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearQueryStatusMap());
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearLastExecutedData());
    expect(mockStore.dispatch).toHaveBeenCalledWith(setPatternsField(''));
    expect(mockStore.dispatch).toHaveBeenCalledWith(setUsingRegexPatterns(false));
    expect(mockStore.dispatch).toHaveBeenCalledWith({ type: 'mock/resetLegacyState' });
    expect(mockedResetLegacyStateActionCreator).toHaveBeenCalledWith(mockServices);
    expect(mockStore.dispatch).toHaveBeenCalledWith(setPromptModeIsAvailable(true));
    expect(mockStore.dispatch).toHaveBeenCalledWith(setSummaryAgentIsAvailable(true));

    // Verify the executeQueries action was dispatched
    expect(mockedExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(mockStore.dispatch).toHaveBeenCalledWith({ type: 'mock/executeQueries' });

    // Verify the detectAndSetOptimalTab action was dispatched
    expect(mockedDetectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
    expect(mockStore.dispatch).toHaveBeenCalledWith({ type: 'mock/detectOptimalTab' });
  });

  it('should trigger side effects when dataset changes with setQueryWithHistory', async () => {
    // Setup a new dataset that's different from the current one
    const newDataset = { id: 'new-dataset', type: 'index_pattern' };
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: newDataset },
      queryEditor: {
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      },
    });

    const action = setQueryWithHistory({ query: 'source=hello', language: 'PPL' });
    await middleware(action);

    // Verify the clearing actions were dispatched
    expect(mockStore.dispatch).toHaveBeenCalledWith(setActiveTab(''));
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearResults());
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearQueryStatusMap());
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearLastExecutedData());
    expect(mockStore.dispatch).toHaveBeenCalledWith(setPatternsField(''));
    expect(mockStore.dispatch).toHaveBeenCalledWith(setUsingRegexPatterns(false));
    expect(mockStore.dispatch).toHaveBeenCalledWith({ type: 'mock/resetLegacyState' });
    expect(mockedResetLegacyStateActionCreator).toHaveBeenCalledWith(mockServices);

    // Verify the executeQueries action was dispatched
    expect(mockedExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(mockStore.dispatch).toHaveBeenCalledWith({ type: 'mock/executeQueries' });
  });

  it('should not trigger side effects if the dataset has not changed', async () => {
    // First action with new dataset
    const firstDataset = { id: 'first-dataset', type: 'index_pattern' };
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: firstDataset },
      queryEditor: {
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      },
    });

    await middleware(setQueryState({ query: 'source=hello', language: 'PPL' }));

    // Reset the mocks
    jest.clearAllMocks();

    // Second action with the same dataset
    await middleware(setQueryState({ query: 'source=updated', language: 'PPL' }));

    // Verify that no clearing actions were dispatched since dataset didn't change
    expect(mockStore.dispatch).not.toHaveBeenCalledWith(setActiveTab(''));
    expect(mockStore.dispatch).not.toHaveBeenCalledWith(clearResults());
    expect(mockStore.dispatch).not.toHaveBeenCalledWith(clearQueryStatusMap());
  });

  it('should not cache dataset when type is index pattern', async () => {
    const indexPatternDataset = {
      id: 'index-pattern',
      type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      dataSource: { id: 'data-source-id' },
    };
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: indexPatternDataset },
      queryEditor: {
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      },
    });

    const action = setQueryState({ query: 'source=hello', language: 'PPL' });
    await middleware(action);

    // Verify the dataset was not cached
    expect(mockCacheDataset).not.toHaveBeenCalled();
  });

  it('should handle missing dataset', async () => {
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: null },
      queryEditor: {
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      },
    });

    const action = setQueryState({ query: 'source=hello', language: 'PPL' });
    await middleware(action);

    // Verify that execute queries was not called
    expect(mockedExecuteQueries).not.toHaveBeenCalled();
    expect(mockedDetectAndSetOptimalTab).not.toHaveBeenCalled();
  });

  it('should update prompt mode availability only if different from current state', async () => {
    mockedGetPromptModeIsAvailable.mockResolvedValueOnce(true);

    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: { id: 'new-dataset', type: 'index_pattern' } },
      queryEditor: {
        promptModeIsAvailable: true, // Already true
        summaryAgentIsAvailable: false,
      },
    });

    const action = setQueryState({ query: 'source=hello', language: 'PPL' });
    await middleware(action);

    // Should not dispatch action to set prompt mode availability since it's already true
    expect(mockStore.dispatch).not.toHaveBeenCalledWith(setPromptModeIsAvailable(true));
  });

  it('should update summary agent availability only if different from current state', async () => {
    mockedGetSummaryAgentIsAvailable.mockResolvedValueOnce(true);

    mockStore.getState = jest.fn().mockReturnValue({
      query: {
        dataset: {
          id: 'new-dataset',
          type: 'index_pattern',
          dataSource: { id: 'data-source-id' },
        },
      },
      queryEditor: {
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: true, // Already true
      },
    });

    const action = setQueryState({ query: 'source=hello', language: 'PPL' });
    await middleware(action);

    // Should not dispatch action to set summary agent availability since it's already true
    expect(mockStore.dispatch).not.toHaveBeenCalledWith(setSummaryAgentIsAvailable(true));
    // But should call getSummaryAgentIsAvailable with the correct data source ID
    expect(mockedGetSummaryAgentIsAvailable).toHaveBeenCalledWith(mockServices, 'data-source-id');
  });
});
