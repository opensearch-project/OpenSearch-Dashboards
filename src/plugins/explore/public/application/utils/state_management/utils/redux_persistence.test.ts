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
import { SignalType } from '../../../../../../data/common';
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
              signalType: SignalType.LOGS,
            })
          ),
        },
      },
      uiSettings: {
        get: jest.fn((key) => {
          if (key === 'defaultColumns') return ['_source'];
          if (key === DEFAULT_TRACE_COLUMNS_SETTING) return ['traceID', 'spanID'];
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
            get: jest.fn(() => Promise.resolve({ signalType: SignalType.Traces })),
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
            get: jest.fn(() => Promise.resolve({ signalType: SignalType.LOGS })),
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
            get: jest.fn(() => Promise.resolve({ signalType: SignalType.LOGS })),
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
            get: jest.fn(() => Promise.resolve({ signalType: SignalType.Traces })),
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
});
