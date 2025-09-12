/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { ExploreEmbeddable } from './explore_embeddable';
import { ExploreInput } from './types';
import { EXPLORE_EMBEDDABLE_TYPE } from './constants';
import { discoverPluginMock } from '../application/legacy/discover/mocks';
import { visualizationRegistry } from '../components/visualizations/visualization_registry';

// Mock ReactDOM
jest.mock('react-dom', () => ({
  render: jest.fn(),
  unmountComponentAtNode: jest.fn(),
}));

// Mock the ExploreEmbeddableComponent
jest.mock('./explore_embeddable_component', () => ({
  ExploreEmbeddableComponent: jest.fn(() => (
    <div data-test-subj="mockExploreEmbeddableComponent" />
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

// Mock the getVisualizationType function
jest.mock('../components/visualizations/utils/use_visualization_types', () => ({
  getVisualizationType: jest.fn().mockReturnValue({
    transformedData: [],
    numericalColumns: [],
    categoricalColumns: [],
    dateColumns: [],
  }),
}));

// Mock the toExpression function
jest.mock('../components/visualizations/utils/to_expression', () => ({
  toExpression: jest.fn().mockReturnValue('test expression'),
}));

// Mock the visualization container utils
jest.mock('../components/visualizations/visualization_builder_utils', () => ({
  convertStringsToMappings: jest.fn().mockReturnValue({}),
  findRuleByIndex: jest.fn().mockReturnValue({
    toExpression: jest.fn(),
  }),
}));

describe('ExploreEmbeddable', () => {
  let embeddable: ExploreEmbeddable;
  let mockSavedExplore: any;
  let mockInput: ExploreInput;
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

    // Create a mock saved explore object
    mockSavedExplore = {
      id: 'test-id',
      title: 'Test Explore',
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
    const mockServices = discoverPluginMock.createExploreServicesMock();

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
    embeddable = new ExploreEmbeddable(
      {
        savedExplore: mockSavedExplore,
        editUrl: '/app/explore/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: mockServices.filterManager,
        services: mockServices,
        editApp: 'explore/logs',
      },
      mockInput,
      mockExecuteTriggerActions
    );
  });

  test('has the correct type', () => {
    expect(embeddable.type).toBe(EXPLORE_EMBEDDABLE_TYPE);
  });

  test('should have return inspector adaptors', () => {
    expect(embeddable.getInspectorAdapters()).not.toBeUndefined();
  });

  test('initializes search props correctly', () => {
    // @ts-ignore - accessing private property for testing
    const searchProps = embeddable.searchProps;

    expect(searchProps).toBeDefined();
    expect(searchProps?.title).toBe('Test Explore');
    expect(searchProps?.description).toBe('Test description');
    expect(searchProps?.displayTimeColumn).toBe(false);
  });

  test('renders component when render is called', () => {
    embeddable.render(mockNode);

    expect(ReactDOM.render).toHaveBeenCalledWith(expect.anything(), mockNode);
  });

  test('cleans up when destroy is called', () => {
    // Setup a mock node
    embeddable.render(mockNode);

    // Call destroy
    embeddable.destroy();

    // Check that unmountComponentAtNode was called
    expect(ReactDOM.unmountComponentAtNode).toHaveBeenCalledWith(mockNode);
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
    expect(mockSavedExplore.searchSource.fetch).toHaveBeenCalled();

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

  test('onContainerError aborts and updates output', () => {
    // @ts-ignore - accessing private property for testing
    embeddable.abortController = { abort: jest.fn() };
    // @ts-ignore - accessing private property for testing
    embeddable.renderComplete = { dispatchError: jest.fn() };
    // @ts-ignore - accessing private method for testing
    embeddable.updateOutput = jest.fn();
    const error = new Error('test error');
    embeddable.onContainerError(error);
    // @ts-ignore - accessing private property for testing
    expect(embeddable.abortController.abort).toHaveBeenCalled();
    // @ts-ignore - accessing private property for testing
    expect(embeddable.renderComplete.dispatchError).toHaveBeenCalled();
    // @ts-ignore - accessing private method for testing
    expect(embeddable.updateOutput).toHaveBeenCalledWith({ loading: false, error });
  });

  test('onContainerError works when abortController is undefined', () => {
    // @ts-ignore - accessing private property for testing
    embeddable.abortController = undefined;
    // @ts-ignore - accessing private property for testing
    embeddable.renderComplete = { dispatchError: jest.fn() };
    // @ts-ignore - accessing private method for testing
    embeddable.updateOutput = jest.fn();
    const error = new Error('test error');
    // @ts-ignore - accessing private method for testing
    embeddable.onContainerError(error);
    // @ts-ignore - accessing private property for testing
    expect(embeddable.renderComplete.dispatchError).toHaveBeenCalled();
    // @ts-ignore - accessing private method for testing
    expect(embeddable.updateOutput).toHaveBeenCalledWith({ loading: false, error });
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

  test('throws error when render is called without search props', () => {
    // Create a new embeddable without search props
    const newEmbeddable = new ExploreEmbeddable(
      {
        savedExplore: {
          ...mockSavedExplore,
          searchSource: {
            ...mockSavedExplore.searchSource,
            getField: jest.fn().mockReturnValue(null),
          },
        },
        editUrl: '/app/explore/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: {} as any,
        services: {} as any,
        editApp: 'explore/logs',
      },
      mockInput,
      mockExecuteTriggerActions
    );

    // Expect render to throw an error
    expect(() => newEmbeddable.render(mockNode)).toThrow('Search scope not defined');
  });

  test('constructor handles missing indexPattern gracefully', () => {
    const mockSavedExploreNoIndex = {
      ...mockSavedExplore,
      searchSource: {
        ...mockSavedExplore.searchSource,
        getField: jest.fn().mockImplementation((field) => {
          if (field === 'index') return null;
          if (field === 'query') return { query: 'test', language: 'PPL' };
          return null;
        }),
      },
    };
    const embeddableNoIndex = new ExploreEmbeddable(
      {
        savedExplore: mockSavedExploreNoIndex,
        editUrl: '/app/explore/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: {} as any,
        services: {} as any,
        editApp: 'explore/logs',
      },
      mockInput,
      mockExecuteTriggerActions
    );
    // @ts-ignore
    expect(embeddableNoIndex.searchProps).toBeUndefined();
    expect(() => embeddableNoIndex.render(mockNode)).toThrow('Search scope not defined');
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

  test('fetch throws error when no matchedRule is exist', async () => {
    jest.spyOn(visualizationRegistry, 'findRuleByAxesMapping').mockReturnValueOnce(undefined);

    mockSavedExplore.visualization = JSON.stringify({
      chartType: 'line',
      axesMapping: { x: 'field1', y: 'field2' },
    });
    mockSavedExplore.uiState = JSON.stringify({ activeTab: 'visualization' });

    // @ts-ignore
    await expect(embeddable.fetch()).rejects.toThrow(
      'Cannot load saved visualization "Test Explore" with id test-id'
    );
  });
});
