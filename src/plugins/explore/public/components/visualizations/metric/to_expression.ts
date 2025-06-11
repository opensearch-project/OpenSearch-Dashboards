/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schemeBlues } from 'd3-scale-chromatic';
import {
  buildExpression,
  buildExpressionFunction,
  ExpressionFunctionOpenSearchDashboards,
  IExpressionLoaderParams,
} from '../../../../../../expressions/public';
import { IndexPattern } from '../../../../../../data/public';
import { DiscoverViewServices } from '../../../../build_services';
import { MetricChartStyleControls } from './metric_vis_config';
import { DiscoverVisColumn, RangeValue } from '../types';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
  styleOptions?: Partial<MetricChartStyleControls>
) => {
  if (
    !indexPattern ||
    !searchContext ||
    !JSON.stringify(searchContext.query).toLowerCase().includes('stats')
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

  const vegaSpec = createVegaMetricSpec(
    indexPattern,
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions
  );

  const vega = buildExpressionFunction<any>('vega', {
    spec: JSON.stringify(vegaSpec),
  });
  return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
};

const createVegaMetricSpec = (
  indexPattern?: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
  styleOptions?: Partial<MetricChartStyleControls>
) => {
  if (!transformedData || transformedData.length === 0) {
    return null;
  }

  const numericFields = numericalColumns?.map((item) => item.name)[0];

  const allColumns = [
    ...(numericalColumns || []),
    ...(categoricalColumns || []),
    ...(dateColumns || []),
  ];

  function generateColorConditions(ranges: RangeValue[]) {
    const colors = schemeBlues[9];
    const conditions = [];

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];

      const minTest = `datum["${numericFields}"] >= ${r.min}`;
      const maxTest = r.max !== undefined ? ` && datum["${numericFields}"] < ${r.max}` : '';

      conditions.push({
        test: minTest + maxTest,
        value: colors[i] || colors[colors.length - 1], // fallback color if not enough
      });
    }
    const last = ranges[ranges.length - 1];
    if (last.max) {
      conditions.push({
        test: `datum["${numericFields}"] >= ${last.max}`,
        value: colors[colors.length - 1],
      });
    }

    return conditions;
  }

  const idToNameMap = new Map(allColumns.map((col) => [col.column, col.name]));

  // map fields in transformedData to genuine field
  function mapTransformedDataKeys(data: Array<Record<string, any>>): Array<Record<string, any>> {
    return data.map((item) => {
      const mappedItem: Record<string, any> = {};
      Object.entries(item).forEach(([key, value]) => {
        const realKey = idToNameMap.get(key) || key;
        mappedItem[realKey] = value;
      });

      return mappedItem;
    });
  }

  const markLayer: any = {
    mark: {
      type: 'text',
      align: 'center',
      fontSize: styleOptions?.fontSize,
      fontWeight: 'bold',
    },
    encoding: {
      text: {
        field: numericFields,
        type: 'quantitative',
      },
    },
  };

  const titleLayer = {
    mark: {
      type: 'text',
      align: 'center',
      dy: 50,
      fontSize: 16,
      fontWeight: 'bold',
    },
    encoding: {
      text: {
        value: styleOptions?.title || numericFields,
      },
    },
  };

  if (styleOptions?.useColor && styleOptions.customRanges && styleOptions.customRanges.length > 0) {
    markLayer.encoding.color = {};
    markLayer.encoding.color.condition = generateColorConditions(styleOptions.customRanges);
  }

  const baseSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: mapTransformedDataKeys(transformedData) },
    layer: [markLayer, styleOptions?.showTitle ? titleLayer : null].filter(Boolean),
  };

  return baseSpec;
};
