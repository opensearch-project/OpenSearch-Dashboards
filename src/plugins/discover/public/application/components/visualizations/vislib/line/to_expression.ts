/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildExpression,
  buildExpressionFunction,
  ExpressionFunctionOpenSearchDashboards,
  IExpressionLoaderParams,
} from '../../../../../../../expressions/public';
import { OpenSearchSearchHit } from '../../../../doc_views/doc_views_types';
import { IndexPattern } from '../../../../../../../data/public';
import { DiscoverViewServices } from '../../../../../build_services';

type Source = Record<string, number | string>;
type Row = OpenSearchSearchHit<Source>;

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  rows: Row[],
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

  const vegaSpec = createVegaSpec(rows);

  const vega = buildExpressionFunction<any>('vega', {
    spec: JSON.stringify(vegaSpec),
  });

  return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
};

const createVegaSpec = (rows: Row[]) => {
  const columns = Object.keys(rows[0]._source).map((column, index) => {
    return {
      field: column,
      id: index,
      name: index === 0 ? column : `series-${index}`,
    };
  });

  const data = rows.map((row: Row) => {
    const transformedRow: Source = {};
    for (const column of columns) {
      transformedRow[column.name] = row._source[column.field];
    }
    return transformedRow;
  });

  const xAxisParam = {
    field: 'timestamp_ms',
    type: 'temporal',
    axis: { format: '%b %-d, %Y', title: columns[0].name },
    scale: {
      padding: 10,
      nice: true, // Round the domain to nice values
    },
  };

  const layer = [];

  const colorPalette = [
    '#4C78A8', // blue
    '#E45756', // red
    '#72B7B2', // teal
    '#F58518', // orange
    '#54A24B', // green
    '#B279A2', // purple
    '#D6A5C9', // pink
    '#9D755D', // brown
    '#BAB0AC', // gray
  ];

  const legendLabelMap: Record<string, string> = {};
  for (let i = 1; i < columns.length; i++) {
    legendLabelMap[columns[i].name] = columns[i].field;
  }

  for (let i = 1; i < columns.length; i++) {
    const yAxisParam = {
      field: columns[i].name,
      type: 'quantitative',
      scale: { zero: false },
      axis: { title: '' },
    };

    const tooltipParam = [
      {
        field: 'timestamp_ms',
        type: 'temporal',
        title: columns[0].name,
        format: '%b %-d, %Y @ %H:%M:%S.%L',
      },
      { field: columns[i].name, type: 'quantitative', title: columns[i].name },
    ];

    const markParam = {
      type: 'line',
      point: true,
      strokeWidth: 2,
      interpolate: 'monotone',
    };

    const encodingParam = {
      x: xAxisParam,
      y: yAxisParam,
      tooltip: tooltipParam,
      color: {
        datum: columns[i].name,
        type: 'nominal',
        scale: {
          domain: columns.slice(1).map((col) => col.name),
          range: colorPalette.slice(0, columns.length - 1),
        },
        legend: {
          title: '',
          labelExpr:
            Object.entries(legendLabelMap)
              .map(([key, value]) => `datum.value == '${key}' ? '${key} : ${value}'`)
              .join(' : ') + ' : datum.label',
          orient: 'bottom',
          labelLimit: 999,
          columns: Math.min(2, columns.length - 1), // Limit to 3 columns or fewer legends
          padding: 4,
        },
      },
    };

    const layerParam = {
      mark: markParam,
      encoding: encodingParam,
    };

    layer.push(layerParam);
  }

  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: data },
    transform: [{ calculate: `datum['${columns[0].field}']`, as: 'timestamp_ms' }],
    layer,
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

  return spec;
};
