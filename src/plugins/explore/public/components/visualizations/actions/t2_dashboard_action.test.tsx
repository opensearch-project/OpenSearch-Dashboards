/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import rison from 'rison-node';
import { registerT2DashboardAction } from './t2_dashboard_action';

const mockBuildVisConfig = jest.fn();
const mockGetAbsoluteTimeRange = jest.fn();
const mockCheckTimeRangeArgsUsable = jest.fn();
let mockChartPreviewError: string | undefined;
// Per-title overrides so a single render can mix healthy and failing previews.
let mockChartPreviewErrorByTitle: Record<string, string> = {};
let mockChartPreviewEmptyTitles: string[] = [];

jest.mock('./auto_visualization_action', () => ({
  buildVisConfig: (...args: any[]) => mockBuildVisConfig(...args),
  getAbsoluteTimeRange: (...args: any[]) => mockGetAbsoluteTimeRange(...args),
  checkTimeRangeArgsUsable: (...args: any[]) => mockCheckTimeRangeArgsUsable(...args),
  ChartPreview: (props: any) => {
    const { useEffect } = jest.requireActual('react') as typeof import('react');
    const { onError, onEmpty, visConfig } = props;
    // The card does not pass a title down, so key the fixtures off the chart config.
    const title = visConfig?.title;

    // Empty deps on purpose: the real fetch effect also runs once with `[]`, so the callbacks
    // it invokes are the ones captured on the first render. Anything that survives here
    // survives that frozen closure too.
    useEffect(() => {
      const error = (title && mockChartPreviewErrorByTitle[title]) || mockChartPreviewError;
      if (error) {
        onError?.(error);
        return;
      }
      if (title && mockChartPreviewEmptyTitles.includes(title)) {
        onEmpty?.();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div data-test-subj="chartPreview" />;
  },
}));

const mockGetDashboardVersion = jest.fn();
jest.mock('../../../application/legacy/discover/opensearch_dashboards_services', () => ({
  getDashboardVersion: () => mockGetDashboardVersion(),
}));

jest.mock('./utils', () => ({
  TextToDashboardMeta: {
    name: 'text_to_dashboard',
    description: 'desc',
    parameters: { type: 'object', properties: {}, required: ['visualizations'] },
  },
}));

const visSpec = (title: string, indexName = 'flights') => ({
  title,
  indexName,
  query: `source=${indexName} | stats count() by carrier`,
  columns: [
    { name: 'carrier', type: 'keyword' },
    { name: 'count()', type: 'integer' },
  ],
});

const preparedQueryFor = (indexName: string) => ({
  dataset: { id: indexName, title: indexName, type: 'INDEX_PATTERN' },
  language: 'PPL',
  query: `source=${indexName}`,
});

const generatedVis = (title: string, indexName = 'flights') => ({
  title,
  // The card passes only visConfig/query down, so carry the title inside visConfig — that is
  // how the ChartPreview mock tells one card apart from another.
  visConfig: { type: 'bar', axesMapping: { x: 'carrier' }, styles: { color: 'red' }, title },
  preparedQuery: preparedQueryFor(indexName),
  resolvedTimeRange: undefined,
  transformations: undefined,
});

const createCore = () =>
  ({
    uiSettings: { get: jest.fn() },
    http: {},
    savedObjects: {},
    notifications: {
      toasts: { addDanger: jest.fn(), addWarning: jest.fn(), addSuccess: jest.fn() },
    },
    application: { navigateToApp: jest.fn() },
  }) as unknown as any;

const createData = () =>
  ({
    query: {
      timefilter: { timefilter: { calculateBounds: jest.fn() } },
      queryString: {
        getDatasetService: () => ({ cacheDataset: jest.fn().mockResolvedValue(undefined) }),
      },
    },
    dataViews: { get: jest.fn().mockResolvedValue({ id: 'dv-1' }) },
  }) as unknown as any;

const createSavedExploreLoader = (
  saveImpl: (savedExplore: any) => Promise<string> = async () => 'saved-id'
) => {
  const saved: any[] = [];
  const loader = {
    get: jest.fn(async () => {
      const savedExplore: any = {
        save: jest.fn(async (opts: any) => {
          savedExplore.saveOpts = opts;
          return saveImpl(savedExplore);
        }),
      };
      saved.push(savedExplore);
      return savedExplore;
    }),
  };
  return { loader: loader as unknown as any, saved };
};

const registerAndGetAction = (core: any, data: any, savedExploreLoader: any): any => {
  let captured: any;
  const registerAction = jest.fn((action: any) => {
    captured = action;
  });
  registerT2DashboardAction(registerAction, core, data, savedExploreLoader);
  return captured;
};

const decodeAppState = (core: any): any => {
  const [, opts] = core.application.navigateToApp.mock.calls[0];
  const aParam = /_a=([^&]+)/.exec(opts.path)![1];
  return rison.decode(decodeURIComponent(aParam));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDashboardVersion.mockReturnValue({ version: '3.0.0' });
  mockGetAbsoluteTimeRange.mockReturnValue(undefined);
  mockChartPreviewError = undefined;
  mockChartPreviewErrorByTitle = {};
  mockChartPreviewEmptyTitles = [];
  // clearAllMocks wipes recorded calls but keeps implementations, so reset the
  // validator to a no-op or a test that makes it throw would leak into later ones.
  mockCheckTimeRangeArgsUsable.mockImplementation(() => undefined);
  mockBuildVisConfig.mockImplementation((args: any) => ({
    success: true,
    visConfig: {
      type: 'bar',
      axesMapping: { x: 'carrier', y: 'count()' },
      splitField: args.splitField,
      styles: { color: 'red' },
    },
    query: preparedQueryFor(args.indexName),
    resolvedChartType: 'bar',
    resolvedAxesMapping: { x: 'carrier', y: 'count()' },
  }));
});

describe('handler', () => {
  const runHandler = (args: any, data = createData()) => {
    const action = registerAndGetAction(createCore(), data, createSavedExploreLoader().loader);
    return action.handler(args);
  };

  it('builds one GeneratedVis per spec', async () => {
    const result = await runHandler({
      visualizations: [visSpec('Chart A'), visSpec('Chart B', 'logs')],
    });

    expect(result.success).toBe(true);
    expect(result.visualizations).toHaveLength(2);
    expect(result.visualizations[0]).toEqual(
      expect.objectContaining({
        title: 'Chart A',
        visConfig: expect.objectContaining({ type: 'bar' }),
        preparedQuery: preparedQueryFor('flights'),
      })
    );
    expect(result.visualizations[1].preparedQuery).toEqual(preparedQueryFor('logs'));
  });

  it('resolves the absolute time range once and shares it across specs', async () => {
    const absolute = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-08T00:00:00.000Z' };
    mockGetAbsoluteTimeRange.mockReturnValue(absolute);

    const result = await runHandler({
      visualizations: [visSpec('Chart A'), visSpec('Chart B'), visSpec('Chart C')],
      timeRange: { from: 'now-7d', to: 'now' },
    });

    expect(mockGetAbsoluteTimeRange).toHaveBeenCalledTimes(1);
    expect(result.resolvedTimeRange).toEqual(absolute);
    for (const vis of result.visualizations) {
      expect(vis.resolvedTimeRange).toEqual(absolute);
    }
  });

  it('omits resolvedTimeRange when no time range was provided', async () => {
    const result = await runHandler({ visualizations: [visSpec('Chart A')] });
    expect(result.resolvedTimeRange).toBeUndefined();
    expect(result.visualizations[0].resolvedTimeRange).toBeUndefined();
  });

  it('forwards transformations onto the generated vis', async () => {
    const transformations = [{ definitionId: 'limit', config: { limit: 10 }, hide: false }] as any;
    const result = await runHandler({
      visualizations: [{ ...visSpec('Chart A'), transformations }],
    });
    expect(result.visualizations[0].transformations).toBe(transformations);
    expect(mockBuildVisConfig.mock.calls[0][0]).toEqual(
      expect.objectContaining({ transformations })
    );
  });

  it('checks the dashboard-level time range against every spec timeFieldName', async () => {
    await runHandler({
      visualizations: [
        { ...visSpec('With Time Field'), timeFieldName: 'timestamp' },
        visSpec('No Time Field'),
      ],
      from: 'now-7d',
      to: 'now',
    });

    // The range lives at the top level, so each spec is checked against the shared value.
    expect(mockCheckTimeRangeArgsUsable).toHaveBeenCalledTimes(2);
    expect(mockCheckTimeRangeArgsUsable).toHaveBeenNthCalledWith(1, {
      from: 'now-7d',
      to: 'now',
      timeFieldName: 'timestamp',
    });
    expect(mockCheckTimeRangeArgsUsable).toHaveBeenNthCalledWith(2, {
      from: 'now-7d',
      to: 'now',
      timeFieldName: undefined,
    });
  });

  it('falls back to the top-level timeFieldName for a spec that omits its own', async () => {
    await runHandler({
      visualizations: [visSpec('Shares Time Field'), visSpec('Also Shares')],
      from: 'now-7d',
      to: 'now',
      timeFieldName: 'timestamp',
    });

    // Neither spec carries its own field, so both resolve to the shared top-level one.
    expect(mockCheckTimeRangeArgsUsable).toHaveBeenNthCalledWith(1, {
      from: 'now-7d',
      to: 'now',
      timeFieldName: 'timestamp',
    });
    expect(mockBuildVisConfig.mock.calls[0][0]).toEqual(
      expect.objectContaining({ timeFieldName: 'timestamp' })
    );
  });

  it('lets a per-visualization timeFieldName override the top-level one', async () => {
    await runHandler({
      visualizations: [
        { ...visSpec('Own Field', 'logs'), timeFieldName: 'event_time' },
        visSpec('Shared Field'),
      ],
      from: 'now-7d',
      to: 'now',
      timeFieldName: 'timestamp',
    });

    // Spec 1 overrides with its own field; spec 2 falls back to the shared one.
    expect(mockCheckTimeRangeArgsUsable).toHaveBeenNthCalledWith(1, {
      from: 'now-7d',
      to: 'now',
      timeFieldName: 'event_time',
    });
    expect(mockCheckTimeRangeArgsUsable).toHaveBeenNthCalledWith(2, {
      from: 'now-7d',
      to: 'now',
      timeFieldName: 'timestamp',
    });
    expect(mockBuildVisConfig.mock.calls[0][0]).toEqual(
      expect.objectContaining({ timeFieldName: 'event_time' })
    );
    expect(mockBuildVisConfig.mock.calls[1][0]).toEqual(
      expect.objectContaining({ timeFieldName: 'timestamp' })
    );
  });

  it('degrades only the spec whose time field is missing', async () => {
    mockCheckTimeRangeArgsUsable.mockImplementation(({ timeFieldName }: any) => {
      if (!timeFieldName) throw new Error('cannot be applied without timeFieldName');
    });

    const result = await runHandler({
      visualizations: [
        { ...visSpec('Has Time Field'), timeFieldName: 'timestamp' },
        visSpec('Missing Time Field'),
      ],
      from: 'now-7d',
      to: 'now',
    });

    expect(result.visualizations[0].error).toBeUndefined();
    expect(result.visualizations[1].error).toContain('without timeFieldName');
    expect(result.visualizations[1].visConfig).toBeUndefined();
  });

  it('isolates a failing spec as an error entry and still resolves the others', async () => {
    mockBuildVisConfig.mockImplementation((args: any) => {
      if (args.title === 'Bad Chart') {
        throw new Error('Chart type "pie" is not compatible with the query result columns.');
      }
      return {
        success: true,
        visConfig: { type: 'bar', axesMapping: {}, styles: {} },
        query: preparedQueryFor(args.indexName),
        resolvedChartType: 'bar',
        resolvedAxesMapping: {},
      };
    });

    const result = await runHandler({
      visualizations: [visSpec('Good Chart'), visSpec('Bad Chart'), visSpec('Another Good')],
    });

    // One entry per spec, in input order.
    expect(result.visualizations.map((v: any) => v.title)).toEqual([
      'Good Chart',
      'Bad Chart',
      'Another Good',
    ]);
    expect(result.visualizations[1].error).toContain('not compatible');
    expect(result.visualizations[1].visConfig).toBeUndefined();
    expect(result.visualizations[0].error).toBeUndefined();
    expect(result.visualizations[2].error).toBeUndefined();
  });
});

describe('render', () => {
  const renderAction = (props: any, overrides: any = {}) => {
    const core = overrides.core ?? createCore();
    const data = overrides.data ?? createData();
    const { loader, saved } = overrides.loaderPair ?? createSavedExploreLoader();
    const action = registerAndGetAction(core, data, loader);
    return { core, data, loader, saved, ...render(action.render(props)) };
  };

  const completeWith = (visualizations: any[], resolvedTimeRange?: any) => ({
    status: 'complete',
    args: { visualizations: [] },
    result: { success: true, visualizations, resolvedTimeRange },
  });

  it('renders nothing while the tool is still executing', () => {
    const { container } = renderAction({
      status: 'executing',
      args: { visualizations: [] },
      result: undefined,
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the result is unsuccessful', () => {
    const { container } = renderAction({
      status: 'complete',
      args: { visualizations: [] },
      result: { success: false },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('hides the save button when every vis failed', () => {
    renderAction(
      completeWith([
        { title: 'Bad A', error: 'boom' },
        { title: 'Bad B', error: 'boom' },
      ])
    );
    expect(screen.queryByText('Save to Dashboard')).not.toBeInTheDocument();
  });

  it('disables the save button once every checkbox is cleared', async () => {
    renderAction(completeWith([generatedVis('Chart A')]));

    const saveButton = screen.getByText('Save to Dashboard').closest('button')!;
    expect(saveButton).toBeEnabled();

    await userEvent.click(screen.getByLabelText('Include "Chart A" in the dashboard'));
    expect(saveButton).toBeDisabled();
  });

  it('keeps the save button visible when only chart preview rendering fails', async () => {
    mockChartPreviewError = 'preview failed';

    renderAction(completeWith([generatedVis('Chart A')]));

    await waitFor(() => {
      expect(screen.getByText('Save to Dashboard')).toBeInTheDocument();
    });
  });

  it('unchecks and disables only the card whose preview failed at runtime', async () => {
    mockChartPreviewErrorByTitle = { 'Chart A': 'boom' };

    renderAction(completeWith([generatedVis('Chart A'), generatedVis('Chart B')]));

    const boxA = screen.getByLabelText('Include "Chart A" in the dashboard');
    const boxB = screen.getByLabelText('Include "Chart B" in the dashboard');

    // Disabling a still-ticked box would read as "broken but will be saved".
    await waitFor(() => expect(boxA).toBeDisabled());
    expect(boxA).not.toBeChecked();

    // The healthy sibling keeps its default selection.
    expect(boxB).toBeEnabled();
    expect(boxB).toBeChecked();
  });

  it('disables the save button when the only vis fails to render', async () => {
    mockChartPreviewError = 'preview failed';

    renderAction(completeWith([generatedVis('Chart A')]));

    const saveButton = screen.getByText('Save to Dashboard').closest('button')!;
    await waitFor(() => expect(saveButton).toBeDisabled());
  });
});

describe('save to dashboard', () => {
  const renderAndSave = async (visualizations: any[], overrides: any = {}) => {
    const core = overrides.core ?? createCore();
    const data = overrides.data ?? createData();
    const { loader, saved } = overrides.loaderPair ?? createSavedExploreLoader();
    const action = registerAndGetAction(core, data, loader);
    render(
      action.render({
        status: 'complete',
        args: { visualizations: [] },
        result: {
          success: true,
          visualizations,
          resolvedTimeRange: overrides.resolvedTimeRange,
        },
      })
    );
    await userEvent.click(screen.getByText('Save to Dashboard'));
    return { core, data, loader, saved };
  };

  it('saves each selected vis as a new object and navigates to a new dashboard', async () => {
    const { core, saved } = await renderAndSave([generatedVis('Chart A')]);

    await waitFor(() => expect(core.application.navigateToApp).toHaveBeenCalled());

    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe('Chart A');
    // copyOnSave forces a fresh object; the duplicate-title check must be skipped or the
    // modal would deadlock across concurrent saves.
    expect(saved[0].copyOnSave).toBe(true);
    expect(saved[0].saveOpts).toEqual({
      confirmOverwrite: false,
      isTitleDuplicateConfirmed: true,
    });

    const [appId, opts] = core.application.navigateToApp.mock.calls[0];
    expect(appId).toBe('dashboards');
    expect(opts.path).toContain('#/create?_a=');
  });

  it('serializes the vis config into the saved explore', async () => {
    const transformations = [{ definitionId: 'limit', config: { limit: 5 }, hide: false }] as any;
    const vis = { ...generatedVis('Chart A'), transformations };
    const { saved } = await renderAndSave([vis]);

    await waitFor(() => expect(saved[0].visualization).toBeDefined());
    expect(JSON.parse(saved[0].visualization)).toEqual({
      title: '',
      chartType: 'bar',
      params: { color: 'red' },
      axesMapping: { x: 'carrier' },
      dataTransformations: transformations,
    });
    expect(saved[0].searchSourceFields).toEqual({
      index: { id: 'dv-1' },
      query: vis.preparedQuery,
    });
  });

  it('lays panels out in input order regardless of save completion order', async () => {
    // Resolve in reverse order to prove panel order follows the input, not the network.
    const delays: Record<string, number> = { 'Chart A': 30, 'Chart B': 20, 'Chart C': 0 };
    const loaderPair = createSavedExploreLoader(
      (savedExplore) =>
        new Promise((resolve) =>
          setTimeout(() => resolve(`id-${savedExplore.title}`), delays[savedExplore.title])
        )
    );

    const { core } = await renderAndSave(
      [generatedVis('Chart A'), generatedVis('Chart B'), generatedVis('Chart C')],
      { loaderPair }
    );

    await waitFor(() => expect(core.application.navigateToApp).toHaveBeenCalled());

    const appState = decodeAppState(core);
    expect(appState.panels.map((p: any) => p.id)).toEqual([
      'id-Chart A',
      'id-Chart B',
      'id-Chart C',
    ]);
    expect(appState.viewMode).toBe('edit');
    expect(appState.panels[0]).toEqual(
      expect.objectContaining({ type: 'explore', panelIndex: '1', version: '3.0.0' })
    );
  });

  it('only saves the visualizations whose checkbox is still ticked', async () => {
    const core = createCore();
    const { loader, saved } = createSavedExploreLoader();
    const action = registerAndGetAction(core, createData(), loader);
    render(
      action.render({
        status: 'complete',
        args: { visualizations: [] },
        result: {
          success: true,
          visualizations: [generatedVis('Chart A'), generatedVis('Chart B')],
        },
      })
    );

    await userEvent.click(screen.getByLabelText('Include "Chart A" in the dashboard'));
    await userEvent.click(screen.getByText('Save to Dashboard'));

    await waitFor(() => expect(core.application.navigateToApp).toHaveBeenCalled());
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe('Chart B');
  });

  it('never saves a vis whose preview failed at runtime', async () => {
    mockChartPreviewErrorByTitle = { 'Chart B': 'boom' };

    const { core, saved } = await renderAndSave([
      generatedVis('Chart A'),
      generatedVis('Chart B'),
      generatedVis('Chart C'),
    ]);

    await waitFor(() => expect(core.application.navigateToApp).toHaveBeenCalled());

    // Chart B built fine but rendered blank, so it must not reach the dashboard.
    expect(saved.map((s: any) => s.title)).toEqual(['Chart A', 'Chart C']);
    const appState = decodeAppState(core);
    expect(appState.panels).toHaveLength(2);
  });

  it('encodes the resolved absolute time range into _g', async () => {
    const resolvedTimeRange = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-08T00:00:00.000Z' };
    const { core } = await renderAndSave([generatedVis('Chart A')], { resolvedTimeRange });

    await waitFor(() => expect(core.application.navigateToApp).toHaveBeenCalled());
    const [, opts] = core.application.navigateToApp.mock.calls[0];
    expect(opts.path).toContain(
      `&_g=${encodeURIComponent(rison.encode({ time: resolvedTimeRange }))}`
    );
  });

  it('warns but still navigates when only some saves fail', async () => {
    const loaderPair = createSavedExploreLoader(async (savedExplore) => {
      if (savedExplore.title === 'Chart B') throw new Error('index missing');
      return `id-${savedExplore.title}`;
    });

    const { core } = await renderAndSave(
      [generatedVis('Chart A'), generatedVis('Chart B'), generatedVis('Chart C')],
      { loaderPair }
    );

    await waitFor(() => expect(core.application.navigateToApp).toHaveBeenCalled());

    expect(core.notifications.toasts.addWarning).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Some visualizations could not be saved' })
    );
    expect(core.notifications.toasts.addDanger).not.toHaveBeenCalled();

    // The partial-failure callout must not claim total failure.
    expect(screen.getByText('Some visualizations could not be saved')).toBeInTheDocument();
    expect(screen.queryByText('Unable to save visualizations')).not.toBeInTheDocument();
    expect(screen.getByText('Failed to save "Chart B": index missing')).toBeInTheDocument();

    // The failed one is skipped; the survivors keep their relative order.
    const appState = decodeAppState(core);
    expect(appState.panels.map((p: any) => p.id)).toEqual(['id-Chart A', 'id-Chart C']);
  });

  it('reports a danger callout and does not navigate when every save fails', async () => {
    const loaderPair = createSavedExploreLoader(async () => {
      throw new Error('network down');
    });

    const { core } = await renderAndSave([generatedVis('Chart A'), generatedVis('Chart B')], {
      loaderPair,
    });

    await waitFor(() =>
      expect(core.notifications.toasts.addDanger).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Could not save visualizations' })
      )
    );
    expect(core.application.navigateToApp).not.toHaveBeenCalled();
    expect(screen.getByText('Unable to save visualizations')).toBeInTheDocument();
    expect(screen.getByText('Failed to save "Chart A": network down')).toBeInTheDocument();
    expect(screen.getByText('Failed to save "Chart B": network down')).toBeInTheDocument();
  });
});
