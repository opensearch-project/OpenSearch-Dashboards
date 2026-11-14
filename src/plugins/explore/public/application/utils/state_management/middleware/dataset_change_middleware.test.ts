/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createDatasetChangeMiddleware } from './dataset_change_middleware';
import {
  setQueryState,
  setQueryWithHistory,
  clearResults,
  setPromptModeIsAvailable,
  setSummaryAgentIsAvailable,
  clearLastExecutedData,
  setPatternsField,
  setUsingRegexPatterns,
  setHideEmptyFields,
} from '../slices';
import {
  clearQueryStatusMap,
  setBreakdownField,
  setIsQueryEditorDirty,
  setIsSelectionStale,
} from '../slices/query_editor/query_editor_slice';
import { setActiveTab } from '../slices';
import { createMockExploreServices, createMockStore, MockStore } from '../__mocks__';
import { DEFAULT_DATA } from '../../../../../../data/common';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../get_summary_agent_is_available';
import * as queryActions from '../actions/query_actions';
import * as resetLegacyStateActions from '../actions/reset_legacy_state';
import { abortAllStreamingQueries } from '../../streaming/streaming_abort_registry';

jest.mock('../../get_prompt_mode_is_available', () => ({
  getPromptModeIsAvailable: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../get_summary_agent_is_available', () => ({
  getSummaryAgentIsAvailable: jest.fn().mockResolvedValue(true),
}));

jest.mock('../actions/query_actions', () => ({
  executeQueries: jest.fn().mockReturnValue({ type: 'mock/executeQueries' }),
  abortAllActiveQueries: jest.fn(),
  supersedeAllActiveQueries: jest.fn(),
}));

jest.mock('../../streaming/streaming_abort_registry', () => ({
  abortAllStreamingQueries: jest.fn(),
}));

jest.mock('../actions/reset_legacy_state', () => ({
  resetLegacyStateActionCreator: jest.fn().mockReturnValue({ type: 'mock/resetLegacyState' }),
}));

const mockedExecuteQueries = queryActions.executeQueries as jest.MockedFunction<
  typeof queryActions.executeQueries
>;
const mockedGetPromptModeIsAvailable = getPromptModeIsAvailable as jest.MockedFunction<
  typeof getPromptModeIsAvailable
>;
const mockedGetSummaryAgentIsAvailable = getSummaryAgentIsAvailable as jest.MockedFunction<
  typeof getSummaryAgentIsAvailable
>;
const mockedResetLegacyStateActionCreator =
  resetLegacyStateActions.resetLegacyStateActionCreator as jest.MockedFunction<
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
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearResults());
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearQueryStatusMap());
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearLastExecutedData());
    expect(mockStore.dispatch).toHaveBeenCalledWith(setPatternsField(''));
    expect(mockStore.dispatch).toHaveBeenCalledWith(setUsingRegexPatterns(false));
    expect(mockStore.dispatch).toHaveBeenCalledWith(setHideEmptyFields(false));
    expect(mockStore.dispatch).toHaveBeenCalledWith({ type: 'mock/resetLegacyState' });
    expect(mockedResetLegacyStateActionCreator).toHaveBeenCalledWith(mockServices);
    expect(mockStore.dispatch).toHaveBeenCalledWith(setPromptModeIsAvailable(true));
    expect(mockStore.dispatch).toHaveBeenCalledWith(setSummaryAgentIsAvailable(true));

    // Verify the executeQueries action was dispatched
    expect(mockedExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(mockStore.dispatch).toHaveBeenCalledWith({ type: 'mock/executeQueries' });
  });

  it('clears results but does not run a query for a dataset type that requires an explicit run', async () => {
    mockServices.data.query.queryString.getDatasetService = jest.fn().mockReturnValue({
      cacheDataset: mockCacheDataset,
      getType: jest.fn((type: string) =>
        type === 'EXPLICIT_RUN_TYPE' ? { meta: { requiresExplicitRun: true } } : undefined
      ),
    });
    middleware = createDatasetChangeMiddleware(mockServices)(mockStore)(mockNext);
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: { id: 'explicit-dataset', type: 'EXPLICIT_RUN_TYPE' } },
      queryEditor: { promptModeIsAvailable: false, summaryAgentIsAvailable: false },
    });

    await middleware(setQueryState({ query: 'q', language: 'L' }));

    expect(mockStore.dispatch).toHaveBeenCalledWith(clearResults());
    expect(mockStore.dispatch).toHaveBeenCalledWith(clearQueryStatusMap());
    expect(mockedExecuteQueries).not.toHaveBeenCalled();
  });

  describe('changing the selection within a dataset type that requires an explicit run', () => {
    const stateWith = (dataset: object) => ({
      query: { dataset },
      queryEditor: { promptModeIsAvailable: false, summaryAgentIsAvailable: false },
    });

    beforeEach(() => {
      mockServices.data.query.queryString.getDatasetService = jest.fn().mockReturnValue({
        cacheDataset: mockCacheDataset,
        getType: jest.fn((type: string) =>
          type === 'EXPLICIT_RUN_TYPE' ? { meta: { requiresExplicitRun: true } } : undefined
        ),
      });
      middleware = createDatasetChangeMiddleware(mockServices)(mockStore)(mockNext);
    });

    const refine = (action: any) => ({ ...action, meta: { refineSelection: true } });

    it('keeps the results and view when the picker refines the selection, marking them stale', async () => {
      mockStore.getState = jest
        .fn()
        .mockReturnValue(stateWith({ id: 'a', type: 'EXPLICIT_RUN_TYPE' }));
      await middleware(setQueryState({ query: 'q', language: 'L' }));
      (mockStore.dispatch as jest.Mock).mockClear();
      mockedResetLegacyStateActionCreator.mockClear();

      mockStore.getState = jest
        .fn()
        .mockReturnValue(stateWith({ id: 'b', type: 'EXPLICIT_RUN_TYPE' }));
      await middleware(refine(setQueryState({ query: 'q', language: 'L' })));

      expect(mockStore.dispatch).toHaveBeenCalledWith(setIsQueryEditorDirty(true));
      expect(mockStore.dispatch).toHaveBeenCalledWith(setIsSelectionStale(true));
      [
        clearResults(),
        clearQueryStatusMap(),
        clearLastExecutedData(),
        setPatternsField(''),
        setHideEmptyFields(false),
        setBreakdownField(undefined),
      ].forEach((reset) => expect(mockStore.dispatch).not.toHaveBeenCalledWith(reset));
      expect(
        (mockStore.dispatch as jest.Mock).mock.calls.some(([a]) => a?.type === setActiveTab.type)
      ).toBe(false);
      expect(mockedResetLegacyStateActionCreator).not.toHaveBeenCalled();
      expect(mockedExecuteQueries).not.toHaveBeenCalled();
      expect(mockCacheDataset).toHaveBeenLastCalledWith(
        { id: 'b', type: 'EXPLICIT_RUN_TYPE' },
        expect.anything(),
        false
      );
    });

    // A page opened from a URL or reloaded has dispatched no query state action yet: the dataset
    // it loaded with is the one the picker refines.
    it('keeps the results on the first refinement after a page load', async () => {
      mockStore.getState = jest
        .fn()
        .mockReturnValueOnce(stateWith({ id: 'a', type: 'EXPLICIT_RUN_TYPE' }))
        .mockReturnValue(stateWith({ id: 'b', type: 'EXPLICIT_RUN_TYPE' }));

      await middleware(refine(setQueryState({ query: 'q', language: 'L' })));

      expect(mockStore.dispatch).toHaveBeenCalledWith(setIsSelectionStale(true));
      expect(mockStore.dispatch).not.toHaveBeenCalledWith(clearResults());
    });

    it('does nothing when the first refinement after a page load re-applies its selection', async () => {
      mockStore.getState = jest
        .fn()
        .mockReturnValue(stateWith({ id: 'a', type: 'EXPLICIT_RUN_TYPE' }));

      await middleware(refine(setQueryState({ query: 'q', language: 'L' })));

      expect(mockStore.dispatch).not.toHaveBeenCalled();
      expect(queryActions.abortAllActiveQueries).not.toHaveBeenCalled();
    });

    // The running query is for the previous selection; Stop's semantics, so what finished stays.
    it('stops the running queries as Stop does when the picker refines the selection', async () => {
      mockStore.getState = jest
        .fn()
        .mockReturnValue(stateWith({ id: 'a', type: 'EXPLICIT_RUN_TYPE' }));
      await middleware(setQueryState({ query: 'q', language: 'L' }));
      jest.clearAllMocks();

      mockStore.getState = jest
        .fn()
        .mockReturnValue(stateWith({ id: 'b', type: 'EXPLICIT_RUN_TYPE' }));
      await middleware(refine(setQueryState({ query: 'q', language: 'L' })));

      expect(queryActions.abortAllActiveQueries).toHaveBeenCalledTimes(1);
      expect(abortAllStreamingQueries).toHaveBeenCalledTimes(1);
      expect(queryActions.supersedeAllActiveQueries).not.toHaveBeenCalled();
    });

    it('still resets for a same-type change that the picker did not make (e.g. a saved query)', async () => {
      mockStore.getState = jest
        .fn()
        .mockReturnValue(stateWith({ id: 'a', type: 'EXPLICIT_RUN_TYPE' }));
      await middleware(setQueryState({ query: 'q', language: 'L' }));
      (mockStore.dispatch as jest.Mock).mockClear();

      mockStore.getState = jest
        .fn()
        .mockReturnValue(stateWith({ id: 'b', type: 'EXPLICIT_RUN_TYPE' }));
      await middleware(setQueryState({ query: 'q', language: 'L' }));

      expect(mockStore.dispatch).toHaveBeenCalledWith(clearResults());
      expect(mockStore.dispatch).toHaveBeenCalledWith(setIsSelectionStale(false));
      expect(mockStore.dispatch).not.toHaveBeenCalledWith(setIsQueryEditorDirty(true));
    });

    it('still clears when switching to it from another type', async () => {
      mockStore.getState = jest
        .fn()
        .mockReturnValue(stateWith({ id: 'logs', type: 'index_pattern' }));
      await middleware(setQueryState({ query: 'q', language: 'L' }));
      (mockStore.dispatch as jest.Mock).mockClear();

      mockStore.getState = jest
        .fn()
        .mockReturnValue(stateWith({ id: 'b', type: 'EXPLICIT_RUN_TYPE' }));
      await middleware(setQueryState({ query: 'q', language: 'L' }));

      expect(mockStore.dispatch).toHaveBeenCalledWith(clearResults());
      expect(mockStore.dispatch).not.toHaveBeenCalledWith(setIsQueryEditorDirty(true));
    });
  });

  // Their rows would otherwise land under the new dataset, whose statuses are cleared here.
  it('stops the queries still running for the previous dataset before clearing', async () => {
    const order: string[] = [];
    (queryActions.supersedeAllActiveQueries as jest.Mock).mockImplementation(() =>
      order.push('supersede')
    );
    (mockStore.dispatch as jest.Mock).mockImplementation((action) => order.push(action?.type));
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: { id: 'logs-b', type: 'INDEX_PATTERN' } },
      queryEditor: { promptModeIsAvailable: false, summaryAgentIsAvailable: false },
    });

    await middleware(setQueryState({ query: 'q', language: 'PPL' }));

    expect(queryActions.supersedeAllActiveQueries).toHaveBeenCalledTimes(1);
    expect(order.indexOf('supersede')).toBeLessThan(order.indexOf(clearQueryStatusMap().type));
    expect(order.indexOf('supersede')).toBeLessThan(order.indexOf('mock/executeQueries'));
  });

  it('fully resets and runs when switching between two index patterns', async () => {
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: { id: 'logs-a', type: 'INDEX_PATTERN' } },
      queryEditor: { promptModeIsAvailable: false, summaryAgentIsAvailable: false },
    });
    await middleware(setQueryState({ query: 'q', language: 'PPL' }));
    (mockStore.dispatch as jest.Mock).mockClear();
    mockedExecuteQueries.mockClear();

    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: { id: 'logs-b', type: 'INDEX_PATTERN' } },
      queryEditor: { promptModeIsAvailable: false, summaryAgentIsAvailable: false },
    });
    // Even a picker-marked change: index patterns don't require an explicit Run.
    await middleware({
      ...setQueryState({ query: 'q', language: 'PPL' }),
      meta: { refineSelection: true },
    });

    expect(mockStore.dispatch).toHaveBeenCalledWith(clearResults());
    expect(mockStore.dispatch).toHaveBeenCalledWith(setPatternsField(''));
    expect(mockedExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
  });

  it('still runs a query for a dataset type that does not opt out', async () => {
    mockServices.data.query.queryString.getDatasetService = jest.fn().mockReturnValue({
      cacheDataset: mockCacheDataset,
      getType: jest.fn(() => ({ meta: { requiresExplicitRun: false } })),
    });
    middleware = createDatasetChangeMiddleware(mockServices)(mockStore)(mockNext);
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: { id: 'regular-dataset', type: 'REGULAR_TYPE' } },
      queryEditor: { promptModeIsAvailable: false, summaryAgentIsAvailable: false },
    });

    await middleware(setQueryState({ query: 'q', language: 'L' }));

    expect(mockedExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
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

  it('should turn hide empty fields back off when the dataset changes', async () => {
    // Which fields are empty depends on the previous dataset's results, so the opt-in is dropped.
    mockStore.getState = jest.fn().mockReturnValue({
      query: { dataset: { id: 'new-dataset', type: 'index_pattern' } },
      queryEditor: {
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      },
    });

    await middleware(setQueryState({ query: 'source=hello', language: 'PPL' }));

    expect(mockStore.dispatch).toHaveBeenCalledWith(setHideEmptyFields(false));
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
