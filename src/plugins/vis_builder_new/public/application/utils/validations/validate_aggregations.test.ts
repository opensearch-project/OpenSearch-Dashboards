/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BUCKET_TYPES, IndexPattern, METRIC_TYPES } from '../../../../../data/public';
import { dataPluginMock } from '../../../../../data/public/mocks';
import { validateAggregations } from './validate_aggregations';

describe('validateAggregations', () => {
  const fields = [
    {
      name: '@timestamp',
    },
    {
      name: 'bytes',
    },
  ];

  const indexPattern = {
    id: '1234',
    title: 'logstash-*',
    fields: {
      getByName: (name: string) => fields.find((f) => f.name === name),
      filter: () => fields,
    },
  } as any;

  const dataStart = dataPluginMock.createStartContract();

  test('Pipeline aggs should have a bucket agg as the last agg', () => {
    const aggConfigs = dataStart.search.aggs.createAggConfigs(indexPattern as IndexPattern, [
      {
        id: '1',
        enabled: true,
        type: METRIC_TYPES.CUMULATIVE_SUM,
        schema: 'metric',
        params: {},
      },
    ]);

    const { valid, errorMsg } = validateAggregations(aggConfigs.aggs);

    expect(valid).toBe(false);
    expect(errorMsg).toMatchInlineSnapshot(
      `"Add a bucket with \\"Date Histogram\\" or \\"Histogram\\" aggregation."`
    );
  });

  test('Pipeline aggs should have a valid bucket agg', () => {
    const aggConfigs = dataStart.search.aggs.createAggConfigs(indexPattern as IndexPattern, [
      {
        id: '0',
        enabled: true,
        type: BUCKET_TYPES.SIGNIFICANT_TERMS,
        schema: 'segment',
        params: {},
      },
      {
        id: '1',
        enabled: true,
        type: METRIC_TYPES.CUMULATIVE_SUM,
        schema: 'metric',
        params: {},
      },
    ]);

    const { valid, errorMsg } = validateAggregations(aggConfigs.aggs);

    expect(valid).toBe(false);
    expect(errorMsg).toMatchInlineSnapshot(
      `"Last bucket aggregation must be \\"Date Histogram\\" or \\"Histogram\\" when using \\"Cumulative Sum\\" metric aggregation."`
    );
  });

  test('Valid pipeline aggconfigs', () => {
    const aggConfigs = dataStart.search.aggs.createAggConfigs(indexPattern as IndexPattern, [
      {
        id: '0',
        enabled: true,
        type: BUCKET_TYPES.DATE_HISTOGRAM,
        schema: 'segment',
        params: {},
      },
      {
        id: '1',
        enabled: true,
        type: METRIC_TYPES.CUMULATIVE_SUM,
        schema: 'metric',
        params: {},
      },
    ]);

    const { valid, errorMsg } = validateAggregations(aggConfigs.aggs);

    expect(valid).toBe(true);
    expect(errorMsg).not.toBeDefined();
  });
});
