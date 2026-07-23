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

const createData = (bounds?: { min: any; max: any }) =>
  ({
    query: {
      timefilter: {
        timefilter: {
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
});
