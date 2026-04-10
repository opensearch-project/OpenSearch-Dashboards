/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { inferPrometheusSeries } from './prometheus_series_inference';

describe('inferPrometheusSeries', () => {
  const baseChartConfig = {
    axesMapping: {
      x: 'Time',
      y: 'Value',
      color: 'Series',
    },
  } as any;

  const baseVisData = {
    numericalColumns: [{ id: 1, name: 'Value', column: 'value' }],
    categoricalColumns: [{ id: 2, name: 'Series', column: 'series' }],
    dateColumns: [{ id: 3, name: 'Time', column: 'timestamp' }],
  } as any;

  test('defaults to high cardinality with instance for a clean multi-instance query', () => {
    const inference = inferPrometheusSeries(
      {
        ...baseVisData,
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
      },
      baseChartConfig
    );

    expect(inference.seriesCount).toBe(2);
    expect(inference.defaultDetectorMode).toBe('high_cardinality');
    expect(inference.varyingLabels).toEqual(['instance']);
    expect(inference.suggestedEntityFields).toEqual(['instance']);
    expect(inference.defaultEntityField).toBe('instance');
  });

  test('prioritizes instance ahead of quantile when both vary', () => {
    const inference = inferPrometheusSeries(
      {
        ...baseVisData,
        transformedData: [
          {
            timestamp: '2026-04-05T00:00:00.000Z',
            value: 1,
            series: '{instance="prometheus-a:9090", job="leaf-prometheus", quantile="0.5"}',
          },
          {
            timestamp: '2026-04-05T00:00:00.000Z',
            value: 2,
            series: '{instance="prometheus-b:9090", job="leaf-prometheus", quantile="0.5"}',
          },
          {
            timestamp: '2026-04-05T00:00:00.000Z',
            value: 3,
            series: '{instance="prometheus-a:9090", job="leaf-prometheus", quantile="0.75"}',
          },
        ],
      },
      baseChartConfig
    );

    expect(inference.varyingLabels).toEqual(['instance', 'quantile']);
    expect(inference.suggestedEntityFields).toEqual(['instance', 'quantile']);
    expect(inference.defaultEntityField).toBe('instance');
  });

  test('falls back to single stream when the query renders one series', () => {
    const inference = inferPrometheusSeries(
      {
        ...baseVisData,
        transformedData: [
          {
            timestamp: '2026-04-05T00:00:00.000Z',
            value: 5,
            series: '{job="leaf-prometheus"}',
          },
        ],
      },
      baseChartConfig
    );

    expect(inference.seriesCount).toBe(1);
    expect(inference.defaultDetectorMode).toBe('single_stream');
    expect(inference.suggestedEntityFields).toEqual([]);
  });
});
