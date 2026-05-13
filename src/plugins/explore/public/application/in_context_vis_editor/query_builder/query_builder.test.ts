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
  getPreloadedQueryState,
  showPromptModeNotAvailableWarning,
  showMissingPromptWarning,
  showMissingDatasetWarning,
} from './utils';

import { prepareQueryForLanguage } from '../../../application/utils/languages';
import { generatePromQLWithAgUi } from '../../../application/utils/query_assist/promql_generator';
import { getPromptModeIsAvailable } from '../../../application/utils/get_prompt_mode_is_available';

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
  } as any);

jest.mock('../../utils/get_prompt_mode_is_available', () => ({
  getPromptModeIsAvailable: jest.fn(),
}));

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  getPreloadedQueryState: jest.fn(),
  queryExecution: jest.fn(),
  showPromptModeNotAvailableWarning: jest.fn(),
  showMissingPromptWarning: jest.fn(),
  showMissingDatasetWarning: jest.fn(),
  handleAgentError: jest.fn(),
}));

jest.mock('../../utils/query_assist/promql_generator', () => ({
  generatePromQLWithAgUi: jest.fn(),
}));

jest.mock('../../../application/utils/languages', () => ({
  prepareQueryForLanguage: jest.fn(),
}));

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

    it('load query from URL state and prioritize it when available', async () => {
      services.osdUrlStateStorage = {
        get: jest.fn((key: string) => {
          if (key === '_eq') return { query: 'source = metrics', language: 'PPL' };
          if (key === '_e') return { languageType: SupportLanguageType.ppl };
          return null;
        }),
        set: jest.fn(),
      } as any;

      await builder.init({
        savedQueryState: { query: 'source = logs', language: 'PPL', dataset: undefined },
      });
      expect(builder.queryState$.value.query).toBe('source = metrics');
      expect(builder.queryEditorState$.value.languageType).toBe('PPL');
    });

    it('sets up subscriptions', async () => {
      await builder.init();
      expect((builder as any).subscriptions.length).toBe(4);
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

  describe('reset', () => {
    it('restores initial state after modifications', () => {
      builder.updateQueryState({ query: 'source = logs' });
      builder.updateQueryEditorState({ promptModeIsAvailable: true });
      builder.reset();

      expect(builder.queryState$.value).toEqual({ query: '', language: 'PPL', dataset: undefined });
      expect(builder.queryEditorState$.value.promptModeIsAvailable).toBe(false);
      expect(builder.resultState$.value).toBeUndefined();
      expect(builder.datasetView$.value).toEqual({
        dataView: undefined,
        isLoading: false,
        error: null,
      });
    });

    it('resets editorRef to null', () => {
      builder.setEditorRef({ getValue: jest.fn() } as any);
      builder.reset();
      expect(builder.getEditorRef()).toBeNull();
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
    it('does nothing when datasetView has no dataView', async () => {
      builder.setIsInitialized(true);
      // datasetView has no dataView by default
      await builder.executeQuery();
      expect(builder.queryEditorState$.value.queryStatus.status).toBe(
        QueryExecutionStatus.UNINITIALIZED
      );
    });

    it('does nothing when datasetView has an error', async () => {
      builder.setIsInitialized(true);
      builder.datasetView$.next({ dataView: undefined, isLoading: false, error: 'some error' });
      await builder.executeQuery();
      expect(builder.queryEditorState$.value.queryStatus.status).toBe(
        QueryExecutionStatus.UNINITIALIZED
      );
    });

    it('does nothing when datasetView is loading', async () => {
      builder.setIsInitialized(true);
      builder.datasetView$.next({ dataView: undefined, isLoading: true, error: null });
      await builder.executeQuery();
      expect(builder.queryEditorState$.value.queryStatus.status).toBe(
        QueryExecutionStatus.UNINITIALIZED
      );
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
      builder.setEditorRef({ getValue: jest.fn().mockReturnValue('') } as any);
      await builder.callAgent();
      expect(showMissingPromptWarning).toHaveBeenCalledWith(services.notifications.toasts);
    });

    it('shows missing dataset warning when no dataset', async () => {
      builder.setEditorRef({ getValue: jest.fn().mockReturnValue('some text') } as any);
      services.data.query.queryString.getQuery.mockReturnValue({
        query: '',
        language: 'PPL',
        dataset: undefined,
      });
      await builder.callAgent();
      expect(showMissingDatasetWarning).toHaveBeenCalledWith(services.notifications.toasts);
    });

    it('handles PROMETHEUS dataset type', async () => {
      builder.setEditorRef({
        getValue: jest.fn().mockReturnValue('question'),
      } as any);

      services.data.query.queryString.getQuery.mockReturnValue({
        query: '',
        language: 'PromQL',
        dataset: {
          id: 'prom-1',
          title: 'prometheus',
          type: 'PROMETHEUS',
        },
      });

      (generatePromQLWithAgUi as jest.Mock).mockResolvedValue({
        query: 'generated PromQL',
      });

      await builder.callAgent();

      expect(builder.queryEditorState$.value.lastExecutedTranslatedQuery).toBe('generated PromQL');
    });

    it('able to handle t2ppl', async () => {
      builder.setEditorRef({
        getValue: jest.fn().mockReturnValue('question'),
      } as any);

      services.data.query.queryString.getQuery.mockReturnValue({
        query: '',
        language: 'PPL',
        dataset: {
          id: 'ppl-1',
          title: 'ppl',
          type: 'PPL',
        },
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

  describe('syncToUrl', () => {
    it('syncs state to URL when osdUrlStateStorage is available', () => {
      const setSpy = jest.fn();
      services.osdUrlStateStorage = {
        get: jest.fn(),
        set: setSpy,
      } as any;

      (builder as any).syncToUrl('_eq', { query: 'test', language: 'PPL' });
      expect(setSpy).toHaveBeenCalledWith(
        '_eq',
        { query: 'test', language: 'PPL' },
        { replace: true }
      );
    });

    it('does nothing when osdUrlStateStorage is not available', () => {
      services.osdUrlStateStorage = null;
      expect(() => {
        (builder as any).syncToUrl('_eq', { query: 'test' });
      }).not.toThrow();
    });
  });

  describe('handleDatasetChange', () => {
    it('returns undefined and disables agents when no dataset', async () => {
      const result = await (builder as any).handleDatasetChange(undefined);
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
      await (builder as any).handleDatasetChange(dataset);

      expect(checkAgentSpy).toHaveBeenCalledWith('ds-123');
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

  describe('setupGlobalDataRangeSync', () => {
    it('syncs dateRange to timefilter when dateRange changes', async () => {
      await builder.init();
      builder.updateQueryEditorState({
        dateRange: { from: 'now-1h', to: 'now' },
      });

      expect(services.data.query.timefilter.timefilter.setTime).toHaveBeenCalledWith({
        from: 'now-1h',
        to: 'now',
      });
    });

    it('does not sync when dateRange is the same', async () => {
      await builder.init();
      const setTimeSpy = jest.spyOn(services.data.query.timefilter.timefilter, 'setTime');
      services.data.query.timefilter.timefilter.getTime = jest
        .fn()
        .mockReturnValue({ from: 'now-1h', to: 'now' });

      builder.updateQueryEditorState({
        dateRange: { from: 'now-1h', to: 'now' },
      });

      expect(setTimeSpy).not.toHaveBeenCalled();
    });
  });

  describe('setupQuerySync', () => {
    it('syncs query to global queryStringManager', async () => {
      await builder.init();
      builder.updateQueryState({ query: 'source = logs' });

      expect(services.data.query.queryString.setQuery).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'source = logs' })
      );
    });

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

  describe('setupLanguageSync', () => {
    it('updates query state when language type changes', async () => {
      await builder.init();

      const newQueryState = {
        query: '',
        language: 'PromQL',
        dataset: { id: 'prom', title: 'prometheus', type: 'PROMETHEUS' },
      };
      (getPreloadedQueryState as jest.Mock).mockResolvedValue(newQueryState);

      builder.updateQueryEditorState({ languageType: SupportLanguageType.promQL });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(builder.queryState$.value.language).toBe('PromQL');
      expect(builder.queryState$.value.dataset).toEqual(newQueryState.dataset);
    });

    it('handles language switch errors', async () => {
      await builder.init();

      const error = new Error('Failed to load dataset');
      (getPreloadedQueryState as jest.Mock).mockRejectedValue(new Error('Failed to load dataset'));

      builder.updateQueryEditorState({ languageType: SupportLanguageType.promQL });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(builder.datasetView$.value.error).toBe('Failed to load dataset');
      expect(services.notifications.toasts.addError).toHaveBeenCalledWith(error, {
        title: 'Error switching language',
      });
    });
  });
});
