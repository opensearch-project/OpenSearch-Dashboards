/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPreloadedState, loadReduxState, persistReduxState } from './redux_persistence';
import { ExploreServices } from '../../../../types';
import { RootState } from '../store';
import { EXPLORE_DEFAULT_LANGUAGE, DEFAULT_TRACE_COLUMNS_SETTING } from '../../../../../common';
import { ColorSchemas } from '../../../../components/visualizations/types';
import { EditorMode, QueryExecutionStatus } from '../types';
import { CORE_SIGNAL_TYPES } from '../../../../../../data/common';
import { of } from 'rxjs';

jest.mock('../../../../components/visualizations/metric/metric_vis_config', () => ({
  defaultMetricChartStyles: {
    showTitle: true,
    title: '',
    fontSize: 60,
    useColor: false,
    colorSchema: 'blues',
  },
}));

describe('redux_persistence', () => {
  let mockServices: ExploreServices;

  beforeEach(() => {
    mockServices = {
      osdUrlStateStorage: {
        set: jest.fn(),
        get: jest.fn(),
      },
      core: {
        application: {
          currentAppId$: of('explore/logs'),
        },
      },
      data: {
        query: {
          queryString: {
            setQuery: jest.fn(),
            addToQueryHistory: jest.fn(),
            getQuery: jest.fn(() => ({ dataset: null })),
            getDefaultQuery: jest.fn(() => ({ dataset: null })),
            getDatasetService: jest.fn(() => ({
              getType: jest.fn(() => ({
                fetch: jest.fn(() => Promise.resolve({ children: [] })),
                toDataset: jest.fn(),
              })),
            })),
            getInitialQueryByDataset: jest.fn((dataset) => ({
              query: 'initial query',
              language: dataset.language || EXPLORE_DEFAULT_LANGUAGE,
              dataset,
            })),
          },
          timefilter: {
            timefilter: {
              getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
            },
          },
        },
        dataViews: {
          get: jest.fn(() =>
            Promise.resolve({
              id: 'test-dataset',
              title: 'test-dataset',
              signalType: CORE_SIGNAL_TYPES.LOGS,
            })
          ),
        },
      },
      uiSettings: {
        get: jest.fn((key) => {
          if (key === 'defaultColumns') return ['_source'];
          if (key === DEFAULT_TRACE_COLUMNS_SETTING) return ['spanId'];
          return undefined;
        }),
      },
      storage: {},
    } as any;

    jest.clearAllMocks();
  });

  describe('persistReduxState', () => {
    it('should persist query and app state to URL storage', () => {
      const mockState: RootState = {
        query: {
          query: 'source=logs | head 10',
          language: 'PPL',
          dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
        },
        ui: {
          activeTabId: '',
          showHistogram: true,
        },
        results: {},
        tab: {
          logs: {},
          patterns: {
            patternsField: undefined,
            usingRegexPatterns: false,
          },
        },
        legacy: {
          columns: ['_source'],
          sort: [],
          isDirty: false,
          interval: 'auto',
          savedSearch: undefined,
          savedQuery: undefined,
          lineCount: undefined,
        },
        queryEditor: {
          queryStatusMap: {},
          overallQueryStatus: {
            status: QueryExecutionStatus.UNINITIALIZED,
            elapsedMs: undefined,
            startTime: undefined,
            error: undefined,
          },
          promptModeIsAvailable: false,
          promptToQueryIsLoading: false,
          editorMode: EditorMode.Query,
          summaryAgentIsAvailable: false,
          lastExecutedPrompt: '',
          lastExecutedTranslatedQuery: '',
          queryExecutionButtonStatus: 'REFRESH',
          isQueryEditorDirty: false,
        },
        meta: {
          isInitialized: false,
        },
      };

      persistReduxState(mockState, mockServices);

      expect(mockServices.osdUrlStateStorage!.set).toHaveBeenCalledWith('_q', mockState.query, {
        replace: true,
      });
      expect(mockServices.osdUrlStateStorage!.set).toHaveBeenCalledWith(
        '_a',
        {
          ui: mockState.ui,
          tab: mockState.tab,
          legacy: mockState.legacy,
        },
        { replace: true }
      );
    });

    it('should handle missing osdUrlStateStorage gracefully', () => {
      const mockState: RootState = {} as any;
      const servicesWithoutStorage = { ...mockServices, osdUrlStateStorage: undefined };

      expect(() => persistReduxState(mockState, servicesWithoutStorage)).not.toThrow();
    });

    it('should handle errors gracefully', () => {
      const mockState: RootState = {} as any;
      const servicesWithError = {
        ...mockServices,
        osdUrlStateStorage: {
          set: jest.fn(() => {
            throw new Error('Storage error');
          }),
          get: jest.fn(),
          change$: {} as any,
          cancel: jest.fn(),
          flush: jest.fn(),
        },
      } as ExploreServices;

      expect(() => persistReduxState(mockState, servicesWithError)).not.toThrow();
    });
  });

  describe('loadReduxState', () => {
    it('should load state from URL storage when available', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      };
      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: {
          logs: {},
          visualizations: {
            styleOptions: {
              showTitle: true,
              title: '',
              fontSize: 60,
              useColor: false,
              colorSchema: ColorSchemas.BLUES,
            },
            chartType: undefined,
            axesMapping: {},
          },
        },
        legacy: {
          columns: ['_source'],
          sort: [],
          isDirty: false,
          interval: 'auto',
          savedSearch: undefined,
          savedQuery: undefined,
          lineCount: undefined,
        },
        meta: {
          isInitialized: false,
        },
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      const result = await loadReduxState(mockServices);

      expect(result.query).toEqual(mockQueryState);
      expect(result.ui).toEqual(mockAppState.ui);
      expect(mockServices.data.query.queryString.setQuery).toHaveBeenCalledWith(mockQueryState);
    });

    it('should fallback to preloaded state when URL storage is not available', async () => {
      const servicesWithoutStorage = { ...mockServices, osdUrlStateStorage: undefined };

      const result = await loadReduxState(servicesWithoutStorage);

      expect(result).toBeDefined();
      expect(result.ui.activeTabId).toBe('');
      expect(result.query.language).toBe(EXPLORE_DEFAULT_LANGUAGE);
    });

    it('should use preloaded state for missing sections', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(null); // No app state

      const result = await loadReduxState(mockServices);

      expect(result.query).toEqual(mockQueryState);
      expect(result.ui.activeTabId).toBe(''); // Should use preloaded UI state
    });

    it('should handle errors and fallback to preloaded state', async () => {
      const servicesWithError = {
        ...mockServices,
        osdUrlStateStorage: {
          get: jest.fn(() => {
            throw new Error('Storage error');
          }),
          set: jest.fn(),
          change$: {} as any,
          cancel: jest.fn(),
          flush: jest.fn(),
        },
      } as ExploreServices;

      const result = await loadReduxState(servicesWithError);

      expect(result).toBeDefined();
      expect(result.ui.activeTabId).toBe(''); // Should fallback to preloaded state
    });
  });

  describe('getPreloadedState', () => {
    it('should return complete preloaded state with correct UI defaults', async () => {
      const result = await getPreloadedState(mockServices);

      expect(result).toBeDefined();
      expect(result.ui).toEqual({
        activeTabId: '',
        showHistogram: true,
      });
      expect(result.query.language).toBe(EXPLORE_DEFAULT_LANGUAGE);
      expect(result.query.query).toBe(''); // Should be empty string
      expect(result.results).toEqual({});
      expect(result.tab.logs).toEqual({});
      expect(result.legacy.columns).toEqual(['_source']);
      expect(result.queryEditor.promptModeIsAvailable).toBe(false);
      expect(result.queryEditor.queryStatusMap).toEqual({});
      expect(result.queryEditor.overallQueryStatus).toEqual({
        status: QueryExecutionStatus.UNINITIALIZED,
        elapsedMs: undefined,
        startTime: undefined,
        error: undefined,
      });
      expect(result.queryEditor.lastExecutedPrompt).toBe('');
      expect(result.queryEditor.lastExecutedTranslatedQuery).toBe('');
      expect(result.meta).toEqual({
        isInitialized: false,
      });
    });

    it('should handle dataset initialization', async () => {
      const mockDataset = { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' };

      // Mock dataset service to return a dataset
      (mockServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() =>
            Promise.resolve({
              children: [{ id: 'pattern1', title: 'Pattern 1' }],
            })
          ),
          toDataset: jest.fn(() => mockDataset),
        })),
      });

      const result = await getPreloadedState(mockServices);

      expect(result.query.dataset).toEqual(mockDataset);
      expect(mockServices.data.query.queryString.getInitialQueryByDataset).toHaveBeenCalledWith({
        ...mockDataset,
        language: EXPLORE_DEFAULT_LANGUAGE,
      });
    });

    it('should handle missing dataset service gracefully', async () => {
      (mockServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue(
        undefined
      );

      const result = await getPreloadedState(mockServices);

      expect(result.query.dataset).toBeUndefined();
      expect(result.query.language).toBe(EXPLORE_DEFAULT_LANGUAGE);
      expect(result.query.query).toBe('');
    });

    it('should use default columns from uiSettings', async () => {
      const customColumns = ['field1', 'field2'];
      (mockServices.uiSettings!.get as jest.Mock).mockImplementation((key) => {
        if (key === 'defaultColumns') return customColumns;
        return undefined;
      });

      const result = await getPreloadedState(mockServices);

      expect(result.legacy.columns).toEqual(customColumns);
    });

    it('should fallback to default columns when uiSettings is not available', async () => {
      const servicesWithoutUiSettings = {
        ...mockServices,
        uiSettings: {
          get: jest.fn(() => ['_source']),
        } as any,
      };

      const result = await getPreloadedState(servicesWithoutUiSettings);

      expect(result.legacy.columns).toEqual(['_source']);
    });

    it('should set correct editor mode from DEFAULT_EDITOR_MODE', async () => {
      const result = await getPreloadedState(mockServices);
      expect(result.queryEditor.editorMode).toBe(EditorMode.Query);
    });

    it('should initialize meta state with isInitialized false', async () => {
      const result = await getPreloadedState(mockServices);
      expect(result.meta).toEqual({
        isInitialized: false,
      });
    });
  });

  describe('loadReduxState with meta state', () => {
    it('should use preloaded meta state when not provided in URL', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      };
      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: {
          logs: {},
          visualizations: {
            styleOptions: {
              showTitle: true,
              title: '',
              fontSize: 60,
              useColor: false,
              colorSchema: ColorSchemas.BLUES,
            },
            chartType: undefined,
            axesMapping: {},
          },
        },
        legacy: {
          columns: ['_source'],
          sort: [],
          isDirty: false,
          interval: 'auto',
          savedSearch: undefined,
          savedQuery: undefined,
          lineCount: undefined,
        },
        // Note: meta is intentionally omitted to test fallback
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      const result = await loadReduxState(mockServices);

      expect(result.meta).toEqual({
        isInitialized: false,
      });
    });

    it('should use meta state from URL when provided', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      };
      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: {
          logs: {},
          visualizations: {
            styleOptions: {
              showTitle: true,
              title: '',
              fontSize: 60,
              useColor: false,
              colorSchema: ColorSchemas.BLUES,
            },
            chartType: undefined,
            axesMapping: {},
          },
        },
        legacy: {
          columns: ['_source'],
          sort: [],
          isDirty: false,
          interval: 'auto',
          savedSearch: undefined,
          savedQuery: undefined,
          lineCount: undefined,
        },
        meta: {
          isInitialized: true, // Different from default
        },
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      const result = await loadReduxState(mockServices);

      expect(result.meta).toEqual({
        isInitialized: true,
      });
    });
  });

  describe('getPreloadedMetaState', () => {
    it('should return meta state with isInitialized false', async () => {
      const result = await getPreloadedState(mockServices);
      expect(result.meta).toEqual({
        isInitialized: false,
      });
    });

    it('should always initialize meta state consistently', async () => {
      // Test multiple calls to ensure consistency
      const result1 = await getPreloadedState(mockServices);
      const result2 = await getPreloadedState(mockServices);

      expect(result1.meta).toEqual(result2.meta);
      expect(result1.meta.isInitialized).toBe(false);
      expect(result2.meta.isInitialized).toBe(false);
    });
  });

  describe('SignalType filtering', () => {
    it('should accept Traces datasets for Traces flavor', async () => {
      const tracesServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/traces') } },
        data: {
          ...mockServices.data,
          dataViews: {
            get: jest.fn(() => Promise.resolve({ signalType: CORE_SIGNAL_TYPES.TRACES })),
          },
        },
      } as any;

      (tracesServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'test' }] })),
          toDataset: jest.fn(() => ({ id: 'test', title: 'test', type: 'INDEX_PATTERN' })),
        })),
      });

      const result = await getPreloadedState(tracesServices);
      expect(result.query.dataset).toBeDefined();
    });

    it('should reject non-Traces datasets for Traces flavor', async () => {
      const tracesServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/traces') } },
        data: {
          ...mockServices.data,
          dataViews: {
            get: jest.fn(() => Promise.resolve({ signalType: CORE_SIGNAL_TYPES.LOGS })),
          },
        },
      } as any;

      (tracesServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'test' }] })),
          toDataset: jest.fn(() => ({ id: 'test', title: 'test', type: 'INDEX_PATTERN' })),
        })),
      });

      const result = await getPreloadedState(tracesServices);
      expect(result.query.dataset).toBeUndefined();
    });

    it('should accept non-Traces datasets for non-Traces flavor', async () => {
      const logsServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/logs') } },
        data: {
          ...mockServices.data,
          dataViews: {
            get: jest.fn(() => Promise.resolve({ signalType: CORE_SIGNAL_TYPES.LOGS })),
          },
        },
      } as any;

      (logsServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'test' }] })),
          toDataset: jest.fn(() => ({ id: 'test', title: 'test', type: 'INDEX_PATTERN' })),
        })),
      });

      const result = await getPreloadedState(logsServices);
      expect(result.query.dataset).toBeDefined();
    });

    it('should reject Traces datasets for non-Traces flavor', async () => {
      const logsServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/logs') } },
        data: {
          ...mockServices.data,
          dataViews: {
            get: jest.fn(() => Promise.resolve({ signalType: CORE_SIGNAL_TYPES.TRACES })),
          },
        },
      } as any;

      (logsServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'test' }] })),
          toDataset: jest.fn(() => ({ id: 'test', title: 'test', type: 'INDEX_PATTERN' })),
        })),
      });

      const result = await getPreloadedState(logsServices);
      expect(result.query.dataset).toBeUndefined();
    });
  });

  describe('loadReduxState with empty columns in URL state', () => {
    it('should use default columns when URL state has empty columns array', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      };
      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: {
          logs: {},
        },
        legacy: {
          columns: [], // Empty columns array
          sort: [],
          isDirty: false,
          interval: 'auto',
          savedSearch: undefined,
          savedQuery: undefined,
          lineCount: undefined,
        },
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      const result = await loadReduxState(mockServices);

      // Should use default columns from UI settings instead of empty array
      expect(result.legacy.columns).toEqual(['_source']);
    });

    it('should use default columns for traces flavor when URL state has empty columns', async () => {
      const tracesServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/traces') } },
      } as any;

      const mockQueryState = {
        query: 'source=traces',
        language: 'PPL',
        dataset: { id: 'traces-dataset', title: 'Traces Dataset', type: 'INDEX_PATTERN' },
      };
      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: {
          logs: {},
        },
        legacy: {
          columns: [], // Empty columns array
          sort: [],
          isDirty: false,
          interval: 'auto',
          savedSearch: undefined,
          savedQuery: undefined,
          lineCount: undefined,
        },
      };

      (tracesServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      (tracesServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'traces-dataset',
        title: 'Traces Dataset',
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });

      const result = await loadReduxState(tracesServices);

      // Should use default trace columns from UI settings
      expect(result.legacy.columns).toEqual(['spanId']);
    });

    it('should preserve existing columns when they are present in URL state', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      };
      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: {
          logs: {},
        },
        legacy: {
          columns: ['field1', 'field2'], // Valid columns
          sort: [],
          isDirty: false,
          interval: 'auto',
          savedSearch: undefined,
          savedQuery: undefined,
          lineCount: undefined,
        },
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      const result = await loadReduxState(mockServices);

      // Should preserve URL state columns when they exist
      expect(result.legacy.columns).toEqual(['field1', 'field2']);
    });
  });

  describe('loadReduxState with SignalType validation for URL datasets', () => {
    it('should validate URL dataset against current flavor and use it if compatible', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'logs-dataset', title: 'Logs Dataset', type: 'INDEX_PATTERN' },
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(null);

      // Mock dataViews.get to return LOGS signal type
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'logs-dataset',
        title: 'Logs Dataset',
        signalType: CORE_SIGNAL_TYPES.LOGS,
      });

      const result = await loadReduxState(mockServices);

      // Should use the URL dataset since it's compatible with logs flavor
      expect(result.query.dataset).toEqual({
        id: 'logs-dataset',
        title: 'Logs Dataset',
        type: 'INDEX_PATTERN',
        timeFieldName: undefined,
        dataSource: undefined,
      });
      expect(result.query.query).toBe(mockQueryState.query);
      expect(result.query.language).toBe(mockQueryState.language);
    });

    it('should reject incompatible URL dataset and fetch new one for traces flavor', async () => {
      const tracesServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/traces') } },
      } as any;

      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'logs-dataset', title: 'Logs Dataset', type: 'INDEX_PATTERN' },
      };

      (tracesServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(null);

      // Mock dataViews.get to return LOGS signal type (incompatible with traces)
      (tracesServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'logs-dataset',
        title: 'Logs Dataset',
        signalType: CORE_SIGNAL_TYPES.LOGS,
      });

      // Mock dataset service to return a traces dataset
      (tracesServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'traces-dataset' }] })),
          toDataset: jest.fn(() => ({
            id: 'traces-dataset',
            title: 'Traces Dataset',
            type: 'INDEX_PATTERN',
          })),
        })),
      });

      // Mock dataViews.get for the fetched traces dataset
      (tracesServices.data.dataViews!.get as jest.Mock).mockImplementation((id) => {
        if (id === 'traces-dataset') {
          return Promise.resolve({ signalType: CORE_SIGNAL_TYPES.TRACES });
        }
        return Promise.resolve({ signalType: CORE_SIGNAL_TYPES.LOGS });
      });

      const result = await loadReduxState(tracesServices);

      // Should NOT use the URL dataset, should fetch a compatible one
      expect(result.query.dataset).toEqual({
        id: 'traces-dataset',
        title: 'Traces Dataset',
        type: 'INDEX_PATTERN',
        timeFieldName: undefined,
        dataSource: undefined,
      });
      // When dataset changes, query is cleared since it may be incompatible
      expect(result.query.query).toBe('');
    });

    it('should reject traces dataset for logs flavor and fetch compatible one', async () => {
      const logsServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/logs') } },
      } as any;

      const mockQueryState = {
        query: 'source=traces',
        language: 'PPL',
        dataset: { id: 'traces-dataset', title: 'Traces Dataset', type: 'INDEX_PATTERN' },
      };

      (logsServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(null);

      // Mock dataViews.get to return TRACES signal type (incompatible with logs)
      (logsServices.data.dataViews!.get as jest.Mock).mockImplementation((id) => {
        if (id === 'traces-dataset') {
          return Promise.resolve({ signalType: CORE_SIGNAL_TYPES.TRACES });
        }
        return Promise.resolve({ signalType: CORE_SIGNAL_TYPES.LOGS });
      });

      // Mock dataset service to return a logs dataset
      (logsServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'logs-dataset' }] })),
          toDataset: jest.fn(() => ({
            id: 'logs-dataset',
            title: 'Logs Dataset',
            type: 'INDEX_PATTERN',
          })),
        })),
      });

      const result = await loadReduxState(logsServices);

      // Should NOT use the traces dataset, should fetch a logs-compatible one
      expect(result.query.dataset).toEqual({
        id: 'logs-dataset',
        title: 'Logs Dataset',
        type: 'INDEX_PATTERN',
        timeFieldName: undefined,
        dataSource: undefined,
      });
    });

    it('should handle URL dataset validation errors gracefully', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'invalid-dataset', title: 'Invalid Dataset', type: 'INDEX_PATTERN' },
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(null);

      // Mock dataViews.get to throw an error for invalid dataset, but succeed for fallback
      (mockServices.data.dataViews!.get as jest.Mock).mockImplementation((id) => {
        if (id === 'invalid-dataset') {
          return Promise.reject(new Error('Dataset not found'));
        }
        if (id === 'fallback-dataset') {
          return Promise.resolve({ signalType: CORE_SIGNAL_TYPES.LOGS });
        }
        return Promise.reject(new Error('Unknown dataset'));
      });

      // Mock dataset service to return a fallback dataset
      (mockServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'fallback-dataset' }] })),
          toDataset: jest.fn(() => ({
            id: 'fallback-dataset',
            title: 'Fallback Dataset',
            type: 'INDEX_PATTERN',
          })),
        })),
      });

      const result = await loadReduxState(mockServices);

      // Should fall back to fetching a new dataset when validation fails
      expect(result.query.dataset).toEqual({
        id: 'fallback-dataset',
        title: 'Fallback Dataset',
        type: 'INDEX_PATTERN',
        timeFieldName: undefined,
        dataSource: undefined,
      });
    });
  });

  describe('Metrics flavor SignalType handling', () => {
    it('should accept Metrics datasets for Metrics flavor', async () => {
      const metricsServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/metrics') } },
        data: {
          ...mockServices.data,
          dataViews: {
            get: jest.fn(() => Promise.resolve({ signalType: CORE_SIGNAL_TYPES.METRICS })),
          },
        },
      } as any;

      (metricsServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'prometheus-test' }] })),
          toDataset: jest.fn(() => ({
            id: 'prometheus-test',
            title: 'Prometheus',
            type: 'PROMETHEUS',
            language: 'PROMQL',
            signalType: CORE_SIGNAL_TYPES.METRICS,
          })),
        })),
      });

      const result = await getPreloadedState(metricsServices);
      expect(result.query.dataset).toBeDefined();
      expect(result.query.dataset?.id).toBe('prometheus-test');
    });

    it('should reject non-Metrics datasets for Metrics flavor', async () => {
      const metricsServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/metrics') } },
        data: {
          ...mockServices.data,
          dataViews: {
            get: jest.fn(() => Promise.resolve({ signalType: CORE_SIGNAL_TYPES.LOGS })),
          },
        },
      } as any;

      (metricsServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'logs-test' }] })),
          toDataset: jest.fn(() => ({
            id: 'logs-test',
            title: 'Logs',
            type: 'INDEX_PATTERN',
          })),
        })),
      });

      const result = await getPreloadedState(metricsServices);
      expect(result.query.dataset).toBeUndefined();
    });

    it('should reject Metrics datasets for Logs flavor', async () => {
      const logsServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/logs') } },
        data: {
          ...mockServices.data,
          dataViews: {
            get: jest.fn(() => Promise.resolve({ signalType: CORE_SIGNAL_TYPES.METRICS })),
          },
        },
      } as any;

      (logsServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'prometheus-test' }] })),
          toDataset: jest.fn(() => ({
            id: 'prometheus-test',
            title: 'Prometheus',
            type: 'PROMETHEUS',
            signalType: CORE_SIGNAL_TYPES.METRICS,
          })),
        })),
      });

      const result = await getPreloadedState(logsServices);
      expect(result.query.dataset).toBeUndefined();
    });
  });

  describe('loadReduxState with column validation for flavor switching', () => {
    it('should replace logs columns with traces defaults when switching to traces flavor', async () => {
      const tracesServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/traces') } },
      } as any;

      const mockQueryState = {
        query: 'source=traces',
        language: 'PPL',
        dataset: { id: 'traces-dataset', title: 'Traces Dataset', type: 'INDEX_PATTERN' },
      };

      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: { logs: {} },
        legacy: {
          columns: ['attributes.@OrderResult', 'attributes.amount.nanos'],
          sort: [],
          isDirty: false,
          interval: 'auto',
        },
      };

      (tracesServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      (tracesServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'traces-dataset',
        title: 'Traces Dataset',
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });

      const result = await loadReduxState(tracesServices);

      // Should replace logs columns with traces defaults
      expect(result.legacy.columns).toEqual(['spanId']);
      expect(result.legacy.columns).not.toContain('attributes.@OrderResult');
      expect(result.legacy.columns).not.toContain('attributes.amount.nanos');
    });

    it('should replace traces columns with logs defaults when switching to logs flavor', async () => {
      const logsServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/logs') } },
      } as any;

      const mockQueryState = {
        query: 'source=logs',
        language: 'PPL',
        dataset: { id: 'logs-dataset', title: 'Logs Dataset', type: 'INDEX_PATTERN' },
      };

      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: { logs: {} },
        legacy: {
          columns: ['spanId'],
          sort: [],
          isDirty: false,
          interval: 'auto',
        },
      };

      (logsServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      // Mock dataViews.get to return LOGS signal type
      (logsServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'logs-dataset',
        title: 'Logs Dataset',
        signalType: CORE_SIGNAL_TYPES.LOGS,
      });

      const result = await loadReduxState(logsServices);

      // Should replace traces columns with logs defaults
      expect(result.legacy.columns).toEqual(['_source']);
      expect(result.legacy.columns).not.toContain('spanId');
    });

    it('should keep valid traces columns when in traces flavor', async () => {
      const tracesServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/traces') } },
      } as any;

      const mockQueryState = {
        query: 'source=traces',
        language: 'PPL',
        dataset: { id: 'traces-dataset', title: 'Traces Dataset', type: 'INDEX_PATTERN' },
      };

      // URL has valid traces columns
      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: { logs: {} },
        legacy: {
          columns: ['spanId', 'serviceName'],
          sort: [],
          isDirty: false,
          interval: 'auto',
        },
      };

      (tracesServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      (tracesServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'traces-dataset',
        title: 'Traces Dataset',
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });

      const result = await loadReduxState(tracesServices);

      // Should keep the valid traces columns
      expect(result.legacy.columns).toEqual(['spanId', 'serviceName']);
    });

    it('should keep valid logs columns when in logs flavor', async () => {
      const logsServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/logs') } },
      } as any;

      const mockQueryState = {
        query: 'source=logs',
        language: 'PPL',
        dataset: { id: 'logs-dataset', title: 'Logs Dataset', type: 'INDEX_PATTERN' },
      };

      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: { logs: {} },
        legacy: {
          columns: ['_source', 'timestamp', 'message'],
          sort: [],
          isDirty: false,
          interval: 'auto',
        },
      };

      (logsServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      (logsServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'logs-dataset',
        title: 'Logs Dataset',
        signalType: CORE_SIGNAL_TYPES.LOGS,
      });

      const result = await loadReduxState(logsServices);

      // Should keep the valid logs columns
      expect(result.legacy.columns).toEqual(['_source', 'timestamp', 'message']);
    });

    it('should replace columns when dataset type does not match flavor', async () => {
      const tracesServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('explore/traces') } },
      } as any;

      const mockQueryState = {
        query: 'source=traces',
        language: 'PPL',
        dataset: { id: 'wrong-dataset', title: 'Wrong Dataset', type: 'INDEX_PATTERN' },
      };

      const mockAppState = {
        ui: { activeTabId: 'logs', showHistogram: true },
        tab: { logs: {} },
        legacy: {
          columns: ['someColumn', 'anotherColumn'],
          sort: [],
          isDirty: false,
          interval: 'auto',
        },
      };

      (tracesServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      // Mock dataViews.get to return LOGS signal type (mismatch with traces flavor)
      (tracesServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'wrong-dataset',
        title: 'Wrong Dataset',
        signalType: CORE_SIGNAL_TYPES.LOGS, // Dataset is logs but flavor is traces
      });

      const result = await loadReduxState(tracesServices);

      // Should replace with traces defaults since we're in traces flavor
      expect(result.legacy.columns).toEqual(['spanId']);
    });
  });
});
