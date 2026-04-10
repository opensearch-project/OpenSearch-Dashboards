/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { useSelector } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MetricsAlertsPanel } from './metrics_alerts_panel';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { useQueryPanelActionDependencies } from '../../../../../components/query_panel/query_panel_widgets/query_panel_actions/use_query_panel_action_dependencies';
import { getVisualizationBuilder } from '../../../../../components/visualizations/visualization_builder';
import { QueryExecutionStatus } from '../../../../utils/state_management/types';

jest.mock('../../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

jest.mock(
  '../../../../../components/query_panel/query_panel_widgets/query_panel_actions/use_query_panel_action_dependencies',
  () => ({
    useQueryPanelActionDependencies: jest.fn(),
  })
);
jest.mock('../../../../../components/visualizations/visualization_builder', () => ({
  getVisualizationBuilder: jest.fn(),
}));
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockUseQueryPanelActionDependencies = useQueryPanelActionDependencies as jest.MockedFunction<
  typeof useQueryPanelActionDependencies
>;
const mockGetVisualizationBuilder = getVisualizationBuilder as jest.MockedFunction<
  typeof getVisualizationBuilder
>;
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe('MetricsAlertsPanel', () => {
  const mockHttpPost = jest.fn();
  const mockHttpGet = jest.fn();
  const mockHttpDelete = jest.fn();
  const mockAddSuccess = jest.fn();
  const mockAddDanger = jest.fn();
  const mockAddWarning = jest.fn();
  const mockGetUrlForApp = jest.fn();
  const mockNavigateToUrl = jest.fn();
  const mockStoreDispatch = jest.fn();
  const mockGetDefaultDataSourceId = jest.fn();
  let mockApplications$: BehaviorSubject<Map<string, any>>;
  let mockVisData$: BehaviorSubject<any>;
  let mockVisConfig$: BehaviorSubject<any>;
  let mockStoreState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    mockStoreState = {
      ui: {},
    };
    mockApplications$ = new BehaviorSubject(
      new Map([
        ['monitors', { id: 'monitors' }],
        ['anomaly-detection-dashboards', { id: 'anomaly-detection-dashboards' }],
      ])
    );
    mockUseSelector.mockImplementation((selector: any) => selector(mockStoreState));
    mockVisData$ = new BehaviorSubject(undefined);
    mockVisConfig$ = new BehaviorSubject(undefined);
    mockGetVisualizationBuilder.mockReturnValue({
      data$: mockVisData$,
      visConfig$: mockVisConfig$,
    } as any);

    mockUseOpenSearchDashboards.mockReturnValue({
      services: {
        http: {
          post: mockHttpPost,
          get: mockHttpGet,
          delete: mockHttpDelete,
        },
        notifications: {
          toasts: {
            addSuccess: mockAddSuccess,
            addDanger: mockAddDanger,
            addWarning: mockAddWarning,
          },
        },
        core: {
          application: {
            applications$: mockApplications$,
            getUrlForApp: mockGetUrlForApp.mockImplementation(
              (appId: string, options?: { path?: string }) =>
                `/app/${appId}${options?.path ? options.path : ''}`
            ),
            navigateToUrl: mockNavigateToUrl,
          },
        },
        store: {
          getState: () => mockStoreState,
          dispatch: mockStoreDispatch.mockImplementation((action: any) => {
            if (action.type === 'ui/setMetricsAlertAssociation') {
              mockStoreState = {
                ...mockStoreState,
                ui: {
                  ...mockStoreState.ui,
                  metricsAlertAssociation: action.payload,
                },
              };
            }
            return action;
          }),
        },
        dataSourceEnabled: true,
        hideLocalCluster: false,
        uiSettings: {},
        dataSourceManagement: {
          getDefaultDataSourceId: mockGetDefaultDataSourceId.mockResolvedValue(''),
        },
      },
    } as any);

    mockUseQueryPanelActionDependencies.mockReturnValue({
      query: {
        language: 'PROMQL',
        query: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
        dataset: {
          id: 'local',
          type: 'PROMETHEUS',
          dataSource: {
            id: 'ds-1',
          },
        },
      },
      queryInEditor: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
      resultStatus: {
        status: QueryExecutionStatus.READY,
      },
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('creates detector, starts it, creates monitor inline, and shows success state', async () => {
    mockHttpPost
      .mockResolvedValueOnce({
        ok: true,
        detectorId: 'det-1',
        detectorName: 'metrics-go_gc_heap_allocs_bytes_total-abcd',
        detectionInterval: { period: { interval: 5, unit: 'Minutes' } },
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        resp: { _id: 'mon-1' },
      });

    render(<MetricsAlertsPanel />);

    fireEvent.click(screen.getByTestId('metricsCreateAlertMonitorButton'));

    await waitFor(() => expect(mockHttpPost).toHaveBeenCalledTimes(3));

    expect(mockHttpPost).toHaveBeenNthCalledWith(
      1,
      '/api/anomaly_detectors/detectors/_create_from_prometheus_query/ds-1',
      expect.objectContaining({ body: expect.any(String) })
    );
    expect(JSON.parse(mockHttpPost.mock.calls[0][1].body)).toEqual({
      query: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
      dataConnectionId: 'local',
      description: 'Auto-created from Explore Metrics alerts flow.',
      detectorMode: 'single_stream',
    });
    expect(mockHttpPost).toHaveBeenNthCalledWith(
      2,
      '/api/anomaly_detectors/detectors/det-1/start/ds-1'
    );

    const monitorCreateCall = mockHttpPost.mock.calls[2];
    expect(monitorCreateCall[0]).toBe('/api/alerting/monitors');
    expect(monitorCreateCall[1].query).toEqual({ dataSourceId: 'ds-1' });

    const monitorPayload = JSON.parse(monitorCreateCall[1].body);
    expect(monitorPayload.name).toContain('metrics-go_gc_heap_allocs_bytes_total-monitor');
    expect(monitorPayload.schedule.period).toEqual({ interval: 5, unit: 'MINUTES' });
    expect(monitorPayload.inputs[0].search.query.query.bool.filter[1].term.detector_id.value).toBe(
      'det-1'
    );
    expect(
      monitorPayload.ui_metadata.triggers[monitorPayload.triggers[0].name].adTriggerMetadata
    ).toEqual({
      triggerType: 'anomaly_detector_trigger',
      anomalyGrade: { value: 0.7, enum: 'ABOVE' },
      anomalyConfidence: { value: 0.7, enum: 'ABOVE' },
    });

    await waitFor(() =>
      expect(mockAddSuccess).toHaveBeenCalledWith(expect.stringContaining('successfully created'))
    );

    expect(screen.getByText('Monitor available')).toBeInTheDocument();
    expect(screen.getByTestId('metricsAlertsViewMonitorButton')).toHaveAttribute(
      'href',
      '/app/monitors#/monitors/mon-1?type=monitor&mode=classic&dataSourceId=ds-1'
    );
    expect(screen.getByTestId('metricsAlertsViewDetectorButton')).toHaveAttribute(
      'href',
      '/app/anomaly-detection-dashboards#/detectors/det-1/results?dataSourceId=ds-1'
    );
  });

  test('passes the local-cluster sentinel in the monitor deep link when data sources are enabled', async () => {
    mockUseQueryPanelActionDependencies.mockReturnValue({
      query: {
        language: 'PROMQL',
        query: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
        dataset: {
          id: 'local',
          type: 'PROMETHEUS',
          dataSource: {},
        },
      },
      queryInEditor: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
      resultStatus: {
        status: QueryExecutionStatus.READY,
      },
    } as any);
    mockHttpPost
      .mockResolvedValueOnce({
        ok: true,
        detectorId: 'det-local',
        detectorName: 'metrics-go_gc_heap_allocs_bytes_total-local',
        detectionInterval: { period: { interval: 5, unit: 'Minutes' } },
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        resp: { _id: 'mon-local' },
      });

    render(<MetricsAlertsPanel />);

    fireEvent.click(screen.getByTestId('metricsCreateAlertMonitorButton'));

    await waitFor(() => expect(mockHttpPost).toHaveBeenCalledTimes(3));
    expect(screen.getByTestId('metricsAlertsViewMonitorButton')).toHaveAttribute(
      'href',
      '/app/monitors#/monitors/mon-local?type=monitor&mode=classic&dataSourceId='
    );
  });

  test('shows persisted monitor association instead of the create form', async () => {
    mockStoreState = {
      ui: {
        metricsAlertAssociation: {
          detectorId: 'det-existing',
          detectorName: 'detector-existing',
          monitorId: 'mon-existing',
          monitorName: 'monitor-existing',
          promqlQuery: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
          dataConnectionId: 'local',
          dataSourceId: 'ds-1',
        },
      },
    };
    mockHttpGet
      .mockResolvedValueOnce({ ok: true, resp: { name: 'monitor-existing' } })
      .mockResolvedValueOnce({ name: 'detector-existing' });

    render(<MetricsAlertsPanel />);

    await waitFor(() => expect(screen.getByText('Monitor available')).toBeInTheDocument());
    expect(screen.queryByTestId('metricsCreateAlertMonitorButton')).not.toBeInTheDocument();
    expect(screen.getByTestId('metricsAlertsViewMonitorButton')).toHaveAttribute(
      'href',
      '/app/monitors#/monitors/mon-existing?type=monitor&mode=classic&dataSourceId=ds-1'
    );
  });

  test('rediscovers an existing monitor association for the same metric query', async () => {
    mockVisData$.next({
      transformedData: [
        {
          timestamp: '2026-04-05T00:00:00.000Z',
          value: 1,
          series: '{instance="localhost:9090"}',
        },
      ],
      numericalColumns: [{ id: 1, name: 'Value', column: 'value' }],
      categoricalColumns: [{ id: 2, name: 'Series', column: 'series' }],
      dateColumns: [{ id: 3, name: 'Time', column: 'timestamp' }],
    });
    mockVisConfig$.next({
      axesMapping: {
        x: 'Time',
        y: 'Value',
        color: 'Series',
      },
    });
    mockHttpPost
      .mockResolvedValueOnce({
        ok: true,
        response: {
          detectors: [
            {
              id: 'det-found',
              name: 'detector-found',
              prometheusSource: {
                query: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
                dataConnectionId: 'local',
              },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        resp: {
          hits: {
            hits: [
              {
                _id: 'mon-found',
                _source: {
                  monitor: {
                    name: 'monitor-found',
                    inputs: [
                      {
                        search: {
                          query: {
                            query: {
                              bool: {
                                filter: [
                                  {
                                    term: {
                                      detector_id: {
                                        value: 'det-found',
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      });

    render(<MetricsAlertsPanel />);

    await waitFor(() => expect(screen.getByText('Monitor available')).toBeInTheDocument());
    expect(screen.queryByTestId('metricsCreateAlertMonitorButton')).not.toBeInTheDocument();
    expect(screen.getByTestId('metricsAlertsViewMonitorButton')).toHaveAttribute(
      'href',
      '/app/monitors#/monitors/mon-found?type=monitor&mode=classic&dataSourceId=ds-1'
    );
  });

  test('rolls back detector creation when monitor creation fails', async () => {
    mockHttpPost
      .mockResolvedValueOnce({
        ok: true,
        detectorId: 'det-rollback',
        detectorName: 'metrics-go_gc_heap_allocs_bytes_total-abcd',
        detectionInterval: { period: { interval: 5, unit: 'Minutes' } },
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: false,
        error: 'Monitor creation failed.',
      });
    mockHttpDelete.mockResolvedValue({ ok: true });

    render(<MetricsAlertsPanel />);

    fireEvent.click(screen.getByTestId('metricsCreateAlertMonitorButton'));

    await waitFor(() =>
      expect(mockHttpDelete).toHaveBeenCalledWith(
        '/api/anomaly_detectors/detectors/det-rollback/ds-1'
      )
    );
    expect(mockAddDanger).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Failed to create alert monitor',
      })
    );
    expect(screen.getByText('Unable to create monitor')).toBeInTheDocument();
  });

  test('falls back to the default data source when local cluster is hidden and the metric has no data source id', async () => {
    mockUseOpenSearchDashboards.mockReturnValue({
      services: {
        http: {
          post: mockHttpPost,
          get: mockHttpGet,
          delete: mockHttpDelete,
        },
        notifications: {
          toasts: {
            addSuccess: mockAddSuccess,
            addDanger: mockAddDanger,
            addWarning: mockAddWarning,
          },
        },
        core: {
          application: {
            applications$: mockApplications$,
            getUrlForApp: mockGetUrlForApp.mockImplementation(
              (appId: string, options?: { path?: string }) =>
                `/app/${appId}${options?.path ? options.path : ''}`
            ),
            navigateToUrl: mockNavigateToUrl,
          },
        },
        store: {
          getState: () => mockStoreState,
          dispatch: mockStoreDispatch.mockImplementation((action: any) => action),
        },
        dataSourceEnabled: true,
        hideLocalCluster: true,
        uiSettings: {},
        dataSourceManagement: {
          getDefaultDataSourceId: mockGetDefaultDataSourceId.mockResolvedValue('ds-default'),
        },
      },
    } as any);
    mockUseQueryPanelActionDependencies.mockReturnValue({
      query: {
        language: 'PROMQL',
        query: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
        dataset: {
          id: 'local',
          type: 'PROMETHEUS',
          dataSource: {},
        },
      },
      queryInEditor: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
      resultStatus: {
        status: QueryExecutionStatus.READY,
      },
    } as any);
    mockHttpPost
      .mockResolvedValueOnce({
        ok: true,
        detectorId: 'det-fallback',
        detectorName: 'metrics-go_gc_heap_allocs_bytes_total-abcd',
        detectionInterval: { period: { interval: 5, unit: 'Minutes' } },
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        resp: { _id: 'mon-fallback' },
      });

    render(<MetricsAlertsPanel />);

    await waitFor(() => expect(mockGetDefaultDataSourceId).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId('metricsCreateAlertMonitorButton'));

    await waitFor(() => expect(mockHttpPost).toHaveBeenCalledTimes(3));

    expect(mockHttpPost).toHaveBeenNthCalledWith(
      1,
      '/api/anomaly_detectors/detectors/_create_from_prometheus_query/ds-default',
      expect.anything()
    );
    expect(mockHttpPost).toHaveBeenNthCalledWith(
      2,
      '/api/anomaly_detectors/detectors/det-fallback/start/ds-default'
    );
    expect(screen.getByTestId('metricsAlertsViewMonitorButton')).toHaveAttribute(
      'href',
      '/app/monitors#/monitors/mon-fallback?type=monitor&mode=classic&dataSourceId=ds-default'
    );
  });

  test('creates a high-cardinality detector for multi-series Prometheus queries by default', async () => {
    mockHttpPost
      .mockResolvedValueOnce({
        ok: true,
        response: {
          detectors: [],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        detectorId: 'det-series',
        detectorName: 'metrics-go_gc_heap_allocs_bytes_total-prometheus-a-9090-abcd',
        detectionInterval: { period: { interval: 5, unit: 'Minutes' } },
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        resp: { _id: 'mon-series' },
      });
    mockVisData$.next({
      transformedData: [
        {
          timestamp: '2026-04-05T00:00:00.000Z',
          value: 1,
          series: '{instance="prometheus-a:9090", job="leaf-prometheus"}',
        },
        {
          timestamp: '2026-04-05T00:00:00.000Z',
          value: 2,
          series: '{instance="prometheus-b:9090", job="leaf-prometheus"}',
        },
      ],
      numericalColumns: [{ id: 1, name: 'Value', column: 'value' }],
      categoricalColumns: [{ id: 2, name: 'Series', column: 'series' }],
      dateColumns: [{ id: 3, name: 'Time', column: 'timestamp' }],
    });
    mockVisConfig$.next({
      axesMapping: {
        x: 'Time',
        y: 'Value',
        color: 'Series',
      },
    });

    render(<MetricsAlertsPanel />);

    expect(screen.getByText('Multi-series Prometheus query detected')).toBeInTheDocument();
    expect(screen.getByTestId('metricsAlertsDetectorModeField')).toHaveValue('high_cardinality');
    expect(screen.getByTestId('metricsAlertsEntityField')).toHaveValue('instance');

    await waitFor(() => expect(mockHttpPost).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('metricsCreateAlertMonitorButton')).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('metricsCreateAlertMonitorButton'));

    await waitFor(() => expect(mockHttpPost).toHaveBeenCalledTimes(4));
    expect(JSON.parse(mockHttpPost.mock.calls[1][1].body)).toEqual({
      query: 'rate(go_gc_heap_allocs_bytes_total{instance="localhost:9090"}[5m])',
      dataConnectionId: 'local',
      description: 'Auto-created from Explore Metrics alerts flow.',
      detectorMode: 'high_cardinality',
      entityField: 'instance',
    });
  });

  test('shows a dependency callout and disables creation when required dashboard apps are unavailable', async () => {
    mockApplications$.next(new Map());

    render(<MetricsAlertsPanel />);

    expect(screen.getByText('Required alerting dependencies are unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This Metrics alert flow needs the following OpenSearch Dashboards apps to be available: Alerting dashboards plugin, Anomaly Detection dashboards plugin.'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('metricsCreateAlertMonitorButton')).toBeDisabled();
  });
});
