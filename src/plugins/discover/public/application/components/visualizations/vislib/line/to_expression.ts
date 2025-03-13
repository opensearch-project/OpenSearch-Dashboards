/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import moment from 'moment';
import {
  buildExpression,
  buildExpressionFunction,
  ExpressionFunctionOpenSearchDashboards,
  IExpressionLoaderParams,
  SerializedFieldFormat,
} from '../../../../../../../expressions/public';
import { OpenSearchSearchHit } from '../../../../doc_views/doc_views_types';
import { IndexPattern } from '../../../../../../../data/public';
import { DiscoverViewServices } from '../../../../../build_services';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  rows: OpenSearchSearchHit[],
  indexPattern: IndexPattern
) => {
  const opensearchDashboards = buildExpressionFunction<ExpressionFunctionOpenSearchDashboards>(
    'opensearchDashboards',
    {}
  );
  const opensearchDashboardsContext = buildExpressionFunction('opensearch_dashboards_context', {
    timeRange: JSON.stringify(searchContext!.timeRange || {}),
    filters: JSON.stringify(searchContext!.filters || []),
    query: JSON.stringify(searchContext!.query || []),
  });

  const vegaSpec = createVegaSpec(rows, indexPattern);

  const vega = buildExpressionFunction<any>('vega', {
    spec: JSON.stringify(vegaSpec),
  });

  return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
};

const createVegaSpec = (rows: OpenSearchSearchHit[], indexPattern: IndexPattern) => {
  const data = rows.map((row: OpenSearchSearchHit) => {
    return row._source as Record<string, any>;
  });

  // Need to format date fields
  // Also need to format column names, field name including . will cause problem in vegalite
  for (const row of data) {
    for (const key in row) {
      if (key === indexPattern.timeFieldName) {
        const formattedDate = moment(row[key]).format('YYYY-MM-DDTHH:mm:ss[Z]');
        row[key] = formattedDate;
      }
    }
  }

  const columns = Object.keys(data[0]);

  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: data },
    mark: {
      type: 'line',
      point: true,
      strokeWidth: 2,
    },
    encoding: {
      x: {
        field: columns[0],
        type: 'temporal',
        title: columns[0],
        axis: { format: '%Y-%m-%d' },
      },
      y: { field: columns[1], type: 'quantitative', title: columns[1], scale: { zero: false } },
      tooltip: [
        { field: columns[0], type: 'temporal', title: columns[0] },
        { field: columns[1], type: 'quantitative', title: columns[1] },
      ],
    },
    config: {
      axis: {
        labelFont: 'sans-serif',
        titleFont: 'sans-serif',
      },
      legend: {
        labelFont: 'sans-serif',
        titleFont: 'sans-serif',
      },
    },
  };

  console.log('vega spec REAL', spec);
  return spec;

  //   $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  //   data: {
  //     values: [
  //       { timestamp: '2023-01-01T00:00:00Z', value: 42.5 },
  //       { timestamp: '2023-01-02T00:00:00Z', value: 38.2 },
  //       { timestamp: '2023-01-03T00:00:00Z', value: 56.7 },
  //       { timestamp: '2023-01-04T00:00:00Z', value: 45.3 },
  //       { timestamp: '2023-01-05T00:00:00Z', value: 62.1 },
  //     ],
  //   },
  //   mark: {
  //     type: 'line',
  //     point: true,
  //     strokeWidth: 2,
  //   },
  //   encoding: {
  //     x: {
  //       field: 'timestamp',
  //       type: 'temporal',
  //       title: 'Date',
  //       axis: { format: '%Y-%m-%d' },
  //     },
  //     y: {
  //       field: 'value',
  //       type: 'quantitative',
  //       title: 'Value',
  //       scale: { zero: false },
  //     },

  //     tooltip: [
  //       { field: 'timestamp', type: 'temporal', title: 'Date', format: '%Y-%m-%d' },
  //       { field: 'value', type: 'quantitative', title: 'Value' },
  //     ],
  //   },
  //   config: {
  //     axis: {
  //       labelFont: 'sans-serif',
  //       titleFont: 'sans-serif',
  //     },
  //     legend: {
  //       labelFont: 'sans-serif',
  //       titleFont: 'sans-serif',
  //     },
  //   },
  // };
};
