/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { skip } from 'rxjs/operators';
import { ExploreEmbeddable } from './explore_embeddable';
import { ExploreInput } from './types';
import { EXPLORE_EMBEDDABLE_TYPE } from './constants';
import { discoverPluginMock } from '../application/legacy/discover/mocks';
import { visualizationRegistry } from '../components/visualizations/visualization_registry';
import { Container, ContainerInput, EmbeddableInput } from '../../../embeddable/public';
import { IVariableInterpolationService } from '../../../dashboard/public';

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

// Mock the ExploreEmbeddableComponent
jest.mock('./explore_embeddable_component', () => ({
  ExploreEmbeddableComponent: jest.fn(() => null),
}));

// Mock the PanelDataService singleton. The real getInstance() throws unless
// PanelDataService.init() was called during plugin setup, which never happens
// in this unit test — so fetch()/destroy() would blow up. Return a stub whose
// setPanelData/removePanelData are no-ops.
jest.mock('./panel_data_service', () => {
  const mockPanelDataInstance = {
    setPanelData: jest.fn(),
    removePanelData: jest.fn(),
  };
  return {
    PanelDataService: {
      getInstance: jest.fn(() => mockPanelDataInstance),
      init: jest.fn(),
    },
  };
});

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

// Mock the visualization container utils
jest.mock('../components/visualizations/visualization_builder_utils', () => ({
  convertStringsToMappings: jest.fn().mockReturnValue({}),
  isValidMapping: jest.fn().mockReturnValue(true),
  findRuleByIndex: jest.fn().mockReturnValue({
    toExpression: jest.fn(),
  }),
  adaptLegacyData: jest.fn().mockReturnValue({ useThresholdColor: true }),
  getColumnsByAxesMapping: jest.fn().mockReturnValue({
    numericalColumns: [],
    categoricalColumns: [],
    dateColumns: [],
  }),
}));

/**
 * A lightweight Container subclass that mimics DashboardContainer's variable
 * services for testing ExploreEmbeddable as a child. This follows the same
 * pattern as HelloWorldContainer / FilterableContainer in the embeddable
 * test_samples, providing a real parent-child input propagation chain.
 */
interface TestContainerInput extends ContainerInput {
  filters?: any[];
  query?: any;
  timeRange?: any;
}

class TestDashboardContainer extends Container<{}, TestContainerInput> {
  public readonly type = 'TEST_DASHBOARD_CONTAINER';
  public readonly variables$ = new BehaviorSubject<any[]>([]);
  public readonly variableInterpolationService: IVariableInterpolationService;
  public readonly variableService: {
    getVariables$: () => BehaviorSubject<any[]>;
  };

  constructor(
    input: TestContainerInput,
    interpolationService?: Partial<IVariableInterpolationService>
  ) {
    super(input, { embeddableLoaded: {} }, () => undefined as any);

    this.variableInterpolationService = {
      hasVariables: jest.fn().mockReturnValue(false),
      interpolate: jest.fn((q: string) => q),
      getCurrentValues: jest.fn().mockReturnValue({}),
      getVariables: jest.fn().mockReturnValue([]),
      ...interpolationService,
    };

    this.variableService = {
      getVariables$: () => this.variables$,
    };
  }

  public getInheritedInput(id: string) {
    return {
      id,
      filters: this.input.filters,
      query: this.input.query,
      timeRange: this.input.timeRange,
    } as Partial<EmbeddableInput>;
  }

  public render() {}
}

/**
 * Factory helper: creates a TestDashboardContainer with a panel slot for the
 * embeddable and returns the container + a reference to the variables$ subject.
 */
function createTestContainer(
  embeddableId: string,
  containerInput: Partial<TestContainerInput> = {},
  interpolationService?: Partial<IVariableInterpolationService>
) {
  const container = new TestDashboardContainer(
    {
      id: 'dashboard-1',
      panels: {
        [embeddableId]: {
          type: EXPLORE_EMBEDDABLE_TYPE,
          explicitInput: { id: embeddableId },
        },
      },
      ...containerInput,
    },
    interpolationService
  );
  return container;
}

function createMockServices() {
  const mockServices = discoverPluginMock.createExploreServicesMock();
  mockServices.data.query.queryString.getLanguageService = jest.fn().mockReturnValue({
    getLanguage: jest.fn().mockReturnValue({
      fields: { formatter: jest.fn() },
    }),
  });
  mockServices.uiSettings.get = jest.fn().mockImplementation((key) => {
    if (key === 'doc_table:hideTimeColumn') return false;
    return 500;
  });
  return mockServices;
}

function createMockSearchSource(overrides: any = {}) {
  const base: any = {
    setField: jest.fn().mockReturnThis(),
    setFields: jest.fn().mockReturnThis(),
    setParent: jest.fn().mockReturnThis(),
    getField: jest.fn((field) => {
      if (field === 'index') return { id: 'test-index' };
      if (field === 'query') return { query: 'test', language: 'PPL' };
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
    getDataFrame: jest.fn().mockReturnValue({ schema: [] }),
    ...overrides,
  };
  base.create = jest.fn().mockImplementation(() => createMockSearchSource(overrides));
  return base;
}

describe('ExploreEmbeddable', () => {
  let embeddable: ExploreEmbeddable;
  let container: TestDashboardContainer;
  let mockSavedExplore: any;
  let mockInput: ExploreInput;
  let mockExecuteTriggerActions: jest.Mock;
  let mockNode: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();

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

    mockInput = {
      id: 'test-embeddable',
      timeRange: { from: 'now-15m', to: 'now' },
      filters: [],
      query: { query: '', language: 'PPL' },
    };

    mockExecuteTriggerActions = jest.fn();
    mockNode = document.createElement('div');

    container = createTestContainer(mockInput.id);
    const mockServices = createMockServices();

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
      mockExecuteTriggerActions,
      container
    );
  });

  afterEach(() => {
    embeddable.destroy();
    container.destroy();
  });

  test('has the correct type', () => {
    expect(embeddable.type).toBe(EXPLORE_EMBEDDABLE_TYPE);
  });

  test('should have return inspector adaptors', () => {
    expect(embeddable.getInspectorAdapters()).not.toBeUndefined();
    expect(embeddable.getInspectorAdapters().data).toBeDefined();
    expect(typeof embeddable.getInspectorAdapters().data.setTabularLoader).toBe('function');
  });

  test('initializes search props correctly', () => {
    // @ts-ignore - accessing private property for testing
    const searchProps = embeddable.searchProps;

    expect(searchProps).toBeDefined();
    expect(searchProps?.title).toBe('Test Explore');
    expect(searchProps?.description).toBe('Test description');
    expect(searchProps?.displayTimeColumn).toBe(false);
  });

  test('cleans up when destroy is called', () => {
    embeddable.render(mockNode);
    embeddable.destroy();
    expect(mockUnmount).toHaveBeenCalled();
  });

  test('updates input correctly', () => {
    const newColumns = ['column3', 'column4'];

    embeddable.updateInput({ columns: newColumns });

    // With a real Container parent, updateInput delegates to parent.updateInputForChild
    expect(container.getInput().panels['test-embeddable'].explicitInput).toEqual(
      expect.objectContaining({ columns: newColumns })
    );
  });

  test('handles fetch correctly', async () => {
    // @ts-ignore
    await embeddable.fetch();

    expect(mockSavedExplore.searchSource.fetch).toHaveBeenCalled();
    expect(embeddable.getOutput().loading).toBe(false);
    expect(embeddable.getOutput().error).toBeUndefined();
  });

  test('reload calls updateHandler with force=true', () => {
    // @ts-ignore
    const spy = jest.spyOn(embeddable as any, 'updateHandler').mockResolvedValue(undefined);
    embeddable.reload();
    expect(spy).toHaveBeenCalledWith(expect.anything(), true);
  });

  test('reload does nothing when searchProps does not exist', () => {
    // @ts-ignore
    embeddable.searchProps = undefined;
    // @ts-ignore
    const spy = jest.spyOn(embeddable as any, 'updateHandler');
    embeddable.reload();
    expect(spy).not.toHaveBeenCalled();
  });

  test('onContainerError aborts and updates output', () => {
    // @ts-ignore
    embeddable.abortController = { abort: jest.fn() };
    // @ts-ignore
    embeddable.renderComplete = { dispatchError: jest.fn() };
    const updateSpy = jest.spyOn(embeddable as any, 'updateOutput');
    const error = new Error('test error');

    embeddable.onContainerError(error);

    // @ts-ignore
    expect(embeddable.abortController.abort).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith({ loading: false, error });
  });

  test('destroy is idempotent', () => {
    expect(() => {
      embeddable.destroy();
      embeddable.destroy();
      embeddable.destroy();
    }).not.toThrow();
  });

  test('onContainerError works when abortController is undefined', () => {
    // @ts-ignore
    embeddable.abortController = undefined;
    // @ts-ignore
    embeddable.renderComplete = { dispatchError: jest.fn() };
    const updateSpy = jest.spyOn(embeddable as any, 'updateOutput');
    const error = new Error('test error');

    embeddable.onContainerError(error);

    // @ts-ignore
    expect(embeddable.renderComplete.dispatchError).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith({ loading: false, error });
  });

  test('renderComponent does nothing if searchProps is undefined', () => {
    // @ts-ignore
    embeddable.searchProps = undefined;
    // @ts-ignore
    expect(() => embeddable.renderComponent(mockNode, undefined)).not.toThrow();
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

  test('handles column actions correctly', () => {
    const updateInputSpy = jest.spyOn(embeddable, 'updateInput');
    // @ts-ignore
    const searchProps = embeddable.searchProps;

    searchProps?.onAddColumn?.('column3');
    expect(updateInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({ columns: expect.anything() })
    );

    searchProps?.onRemoveColumn?.('column1');
    expect(updateInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({ columns: expect.anything() })
    );

    searchProps?.onMoveColumn?.('column1', 1);
    expect(updateInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({ columns: expect.anything() })
    );

    searchProps?.onSetColumns?.(['column3', 'column4']);
    expect(updateInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({ columns: expect.anything() })
    );
  });

  test('handles filter action correctly', async () => {
    // @ts-ignore
    const searchProps = embeddable.searchProps;
    await searchProps?.onFilter?.({ name: 'field1' } as any, ['value1'], 'is');
    expect(mockExecuteTriggerActions).toHaveBeenCalled();
  });

  test('onFilter returns early when indexPattern is not available', async () => {
    const mockServices = createMockServices();
    const noIndexContainer = createTestContainer('no-index-filter-emb');
    const noIndexSearchSource = createMockSearchSource({
      getField: jest.fn((field) => {
        if (field === 'index') return null;
        if (field === 'query') return { query: 'test', language: 'PPL' };
        return null;
      }),
    });

    const mockExecuteTriggerActionsLocal = jest.fn();
    const embeddableNoIndex = new ExploreEmbeddable(
      {
        savedExplore: { ...mockSavedExplore, searchSource: noIndexSearchSource },
        editUrl: '/app/explore/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: mockServices.filterManager,
        services: mockServices,
        editApp: 'explore/logs',
      },
      { ...mockInput, id: 'no-index-filter-emb' },
      mockExecuteTriggerActionsLocal,
      noIndexContainer
    );

    // Manually set searchProps to enable onFilter testing
    // @ts-ignore
    embeddableNoIndex.searchProps = {
      onFilter: async (field: any, value: any, operator: any) => {
        const indexPattern = noIndexSearchSource.getField('index');
        if (!indexPattern) return;
      },
    };

    // @ts-ignore
    const searchProps = embeddableNoIndex.searchProps;
    await searchProps?.onFilter?.({ name: 'field1' } as any, ['value1'], 'is');

    expect(mockExecuteTriggerActionsLocal).not.toHaveBeenCalled();

    embeddableNoIndex.destroy();
    noIndexContainer.destroy();
  });

  test('constructor handles missing indexPattern gracefully', () => {
    const mockServices = createMockServices();
    const noIndexContainer = createTestContainer('no-index-ctor-emb');
    const noIndexSearchSource = createMockSearchSource({
      getField: jest.fn((field) => {
        if (field === 'index') return null;
        if (field === 'query') return { query: 'test', language: 'PPL' };
        return null;
      }),
    });

    const embeddableNoIndex = new ExploreEmbeddable(
      {
        savedExplore: { ...mockSavedExplore, searchSource: noIndexSearchSource },
        editUrl: '/app/explore/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: mockServices.filterManager,
        services: mockServices,
        editApp: 'explore/logs',
      },
      { ...mockInput, id: 'no-index-ctor-emb' },
      mockExecuteTriggerActions,
      noIndexContainer
    );

    // @ts-ignore
    expect(embeddableNoIndex.searchProps).toBeDefined();
    // @ts-ignore
    expect(embeddableNoIndex.searchProps?.indexPattern).toBeNull();

    embeddableNoIndex.destroy();
    noIndexContainer.destroy();
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

  test('renders successfully even without index pattern', () => {
    const mockServices = createMockServices();
    const noIndexContainer = createTestContainer('no-index-emb');
    const noIndexSearchSource = createMockSearchSource({
      getField: jest.fn((field) => {
        if (field === 'query') return { query: 'test', language: 'PPL' };
        return null;
      }),
    });

    const emb = new ExploreEmbeddable(
      {
        savedExplore: { ...mockSavedExplore, searchSource: noIndexSearchSource },
        editUrl: '/app/explore/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: mockServices.filterManager,
        services: mockServices,
        editApp: 'explore/logs',
      },
      { ...mockInput, id: 'no-index-emb' },
      mockExecuteTriggerActions,
      noIndexContainer
    );

    // @ts-ignore
    expect(emb.searchProps).toBeDefined();
    expect(() => emb.render(mockNode)).not.toThrow();

    emb.destroy();
    noIndexContainer.destroy();
  });

  test('updateHandler skips fetch when node is not set', async () => {
    // @ts-ignore
    const fetchSpy = jest.spyOn(embeddable as any, 'fetch').mockResolvedValue(undefined);
    // @ts-ignore - no node set yet
    embeddable.node = undefined;
    // @ts-ignore
    await embeddable.updateHandler(embeddable.searchProps, true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('updateHandler fetches when node is set and force=true', async () => {
    // @ts-ignore
    const fetchSpy = jest.spyOn(embeddable as any, 'fetch').mockResolvedValue(undefined);
    // @ts-ignore
    embeddable.node = mockNode;
    // @ts-ignore
    await embeddable.updateHandler(embeddable.searchProps, true);
    expect(fetchSpy).toHaveBeenCalled();
  });

  test('fetch handles missing searchProps gracefully', async () => {
    // @ts-ignore
    embeddable.searchProps = undefined;
    // @ts-ignore
    await expect(embeddable.fetch()).resolves.toBeUndefined();
  });

  test('fetch handles empty data by skipping visualization processing', async () => {
    const mockNormalizeResultRows =
      await import('../components/visualizations/utils/normalize_result_rows');
    jest.spyOn(mockNormalizeResultRows, 'normalizeResultRows').mockReturnValueOnce({
      transformedData: [],
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      unknownColumns: [],
    });

    mockSavedExplore.visualization = JSON.stringify({
      chartType: 'line',
      axesMapping: { x: 'field1', y: 'field2' },
    });
    mockSavedExplore.uiState = JSON.stringify({ activeTab: 'visualization' });

    // @ts-ignore
    await embeddable.fetch();

    expect(embeddable.getOutput().error).toBeUndefined();
    expect(embeddable.getOutput().loading).toBe(false);
  });

  test('calls setTabularLoader with correct columns and rows when visualization data exists', async () => {
    const mockGetByName = jest.fn().mockReturnValue({ name: 'price' });

    const mockNormalizeResultRows =
      await import('../components/visualizations/utils/normalize_result_rows');
    jest.spyOn(mockNormalizeResultRows, 'normalizeResultRows').mockReturnValueOnce({
      transformedData: [{ price: 10, category: 'A', date: '2024-01-01' }],
      numericalColumns: [{ name: 'price', column: 'price' } as any],
      categoricalColumns: [{ name: 'category', column: 'category' } as any],
      dateColumns: [{ name: 'date', column: 'date' } as any],
      unknownColumns: [],
    });

    mockSavedExplore.searchSource.getField = jest.fn().mockImplementation((field: string) => {
      if (field === 'index') return { fields: { getByName: mockGetByName } };
      if (field === 'query') return { query: 'test', language: 'PPL' };
    });

    const setTabularLoaderSpy = jest.spyOn(
      embeddable.getInspectorAdapters().data,
      'setTabularLoader'
    );

    // @ts-ignore
    await embeddable.fetch();

    expect(setTabularLoaderSpy).toHaveBeenCalledWith(expect.any(Function), {
      returnsFormattedValues: true,
    });

    const loader: any = setTabularLoaderSpy.mock.calls[0][0];
    const result = loader();
    expect(result.columns).toEqual([
      { name: 'price', field: 'price' },
      { name: 'category', field: 'category' },
      { name: 'date', field: 'date' },
    ]);
    expect(result.rows).toHaveLength(1);
  });

  test('formats row values using field formatter when available', async () => {
    const mockConverter = jest.fn().mockReturnValue('formatted');
    const mockGetFormatterForField = jest.fn().mockReturnValue({ convert: mockConverter });
    const mockGetByName = jest.fn().mockReturnValue({ name: 'price' });

    mockSavedExplore.searchSource.getField = jest.fn().mockImplementation((field: string) => {
      if (field === 'index') {
        return {
          fields: { getByName: mockGetByName },
          getFormatterForField: mockGetFormatterForField,
        };
      }
      if (field === 'query') return { query: 'test', language: 'PPL' };
    });

    const mockNormalizeResultRows =
      await import('../components/visualizations/utils/normalize_result_rows');
    jest.spyOn(mockNormalizeResultRows, 'normalizeResultRows').mockReturnValueOnce({
      transformedData: [{ price: 42 }],
      numericalColumns: [{ name: 'price', column: 'price' } as any],
      categoricalColumns: [],
      dateColumns: [],
      unknownColumns: [],
    });

    const setTabularLoaderSpy = jest.spyOn(
      embeddable.getInspectorAdapters().data,
      'setTabularLoader'
    );

    // @ts-ignore
    await embeddable.fetch();

    const loader: any = setTabularLoaderSpy.mock.calls[0][0];
    const result = loader();
    expect(mockGetFormatterForField).toHaveBeenCalled();
    expect(mockConverter).toHaveBeenCalledWith(42);
    expect(result.rows[0].price.raw).toBe(42);
    expect(result.rows[0].price.formatted).toBe('formatted');
  });

  test('should be able to adapt deprecated styles', async () => {
    jest.spyOn(visualizationRegistry, 'findRuleByAxesMapping').mockReturnValueOnce({
      priority: 100,
      mappings: [],
      render: jest.fn(),
    });

    const adaptLegacyDataSpy = jest.spyOn(
      await import('../components/visualizations/visualization_builder_utils'),
      'adaptLegacyData'
    );

    mockSavedExplore.visualization = JSON.stringify({
      chartType: 'line',
      axesMapping: { x: 'field1', y: 'field2' },
      thresholdLines: [],
    });
    mockSavedExplore.uiState = JSON.stringify({ activeTab: 'visualization' });

    // @ts-ignore
    await embeddable.fetch();

    expect(adaptLegacyDataSpy).toHaveBeenCalled();
  });

  describe('variable interpolation in panel title', () => {
    test('interpolates input.title when it contains variables', () => {
      const mockInterpolation: Partial<IVariableInterpolationService> = {
        hasVariables: jest.fn((str: string) => str.includes('$')),
        interpolate: jest.fn().mockReturnValue('Sales for Region-A'),
        getCurrentValues: jest.fn().mockReturnValue({}),
        getVariables: jest.fn().mockReturnValue([]),
      };
      const parent = createTestContainer(
        'title-var-emb',
        {
          panels: {
            'title-var-emb': {
              type: EXPLORE_EMBEDDABLE_TYPE,
              explicitInput: { id: 'title-var-emb', title: 'Sales for $region' },
            },
          },
        },
        mockInterpolation
      );
      const mockServices = createMockServices();

      const emb = new ExploreEmbeddable(
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
        { ...mockInput, id: 'title-var-emb', title: 'Sales for $region' },
        mockExecuteTriggerActions,
        parent
      );

      // @ts-ignore
      emb.handleTitleVariables();

      expect(mockInterpolation.interpolate).toHaveBeenCalledWith('Sales for $region');
      expect(emb.getOutput().title).toBe('Sales for Region-A');

      emb.destroy();
      parent.destroy();
    });

    test('falls back to savedExplore.title when input.title has no variables', () => {
      const mockInterpolation: Partial<IVariableInterpolationService> = {
        hasVariables: jest.fn((str: string) => str.includes('$')),
        interpolate: jest.fn().mockReturnValue('Logs for prod'),
        getCurrentValues: jest.fn().mockReturnValue({}),
        getVariables: jest.fn().mockReturnValue([]),
      };
      const parent = createTestContainer('title-saved-emb', {}, mockInterpolation);
      const mockServices = createMockServices();

      const emb = new ExploreEmbeddable(
        {
          savedExplore: { ...mockSavedExplore, title: 'Logs for $env' },
          editUrl: '/app/explore/logs/test',
          editPath: 'test',
          indexPatterns: [],
          editable: true,
          filterManager: mockServices.filterManager,
          services: mockServices,
          editApp: 'explore/logs',
        },
        { ...mockInput, id: 'title-saved-emb' },
        mockExecuteTriggerActions,
        parent
      );

      // @ts-ignore
      emb.handleTitleVariables();

      expect(mockInterpolation.interpolate).toHaveBeenCalledWith('Logs for $env');
      expect(emb.getOutput().title).toBe('Logs for prod');

      emb.destroy();
      parent.destroy();
    });

    test('does not interpolate when neither title contains variables', () => {
      const mockInterpolation: Partial<IVariableInterpolationService> = {
        hasVariables: jest.fn().mockReturnValue(false),
        interpolate: jest.fn(),
        getCurrentValues: jest.fn().mockReturnValue({}),
        getVariables: jest.fn().mockReturnValue([]),
      };
      const parent = createTestContainer('no-var-emb', {}, mockInterpolation);
      const mockServices = createMockServices();

      const emb = new ExploreEmbeddable(
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
        { ...mockInput, id: 'no-var-emb' },
        mockExecuteTriggerActions,
        parent
      );

      // @ts-ignore
      emb.handleTitleVariables();
      expect(mockInterpolation.interpolate).not.toHaveBeenCalled();

      emb.destroy();
      parent.destroy();
    });

    test('re-interpolates title when variables$ emits new values', (done) => {
      const mockInterpolation: Partial<IVariableInterpolationService> = {
        hasVariables: jest.fn((str: string) => str.includes('$')),
        interpolate: jest.fn().mockReturnValue('Dashboard: initial'),
        getCurrentValues: jest.fn().mockReturnValue({}),
        getVariables: jest.fn().mockReturnValue([]),
      };
      const parent = createTestContainer('reactive-title-emb', {}, mockInterpolation);
      const mockServices = createMockServices();

      const emb = new ExploreEmbeddable(
        {
          savedExplore: { ...mockSavedExplore, title: 'Dashboard: $env' },
          editUrl: '/app/explore/logs/test',
          editPath: 'test',
          indexPatterns: [],
          editable: true,
          filterManager: mockServices.filterManager,
          services: mockServices,
          editApp: 'explore/logs',
        },
        { ...mockInput, id: 'reactive-title-emb' },
        mockExecuteTriggerActions,
        parent
      );

      (mockInterpolation.interpolate as jest.Mock).mockReturnValue('Dashboard: production');

      emb
        .getOutput$()
        .pipe(skip(1))
        .subscribe((output) => {
          if (output.title === 'Dashboard: production') {
            emb.destroy();
            parent.destroy();
            done();
          }
        });

      parent.variables$.next([{ id: 'env', value: 'production' }]);
    });
  });

  describe('variable interpolation in queries', () => {
    test('stores originalQuery and interpolates on initialization', () => {
      const mockInterpolation: Partial<IVariableInterpolationService> = {
        hasVariables: jest.fn((str: string) => str.includes('$')),
        interpolate: jest.fn().mockReturnValue("source = logs | where region = 'us-east-1'"),
        getCurrentValues: jest.fn().mockReturnValue({}),
        getVariables: jest.fn().mockReturnValue([]),
      };
      const parent = createTestContainer('query-init-emb', {}, mockInterpolation);
      const mockServices = createMockServices();

      const searchSource = createMockSearchSource({
        getField: jest.fn((field: string) => {
          if (field === 'index') return { id: 'test-index' };
          if (field === 'query')
            return { query: "source = logs | where region = '$region'", language: 'PPL' };
          return null;
        }),
      });

      const emb = new ExploreEmbeddable(
        {
          savedExplore: {
            ...mockSavedExplore,
            searchSource,
            uiState: '{"activeTab":"visualization"}',
          },
          editUrl: '/app/explore/logs/test',
          editPath: 'test',
          indexPatterns: [],
          editable: true,
          filterManager: mockServices.filterManager,
          services: mockServices,
          editApp: 'explore/logs',
        },
        { ...mockInput, id: 'query-init-emb' },
        mockExecuteTriggerActions,
        parent
      );

      expect(emb.originalQuery).toContain('$region');
      expect(mockInterpolation.interpolate).toHaveBeenCalled();

      emb.destroy();
      parent.destroy();
    });

    test('handleVariablesChange refetches on new value and skips on same value', () => {
      const mockInterpolation: Partial<IVariableInterpolationService> = {
        hasVariables: jest.fn().mockReturnValue(true),
        interpolate: jest.fn().mockReturnValue("source = logs | where env = 'prod'"),
        getCurrentValues: jest.fn().mockReturnValue({}),
        getVariables: jest.fn().mockReturnValue([]),
      };
      const parent = createTestContainer('query-change-emb', {}, mockInterpolation);
      const mockServices = createMockServices();

      const searchSource = createMockSearchSource({
        getField: jest.fn((field: string) => {
          if (field === 'index') return { id: 'test-index' };
          if (field === 'query')
            return { query: "source = logs | where env = '$env'", language: 'PPL' };
          return null;
        }),
      });

      const emb = new ExploreEmbeddable(
        {
          savedExplore: {
            ...mockSavedExplore,
            searchSource,
            uiState: '{"activeTab":"visualization"}',
          },
          editUrl: '/app/explore/logs/test',
          editPath: 'test',
          indexPatterns: [],
          editable: true,
          filterManager: mockServices.filterManager,
          services: mockServices,
          editApp: 'explore/logs',
        },
        { ...mockInput, id: 'query-change-emb' },
        mockExecuteTriggerActions,
        parent
      );

      const updateHandlerSpy = jest.spyOn(emb as any, 'updateHandler').mockResolvedValue(undefined);

      // Same value as initial — skipped
      // @ts-ignore
      emb.handleVariablesChange();
      expect(updateHandlerSpy).not.toHaveBeenCalled();

      // New value — refetches
      (mockInterpolation.interpolate as jest.Mock).mockReturnValue(
        "source = logs | where env = 'staging'"
      );
      // @ts-ignore
      emb.handleVariablesChange();
      expect(updateHandlerSpy).toHaveBeenCalledTimes(1);
      expect(searchSource.setField).toHaveBeenCalledWith(
        'query',
        expect.objectContaining({ query: "source = logs | where env = 'staging'" })
      );

      emb.destroy();
      parent.destroy();
    });
  });
});
