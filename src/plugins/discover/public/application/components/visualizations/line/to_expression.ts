/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildExpression,
  buildExpressionFunction,
  ExpressionFunctionOpenSearchDashboards,
  IExpressionLoaderParams,
} from '../../../../../../expressions/public';
import { OpenSearchSearchHit } from '../../../doc_views/doc_views_types';
import { IndexPattern } from '../../../../../../data/public';
import { DiscoverViewServices } from '../../../../build_services';
import { OsdFieldType } from '../../../../../../data/common/osd_field_types/osd_field_type';
import { getFieldType } from '../../../../../../data/common/data_frames/utils';

export type DiscoverVisFieldType = 'numerical' | 'categorical' | 'date';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  rows: OpenSearchSearchHit[],
  indexPattern: IndexPattern
) => {
  if (
    !indexPattern ||
    !searchContext ||
    !JSON.stringify(searchContext.query).toLowerCase().includes('stats') // query is not aggregated
  ) {
    return '';
  }

  const opensearchDashboards = buildExpressionFunction<ExpressionFunctionOpenSearchDashboards>(
    'opensearchDashboards',
    {}
  );
  const opensearchDashboardsContext = buildExpressionFunction('opensearch_dashboards_context', {
    timeRange: JSON.stringify(searchContext.timeRange || {}),
    filters: JSON.stringify(searchContext.filters || []),
    query: JSON.stringify(searchContext.query || []),
  });

  const vegaSpec = createVegaSpec(rows, indexPattern);

  const vega = buildExpressionFunction<any>('vega', {
    spec: JSON.stringify(vegaSpec),
  });

  return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
};

// TODO: map OSD_FIELD_TYPES to DiscoverVisFieldType
const getFieldTypeFromSchema = (schema: string): DiscoverVisFieldType => {
  switch (schema) {
    case 'string':
      return 'categorical';
    case 'number':
      return 'numerical';
    case 'double':
      return 'numerical';
    case 'integer':
      return 'numerical';
    case 'long':
      return 'numerical';
    case 'float':
      return 'numerical';
    case 'boolean':
      return 'numerical';
    case 'date':
      return 'date';
  }
  return 'categorical';
};

const createVegaSpec = (rows: OpenSearchSearchHit[], indexPattern: IndexPattern) => {
  const categoricalAxes = () => {};
  const isTimeBased = () => {};
  const numericalAxes = () => {};

  const columns = Object.keys(rows[0]._source).map((column, index) => {
    const schema = indexPattern.fields.getByName(column);
    if (!schema) {
      console.log(`Column ${column} not found in index pattern`);
      return {
        name: column,
        id: index,
        type: 'string',
      };
    } else {
      return {
        name: schema.name,
        id: index,
        schema: getFieldTypeFromSchema(schema.type),
      };
    }
    console.log('schema', schema);
    // const isDate = indexPattern.fields.getByName(column)?.type === 'date';
    // const isNumeric = indexPattern.fields.getByName(column)?.type === ('number' || 'double');
    // const isString = indexPattern.fields.getByName(column)?.type === 'string';
    // const isBoolean = indexPattern.fields.getByName(column)?.type === 'boolean';
    return {
      name: column,
      id: index,
    };
  });

  const data = rows.map((row: OpenSearchSearchHit) => {
    const transformedRow: Record<string, any> = {};
    for (const column of columns) {
      transformedRow[column.name] = row._source[column.name];
    }
    return transformedRow;
  });

  console.log('columns', columns);
  console.log('rows', rows);
  console.log('indexPattern', indexPattern);

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
    const colorIndex = (i - 1) % colorPalette.length;
    const color = colorPalette[colorIndex];

    const yAxisParam = {
      field: columns[i].name,
      type: 'quantitative',
      scale: { zero: false },
      axis: { titleColor: color, title: columns[i].name },
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
          columns: Math.min(3, columns.length - 1), // Limit to 3 columns or fewer legends
          padding: 10,
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

  console.log('vega spec REAL', spec);

  return spec;
};
