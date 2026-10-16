/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { skip } from 'rxjs/operators';
import { ExploreEmbeddable, getCrosshairGroup } from './explore_embeddable';
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

// Mock the PanelDataService singleton so fetch()/destroy() interactions with the
// shared panel-data store can be asserted directly, without depending on whether
// PanelDataService.init() was called (getInstance() now safely returns null when
// uninitialized, e.g. when contextProvider is disabled).
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

describe('getCrosshairGroup', () => {
  it('returns no group when shared crosshair is disabled', () => {
    expect(getCrosshairGroup(false, 'dashboard-123')).toBeUndefined();
  });

  it('uses the container id when shared crosshair is enabled', () => {
    expect(getCrosshairGroup(true, 'dashboard-123')).toBe('dashboard-123');
  });

  it('uses the static id for an unsaved dashboard', () => {
    expect(getCrosshairGroup(true, '')).toBe('dashboard-unsaved');
  });
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
  isVisible?: boolean;
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
      isVisible: this.input.isVisible,
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
  const indexPattern = {
    id: 'test-index',
    getFieldByName: jest.fn((name: string) => ({ name, sortable: true })),
    fields: {
      getByName: jest.fn((name: string) => ({ name })),
    },
  };
  const base: any = {
    setField: jest.fn().mockReturnThis(),
    setFields: jest.fn().mockReturnThis(),
    setParent: jest.fn().mockReturnThis(),
    getField: jest.fn((field) => {
      if (field === 'index') return indexPattern;
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

  const createEmbeddableForTest = (
    id: string,
    savedExploreOverrides: Record<string, unknown> = {},
    inputOverrides: Partial<ExploreInput> = {}
  ) => {
    const localContainer = createTestContainer(id);
    const localServices = createMockServices();
    const savedExplore = {
      ...mockSavedExplore,
      ...savedExploreOverrides,
    };
    const instance = new ExploreEmbeddable(
      {
        savedExplore,
        editUrl: '/app/explore/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: localServices.filterManager,
        services: localServices,
        editApp: 'explore/logs',
      },
      { ...mockInput, ...inputOverrides, id },
      mockExecuteTriggerActions,
      localContainer
    );
    return { instance, localContainer, savedExplore };
  };

  afterEach(() => {
    embeddable.destroy();
    container.destroy();
  });

  test('has the correct type', () => {
    expect(embeddable.type).toBe(EXPLORE_EMBEDDABLE_TYPE);
  });

  test('uses visualization metadata for the default panel title and description', () => {
    const services = createMockServices();
    const metadataContainer = createTestContainer('metadata-embeddable');
    const metadataEmbeddable = new ExploreEmbeddable(
      {
        savedExplore: {
          ...mockSavedExplore,
          visualization: JSON.stringify({
            chartType: 'bar',
            title: 'Visualization title',
            description: 'Visualization description',
          }),
        },
        editUrl: '/app/explore/logs/test',
        editPath: 'test',
        indexPatterns: [],
        editable: true,
        filterManager: services.filterManager,
        services,
        editApp: 'explore/logs',
      },
      { ...mockInput, id: 'metadata-embeddable' },
      mockExecuteTriggerActions,
      metadataContainer
    );

    expect(metadataEmbeddable.getTitle()).toBe('Visualization title');
    expect(metadataEmbeddable.getDescription()).toBe('Visualization description');

    metadataEmbeddable.destroy();
    metadataContainer.destroy();
  });

  test('falls back to the saved object title when visualization title is empty', () => {
    expect(embeddable.getTitle()).toBe('Test Explore');
  });

  test('should have return inspector adaptors', () => {
    expect(embeddable.getInspectorAdapters()).not.toBeUndefined();
    expect(embeddable.getInspectorAdapters().data).toBeDefined();
    expect(typeof embeddable.getInspectorAdapters().data.setTabularLoader).toBe('function');
  });

  test('has no view state before the panel is mounted or explicitly fetched', () => {
    expect((embeddable as any).state).toBeUndefined();
  });

  test('cleans up when destroy is called', () => {
    embeddable.render(mockNode);
    embeddable.destroy();
    expect(mockUnmount).toHaveBeenCalled();
  });

  test('destroy does not throw when PanelDataService is uninitialized (contextProvider disabled)', () => {
    const { PanelDataService } = jest.requireMock('./panel_data_service');
    PanelDataService.getInstance.mockReturnValueOnce(null);

    embeddable.render(mockNode);
    expect(() => embeddable.destroy()).not.toThrow();
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
    await (embeddable as any).fetch();

    expect(mockSavedExplore.searchSource.fetch).toHaveBeenCalled();
    expect(embeddable.getOutput().loading).toBe(false);
    expect(embeddable.getOutput().error).toBeUndefined();
    expect((embeddable as any).state).toEqual(
      expect.objectContaining({
        status: 'ready',
        content: expect.objectContaining({ kind: 'logs' }),
      })
    );
  });

  test('uses the same React component type across state transitions', () => {
    (embeddable as any).root = mockRoot;

    (embeddable as any).transitionToReady({
      kind: 'logs',
      dataset: (embeddable as any).indexPattern,
      sampleSize: 500,
      rows: [],
      hits: 0,
    });
    const readyElement = mockRender.mock.calls.at(-1)?.[0];

    (embeddable as any).transitionToError({
      name: 'Error',
      message: 'failed',
    });
    const errorElement = mockRender.mock.calls.at(-1)?.[0];

    expect(errorElement.type).toBe(readyElement.type);
  });

  test('reload requests a forced input refresh', () => {
    const spy = jest.spyOn(embeddable as any, 'handleInputChange').mockResolvedValue(undefined);
    embeddable.reload();
    expect(spy).toHaveBeenCalledWith(true);
  });

  test('output changes do not trigger data fetches', () => {
    const fetchSpy = jest.spyOn(embeddable as any, 'fetch').mockResolvedValue(undefined);

    (embeddable as any).updateOutput({ loading: true });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('onContainerError aborts and updates output', () => {
    const abort = jest.fn();
    (embeddable as any).abortController = { abort };
    const error = new Error('test error');

    embeddable.onContainerError(error);

    expect(abort).toHaveBeenCalled();
    expect(embeddable.getOutput()).toEqual(
      expect.objectContaining({
        loading: false,
        error: { name: 'Error', message: 'test error' },
      })
    );
    expect((embeddable as any).state).toEqual({
      status: 'error',
      error: { name: 'Error', message: 'test error' },
    });
  });

  test('destroy is idempotent', () => {
    expect(() => {
      embeddable.destroy();
      embeddable.destroy();
      embeddable.destroy();
    }).not.toThrow();
  });

  test('onContainerError works when abortController is undefined', () => {
    (embeddable as any).abortController = undefined;
    const error = new Error('test error');

    embeddable.onContainerError(error);

    expect(embeddable.getOutput().error).toEqual({
      name: 'Error',
      message: 'test error',
    });
  });

  test('renderComponent does nothing before state and root are available', () => {
    expect(() => (embeddable as any).renderComponent()).not.toThrow();
  });

  test('destroy handles missing resources gracefully', () => {
    (embeddable as any).inputSubscription = undefined;
    (embeddable as any).autoRefreshFetchSubscription = undefined;
    (embeddable as any).abortController = undefined;
    (embeddable as any).node = undefined;
    expect(() => embeddable.destroy()).not.toThrow();
  });

  test('handles column actions correctly', () => {
    const updateInputSpy = jest.spyOn(embeddable, 'updateInput');

    (embeddable as any).onAddColumn('column3');
    expect(updateInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({ columns: expect.anything() })
    );

    (embeddable as any).onRemoveColumn('column1');
    expect(updateInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.anything(),
        sort: [],
      })
    );
  });

  test('updates log columns without refetching the result set', async () => {
    (embeddable as any).root = mockRoot;
    (embeddable as any).node = mockNode;
    await (embeddable as any).handleInputChange(true);
    mockRender.mockClear();
    mockSavedExplore.searchSource.fetch.mockClear();

    embeddable.updateInput({ columns: ['column3'] });

    expect(mockSavedExplore.searchSource.fetch).not.toHaveBeenCalled();
    expect(mockRender.mock.calls.at(-1)?.[0].props.selectedColumns).toEqual(['column3']);
  });

  test('handles filter action correctly', () => {
    (embeddable as any).onFilter('field1', 'value1', '+');

    expect(mockExecuteTriggerActions).toHaveBeenCalled();
  });

  test('onFilter returns early when indexPattern is not available', () => {
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

    (embeddableNoIndex as any).onFilter('field1', 'value1', '+');

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

    expect((embeddableNoIndex as any).indexPattern).toBeUndefined();

    embeddableNoIndex.destroy();
    noIndexContainer.destroy();
  });

  test('column actions handle missing columns gracefully', () => {
    const { instance, localContainer } = createEmbeddableForTest('no-columns-emb', {
      columns: undefined,
    });

    expect(() => (instance as any).onAddColumn('col')).not.toThrow();
    expect(() => (instance as any).onRemoveColumn('col')).not.toThrow();

    instance.destroy();
    localContainer.destroy();
  });

  test('reports a render error when the logs view has no index pattern', async () => {
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

    await (emb as any).fetch();

    expect((emb as any).state).toEqual({
      status: 'error',
      error: {
        name: 'Error',
        message: 'Cannot render the Explore logs table without a data view',
      },
    });

    emb.destroy();
    noIndexContainer.destroy();
  });

  test('handleInputChange skips fetch when the panel is not mounted', async () => {
    const fetchSpy = jest.spyOn(embeddable as any, 'fetch').mockResolvedValue(undefined);
    (embeddable as any).node = undefined;

    await (embeddable as any).handleInputChange(true);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('handleInputChange fetches when the panel is mounted and force=true', async () => {
    const fetchSpy = jest.spyOn(embeddable as any, 'fetch').mockResolvedValue(undefined);
    (embeddable as any).node = mockNode;

    await (embeddable as any).handleInputChange(true);

    expect(fetchSpy).toHaveBeenCalled();
  });

  test('handleInputChange skips fetch while not visible and records one is owed', async () => {
    const fetchSpy = jest.spyOn(embeddable as any, 'fetch').mockResolvedValue(undefined);
    (embeddable as any).node = mockNode;
    // Set input directly to avoid retriggering the input subscription.
    (embeddable as any).input.isVisible = false;

    await (embeddable as any).handleInputChange(true);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect((embeddable as any).pendingFetchOnResume).toBe(true);
  });

  test('handleInputChange runs the owed fetch once when the panel becomes visible', async () => {
    const fetchSpy = jest.spyOn(embeddable as any, 'fetch').mockResolvedValue(undefined);
    (embeddable as any).node = mockNode;
    (embeddable as any).pendingFetchOnResume = true;
    (embeddable as any).input.isVisible = true;

    await (embeddable as any).handleInputChange();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect((embeddable as any).pendingFetchOnResume).toBe(false);
  });

  test('defers mounted panel refreshes while hidden and fetches once on expansion', () => {
    const fetchSpy = jest.spyOn(embeddable as any, 'fetch').mockResolvedValue(undefined);
    container.updateInput({ isVisible: false });
    embeddable.render(mockNode);
    embeddable.reload();
    embeddable.reload();
    container.updateInput({ timeRange: { from: 'now-1h', to: 'now' } });

    expect(fetchSpy).not.toHaveBeenCalled();

    container.updateInput({ isVisible: true });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    embeddable.updateInput({ columns: ['column3'] });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('leaves the current view untouched while a refresh is loading', async () => {
    const currentContent = {
      kind: 'logs',
      dataset: (embeddable as any).indexPattern,
      sampleSize: 500,
      rows: [],
      hits: 0,
    };
    (embeddable as any).state = { status: 'ready', content: currentContent };
    (embeddable as any).root = mockRoot;
    mockRender.mockClear();

    let resolveFetch!: (value: any) => void;
    mockSavedExplore.searchSource.fetch.mockImplementationOnce(
      () => new Promise((resolve) => (resolveFetch = resolve))
    );

    const refresh = (embeddable as any).fetch();
    await Promise.resolve();

    expect((embeddable as any).state).toEqual({
      status: 'ready',
      content: currentContent,
    });
    expect(mockRender).not.toHaveBeenCalled();
    expect(embeddable.getOutput().loading).toBe(true);

    resolveFetch({
      hits: { hits: [], total: 0 },
    });
    await refresh;

    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(embeddable.getOutput().loading).toBe(false);
  });

  test('ignores a stale response after a newer refresh starts', async () => {
    let resolveFirst!: (value: any) => void;
    let resolveSecond!: (value: any) => void;
    mockSavedExplore.searchSource.fetch
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockImplementationOnce(() => new Promise((resolve) => (resolveSecond = resolve)));

    const firstRefresh = (embeddable as any).fetch();
    await Promise.resolve();
    const secondRefresh = (embeddable as any).fetch();
    await Promise.resolve();

    resolveFirst({
      hits: {
        hits: [
          {
            _index: 'test-index',
            _id: 'stale',
            _score: null,
            _source: {},
          },
        ],
        total: 1,
      },
    });
    await firstRefresh;
    expect((embeddable as any).state).toBeUndefined();
    expect(embeddable.getOutput().loading).toBe(true);

    resolveSecond({
      hits: {
        hits: [
          {
            _index: 'test-index',
            _id: 'current',
            _score: null,
            _source: {},
          },
        ],
        total: 1,
      },
    });
    await secondRefresh;

    expect((embeddable as any).state.content.rows[0]._id).toBe('current');
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

    const { instance, localContainer } = createEmbeddableForTest('empty-chart-emb', {
      visualization: JSON.stringify({
        chartType: 'line',
        axesMapping: { x: 'field1', y: 'field2' },
      }),
      uiState: JSON.stringify({ activeTab: 'visualization' }),
    });

    await (instance as any).fetch();

    expect(instance.getOutput().error).toBeUndefined();
    expect(instance.getOutput().loading).toBe(false);
    expect((instance as any).state).toEqual(
      expect.objectContaining({
        status: 'ready',
        content: expect.objectContaining({
          kind: 'chart',
          data: expect.objectContaining({ transformedData: [] }),
        }),
      })
    );

    instance.destroy();
    localContainer.destroy();
  });

  test('chart content uses the saved panel query instead of the dashboard query', async () => {
    const panelQuery = {
      query: 'SELECT * FROM logs',
      language: 'SQL',
      dataset: { id: 'panel-dataset', type: 'INDEXES', title: 'logs' },
    };
    const searchSource = createMockSearchSource({
      getField: jest.fn((field: string) => (field === 'query' ? panelQuery : undefined)),
      fetch: jest.fn().mockResolvedValue({ hits: { hits: [], total: 0 } }),
    });
    const { instance, localContainer } = createEmbeddableForTest(
      'panel-query-chart-emb',
      {
        searchSource,
        visualization: JSON.stringify({ chartType: 'line' }),
        uiState: JSON.stringify({ activeTab: 'visualization' }),
      },
      { query: { query: '', language: 'PPL' } }
    );

    await (instance as any).fetch();

    expect(instance.getOutput().error).toBeUndefined();
    expect((instance as any).state.content.query).toEqual({
      language: 'SQL',
      dataset: panelQuery.dataset,
    });

    instance.destroy();
    localContainer.destroy();
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

    await (embeddable as any).fetch();

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

    await (embeddable as any).fetch();

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

    const mockNormalizeResultRows =
      await import('../components/visualizations/utils/normalize_result_rows');
    jest.spyOn(mockNormalizeResultRows, 'normalizeResultRows').mockReturnValueOnce({
      transformedData: [{ field1: 'a', field2: 10 }],
      numericalColumns: [{ id: 1, name: 'field2', column: 'field2', schema: 'numerical' } as any],
      categoricalColumns: [
        { id: 0, name: 'field1', column: 'field1', schema: 'categorical' } as any,
      ],
      dateColumns: [],
      unknownColumns: [],
    });

    const { instance, localContainer } = createEmbeddableForTest('legacy-chart-emb', {
      visualization: JSON.stringify({
        chartType: 'line',
        axesMapping: { x: 'field1', y: 'field2' },
        params: { thresholdLines: [] },
      }),
      uiState: JSON.stringify({ activeTab: 'visualization' }),
    });

    await (instance as any).fetch();

    expect(adaptLegacyDataSpy).toHaveBeenCalled();

    instance.destroy();
    localContainer.destroy();
  });

  describe('variable interpolation in panel metadata', () => {
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
      emb.handlePanelMetadataVariables();

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
      emb.handlePanelMetadataVariables();

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
      emb.handlePanelMetadataVariables();
      expect(mockInterpolation.interpolate).not.toHaveBeenCalled();

      emb.destroy();
      parent.destroy();
    });

    test('interpolates visualization description when it contains variables', () => {
      const mockInterpolation: Partial<IVariableInterpolationService> = {
        hasVariables: jest.fn((str: string) => str.includes('$')),
        interpolate: jest.fn((str: string) => str.replace('$env', 'production')),
        getCurrentValues: jest.fn().mockReturnValue({}),
        getVariables: jest.fn().mockReturnValue([]),
      };
      const parent = createTestContainer('description-var-emb', {}, mockInterpolation);
      const mockServices = createMockServices();

      const emb = new ExploreEmbeddable(
        {
          savedExplore: {
            ...mockSavedExplore,
            visualization: JSON.stringify({
              chartType: 'bar',
              description: 'Logs for $env',
            }),
          },
          editUrl: '/app/explore/logs/test',
          editPath: 'test',
          indexPatterns: [],
          editable: true,
          filterManager: mockServices.filterManager,
          services: mockServices,
          editApp: 'explore/logs',
        },
        { ...mockInput, id: 'description-var-emb' },
        mockExecuteTriggerActions,
        parent
      );

      expect(mockInterpolation.interpolate).toHaveBeenCalledWith('Logs for $env');
      expect(emb.getDescription()).toBe('Logs for production');

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

    test('re-interpolates description when variables$ emits new values', () => {
      let environment = 'initial';
      const mockInterpolation: Partial<IVariableInterpolationService> = {
        hasVariables: jest.fn((str: string) => str.includes('$')),
        interpolate: jest.fn((str: string) => str.replace('$env', environment)),
        getCurrentValues: jest.fn().mockReturnValue({}),
        getVariables: jest.fn().mockReturnValue([]),
      };
      const parent = createTestContainer('reactive-description-emb', {}, mockInterpolation);
      const mockServices = createMockServices();

      const emb = new ExploreEmbeddable(
        {
          savedExplore: {
            ...mockSavedExplore,
            visualization: JSON.stringify({
              chartType: 'bar',
              description: 'Logs for $env',
            }),
          },
          editUrl: '/app/explore/logs/test',
          editPath: 'test',
          indexPatterns: [],
          editable: true,
          filterManager: mockServices.filterManager,
          services: mockServices,
          editApp: 'explore/logs',
        },
        { ...mockInput, id: 'reactive-description-emb' },
        mockExecuteTriggerActions,
        parent
      );

      expect(emb.getDescription()).toBe('Logs for initial');
      const outputListener = jest.fn();
      const outputSubscription = emb.getOutput$().subscribe(outputListener);
      outputListener.mockClear();

      environment = 'production';
      parent.variables$.next([{ id: 'env', value: 'production' }]);

      expect(emb.getDescription()).toBe('Logs for production');
      expect(outputListener).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Logs for production' })
      );

      outputSubscription.unsubscribe();
      emb.destroy();
      parent.destroy();
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

      const handleInputChangeSpy = jest
        .spyOn(emb as any, 'handleInputChange')
        .mockResolvedValue(undefined);

      // Same value as initial — skipped
      // @ts-ignore
      emb.handleVariablesChange();
      expect(handleInputChangeSpy).not.toHaveBeenCalled();

      // New value — refetches
      (mockInterpolation.interpolate as jest.Mock).mockReturnValue(
        "source = logs | where env = 'staging'"
      );
      // @ts-ignore
      emb.handleVariablesChange();
      expect(handleInputChangeSpy).toHaveBeenCalledTimes(1);
      expect(handleInputChangeSpy).toHaveBeenCalledWith(true);
      expect(searchSource.setField).toHaveBeenCalledWith(
        'query',
        expect.objectContaining({ query: "source = logs | where env = 'staging'" })
      );

      emb.destroy();
      parent.destroy();
    });
  });
});
