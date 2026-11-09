/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryBuilder, SupportLanguageType } from './query_builder';
import {
  EditorMode,
  QueryExecutionStatus,
} from '../../../application/utils/state_management/types';
import {
  queryExecution,
  showPromptModeNotAvailableWarning,
  showMissingPromptWarning,
} from './utils';

import { prepareQueryForLanguage } from '../../../application/utils/languages';
import { generatePromQLWithAgUi } from '../../../application/utils/query_assist/promql_generator';
import { getPromptModeIsAvailable } from '../../../application/utils/get_prompt_mode_is_available';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../services/source_type_registry';
import { ExploreFlavor } from '../../../../common';

const mockQuery = {
  query: 'source=logs | head 10',
  language: 'PPL',
  dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
};

const mockGetServices = () =>
  ({
    osdUrlStateStorage: undefined,
    data: {
      query: {
        queryString: {
          getQuery: jest.fn().mockReturnValue(mockQuery),
          setQuery: jest.fn(),
          getDefaultQuery: jest.fn().mockReturnValue({}),
          getInitialQueryByDataset: jest
            .fn()
            .mockReturnValue({ query: '', language: 'PPL', dataset: undefined }),
          getDatasetService: jest.fn().mockReturnValue({ cacheDataset: jest.fn() }),
          getLanguageService: jest.fn().mockReturnValue({
            getLanguage: jest.fn().mockReturnValue(null),
          }),
        },
        timefilter: {
          timefilter: {
            getTime: jest.fn().mockReturnValue({ from: 'now-15m', to: 'now' }),
            setTime: jest.fn(),
          },
        },
      },
      dataViews: {
        get: jest.fn().mockResolvedValue(undefined),
        getDefault: jest.fn().mockResolvedValue(undefined),
        ensureDefaultDataView: jest.fn().mockResolvedValue(undefined),
        convertToDataset: jest.fn().mockReturnValue({}),
      },
    },
    notifications: {
      toasts: {
        addError: jest.fn(),
        addWarning: jest.fn(),
      },
    },
    uiSettings: { get: jest.fn().mockResolvedValue(false) },
    savedObjects: {},
    http: { post: jest.fn() },
    inspectorAdapters: {
      requests: {
        reset: jest.fn(),
        start: jest.fn().mockReturnValue({
          stats: jest.fn().mockReturnThis(),
          ok: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
          getTime: jest.fn().mockReturnValue(100),
        }),
      },
    },
  }) as any;

jest.mock('../../utils/get_prompt_mode_is_available', () => ({
  getPromptModeIsAvailable: jest.fn(),
}));

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  // getPreloadedQueryState: jest.fn(),
  queryExecution: jest.fn(),
  showPromptModeNotAvailableWarning: jest.fn(),
  showMissingPromptWarning: jest.fn(),
  showMissingDatasetWarning: jest.fn(),
  showUndefinedDatasetWarning: jest.fn(),
  handleAgentError: jest.fn(),
}));

jest.mock('../../utils/query_assist/promql_generator', () => ({
  generatePromQLWithAgUi: jest.fn(),
}));

jest.mock('../../../application/utils/languages', () => ({
  prepareQueryForLanguage: jest.fn(),
}));

// Lets pending awaits (dataset wait, execution) settle.
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('QueryBuilder', () => {
  let builder: QueryBuilder;
  let services: ReturnType<typeof mockGetServices>;

  beforeEach(() => {
    services = mockGetServices();
    builder = new QueryBuilder(() => services);
  });

  afterEach(() => {
    builder.dispose();
  });

  describe('init', () => {
    it('initialize with default state when no URL state or saved state', async () => {
      await builder.init();
      expect(builder.queryState$.value).toEqual({
        query: '',
        language: 'PPL',
        dataset: undefined,
      });
      expect(builder.queryEditorState$.value.editorMode).toBe(EditorMode.Query);
    });

    it('load query from saved state', async () => {
      await builder.init({
        savedQueryState: { query: 'source = logs', language: 'PPL', dataset: undefined },
      });
      expect(builder.queryState$.value.query).toBe('source = logs');
      expect(builder.queryState$.value.language).toBe('PPL');
    });

    it('hydrates from savedQueryState only, ignoring URL state', async () => {
      services.osdUrlStateStorage = {
        get: jest.fn(() => ({ query: 'source = from_url', language: 'PPL' })),
        set: jest.fn(),
      } as any;

      await builder.init({
        savedQueryState: { query: 'source = logs', language: 'PPL', dataset: undefined },
      });
      expect(services.osdUrlStateStorage.get).not.toHaveBeenCalled();
      expect(builder.queryState$.value.query).toBe('source = logs');
      expect(builder.queryState$.value.language).toBe('PPL');
    });

    it('sets up subscriptions', async () => {
      await builder.init();
      // expect((builder as any).subscriptions.length).toBe(2);
      // Only the query sync: the language follows the query, so there's no language sync.
      expect((builder as any).subscriptions.length).toBe(1);
    });
  });

  describe('updateQueryState', () => {
    beforeEach(() => {
      builder.updateQueryState({
        query: 'source = logs1',
        language: 'PPL',
        dataset: undefined,
      });
    });
    it('merges partial updates into queryState$', () => {
      builder.updateQueryState({ query: 'source = logs' });
      expect(builder.queryState$.value.query).toBe('source = logs');
      expect(builder.queryState$.value.language).toBe('PPL');
    });
  });

  describe('updateQueryEditorState', () => {
    beforeEach(() => {
      builder.updateQueryEditorState({
        promptModeIsAvailable: false,
        editorMode: EditorMode.Query,
      });
    });
    it('merges partial updates into queryEditorState$', () => {
      builder.updateQueryEditorState({ promptModeIsAvailable: true });
      expect(builder.queryEditorState$.value.promptModeIsAvailable).toBe(true);
      expect(builder.queryEditorState$.value.editorMode).toBe(EditorMode.Query);
    });

    it('updates editorMode', () => {
      builder.updateQueryEditorState({ editorMode: EditorMode.Prompt });
      expect(builder.queryEditorState$.value.editorMode).toBe(EditorMode.Prompt);
    });
  });

  describe('updateQueryResultForEditor', () => {
    it('updates resultState$', () => {
      const result = { hits: { hits: [], total: 0 } } as any;
      builder.updateQueryResultForEditor(result);
      expect(builder.resultState$.value).toEqual(result);
    });
  });

  describe('clearResultState', () => {
    it('resets resultState$ to undefined', () => {
      builder.updateQueryResultForEditor({ hits: { hits: [] } } as any);
      builder.clearResultState();
      expect(builder.resultState$.value).toBeUndefined();
    });
  });

  describe('dispose', () => {
    it('completes all subjects', () => {
      const completeSpy = jest.spyOn(builder.queryState$, 'complete');
      builder.dispose();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('waitForDatasetReady', () => {
    it('waits until isLoading becomes false', async () => {
      builder.datasetView$.next({ dataView: undefined, isLoading: true, error: null });

      setTimeout(() => {
        builder.datasetView$.next({ dataView: undefined, isLoading: false, error: null });
      }, 50);

      const result = await builder.waitForDatasetReady();
      expect(result.isLoading).toBe(false);
    });
  });

  describe('executeQuery', () => {
    beforeEach(() => {
      (prepareQueryForLanguage as jest.Mock).mockReturnValue({
        query: 'source = logs',
      });
    });
    it('interpolates with the interpolation service current at execution time', async () => {
      const makeService = (value: string) => ({
        hasVariables: jest.fn(() => true),
        interpolate: jest.fn(() => value),
      });
      let current: ReturnType<typeof makeService> | undefined = makeService('source = first');
      const row = new QueryBuilder(
        () => services,
        'B',
        () => current as any
      );
      row.setIsInitialized(true);
      row.datasetView$.next({ dataView: { id: 'logs' } as any, isLoading: false, error: null });

      await row.executeQuery();
      expect(row.lastExecutedInterpolatedQuery).toBe('source = first');

      // The container replaced its service: the row picks it up without being told.
      current = makeService('source = second');
      await row.executeQuery();
      expect(row.lastExecutedInterpolatedQuery).toBe('source = second');

      current = undefined;
      await row.executeQuery();
      expect(row.lastExecutedInterpolatedQuery).toBe('source = logs');
      row.dispose();
    });

    it('does nothing when datasetView has no dataView', async () => {
      builder.setIsInitialized(true);
      // datasetView has no dataView by default
      await builder.executeQuery();
      expect(builder.queryEditorState$.value.queryStatus.status).toBe(
        QueryExecutionStatus.UNINITIALIZED
      );
    });

    // it('does nothing when datasetView has an error', async () => {
    //   builder.setIsInitialized(true);
    //   builder.datasetView$.next({ dataView: undefined, isLoading: false, error: 'some error' });
    //   await builder.executeQuery();
    //   expect(builder.queryEditorState$.value.queryStatus.status).toBe(
    //     QueryExecutionStatus.UNINITIALIZED
    //   );
    // });
    // A dataset that failed to load is the row's error, so the list and the vis can show it.
    // it('does not execute, and reports the dataset error, when datasetView has an error', async () => {
    // executeQuery no longer sets the error itself: it returns before resetting the status, so the
    // error set when the dataset failed to load stays.
    it('does not execute, and keeps the dataset load error, when datasetView has an error', async () => {
      builder.setIsInitialized(true);
      (queryExecution as jest.Mock).mockClear();
      builder.datasetView$.next({ dataView: undefined, isLoading: false, error: 'some error' });
      // What setupQuerySync's catchError does on a failed load.
      (builder as any).setDatasetLoadError('some error');
      await builder.executeQuery();
      expect(queryExecution).not.toHaveBeenCalled();
      const { queryStatus } = builder.queryEditorState$.value;
      expect(queryStatus.status).toBe(QueryExecutionStatus.ERROR);
      expect(queryStatus.error?.message.details).toBe('some error');
    });

    // it('does nothing when datasetView is loading', async () => {
    //   builder.setIsInitialized(true);
    //   builder.datasetView$.next({ dataView: undefined, isLoading: true, error: null });
    //   await builder.executeQuery();
    //   expect(builder.queryEditorState$.value.queryStatus.status).toBe(
    //     QueryExecutionStatus.UNINITIALIZED
    //   );
    // });
    // The page executes right after load(), while rows still load their dataset: wait, then run.
    it('waits for the dataset to load, then executes', async () => {
      builder.setIsInitialized(true);
      (queryExecution as jest.Mock).mockClear();
      builder.datasetView$.next({ dataView: undefined, isLoading: true, error: null });

      const running = builder.executeQuery();
      await Promise.resolve();
      expect(queryExecution).not.toHaveBeenCalled();

      builder.datasetView$.next({
        dataView: { id: 'logs', title: 'logs', fields: [] } as any,
        isLoading: false,
        error: null,
      });
      await running;
      expect(queryExecution).toHaveBeenCalled();
    });

    it('executes query when dataView is ready', async () => {
      builder.setIsInitialized(true);
      const mockDataView = {
        id: 'logs',
        title: 'logs',
        fields: [],
      } as any;

      builder.datasetView$.next({
        dataView: mockDataView,
        isLoading: false,
        error: null,
      });

      await builder.executeQuery();

      expect(queryExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          queryString: 'source = logs',
        })
      );
    });
  });

  describe('onQueryExecutionSubmit', () => {
    it('calls executeQuery in Query mode', async () => {
      const executeQuerySpy = jest.spyOn(builder, 'executeQuery').mockResolvedValue();
      const callAgentSpy = jest.spyOn(builder, 'callAgent').mockResolvedValue();

      builder.updateQueryEditorState({ editorMode: EditorMode.Query });
      await builder.onQueryExecutionSubmit();
      expect(executeQuerySpy).toHaveBeenCalled();
      expect(callAgentSpy).not.toHaveBeenCalled();
    });

    it('shows warning when in Prompt mode but promptModeIsAvailable is false', async () => {
      builder.updateQueryEditorState({
        editorMode: EditorMode.Prompt,
        promptModeIsAvailable: false,
      });
      await builder.onQueryExecutionSubmit();
      expect(showPromptModeNotAvailableWarning).toHaveBeenCalledWith(services.notifications.toasts);
    });

    it('calls callAgent when in Prompt mode and promptModeIsAvailable is true', async () => {
      const callAgentSpy = jest.spyOn(builder, 'callAgent').mockResolvedValue();
      builder.updateQueryEditorState({
        editorMode: EditorMode.Prompt,
        promptModeIsAvailable: true,
      });
      await builder.onQueryExecutionSubmit();
      expect(callAgentSpy).toHaveBeenCalled();
    });
  });

  describe('callAgent', () => {
    it('returns early when editorRef is null', async () => {
      await builder.callAgent();
      expect(services.http.post).not.toHaveBeenCalled();
    });

    it('shows missing prompt warning when editor is empty', async () => {
      builder.setEditor({ getValue: jest.fn().mockReturnValue('') } as any);
      await builder.callAgent();
      expect(showMissingPromptWarning).toHaveBeenCalledWith(services.notifications.toasts);
    });

    // it('shows missing dataset warning when no dataset', async () => {
    //   builder.setEditor({ getValue: jest.fn().mockReturnValue('some text') } as any);
    //   services.data.query.queryString.getQuery.mockReturnValue({
    //     query: '',
    //     language: 'PPL',
    //     dataset: undefined,
    //   });
    //   await builder.callAgent();
    //   expect(showMissingDatasetWarning).toHaveBeenCalledWith(services.notifications.toasts);
    // });
    // No dataset: the row returns without calling the agent; executeAll's skipped-rows toast
    // tells the user.
    it('returns without calling the agent when the row has no dataset', async () => {
      (generatePromQLWithAgUi as jest.Mock).mockClear();
      builder.setEditor({ getValue: jest.fn().mockReturnValue('some text') } as any);
      await builder.callAgent();
      expect(services.http.post).not.toHaveBeenCalled();
      expect(generatePromQLWithAgUi).not.toHaveBeenCalled();
    });

    it('handles PROMETHEUS dataset type', async () => {
      builder.setEditor({
        getValue: jest.fn().mockReturnValue('question'),
      } as any);

      // callAgent reads the row's own query state, not the global query string.
      builder.updateQueryState({
        query: '',
        language: 'PromQL',
        dataset: {
          id: 'prom-1',
          title: 'prometheus',
          type: 'PROMETHEUS',
        } as any,
      });

      (generatePromQLWithAgUi as jest.Mock).mockResolvedValue({
        query: 'generated PromQL',
      });

      await builder.callAgent();

      expect(builder.queryEditorState$.value.lastExecutedTranslatedQuery).toBe('generated PromQL');
    });

    it('able to handle t2ppl', async () => {
      builder.setEditor({
        getValue: jest.fn().mockReturnValue('question'),
      } as any);

      builder.updateQueryState({
        query: '',
        language: 'PPL',
        dataset: {
          id: 'ppl-1',
          title: 'ppl',
          type: 'PPL',
        } as any,
      });

      const mockApiResponse = {
        query: 'source=logs | head 10',
        timeRange: null,
      };
      services.http.post.mockResolvedValue(mockApiResponse);
      await builder.callAgent();
      expect(builder.queryEditorState$.value.lastExecutedTranslatedQuery).toBe(
        mockApiResponse.query
      );
    });
  });

  describe('handleDatasetChange', () => {
    it('returns undefined and disables agents when no dataset', async () => {
      const result = await (builder as any).handleDatasetChange({ query: '', language: 'PPL' });
      expect(result).toBeUndefined();
      expect(builder.queryEditorState$.value.promptModeIsAvailable).toBe(false);
    });

    it('fetches dataView and checks agent availability for dataset', async () => {
      const mockDataView = { id: 'logs', title: 'logs' };
      services.data.dataViews.get = jest.fn().mockResolvedValue(mockDataView);
      const checkAgentSpy = jest.spyOn(builder as any, 'checkAgentAvailability');

      const dataset = {
        id: 'logs',
        title: 'logs',
        type: 'INDEX_PATTERN',
        dataSource: { id: 'ds-123' },
      } as any;

      const query = { query: '', language: 'PPL', dataset };
      await (builder as any).handleDatasetChange(query);

      // The row's own query, not the global one, decides AI availability.
      expect(checkAgentSpy).toHaveBeenCalledWith(query);
    });
  });

  describe('fetchDataView', () => {
    it('returns cached dataView when available', async () => {
      const mockDataView = { id: 'logs', title: 'logs' };
      services.data.dataViews.get = jest.fn().mockResolvedValue(mockDataView);

      const dataset = { id: '123', title: 'logs', type: 'INDEX_PATTERN' } as any;
      const result = await (builder as any).fetchDataView(dataset);

      expect(result).toEqual(mockDataView);
      expect(services.data.dataViews.get).toHaveBeenCalledTimes(1);
      expect(services.data.dataViews.get).toHaveBeenCalledWith('123', false);
    });

    it('caches dataset when not found in cache', async () => {
      services.data.dataViews.get = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ id: 'logs', title: 'logs' });
      const cacheDatasetSpy = jest.fn().mockResolvedValue(undefined);
      services.data.query.queryString.getDatasetService = jest
        .fn()
        .mockReturnValue({ cacheDataset: cacheDatasetSpy });

      const dataset = { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' } as any;
      await (builder as any).fetchDataView(dataset);

      expect(cacheDatasetSpy).toHaveBeenCalled();
      expect(services.data.dataViews.get).toHaveBeenCalledTimes(2);
    });

    it('uses onlyCheckCache=true for non-index-pattern datasets', async () => {
      const mockDataView = { id: 'prom', title: 'prometheus' };
      services.data.dataViews.get = jest.fn().mockResolvedValue(mockDataView);

      const dataset = { id: 'prom', title: 'prometheus', type: 'PROMETHEUS' } as any;
      await (builder as any).fetchDataView(dataset);

      expect(services.data.dataViews.get).toHaveBeenCalledWith('prom', true);
    });
  });

  it('updates agent flag when both checks succeed', async () => {
    (getPromptModeIsAvailable as jest.Mock).mockResolvedValue(true);

    await (builder as any).checkAgentAvailability('ds-123');

    expect(builder.queryEditorState$.value.promptModeIsAvailable).toBe(true);
  });

  describe("a registered Metrics source's own language", () => {
    const dataset = { id: 'my-metrics', title: 'My metrics', type: 'MY_DATASET_TYPE' } as any;
    beforeEach(() => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'my-source',
        label: 'My Source',
        datasetTypes: ['MY_DATASET_TYPE'],
        flavors: [ExploreFlavor.Metrics],
        languageSettings: { MY_SQL: {} },
        resolveDefaultDataset: async () => undefined,
      });
      setSourceTypeRegistry(registry);
      // (getPreloadedQueryState as jest.Mock).mockResolvedValue({
      //   query: '',
      //   language: 'MY_SQL',
      //   dataset,
      // });
    });
    afterEach(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

    it('keeps the saved query options on init', async () => {
      await builder.init({
        savedQueryState: {
          query: 'SELECT 1',
          language: 'MY_SQL',
          dataset,
          queryOptions: { maxDataPoints: 50 },
        },
      });

      expect(builder.queryState$.value.queryOptions).toEqual({ maxDataPoints: 50 });

      builder.updateQueryOptions({ maxDataPoints: 75 });
      expect(builder.queryState$.value.queryOptions).toEqual({ maxDataPoints: 75 });
    });

    it('still drops query options for a logs language', async () => {
      // (getPreloadedQueryState as jest.Mock).mockResolvedValue(mockQuery);
      await builder.init({
        savedQueryState: { ...mockQuery, queryOptions: { maxDataPoints: 50 } },
      });

      expect(builder.queryState$.value.queryOptions).toBeUndefined();
    });
  });

  describe('setupQuerySync', () => {
    it('handles dataset changes', async () => {
      await builder.init();

      const mockDataView = { id: 'logs', title: 'logs' };
      jest.spyOn(builder as any, 'handleDatasetChange').mockResolvedValue(mockDataView);

      const dataset = { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' } as any;
      builder.updateQueryState({ dataset });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(builder.datasetView$.value.dataView).toEqual(mockDataView);
      expect(builder.datasetView$.value.isLoading).toBe(false);
      expect(builder.datasetView$.value.error).toBeNull();
    });

    it('shows error toast when dataset loading fails', async () => {
      await builder.init();
      jest
        .spyOn(builder as any, 'handleDatasetChange')
        .mockRejectedValue(new Error('Dataset not found'));

      const dataset = { id: 'invalid', title: 'invalid', type: 'INDEX_PATTERN' } as any;
      builder.updateQueryState({ dataset });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(builder.datasetView$.value.error).toContain('Error loading dataset');
    });
  });

  // languageType was removed from QueryEditorState: the language lives on the query state only.
  describe('language lives on the query state', () => {
    it("is set from the saved query's language on init", async () => {
      await builder.init({ savedQueryState: { query: 'up', language: 'PROMQL' } });

      expect(builder.queryState$.value.language).toBe(SupportLanguageType.promQL);
    });

    it('updates when the query language changes, without preloading another dataset', async () => {
      await builder.init();
      const dataset = builder.queryState$.value.dataset;
      // (getPreloadedQueryState as jest.Mock).mockClear();

      builder.updateQueryState({ language: 'SQL', query: '' });

      expect(builder.queryState$.value.language).toBe(SupportLanguageType.sql);
      expect(builder.queryState$.value.dataset).toEqual(dataset);
      // expect(getPreloadedQueryState).not.toHaveBeenCalled();
    });
  });

  describe('multi-query row isolation', () => {
    let row: QueryBuilder;

    beforeEach(() => {
      services.osdUrlStateStorage = { get: jest.fn(), set: jest.fn() } as any;
      // (getPreloadedQueryState as jest.Mock).mockResolvedValue({
      //   query: '',
      //   language: 'PPL',
      //   dataset: undefined,
      // });
      row = new QueryBuilder(() => services, 'B');
    });

    afterEach(() => {
      row.dispose();
    });

    it('does not write URL, global query string or timefilter', async () => {
      jest.useFakeTimers();
      await row.init();
      row.updateQueryState({ query: 'source = edited' });
      jest.advanceTimersByTime(1000);
      jest.useRealTimers();

      expect(services.osdUrlStateStorage.set).not.toHaveBeenCalled();
      expect(services.data.query.queryString.setQuery).not.toHaveBeenCalled();
      expect(services.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });

    it('executes with its own abort controller (no shared/global controller)', async () => {
      row.setIsInitialized(true);
      row.datasetView$.next({ dataView: { id: 'logs' } as any, isLoading: false, error: null });
      (prepareQueryForLanguage as jest.Mock).mockReturnValue({ query: 'source = logs' });

      (queryExecution as jest.Mock).mockClear();
      await row.executeQuery();
      await builder.executeQuery();

      const calls = (queryExecution as jest.Mock).mock.calls.map(([args]) => args);
      const rowCall = calls[0];
      const builderCall = calls[1];
      expect(rowCall?.activeQueryAbortController).toBeInstanceOf(AbortController);
      expect(rowCall?.activeQueryAbortController).not.toBe(builderCall?.activeQueryAbortController);
    });
  });

  describe('multiple PromQL expressions', () => {
    const ready = (row: QueryBuilder) => {
      row.datasetView$.next({ dataView: { id: 'prom' } as any, isLoading: false, error: null });
    };

    it('runs a row with several expressions as one combined query', async () => {
      (queryExecution as jest.Mock).mockClear();
      (prepareQueryForLanguage as jest.Mock).mockReturnValue({ query: 'up; down' });
      builder.init({
        savedQueryState: { query: 'up; down', language: 'PROMQL', dataset: undefined },
      });
      ready(builder);

      await builder.executeQuery();

      expect(queryExecution).toHaveBeenCalledTimes(1);
    });
  });

  describe('shared query options', () => {
    const runWith = async (language: string, maxDataPoints?: number) => {
      (queryExecution as jest.Mock).mockClear();
      (prepareQueryForLanguage as jest.Mock).mockReturnValue({ query: 'q' });
      const row = new QueryBuilder(
        () => services,
        'A',
        undefined,
        () => ({ maxDataPoints })
      );
      row.init({
        savedQueryState: {
          query: 'q',
          language,
          dataset: undefined,
          queryOptions: { maxDataPoints: 50 },
        } as any,
      });
      row.datasetView$.next({ dataView: { id: 'ds' } as any, isLoading: false, error: null });
      await row.executeQuery();
      const [args] = (queryExecution as jest.Mock).mock.calls[0];
      row.dispose();
      return args.query;
    };

    it("runs a metrics row with the panel's max data points instead of its own", async () => {
      expect((await runWith('PROMQL', 300)).queryOptions.maxDataPoints).toBe(300);
      // Undefined = auto, even when the row still carries an old value.
      expect((await runWith('PROMQL', undefined)).queryOptions.maxDataPoints).toBeUndefined();
    });

    it('leaves a logs row as it is', async () => {
      expect((await runWith('PPL', 300)).queryOptions).toBeUndefined();
    });
  });

  describe('abortActiveQueries', () => {
    it("aborts only this builder's queries", async () => {
      const other = new QueryBuilder(() => services, 'Z');
      // Calls from earlier tests would shift the indexes below.
      (queryExecution as jest.Mock).mockClear();
      (queryExecution as jest.Mock).mockImplementation(({ activeQueryAbortController }) => {
        return new Promise(() => {});
      });
      (prepareQueryForLanguage as jest.Mock).mockReturnValue({ query: 'q' });
      [builder, other].forEach((b) => {
        b.setIsInitialized(true);
        b.datasetView$.next({ dataView: { id: 'logs' } as any, isLoading: false, error: null });
      });
      const builderExecution = builder.executeQuery();
      // await Promise.resolve();
      // await Promise.resolve();
      await flushPromises();
      const otherExecution = other.executeQuery();
      // await Promise.resolve();
      // await Promise.resolve();
      await flushPromises();

      other.abortActiveQueries();

      const [builderController, otherController] = (queryExecution as jest.Mock).mock.calls.map(
        ([args]) => args.activeQueryAbortController
      );
      expect(otherController.signal.aborted).toBe(true);
      expect(builderController.signal.aborted).toBe(false);
      void builderExecution;
      void otherExecution;
      (queryExecution as jest.Mock).mockReset();
      other.dispose();
    });

    it('stops a run cancelled while it waits for the dataset', async () => {
      (queryExecution as jest.Mock).mockClear();
      builder.setIsInitialized(true);
      builder.datasetView$.next({ dataView: undefined, isLoading: true, error: null });

      const execution = builder.executeQuery();
      builder.abortActiveQueries();
      builder.datasetView$.next({ dataView: { id: 'logs' } as any, isLoading: false, error: null });
      await execution;

      expect(queryExecution).not.toHaveBeenCalled();
    });

    it('aborts the previous run when a newer one starts', async () => {
      (queryExecution as jest.Mock).mockReset();
      (queryExecution as jest.Mock).mockImplementation(() => new Promise(() => {}));
      (prepareQueryForLanguage as jest.Mock).mockReturnValue({ query: 'q' });
      builder.setIsInitialized(true);
      builder.datasetView$.next({ dataView: { id: 'logs' } as any, isLoading: false, error: null });

      void builder.executeQuery();
      await flushPromises();
      void builder.executeQuery();
      await flushPromises();

      const [first, second] = (queryExecution as jest.Mock).mock.calls.map(
        ([args]) => args.activeQueryAbortController
      );
      expect(first.signal.aborted).toBe(true);
      expect(second.signal.aborted).toBe(false);
      (queryExecution as jest.Mock).mockReset();
    });
  });
});
