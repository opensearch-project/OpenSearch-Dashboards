/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import rison from 'rison-node';
import {
  registerAutoVisualizationAction,
  AUTO_VISUALIZATION_TOOL_NAME,
} from './auto_visualization_action';

// --- Mocks for heavy / environment-coupled dependencies -------------------

const mockFindRulesByColumns = jest.fn();
const mockGetAxesMappingByRule = jest.fn();
const mockGetVisualization = jest.fn();

jest.mock('../../../components/visualizations/visualization_registry', () => ({
  visualizationRegistry: {
    findRulesByColumns: (...args: any[]) => mockFindRulesByColumns(...args),
    getAxesMappingByRule: (...args: any[]) => mockGetAxesMappingByRule(...args),
    getVisualization: (...args: any[]) => mockGetVisualization(...args),
  },
}));

const mockNormalizeResultRows = jest.fn();
jest.mock('../../../components/visualizations/utils/normalize_result_rows', () => ({
  normalizeResultRows: (...args: any[]) => mockNormalizeResultRows(...args),
}));

jest.mock('../../../components/visualizations/visualization_render', () => ({
  CommonVisualizationRender: () => <div data-test-subj="commonVisRender" />,
}));

jest.mock('../../../application/in_context_vis_editor/component/vis_editor_no_results', () => ({
  VisEditorNoResults: () => <div data-test-subj="visEditorNoResults" />,
}));

jest.mock('./utils', () => ({
  AUTO_VISUALIZATION_TOOL_NAME: 'auto_create_visualization',
  AutoVisMeta: {
    name: 'auto_create_visualization',
    description: 'desc',
    parameters: { type: 'object', properties: {}, required: [] },
  },
}));

const baseArgs = {
  query: 'source=flights | stats avg(price) by carrier',
  indexName: 'flights',
  columns: [
    { name: 'carrier', type: 'keyword' },
    { name: 'avg(price)', type: 'double' },
  ],
};

const createCore = () =>
  ({
    uiSettings: { get: jest.fn(() => 500) },
    http: { basePath: { prepend: (p: string) => `/base${p}` } },
    savedObjects: {
      client: { get: jest.fn().mockResolvedValue({ attributes: { title: 'My Dashboard' } }) },
    },
    notifications: { toasts: {} },
    application: { navigateToApp: jest.fn() },
  }) as unknown as any;

const createData = (bounds?: { min: any; max: any }, globalTime?: any) =>
  ({
    query: {
      timefilter: {
        timefilter: {
          getTime: jest.fn(() => globalTime),
          calculateBounds: jest.fn(() => bounds ?? { min: undefined, max: undefined }),
        },
      },
    },
    search: { searchSource: { create: jest.fn() } },
  }) as unknown as any;

const createContextProvider = (dashboardId?: string) =>
  ({
    getAssistantContextStore: () => ({
      getContextsByCategory: (category: string) =>
        category === 'page' && dashboardId ? [{ value: { appId: 'dashboards', dashboardId } }] : [],
    }),
  }) as unknown as any;

const registerAndGetAction = (core: any, data: any, contextProvider?: any): any => {
  let captured: any;
  const registerAction = jest.fn((action: any) => {
    captured = action;
  });
  registerAutoVisualizationAction(registerAction, core, data, contextProvider);
  return captured;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockNormalizeResultRows.mockReturnValue({
    transformedData: [{ carrier: 'A', 'avg(price)': 1 }],
    numericalColumns: [{ name: 'avg(price)' }],
    categoricalColumns: [{ name: 'carrier' }],
    dateColumns: [],
    unknownColumns: [],
  });
  mockFindRulesByColumns.mockReturnValue({
    exact: [{ visType: 'bar', rules: [{ priority: 10 }] }],
    all: [{ visType: 'bar', rules: [{ priority: 10 }] }],
  });
  mockGetAxesMappingByRule.mockReturnValue({ x: 'carrier', y: 'avg(price)' });
  mockGetVisualization.mockReturnValue({ ui: { style: { defaults: { color: 'red' } } } });
});

describe('registerAutoVisualizationAction', () => {
  it('does nothing when registerAction is undefined', () => {
    expect(() =>
      registerAutoVisualizationAction(undefined as any, createCore(), createData())
    ).not.toThrow();
  });

  it('registers an action with the auto visualization tool name and custom renderer', () => {
    const action = registerAndGetAction(createCore(), createData());
    expect(action.name).toBe(AUTO_VISUALIZATION_TOOL_NAME);
    expect(action.useCustomRenderer).toBe(true);
    expect(typeof action.handler).toBe('function');
    expect(typeof action.render).toBe('function');
  });
});

describe('handler', () => {
  it('resolves the highest-priority compatible chart and returns a success result', async () => {
    const action = registerAndGetAction(createCore(), createData());
    const result = await action.handler(baseArgs);

    expect(result.success).toBe(true);
    expect(result.chartType).toBe('bar');
    expect(result.resolvedAxesMapping).toEqual({ x: 'carrier', y: 'avg(price)' });
    expect(result.visConfig).toEqual({
      type: 'bar',
      axesMapping: { x: 'carrier', y: 'avg(price)' },
      splitField: undefined,
      styles: { color: 'red' },
    });
    expect(result.preparedQuery).toEqual({
      dataset: expect.objectContaining({ id: 'flights', title: 'flights' }),
      language: 'PPL',
      query: baseArgs.query,
    });
  });

  it('honors a compatible potentialChartType hint', async () => {
    mockFindRulesByColumns.mockReturnValue({
      exact: [
        { visType: 'bar', rules: [{ priority: 5 }] },
        { visType: 'pie', rules: [{ priority: 3 }] },
      ],
      all: [],
    });
    const action = registerAndGetAction(createCore(), createData());
    const result = await action.handler({ ...baseArgs, potentialChartType: 'pie' });
    expect(result.chartType).toBe('pie');
  });

  it('falls back to table when no compatible charts are found', async () => {
    mockFindRulesByColumns.mockReturnValue({ exact: [], all: [] });
    const action = registerAndGetAction(createCore(), createData());
    const result = await action.handler(baseArgs);
    expect(result.success).toBe(true);
    expect(result.chartType).toBe('table');
    expect(result.resolvedAxesMapping).toEqual({});
  });

  it('returns a failure result when the chart-type hint is incompatible', async () => {
    // Only 'bar' is compatible, but the user asked for 'pie'.
    const action = registerAndGetAction(createCore(), createData());
    const result = await action.handler({ ...baseArgs, potentialChartType: 'pie' });
    expect(result.success).toBe(false);
    expect(result.message).toContain('not compatible');
    expect(result.message).toContain('bar');
  });

  it('builds an editor path with encoded _v and _eq params', async () => {
    const action = registerAndGetAction(createCore(), createData());
    const result = await action.handler(baseArgs);

    expect(result.editorPath).toEqual(expect.stringContaining('#/?_v='));
    expect(result.editorPath).toEqual(expect.stringContaining('&_eq='));
    // No time range / dashboard by default.
    expect(result.editorPath).not.toContain('_g=');
    expect(result.editorPath).not.toContain('_c=');
  });

  it('resolves a relative time range to an absolute window', async () => {
    const min = { toISOString: () => '2026-01-01T00:00:00.000Z' };
    const max = { toISOString: () => '2026-01-08T00:00:00.000Z' };
    const data = createData({ min, max });
    const action = registerAndGetAction(createCore(), data);

    const result = await action.handler({
      ...baseArgs,
      timeFieldName: 'timestamp',
      timeRange: { from: 'now-7d', to: 'now' },
    });

    expect(result.resolvedTimeRange).toEqual({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-08T00:00:00.000Z',
    });
    // _g is encoded into the editor path.
    const gParam = `_g=${encodeURIComponent(
      rison.encode({
        time: { from: '2026-01-01T00:00:00.000Z', to: '2026-01-08T00:00:00.000Z' },
      })
    )}`;
    expect(result.editorPath).toContain(gParam);
  });

  it('prefers the from/to the agent asked for over the injected page time range', async () => {
    const min = { toISOString: () => '2026-02-01T00:00:00.000Z' };
    const max = { toISOString: () => '2026-02-02T00:00:00.000Z' };
    const data = createData({ min, max });
    const action = registerAndGetAction(createCore(), data);

    await action.handler({
      ...baseArgs,
      timeFieldName: 'timestamp',
      from: 'now-1d',
      to: 'now',
      // chat injects this from the page context on every tool call
      timeRange: { from: 'now-7d', to: 'now' },
    });

    expect(data.query.timefilter.timefilter.calculateBounds).toHaveBeenCalledWith({
      from: 'now-1d',
      to: 'now',
    });
    expect(data.query.timefilter.timefilter.getTime).not.toHaveBeenCalled();
  });

  it('falls back to the global time filter when neither from/to nor a page range is given', async () => {
    const min = { toISOString: () => '2026-03-01T00:00:00.000Z' };
    const max = { toISOString: () => '2026-03-02T00:00:00.000Z' };
    const data = createData({ min, max }, { from: 'now-15m', to: 'now' });
    const action = registerAndGetAction(createCore(), data);

    await action.handler({ ...baseArgs, timeFieldName: 'timestamp' });

    expect(data.query.timefilter.timefilter.getTime).toHaveBeenCalled();
    expect(data.query.timefilter.timefilter.calculateBounds).toHaveBeenCalledWith({
      from: 'now-15m',
      to: 'now',
    });
  });

  it('ignores a half-specified time range and uses the page range instead', async () => {
    const min = { toISOString: () => '2026-01-01T00:00:00.000Z' };
    const max = { toISOString: () => '2026-01-08T00:00:00.000Z' };
    const data = createData({ min, max });
    const action = registerAndGetAction(createCore(), data);

    const result = await action.handler({
      ...baseArgs,
      timeFieldName: 'timestamp',
      from: 'now-1d',
      timeRange: { from: 'now-7d', to: 'now' },
    });

    // No throw: the resolved range the payload reports is the page one, so the llm can
    // see its half-range was not used.
    expect(result.success).toBe(true);
    expect(data.query.timefilter.timefilter.calculateBounds).toHaveBeenCalledWith({
      from: 'now-7d',
      to: 'now',
    });
  });

  it('rejects a time range without timeFieldName, since it would be dropped', async () => {
    const min = { toISOString: () => '2026-01-01T00:00:00.000Z' };
    const max = { toISOString: () => '2026-01-08T00:00:00.000Z' };
    const action = registerAndGetAction(createCore(), createData({ min, max }));

    const result = await action.handler({ ...baseArgs, from: 'now-1d', to: 'now' });

    expect(result.success).toBe(false);
    expect(result.message).toContain('timeFieldName');
    // Both ways out are offered so an index with no time field cannot trap the llm.
    expect(result.message).toContain('omit from/to');
  });

  it('reports no resolved range when the agent time range is unparseable', async () => {
    // dateMath yields null min/max for anything it cannot parse, e.g. "last tuesday".
    const action = registerAndGetAction(createCore(), createData());

    const result = await action.handler({
      ...baseArgs,
      timeFieldName: 'timestamp',
      from: 'last tuesday',
      to: 'now',
    });

    // The chart still renders, but resolvedTimeRange stays undefined, so nothing claims
    // the requested range was applied.
    expect(result.success).toBe(true);
    expect(result.resolvedTimeRange).toBeUndefined();
    expect(result.editorPath).not.toContain('_g=');
  });

  it('keeps rendering without a time range when the page range is unparseable', async () => {
    const action = registerAndGetAction(createCore(), createData());

    const result = await action.handler({
      ...baseArgs,
      timeFieldName: 'timestamp',
      timeRange: { from: 'bogus', to: 'now' },
    });

    expect(result.success).toBe(true);
    expect(result.resolvedTimeRange).toBeUndefined();
    expect(result.editorPath).not.toContain('_g=');
  });

  it('adds dashboard container info (_c) when on a dashboard page', async () => {
    const core = createCore();
    const action = registerAndGetAction(core, createData(), createContextProvider('dash-1'));
    const result = await action.handler(baseArgs);

    expect(core.savedObjects.client.get).toHaveBeenCalledWith('dashboard', 'dash-1');
    const cParam = `_c=${encodeURIComponent(
      rison.encode({
        originatingApp: 'dashboards',
        containerInfo: { containerId: 'dash-1', containerName: 'My Dashboard' },
      })
    )}`;
    expect(result.editorPath).toContain(cParam);
  });

  it('omits _c when not on a dashboard page', async () => {
    const action = registerAndGetAction(createCore(), createData(), createContextProvider());
    const result = await action.handler(baseArgs);
    expect(result.editorPath).not.toContain('_c=');
  });

  it('still succeeds when the dashboard name lookup fails', async () => {
    const core = createCore();
    core.savedObjects.client.get = jest.fn().mockRejectedValue(new Error('not found'));
    const action = registerAndGetAction(core, createData(), createContextProvider('dash-1'));
    const result = await action.handler(baseArgs);

    // containerId present, containerName omitted.
    const cParam = `_c=${encodeURIComponent(
      rison.encode({
        originatingApp: 'dashboards',
        containerInfo: { containerId: 'dash-1' },
      })
    )}`;
    expect(result.editorPath).toContain(cParam);
  });
});

describe('render', () => {
  const renderResult = (core: any, data: any, props: any) => {
    const action = registerAndGetAction(core, data, undefined);
    return render(action.render(props));
  };

  it('renders nothing while pending', () => {
    const { container } = renderResult(createCore(), createData(), {
      status: 'executing',
      args: baseArgs,
      result: undefined,
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the parameters accordion and open-in-editor button on success', () => {
    // Chart preview kicks off a fetch; make searchSource resolve to empty rows.
    const data = createData();
    data.search.searchSource.create = jest.fn().mockResolvedValue({
      setFields: jest.fn(),
      fetch: jest.fn().mockResolvedValue({ hits: { hits: [] } }),
      getDataFrame: jest.fn(() => ({ schema: [] })),
    });
    data.query.queryString = {
      getLanguageService: () => ({ getLanguage: () => ({}) }),
    };

    renderResult(createCore(), data, {
      status: 'complete',
      args: baseArgs,
      result: {
        success: true,
        preparedQuery: { dataset: { title: 'flights' }, language: 'PPL', query: baseArgs.query },
        visConfig: { type: 'bar', axesMapping: {}, styles: {} },
        editorPath: '#/?_v=x',
      },
    });

    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Open in Editor')).toBeInTheDocument();
  });

  it('shows the resolved window in the parameters, not the raw from/to', () => {
    const data = createData();
    data.search.searchSource.create = jest.fn().mockResolvedValue({
      setFields: jest.fn(),
      fetch: jest.fn().mockResolvedValue({ hits: { hits: [] } }),
      getDataFrame: jest.fn(() => ({ schema: [] })),
    });
    data.query.queryString = {
      getLanguageService: () => ({ getLanguage: () => ({}) }),
    };

    renderResult(createCore(), data, {
      status: 'complete',
      args: { ...baseArgs, timeFieldName: 'timestamp', from: 'now-7d', to: 'now' },
      result: {
        success: true,
        preparedQuery: { dataset: { title: 'flights' }, language: 'PPL', query: baseArgs.query },
        visConfig: { type: 'bar', axesMapping: {}, styles: {} },
        editorPath: '#/?_v=x',
        resolvedTimeRange: {
          from: '2026-01-01T00:00:00.000Z',
          to: '2026-01-08T00:00:00.000Z',
        },
      },
    });

    const paramsJson = screen.getByText(/"timeRange"/).textContent ?? '';
    expect(paramsJson).toContain('2026-01-01T00:00:00.000Z');
    expect(paramsJson).not.toContain('now-7d');
  });
});

describe('handler with transformations', () => {
  const rawSchema = [
    { name: 'carrier', type: 'keyword' },
    { name: 'avg(price)', type: 'double' },
  ];

  const createSearchableData = (rows: any[], schema = rawSchema) => {
    const data = createData();
    data.dataViews = { get: jest.fn().mockResolvedValue({}) };
    data.query.queryString = {
      getLanguageService: () => ({ getLanguage: () => ({}) }),
      getDatasetService: () => ({ cacheDataset: jest.fn() }),
    };
    data.search.searchSource.create = jest.fn().mockResolvedValue({
      setFields: jest.fn(),
      fetch: jest.fn().mockResolvedValue({ hits: { hits: rows } }),
      getDataFrame: jest.fn(() => ({ schema })),
    });
    return data;
  };

  const groupByCarrier = [
    {
      definitionId: 'group_by',
      config: {
        groupByField: 'carrier',
        aggregations: [{ field: 'avg(price)', method: 'mean' }],
      },
    },
  ] as any;

  it('does not run an extra query when there are no transformations', async () => {
    const data = createSearchableData([]);
    const action = registerAndGetAction(createCore(), data);

    const result = await action.handler(baseArgs);

    expect(result.success).toBe(true);
    // The columns the llm passed already describe the rendered data, so no query is needed.
    expect(data.search.searchSource.create).not.toHaveBeenCalled();
    expect(mockNormalizeResultRows).toHaveBeenCalledWith([], rawSchema);
  });

  it('resolves the axes against the post-transformation columns', async () => {
    const data = createSearchableData([
      { _source: { carrier: 'AA', 'avg(price)': 100 } },
      { _source: { carrier: 'AA', 'avg(price)': 200 } },
    ]);
    const action = registerAndGetAction(createCore(), data);

    const result = await action.handler({ ...baseArgs, transformations: groupByCarrier });

    expect(result.success).toBe(true);
    expect(data.search.searchSource.create).toHaveBeenCalled();
    // group_by replaces `avg(price)` with `mean_avg(price)`; the chart must be planned
    // against that, not against the raw column list.
    expect(mockNormalizeResultRows).toHaveBeenCalledWith(
      [],
      [
        { name: 'carrier', type: 'keyword' },
        { name: 'mean_avg(price)', type: 'integer' },
      ]
    );
  });

  it('fails when the pipeline drops every row, instead of planning from a degraded schema', async () => {
    // deriveSchemaFromRows is a no-op on an empty row set, so finalSchema would silently fall
    // back to the pre-transformation columns.
    const data = createSearchableData([]);
    const action = registerAndGetAction(createCore(), data);

    const result = await action.handler({ ...baseArgs, transformations: groupByCarrier });

    expect(result.success).toBe(false);
    expect(result.message).toContain('dropped every row');
    expect(result.message).toContain('group_by');
  });

  it('reports the query failure instead of a chart when the extra query throws', async () => {
    const data = createSearchableData([]);
    data.search.searchSource.create = jest.fn().mockRejectedValue(new Error('index_not_found'));
    const action = registerAndGetAction(createCore(), data);

    const result = await action.handler({ ...baseArgs, transformations: groupByCarrier });

    expect(result.success).toBe(false);
    expect(result.message).toContain('index_not_found');
  });
});
