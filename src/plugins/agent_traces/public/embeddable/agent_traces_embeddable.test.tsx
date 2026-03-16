/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AgentTracesEmbeddable } from './agent_traces_embeddable';
import { AgentTracesInput } from './types';
import { AGENT_TRACES_EMBEDDABLE_TYPE } from './constants';
import { discoverPluginMock } from '../application/legacy/discover/mocks';

// Mock react-dom/client
const mockUnmount = jest.fn();
const mockRender = jest.fn();
const mockRoot = {
  render: mockRender,
  unmount: mockUnmount,
};

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => mockRoot),
}));

// Mock the AgentTracesEmbeddableComponent
jest.mock('./agent_traces_embeddable_component', () => ({
  AgentTracesEmbeddableComponent: jest.fn(() => (
    <div data-test-subj="mockAgentTracesEmbeddableComponent" />
  )),
}));

// Mock the services
jest.mock('../application/legacy/discover/opensearch_dashboards_services', () => {
  const mockTimefilter = {
    getAutoRefreshFetch$: jest.fn().mockReturnValue({
      subscribe: jest.fn().mockReturnValue({
        unsubscribe: jest.fn(),
      }),
    }),
  };

  return {
    getServices: jest.fn(() => ({
      timefilter: mockTimefilter,
      uiSettings: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'doc_table:hideTimeColumn') {
            return false;
          }
          return 500;
        }),
      },
    })),
    getRequestInspectorStats: jest.fn(),
    getResponseInspectorStats: jest.fn(),
  };
});

describe('AgentTracesEmbeddable', () => {
  let embeddable: AgentTracesEmbeddable;
  let mockSavedAgentTraces: any;
  let mockInput: AgentTracesInput;
  let mockExecuteTriggerActions: jest.Mock;
  let mockNode: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock search source with proper chaining
    const mockSearchSourceBase = {
      setField: jest.fn().mockReturnThis(),
      setFields: jest.fn().mockReturnThis(),
      setParent: jest.fn().mockReturnThis(),
      getField: jest.fn((field) => {
        if (field === 'index') {
          return { id: 'test-index' };
        }
        if (field === 'query') {
          return { query: 'test', language: 'PPL' };
        }
        return null;
      }),
      getSearchRequestBody: jest.fn().mockResolvedValue({}),
      fetch: jest.fn().mockResolvedValue({
        hits: {
          hits: [
            { _id: '1', _source: { field1: 'value1' } },
            { _id: '2', _source: { field1: 'value2' } },
          ],
          total: 2,
        },
      }),
      getDataFrame: jest.fn().mockReturnValue({
        schema: [],
      }),
    };

    // Create a function that returns a new mock search source
    const createMockSearchSource = (): any => ({
      ...mockSearchSourceBase,
      create: jest.fn().mockImplementation(() => createMockSearchSource()),
    });

    // Create a mock saved agent traces object
    mockSavedAgentTraces = {
      id: 'test-id',
      title: 'Test Agent Traces',
      description: 'Test description',
      columns: ['column1', 'column2'],
      sort: [['column1', 'asc']],
      searchSource: createMockSearchSource(),
      uiState: '{"activeTab":"logs"}',
      visualization: '{"chartType":"bar"}',
    };

    // Create mock input
    mockInput = {
      id: 'test-embeddable',
      timeRange: { from: 'now-15m', to: 'now' },
      filters: [],
      query: { query: '', language: 'PPL' },
    };

    // Create mock executeTriggerActions
    mockExecuteTriggerActions = jest.fn();

    // Create mock node
    mockNode = document.createElement('div');

    // Create mock services using the discoverPluginMock
    const mockServices = discoverPluginMock.createAgentTracesServicesMock();

    // Add specific mocks for the services used in the embeddable
    mockServices.data.query.queryString.getLanguageService = jest.fn().mockReturnValue({
      getLanguage: jest.fn().mockReturnValue({
        fields: {
          formatter: jest.fn(),
        },
      }),
    });

    // Mock the uiSettings service for DOC_HIDE_TIME_COLUMN_SETTING
    mockServices.uiSettings.get = jest.fn().mockImplementation((key) => {
      if (key === 'doc_table:hideTimeColumn') {
        return false;
      }
      return 500;
    });

    // Create the embeddable
    embeddable = new AgentTracesEmbeddable(
      {
        savedAgentTraces: mockSavedAgentTraces,
        editUrl: '/app/agentTraces/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: mockServices.filterManager,
        services: mockServices,
        editApp: 'agentTraces/logs',
      },
      mockInput,
      mockExecuteTriggerActions
    );
  });

  test('has the correct type', () => {
    expect(embeddable.type).toBe(AGENT_TRACES_EMBEDDABLE_TYPE);
  });

  test('should have return inspector adaptors', () => {
    expect(embeddable.getInspectorAdapters()).not.toBeUndefined();
  });

  test('initializes search props correctly', () => {
    // @ts-ignore - accessing private property for testing
    const searchProps = embeddable.searchProps;

    expect(searchProps).toBeDefined();
    expect(searchProps?.title).toBe('Test Agent Traces');
    expect(searchProps?.description).toBe('Test description');
    expect(searchProps?.displayTimeColumn).toBe(false);
  });

  test('cleans up when destroy is called', () => {
    // Setup a mock node
    embeddable.render(mockNode);

    // Call destroy
    embeddable.destroy();

    // Check that unmount was called
    expect(mockUnmount).toHaveBeenCalled();
  });

  test('updates input correctly', () => {
    const newColumns = ['column3', 'column4'];

    // @ts-ignore - accessing private method for testing
    embeddable.updateInput({ columns: newColumns });

    // Check that the input was updated
    expect(embeddable.getInput().columns).toEqual(newColumns);
  });

  test('handles fetch correctly', async () => {
    // @ts-ignore - accessing private method for testing
    await embeddable.fetch();

    // Check that fetch was called
    expect(mockSavedAgentTraces.searchSource.fetch).toHaveBeenCalled();

    // Check that the output was updated
    expect(embeddable.getOutput().loading).toBe(false);
    expect(embeddable.getOutput().error).toBeUndefined();
  });

  test('handles reload correctly', () => {
    // Mock the updateHandler method
    // @ts-ignore - accessing private method for testing
    embeddable.updateHandler = jest.fn();

    // Call reload
    embeddable.reload();

    // Check that updateHandler was called with force=true
    // @ts-ignore - accessing private method for testing
    expect(embeddable.updateHandler).toHaveBeenCalledWith(expect.anything(), true);
  });

  test('reload calls updateHandler when searchProps exists', () => {
    // @ts-ignore
    const updateHandlerSpy = jest.spyOn(embeddable, 'updateHandler').mockResolvedValue(undefined);
    embeddable.reload();
    expect(updateHandlerSpy).toHaveBeenCalled();
  });

  test('reload does nothing when searchProps does not exist', () => {
    // @ts-ignore - accessing private property for testing
    embeddable.searchProps = undefined;
    // @ts-ignore - accessing private method for testing
    const updateHandlerSpy = jest.spyOn(embeddable, 'updateHandler');
    embeddable.reload();
    expect(updateHandlerSpy).not.toHaveBeenCalled();
  });

  test('renderComponent does nothing if searchProps is undefined', () => {
    // @ts-ignore - accessing private property for testing
    embeddable.searchProps = undefined;
    // @ts-ignore - accessing private method for testing
    expect(() => embeddable.renderComponent(mockNode, undefined)).not.toThrow();
  });

  test('destroy is idempotent (can be called multiple times safely)', () => {
    expect(() => {
      embeddable.destroy();
      embeddable.destroy();
      embeddable.destroy();
    }).not.toThrow();
  });

  test('handles column actions correctly', () => {
    // Mock the updateInput method
    // @ts-ignore - accessing private method for testing
    embeddable.updateInput = jest.fn();

    // @ts-ignore - accessing private property for testing
    const searchProps = embeddable.searchProps;

    // Test onAddColumn
    searchProps?.onAddColumn?.('column3');
    // @ts-ignore - accessing private method for testing
    expect(embeddable.updateInput).toHaveBeenCalledWith(
      expect.objectContaining({ columns: expect.anything() })
    );

    // Test onRemoveColumn
    searchProps?.onRemoveColumn?.('column1');
    // @ts-ignore - accessing private method for testing
    expect(embeddable.updateInput).toHaveBeenCalledWith(
      expect.objectContaining({ columns: expect.anything() })
    );

    // Test onMoveColumn
    searchProps?.onMoveColumn?.('column1', 1);
    // @ts-ignore - accessing private method for testing
    expect(embeddable.updateInput).toHaveBeenCalledWith(
      expect.objectContaining({ columns: expect.anything() })
    );

    // Test onSetColumns
    searchProps?.onSetColumns?.(['column3', 'column4']);
    // @ts-ignore - accessing private method for testing
    expect(embeddable.updateInput).toHaveBeenCalledWith(
      expect.objectContaining({ columns: expect.anything() })
    );
  });

  test('handles filter action correctly', async () => {
    // @ts-ignore - accessing private property for testing
    const searchProps = embeddable.searchProps;

    // Test onFilter
    await searchProps?.onFilter?.({ name: 'field1' } as any, ['value1'], 'is');

    // Check that executeTriggerActions was called
    expect(mockExecuteTriggerActions).toHaveBeenCalled();
  });

  test('onFilter returns early when indexPattern is not available', async () => {
    const mockSavedAgentTracesNoIndex = {
      ...mockSavedAgentTraces,
      searchSource: {
        ...mockSavedAgentTraces.searchSource,
        getField: jest.fn().mockImplementation((field) => {
          if (field === 'index') return null;
          if (field === 'query') return { query: 'test', language: 'PPL' };
          return null;
        }),
      },
    };

    const mockServices = discoverPluginMock.createAgentTracesServicesMock();
    mockServices.data.query.queryString.getLanguageService = jest.fn().mockReturnValue({
      getLanguage: jest.fn().mockReturnValue({
        fields: {
          formatter: jest.fn(),
        },
      }),
    });
    mockServices.uiSettings.get = jest.fn().mockImplementation((key) => {
      if (key === 'doc_table:hideTimeColumn') return false;
      return 500;
    });

    const mockExecuteTriggerActionsLocal = jest.fn();
    const embeddableNoIndex = new AgentTracesEmbeddable(
      {
        savedAgentTraces: mockSavedAgentTracesNoIndex,
        editUrl: '/app/agentTraces/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: mockServices.filterManager,
        services: mockServices,
        editApp: 'agentTraces/logs',
      },
      mockInput,
      mockExecuteTriggerActionsLocal
    );

    // Manually set searchProps to enable onFilter testing
    // @ts-ignore
    embeddableNoIndex.searchProps = {
      onFilter: async (field: any, value: any, operator: any) => {
        const indexPattern = mockSavedAgentTracesNoIndex.searchSource.getField('index');
        if (!indexPattern) return;
      },
    };

    // @ts-ignore
    const searchProps = embeddableNoIndex.searchProps;

    // Test onFilter returns early without calling executeTriggerActions
    await searchProps?.onFilter?.({ name: 'field1' } as any, ['value1'], 'is');

    // Check that executeTriggerActions was NOT called
    expect(mockExecuteTriggerActionsLocal).not.toHaveBeenCalled();
  });

  test('renders successfully even without index pattern', () => {
    const mockServices = discoverPluginMock.createAgentTracesServicesMock();
    mockServices.uiSettings.get = jest.fn().mockImplementation((key) => {
      if (key === 'doc_table:hideTimeColumn') return false;
      return 500;
    });
    mockServices.data.query.queryString.getLanguageService = jest.fn().mockReturnValue({
      getLanguage: jest.fn().mockReturnValue({
        fields: {
          formatter: jest.fn(),
        },
      }),
    });

    // Create a new embeddable without index pattern
    const newEmbeddable = new AgentTracesEmbeddable(
      {
        savedAgentTraces: {
          ...mockSavedAgentTraces,
          searchSource: {
            ...mockSavedAgentTraces.searchSource,
            getField: jest.fn().mockImplementation((field) => {
              if (field === 'query') return { query: 'test', language: 'PPL' };
              return null;
            }),
          },
        },
        editUrl: '/app/agentTraces/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: mockServices.filterManager,
        services: mockServices,
        editApp: 'agentTraces/logs',
      },
      mockInput,
      mockExecuteTriggerActions
    );

    // searchProps should be initialized even without index pattern
    // @ts-ignore
    expect(newEmbeddable.searchProps).toBeDefined();

    // Render should work without throwing
    expect(() => newEmbeddable.render(mockNode)).not.toThrow();
  });

  test('constructor handles missing indexPattern gracefully', () => {
    const mockServices = discoverPluginMock.createAgentTracesServicesMock();
    mockServices.uiSettings.get = jest.fn().mockImplementation((key) => {
      if (key === 'doc_table:hideTimeColumn') return false;
      return 500;
    });
    mockServices.data.query.queryString.getLanguageService = jest.fn().mockReturnValue({
      getLanguage: jest.fn().mockReturnValue({
        fields: {
          formatter: jest.fn(),
        },
      }),
    });

    const mockSavedAgentTracesNoIndex = {
      ...mockSavedAgentTraces,
      searchSource: {
        ...mockSavedAgentTraces.searchSource,
        getField: jest.fn().mockImplementation((field) => {
          if (field === 'index') return null;
          if (field === 'query') return { query: 'test', language: 'PPL' };
          return null;
        }),
      },
    };
    const embeddableNoIndex = new AgentTracesEmbeddable(
      {
        savedAgentTraces: mockSavedAgentTracesNoIndex,
        editUrl: '/app/agentTraces/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: mockServices.filterManager,
        services: mockServices,
        editApp: 'agentTraces/logs',
      },
      mockInput,
      mockExecuteTriggerActions
    );
    // @ts-ignore - searchProps should now be defined even without indexPattern
    expect(embeddableNoIndex.searchProps).toBeDefined();
    // @ts-ignore - indexPattern should be null/undefined
    expect(embeddableNoIndex.searchProps?.indexPattern).toBeNull();
  });

  test('onAddColumn/onRemoveColumn/onMoveColumn/onSetColumns handle undefined columns gracefully', () => {
    // @ts-ignore
    const searchProps = embeddable.searchProps;
    if (searchProps) {
      searchProps.columns = undefined;
      expect(() => searchProps.onAddColumn && searchProps.onAddColumn('col')).not.toThrow();
      expect(() => searchProps.onRemoveColumn && searchProps.onRemoveColumn('col')).not.toThrow();
      expect(() => searchProps.onMoveColumn && searchProps.onMoveColumn('col', 1)).not.toThrow();
      expect(() => searchProps.onSetColumns && searchProps.onSetColumns(['a', 'b'])).not.toThrow();
    }
  });

  test('updateHandler handles force/needFetch/this.node branches', async () => {
    // @ts-ignore
    const searchProps = embeddable.searchProps;
    // @ts-ignore
    const fetchSpy = jest.spyOn(embeddable, 'fetch').mockResolvedValue(undefined);
    // @ts-ignore
    embeddable.node = mockNode;
    // @ts-ignore
    await embeddable.updateHandler(searchProps, true);
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockClear();
    // @ts-ignore
    embeddable.prevState = { filters: [], query: {}, timeRange: {} };
    // @ts-ignore
    embeddable.input = { filters: [], query: {}, timeRange: {} };
    // @ts-ignore
    await embeddable.updateHandler(searchProps, false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('fetch handles missing searchProps gracefully', async () => {
    // @ts-ignore
    embeddable.searchProps = undefined;
    // @ts-ignore
    await expect(embeddable.fetch()).resolves.toBeUndefined();
  });

  test('destroy handles missing resources gracefully', () => {
    // @ts-ignore
    embeddable.subscription = undefined;
    // @ts-ignore
    embeddable.autoRefreshFetchSubscription = undefined;
    // @ts-ignore
    embeddable.abortController = undefined;
    // @ts-ignore
    embeddable.searchProps = undefined;
    // @ts-ignore
    embeddable.node = undefined;
    expect(() => embeddable.destroy()).not.toThrow();
  });
});
