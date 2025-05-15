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
import { IFieldType, IndexPattern } from '../../../../../../data/public';
import { DiscoverViewServices } from '../../../../build_services';
import { cons } from 'fp-ts/lib/ReadonlyNonEmptyArray';

export type DiscoverVisFieldType = 'numerical' | 'categorical' | 'date';

interface DiscoverVisColumn {
  id: number;
  name: string;
  schema: DiscoverVisFieldType;
  column: string;
}

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  rows: OpenSearchSearchHit[],
  indexPattern: IndexPattern,
  fieldSchema: Array<Partial<IFieldType>>
) => {
  if (
    !indexPattern ||
    !searchContext ||
    !JSON.stringify(searchContext.query).toLowerCase().includes('stats') // Empty visualization if query is not aggregated
  ) {
    return '';
  }

  const columns: DiscoverVisColumn[] = fieldSchema.map((field, index) => {
    // Create a clean version of the field name
    return {
      id: index,
      schema: getFieldTypeFromSchema(field.type),
      name: field.name || '',
      column: `field-${index}`,
    };
  });

  const numericalColumns = columns.filter((column) => column.schema === 'numerical');
  const categoricalColumns = columns.filter((column) => column.schema === 'categorical');

  if (rows.length < 1) {
    return ''; // no visualization
  }

  if (rows.length === 1) {
    return ''; // metric/markdown visualization
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

  let vegaSpec;
  if (numericalColumns.length >= 1 && categoricalColumns.length === 1) {
    // Satisfy the condition of line chart
    vegaSpec = createVegaLineSpec(
      rows,
      indexPattern,
      columns,
      numericalColumns,
      categoricalColumns
    );
  } else {
    vegaSpec = '{}'; // Table visualization
  }

  const vega = buildExpressionFunction<any>('vega', {
    spec: JSON.stringify(vegaSpec),
  });

  return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
};

// TODO: map OSD_FIELD_TYPES to DiscoverVisFieldType
const getFieldTypeFromSchema = (schema?: string): DiscoverVisFieldType => {
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

const createVegaLineSpec = (
  rows: OpenSearchSearchHit[],
  indexPattern: IndexPattern,
  columns: DiscoverVisColumn[],
  numericalFields: any,
  categoricalFields: any
) => {
  // Transform data to a format Vega can use
  const data = rows.map((row: OpenSearchSearchHit) => {
    const transformedRow: Record<number, any> = {};
    for (const column of columns) {
      // Make sure we're consistent with field vs name
      const fieldName = column.name;
      transformedRow[column.column] = row._source[fieldName];
    }
    return transformedRow;
  });

  console.log('transformed data for vega:', data);

  // Make sure we have data, categorical and numerical fields
  if (data.length === 0 || !categoricalFields[0] || numericalFields.length < 1) {
    console.error('Not enough data or fields for visualization');
    return null;
  }

  const categoryField = categoricalFields[0].column;
  const numericFields = numericalFields.map((f) => f.column);

  console.log('category field:', categoryField);
  console.log('numeric field:', numericFields);

  // Colors for different lines
  const colors = ['#4C78A8', '#E45756', '#72B7B2', '#F58518', '#54A24B', '#B279A2'];

  // Create a layer for each numeric field
  const layers = numericFields.map((numericField, index) => {
    const colorIndex = index % colors.length;

    return {
      mark: {
        type: 'line',
        point: true,
        tooltip: true,
        stroke: colors[colorIndex],
      },
      encoding: {
        x: {
          field: categoryField,
          type: 'nominal',
          axis: {
            // Only first layer needs axis config
            title: categoryField,
            labelAngle: -45,
          },
        },
        y: {
          field: numericField,
          type: 'quantitative',
          title: numericField,
          axis: { title: categoryField }, // Only first layer needs Y-axis
        },
        color: {
          datum: numericField, // Use field name for color legend
          legend: {
            title: null,
          },
        },
        tooltip: [
          { field: categoryField, title: categoryField },
          { field: numericField, title: numericField },
        ],
      },
    };
  });

  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: data },
    layer: layers,
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

  console.log('vega spec REVISED:', spec);
  return spec;
};
