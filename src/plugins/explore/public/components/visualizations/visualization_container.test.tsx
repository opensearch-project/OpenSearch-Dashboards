/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { VisualizationContainer } from './visualization_container';
import * as VB from './visualization_builder';
import * as TabResultsHooks from '../../application/utils/hooks/use_tab_results';
import { BehaviorSubject } from 'rxjs';
import { VisFieldType } from './types';
import { VisData } from './visualization_builder.types';

const mockHttpPost = jest.fn();
const mockGetDefaultDataSourceId = jest.fn();
const mockApplications$ = new BehaviorSubject<ReadonlyMap<string, unknown>>(
  new Map([['anomaly-detection-dashboards', { id: 'anomaly-detection-dashboards' }]])
);
const mockServices = {
  core: {
    application: {
      applications$: mockApplications$,
    },
    workspaces: {
      currentWorkspaceId$: {
        getValue: jest.fn(() => undefined),
      },
    },
  },
  http: {
    post: mockHttpPost,
  },
  uiSettings: {},
  dataSourceEnabled: false,
  hideLocalCluster: false,
  dataSourceManagement: {
    getDefaultDataSourceId: mockGetDefaultDataSourceId,
  },
};

// Mock react-redux before importing any components
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: jest.fn(() => ({
    results: {
      hits: {
        hits: [{ _source: { field1: 'value1' } }, { _source: { field1: 'value2' } }],
      },
      fieldSchema: [
        { name: 'field1', type: 'string' },
        { name: 'count', type: 'number' },
      ],
    },
  })),
}));

jest.mock('../query_panel/utils/use_search_context', () => ({
  useSearchContext: jest.fn(() => ({
    timeRange: { from: 'now-15m', to: 'now' },
    query: 'source=test',
  })),
}));

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: () => ({
    services: mockServices,
  }),
}));

// Mock the visualization builder
const mockVisualizationBuilder = {
  data$: new BehaviorSubject<VisData | undefined>({
    transformedData: [
      { field1: 'value1', count: 10 },
      { field1: 'value2', count: 20 },
    ],
    numericalColumns: [
      {
        id: 1,
        name: 'count',
        schema: VisFieldType.Numerical,
        column: 'count',
        validValuesCount: 2,
        uniqueValuesCount: 2,
      },
    ],
    categoricalColumns: [
      {
        id: 2,
        name: 'field1',
        schema: VisFieldType.Categorical,
        column: 'field1',
        validValuesCount: 2,
        uniqueValuesCount: 2,
      },
    ],
    dateColumns: [],
  }),
  visConfig$: new BehaviorSubject({
    type: 'bar',
    styles: {
      legendPosition: 'right',
      thresholds: [],
      pageSize: 10,
    },
    axesMapping: {},
  }),
  renderVisualization: jest.fn(),
  handleData: jest.fn(),
  init: jest.fn(),
  reset: jest.fn(),
};

const defaultVisData: VisData = {
  transformedData: [
    { field1: 'value1', count: 10 },
    { field1: 'value2', count: 20 },
  ],
  numericalColumns: [
    {
      id: 1,
      name: 'count',
      schema: VisFieldType.Numerical,
      column: 'count',
      validValuesCount: 2,
      uniqueValuesCount: 2,
    },
  ],
  categoricalColumns: [
    {
      id: 2,
      name: 'field1',
      schema: VisFieldType.Categorical,
      column: 'field1',
      validValuesCount: 2,
      uniqueValuesCount: 2,
    },
  ],
  dateColumns: [],
};

const setPromqlVisualizationData = (rows: Array<Record<string, unknown>>) => {
  mockVisualizationBuilder.data$.next({
    transformedData: rows,
    numericalColumns: [
      {
        id: 1,
        name: 'Value',
        schema: VisFieldType.Numerical,
        column: 'Value',
        validValuesCount: rows.length,
        uniqueValuesCount: rows.length,
      },
    ],
    categoricalColumns: [
      {
        id: 2,
        name: 'Series',
        schema: VisFieldType.Categorical,
        column: 'Series',
        validValuesCount: rows.length,
        uniqueValuesCount: new Set(rows.map((row) => row.Series)).size,
      },
    ],
    dateColumns: [
      {
        id: 3,
        name: 'Time',
        schema: VisFieldType.Date,
        column: 'Time',
        validValuesCount: rows.length,
        uniqueValuesCount: rows.length,
      },
    ],
  });

  mockVisualizationBuilder.visConfig$.next({
    type: 'line',
    styles: {
      legendPosition: 'right',
      thresholds: [],
      pageSize: 10,
    },
    axesMapping: {
      x: 'Time',
      y: 'Value',
      color: 'Series',
    },
  });
};

describe('VisualizationContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplications$.next(
      new Map([['anomaly-detection-dashboards', { id: 'anomaly-detection-dashboards' }]])
    );
    mockVisualizationBuilder.data$.next(defaultVisData);
    mockVisualizationBuilder.visConfig$.next({
      type: 'bar',
      styles: {
        legendPosition: 'right',
        thresholds: [],
        pageSize: 10,
      },
      axesMapping: {},
    });
    mockHttpPost.mockResolvedValue({
      ok: true,
      response: {},
    });
    mockGetDefaultDataSourceId.mockReset();
    mockGetDefaultDataSourceId.mockResolvedValue('');
    mockServices.dataSourceEnabled = false;
    mockServices.hideLocalCluster = false;
    jest.spyOn(VB, 'getVisualizationBuilder').mockReturnValue(mockVisualizationBuilder as any);
    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        query: {
          language: 'PPL',
          query: 'source = test',
          dataset: undefined,
        },
      })
    );
  });

  it('renders the visualization container', () => {
    render(<VisualizationContainer />);

    expect(screen.getByTestId('exploreVisualizationLoader')).toBeInTheDocument();
    expect(mockVisualizationBuilder.init).toHaveBeenCalled();
    expect(mockVisualizationBuilder.handleData).toHaveBeenCalled();
    expect(mockVisualizationBuilder.renderVisualization).toHaveBeenCalled();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<VisualizationContainer />);

    unmount();

    expect(mockVisualizationBuilder.reset).toHaveBeenCalled();
  });

  it('handles empty results', () => {
    // Override the mock for this test
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    jest.spyOn(TabResultsHooks, 'useTabResults').mockReturnValueOnce({
      results: null,
    });

    render(<VisualizationContainer />);

    // Should still render without crashing
    expect(screen.getByTestId('exploreVisualizationLoader')).toBeInTheDocument();
  });

  it('still requests preview when there are fewer than 400 datapoints for PROMQL preview', async () => {
    const promqlHits = Array.from({ length: 399 }, (_, index) => ({
      _source: {
        Time: 1700000000000 + index * 60000,
        Series: '{instance="localhost:9090"}',
        Value: index,
      },
    }));
    setPromqlVisualizationData(promqlHits.map((hit) => hit._source));

    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        query: {
          language: 'PROMQL',
          query: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
          dataset: { id: 'local' },
        },
      })
    );

    jest.spyOn(TabResultsHooks, 'useTabResults').mockReturnValueOnce({
      results: {
        hits: { hits: promqlHits },
        fieldSchema: [
          { name: 'Time', type: 'time' },
          { name: 'Series', type: 'string' },
          { name: 'Value', type: 'number' },
        ],
      } as any,
    });

    render(<VisualizationContainer />);

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalledWith(
        '/api/explore/anomaly_preview',
        expect.objectContaining({
          body: expect.any(String),
        })
      );
      expect(mockHttpPost).toHaveBeenCalledWith(
        '/api/explore/forecast_preview',
        expect.objectContaining({
          body: expect.any(String),
        })
      );
    });

    const anomalyPreviewCall = mockHttpPost.mock.calls.find(
      ([path]) => path === '/api/explore/anomaly_preview'
    );
    const forecastPreviewCall = mockHttpPost.mock.calls.find(
      ([path]) => path === '/api/explore/forecast_preview'
    );

    expect(JSON.parse(anomalyPreviewCall?.[1]?.body ?? '{}')).toMatchObject({
      promqlQuery: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
      dataConnectionId: 'local',
      seriesValue: '{instance="localhost:9090"}',
    });
    expect(JSON.parse(forecastPreviewCall?.[1]?.body ?? '{}')).toMatchObject({
      promqlQuery: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
      dataConnectionId: 'local',
      seriesValue: '{instance="localhost:9090"}',
    });

    expect(screen.queryByText('Preview requires at least 400 datapoints')).not.toBeInTheDocument();
  });

  it('previews all Prometheus series when there are no more than three', async () => {
    const rows = [
      {
        Time: 1700000000000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 10,
      },
      {
        Time: 1700000060000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 12,
      },
      {
        Time: 1700000000000,
        Series: '{instance="prometheus-b:9090",job="leaf-prometheus"}',
        Value: 20,
      },
      {
        Time: 1700000060000,
        Series: '{instance="prometheus-b:9090",job="leaf-prometheus"}',
        Value: 22,
      },
    ];
    setPromqlVisualizationData(rows);

    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        query: {
          language: 'PROMQL',
          query: 'rate(go_gc_heap_allocs_bytes_total{job="leaf-prometheus"}[10m])',
          dataset: { id: 'prome_multi' },
        },
      })
    );

    render(<VisualizationContainer />);

    await waitFor(() => {
      const forecastCalls = mockHttpPost.mock.calls.filter(
        ([path]) => path === '/api/explore/forecast_preview'
      );
      expect(forecastCalls).toHaveLength(2);
    });

    expect(screen.queryByTestId('metricsPreviewSeriesSelector')).not.toBeInTheDocument();
    const forecastSeriesValues = mockHttpPost.mock.calls
      .filter(([path]) => path === '/api/explore/forecast_preview')
      .map(([, options]) => JSON.parse(options?.body ?? '{}')?.seriesValue);

    expect(forecastSeriesValues).toEqual([
      '{instance="prometheus-a:9090",job="leaf-prometheus"}',
      '{instance="prometheus-b:9090",job="leaf-prometheus"}',
    ]);
  });

  it('uses the local cluster for preview routes when local cluster is available', async () => {
    setPromqlVisualizationData([
      {
        Time: 1700000000000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 10,
      },
      {
        Time: 1700000060000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 12,
      },
    ]);
    mockServices.dataSourceEnabled = true;

    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        query: {
          language: 'PROMQL',
          query: 'rate(go_gc_heap_allocs_bytes_total{job="leaf-prometheus"}[10m])',
          dataset: {
            id: 'prome_multi',
            dataSource: { id: 'ds-1' },
          },
        },
      })
    );

    render(<VisualizationContainer />);

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalledWith(
        '/api/explore/anomaly_preview',
        expect.not.objectContaining({
          query: expect.anything(),
        })
      );
      expect(mockHttpPost).toHaveBeenCalledWith(
        '/api/explore/forecast_preview',
        expect.not.objectContaining({
          query: expect.anything(),
        })
      );
    });
  });

  it('uses the explicit OpenSearch data source id for preview routes when local cluster is hidden', async () => {
    setPromqlVisualizationData([
      {
        Time: 1700000000000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 10,
      },
      {
        Time: 1700000060000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 12,
      },
    ]);
    mockServices.dataSourceEnabled = true;
    mockServices.hideLocalCluster = true;

    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        query: {
          language: 'PROMQL',
          query: 'rate(go_gc_heap_allocs_bytes_total{job="leaf-prometheus"}[10m])',
          dataset: {
            id: 'prome_multi',
            dataSource: { id: 'ds-1' },
          },
        },
      })
    );

    render(<VisualizationContainer />);

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalledWith(
        '/api/explore/anomaly_preview',
        expect.objectContaining({
          query: { dataSourceId: 'ds-1' },
        })
      );
      expect(mockHttpPost).toHaveBeenCalledWith(
        '/api/explore/forecast_preview',
        expect.objectContaining({
          query: { dataSourceId: 'ds-1' },
        })
      );
    });
  });

  it('uses the default OpenSearch data source id for preview routes when local cluster is hidden', async () => {
    setPromqlVisualizationData([
      {
        Time: 1700000000000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 10,
      },
      {
        Time: 1700000060000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 12,
      },
    ]);
    mockServices.dataSourceEnabled = true;
    mockServices.hideLocalCluster = true;
    mockGetDefaultDataSourceId.mockResolvedValue('ds-default');

    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        query: {
          language: 'PROMQL',
          query: 'rate(go_gc_heap_allocs_bytes_total{job="leaf-prometheus"}[10m])',
          dataset: { id: 'prome_multi' },
        },
      })
    );

    render(<VisualizationContainer />);

    await waitFor(() => {
      expect(mockGetDefaultDataSourceId).toHaveBeenCalled();
      expect(mockHttpPost).toHaveBeenCalledWith(
        '/api/explore/anomaly_preview',
        expect.objectContaining({
          query: { dataSourceId: 'ds-default' },
        })
      );
      expect(mockHttpPost).toHaveBeenCalledWith(
        '/api/explore/forecast_preview',
        expect.objectContaining({
          query: { dataSourceId: 'ds-default' },
        })
      );
    });
  });

  it('asks users to select series when a Prometheus query returns more than three series', async () => {
    const rows = ['a', 'b', 'c', 'd'].flatMap((instance, index) => [
      {
        Time: 1700000000000,
        Series: `{instance="prometheus-${instance}:9090",job="leaf-prometheus"}`,
        Value: index * 10,
      },
      {
        Time: 1700000060000,
        Series: `{instance="prometheus-${instance}:9090",job="leaf-prometheus"}`,
        Value: index * 10 + 2,
      },
    ]);
    setPromqlVisualizationData(rows);

    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        query: {
          language: 'PROMQL',
          query: 'rate(go_gc_heap_allocs_bytes_total{job="leaf-prometheus"}[10m])',
          dataset: { id: 'prome_multi' },
        },
      })
    );

    render(<VisualizationContainer />);

    expect(await screen.findByTestId('metricsPreviewSeriesSelector')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'This query returns 4 series. Select up to 3 series to generate preview overlays.'
      )
    ).toBeInTheDocument();
    expect(
      mockHttpPost.mock.calls.filter(([path]) => path === '/api/explore/forecast_preview')
    ).toHaveLength(0);
  });

  it('does not request or render preview overlays when Anomaly Detection UI is unavailable', async () => {
    mockApplications$.next(new Map());
    setPromqlVisualizationData([
      {
        Time: 1700000000000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 10,
      },
      {
        Time: 1700000060000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 12,
      },
    ]);

    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        query: {
          language: 'PROMQL',
          query: 'rate(go_gc_heap_allocs_bytes_total{job="leaf-prometheus"}[10m])',
          dataset: { id: 'prome_multi' },
        },
      })
    );

    render(<VisualizationContainer />);

    await waitFor(() => {
      expect(mockHttpPost).not.toHaveBeenCalled();
    });

    expect(screen.queryByTestId('metricsPreviewStatusCallout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('metricsPreviewSeriesSelector')).not.toBeInTheDocument();
  });

  it('suppresses preview status when the cluster is missing the AD preview dependency', async () => {
    setPromqlVisualizationData([
      {
        Time: 1700000000000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 10,
      },
      {
        Time: 1700000060000,
        Series: '{instance="prometheus-a:9090",job="leaf-prometheus"}',
        Value: 12,
      },
    ]);

    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        query: {
          language: 'PROMQL',
          query: 'rate(go_gc_heap_allocs_bytes_total{job="leaf-prometheus"}[10m])',
          dataset: { id: 'prome_multi' },
        },
      })
    );

    mockHttpPost.mockImplementation((path: string) => {
      if (path === '/api/explore/anomaly_preview') {
        return Promise.resolve({
          ok: false,
          message:
            'Anomaly Detection plugin endpoint not found on this OpenSearch cluster. Ensure the AD plugin is installed/enabled.',
        });
      }

      return Promise.resolve({
        ok: false,
        message:
          'Forecasting preview endpoint not found on this OpenSearch cluster. Install/enable the Forecast plugin to use preview.',
      });
    });

    render(<VisualizationContainer />);

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('metricsPreviewStatusCallout')).not.toBeInTheDocument();
    });
  });
});
