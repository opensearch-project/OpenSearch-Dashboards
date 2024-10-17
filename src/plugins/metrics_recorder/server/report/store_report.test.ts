/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { storeReport } from './store_report';
import { ReportSchemaType } from './schema';
import { OpenSearchDashboardsRequest } from 'src/core/server';
import { METRIC_TYPE } from '@osd/analytics';

describe('store_report', () => {
  const mockRecordCount = jest.fn();
  const metricsRecorder = {
    recordCount: mockRecordCount,
  };
  const req = {
    headers: {
      'user-agent': 'test-user-agent',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('stores report for all types of data', async () => {
    const report: ReportSchemaType = {
      reportVersion: 1,
      uiStatsMetrics: {
        any: {
          key: 'test-key',
          type: METRIC_TYPE.CLICK,
          appName: 'test-app-name',
          eventName: 'test-event-name',
          stats: {
            min: 1,
            max: 2,
            avg: 1.5,
            sum: 3,
          },
        },
      },
    };
    await storeReport(metricsRecorder, report, (req as unknown) as OpenSearchDashboardsRequest);

    expect(mockRecordCount).toHaveBeenCalledWith([
      expect.objectContaining({
        appName: 'test-app-name',
        metricName: 'test-event-name',
        count: 3,
        attributes: { applicationId: '' },
      }),
    ]);
  });

  test('it should not fail if nothing to store', async () => {
    const report: ReportSchemaType = {
      reportVersion: 1,
      userAgent: void 0,
      uiStatsMetrics: void 0,
      application_usage: void 0,
    };
    await storeReport(metricsRecorder, report, (req as unknown) as OpenSearchDashboardsRequest);

    expect(mockRecordCount).not.toHaveBeenCalled();
  });
});
