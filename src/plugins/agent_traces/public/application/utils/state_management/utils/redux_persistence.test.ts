/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPreloadedState, loadReduxState, persistReduxState } from './redux_persistence';
import { AgentTracesServices } from '../../../../types';
import { RootState } from '../store';
import {
  AGENT_TRACES_DEFAULT_LANGUAGE,
  DEFAULT_COLUMNS_SETTING,
  DEFAULT_TRACE_COLUMNS_SETTING,
  DEFAULT_LOGS_COLUMNS_SETTING,
} from '../../../../../common';
import { EditorMode, QueryExecutionStatus } from '../types';
import { CORE_SIGNAL_TYPES } from '../../../../../../data/common';
import { of } from 'rxjs';

describe('redux_persistence', () => {
  let mockServices: AgentTracesServices;

  beforeEach(() => {
    mockServices = {
      osdUrlStateStorage: {
        set: jest.fn(),
        get: jest.fn(),
      },
      core: {
        application: {
          currentAppId$: of('agentTraces/logs'),
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
              language: dataset.language || AGENT_TRACES_DEFAULT_LANGUAGE,
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
          if (key === DEFAULT_COLUMNS_SETTING) return ['_source'];
          if (key === DEFAULT_TRACE_COLUMNS_SETTING) return ['spanId'];
          if (key === DEFAULT_LOGS_COLUMNS_SETTING)
            return ['body', 'severityText', 'resource.attributes.service.name'];
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
          hasUserInitiatedQuery: false,
          fetchVersion: 0,
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
      } as AgentTracesServices;

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

      // resolveDataset requires TRACES signal type
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'test-dataset',
        title: 'test-dataset',
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(mockAppState);

      const result = await loadReduxState(mockServices);

      // Dataset is resolved through resolveDataset which validates signal type
      expect(result.query.dataset).toBeDefined();
      expect(result.ui).toEqual(mockAppState.ui);
      expect(mockServices.data.query.queryString.setQuery).toHaveBeenCalled();
    });

    it('should fallback to preloaded state when URL storage is not available', async () => {
      const servicesWithoutStorage = { ...mockServices, osdUrlStateStorage: undefined };

      const result = await loadReduxState(servicesWithoutStorage);

      expect(result).toBeDefined();
      expect(result.ui.activeTabId).toBe('');
      expect(result.query.language).toBe(AGENT_TRACES_DEFAULT_LANGUAGE);
    });

    it('should use preloaded state for missing sections', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      };

      // resolveDataset requires TRACES signal type
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'test-dataset',
        title: 'test-dataset',
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(null); // No app state

      const result = await loadReduxState(mockServices);

      expect(result.query.dataset).toBeDefined();
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
      } as AgentTracesServices;

      const result = await loadReduxState(servicesWithError);

      expect(result).toBeDefined();
      expect(result.ui.activeTabId).toBe(''); // Should fallback to preloaded state
    });
  });

  describe('getPreloadedState', () => {
    it('should return complete preloaded state with correct UI defaults', async () => {
      // Mock dataViews.get to return TRACES signal type (required by resolveDataset)
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'test-dataset',
        title: 'test-dataset',
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });

      const result = await getPreloadedState(mockServices);

      expect(result).toBeDefined();
      expect(result.ui).toEqual({
        activeTabId: '',
        showHistogram: true,
      });
      expect(result.query.language).toBe(AGENT_TRACES_DEFAULT_LANGUAGE);
      expect(result.query.query).toBe(''); // Should be empty string
      expect(result.results).toEqual({});
      expect(result.tab.logs).toEqual({});
      // getPreloadedLegacyState uses DEFAULT_TRACE_COLUMNS_SETTING
      expect(result.legacy.columns).toEqual(['spanId']);
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

      // resolveDataset requires TRACES signal type
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'test-dataset',
        title: 'test-dataset',
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });

      const result = await getPreloadedState(mockServices);

      expect(result.query.dataset).toEqual(mockDataset);
      expect(mockServices.data.query.queryString.getInitialQueryByDataset).toHaveBeenCalledWith({
        ...mockDataset,
        language: AGENT_TRACES_DEFAULT_LANGUAGE,
      });
    });

    it('should handle missing dataset service gracefully', async () => {
      (mockServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue(
        undefined
      );

      const result = await getPreloadedState(mockServices);

      expect(result.query.dataset).toBeUndefined();
      expect(result.query.language).toBe(AGENT_TRACES_DEFAULT_LANGUAGE);
      expect(result.query.query).toBe('');
    });

    it('should use default columns from uiSettings', async () => {
      const customColumns = ['field1', 'field2'];
      (mockServices.uiSettings!.get as jest.Mock).mockImplementation((key) => {
        if (key === DEFAULT_TRACE_COLUMNS_SETTING) return customColumns;
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
    beforeEach(() => {
      // Ensure TRACES signal type for dataset resolution
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'test-dataset',
        title: 'test-dataset',
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });
    });

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
    it('should accept Traces datasets', async () => {
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });

      (mockServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'test' }] })),
          toDataset: jest.fn(() => ({ id: 'test', title: 'test', type: 'INDEX_PATTERN' })),
        })),
      });

      const result = await getPreloadedState(mockServices);
      expect(result.query.dataset).toBeDefined();
    });

    it('should reject non-Traces datasets', async () => {
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        signalType: CORE_SIGNAL_TYPES.LOGS,
      });

      (mockServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'test' }] })),
          toDataset: jest.fn(() => ({ id: 'test', title: 'test', type: 'INDEX_PATTERN' })),
        })),
      });

      const result = await getPreloadedState(mockServices);
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
      expect(result.legacy.columns).toEqual(['spanId']);
    });

    it('should use default columns for traces flavor when URL state has empty columns', async () => {
      const tracesServices = {
        ...mockServices,
        core: { application: { currentAppId$: of('agentTraces/traces') } },
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
    it('should validate URL dataset and use it if it has TRACES signal type', async () => {
      const mockQueryState = {
        query: 'source=traces | head 10',
        language: 'PPL',
        dataset: { id: 'traces-dataset', title: 'Traces Dataset', type: 'INDEX_PATTERN' },
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(null);

      // Mock dataViews.get to return TRACES signal type
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        id: 'traces-dataset',
        title: 'Traces Dataset',
        signalType: CORE_SIGNAL_TYPES.TRACES,
      });

      const result = await loadReduxState(mockServices);

      expect(result.query.dataset).toBeDefined();
      expect(result.query.dataset?.id).toBe('traces-dataset');
    });

    it('should reject non-TRACES URL dataset and fetch compatible one', async () => {
      const mockQueryState = {
        query: 'source=logs | head 10',
        language: 'PPL',
        dataset: { id: 'logs-dataset', title: 'Logs Dataset', type: 'INDEX_PATTERN' },
      };

      (mockServices.osdUrlStateStorage!.get as jest.Mock)
        .mockReturnValueOnce(mockQueryState)
        .mockReturnValueOnce(null);

      // Mock dataViews.get - logs dataset is incompatible, traces dataset is compatible
      (mockServices.data.dataViews!.get as jest.Mock).mockImplementation((id) => {
        if (id === 'traces-dataset') {
          return Promise.resolve({ signalType: CORE_SIGNAL_TYPES.TRACES });
        }
        return Promise.resolve({ signalType: CORE_SIGNAL_TYPES.LOGS });
      });

      // Mock dataset service to return a traces dataset
      (mockServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'traces-dataset' }] })),
          toDataset: jest.fn(() => ({
            id: 'traces-dataset',
            title: 'Traces Dataset',
            type: 'INDEX_PATTERN',
          })),
        })),
      });

      const result = await loadReduxState(mockServices);

      expect(result.query.dataset?.id).toBe('traces-dataset');
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

      // Mock dataViews.get to throw for invalid, succeed for fallback
      (mockServices.data.dataViews!.get as jest.Mock).mockImplementation((id) => {
        if (id === 'invalid-dataset') {
          return Promise.reject(new Error('Dataset not found'));
        }
        if (id === 'fallback-dataset') {
          return Promise.resolve({ signalType: CORE_SIGNAL_TYPES.TRACES });
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

      expect(result.query.dataset?.id).toBe('fallback-dataset');
    });
  });

  describe('Metrics flavor SignalType handling', () => {
    it('should reject Metrics datasets since resolveDataset requires TRACES', async () => {
      (mockServices.data.dataViews!.get as jest.Mock).mockResolvedValue({
        signalType: CORE_SIGNAL_TYPES.METRICS,
      });

      (mockServices.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve({ children: [{ id: 'metrics-test' }] })),
          toDataset: jest.fn(() => ({
            id: 'metrics-test',
            title: 'Metrics',
            type: 'INDEX_PATTERN',
            language: 'PPL',
            signalType: CORE_SIGNAL_TYPES.METRICS,
          })),
        })),
      });

      const result = await getPreloadedState(mockServices);
      // Metrics datasets are rejected because resolveDataset requires TRACES
      expect(result.query.dataset).toBeUndefined();
    });
  });
});
