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
import { IndexPattern } from '../../../../../../data/public';
import { DiscoverViewServices } from '../../../../build_services';
import { LineChartStyleControls } from './line_vis_config';
import { DiscoverVisColumn } from '../types';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
  styleOptions?: Partial<LineChartStyleControls>
) => {
  console.log('line chart');
  if (
    !indexPattern ||
    !searchContext ||
    !JSON.stringify(searchContext.query).toLowerCase().includes('stats') // Empty visualization if query is not aggregated
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

  const vegaSpec = createVegaLineSpec(
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

// Todo: this func needs modification based on the new mapping rules
const createVegaLineSpec = (
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
  styleOptions?: Partial<LineChartStyleControls>
) => {
  console.log('transformedData', transformedData);
  console.log('numericalColumns', numericalColumns);
  console.log('categoricalColumns', categoricalColumns);
  console.log('dateColumns', dateColumns);

  // Todo: revise this to use the new mapping rules

  // Validate inputs
  if (!transformedData || transformedData.length === 0) {
    return null;
  }

  // Get column counts
  const numMetrics = numericalColumns?.length || 0;
  const numCategories = categoricalColumns?.length || 0;
  const numDates = dateColumns?.length || 0;

  // Apply default style options
  const defaultStyles: any = {
    addLegend: true,
    legendPosition: 'right',
    lineWidth: 2,
    showPoints: true,
    interpolate: 'monotone',
    // ... other defaults
  };

  const styles = { ...defaultStyles, ...styleOptions };
  console.log('defaultStyles', defaultStyles);
  console.log('newstyles', styles);

  let newSpec: any;

  // Rule 1: 1 Metric & 1 Date → Line Chart
  if (numMetrics === 1 && numDates === 1 && numCategories === 0) {
    const metricField = numericalColumns[0].column; // 'field-0'
    const dateField = dateColumns[0].column; // 'field-1'
    const metricName = numericalColumns[0].name; // 'avg ( products.base_price )'
    const dateName = dateColumns[0].name; // 'order_date'

    newSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: `${metricName} Over Time`,
      data: { values: transformedData },
      mark: {
        type: 'line',
        point: styles.showPoints,
        tooltip: true,
        strokeWidth: styles.lineWidth,
        interpolate: styles.interpolate,
      },
      encoding: {
        x: {
          field: dateField,
          type: 'temporal',
          axis: {
            title: dateName,
            labelAngle: -45,
          },
        },
        y: {
          field: metricField,
          type: 'quantitative',
          axis: { title: metricName },
        },
      },
    };
  }

  // Rule 2: 2 Metrics & 1 Date → Line + Bar Chart
  else if (numMetrics === 2 && numDates === 1 && numCategories === 0) {
    const metric1Field = numericalColumns[0].column;
    const metric2Field = numericalColumns[1].column;
    const dateField = dateColumns[0].column;
    const metric1Name = numericalColumns[0].name;
    const metric2Name = numericalColumns[1].name;
    const dateName = dateColumns[0].name;

    newSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: `${metric1Name} (Bar) and ${metric2Name} (Line) Over Time`,
      data: { values: transformedData },
      layer: [
        {
          mark: {
            type: 'bar',
            opacity: 0.7,
            tooltip: true,
          },
          encoding: {
            x: {
              field: dateField,
              type: 'temporal',
              axis: {
                title: dateName,
                labelAngle: -45,
              },
            },
            y: {
              field: metric1Field,
              type: 'quantitative',
              axis: { title: metric1Name },
            },
            color: {
              datum: metric1Name,
              legend: styles.addLegend
                ? {
                    title: 'Metrics',
                    orient: styles.legendPosition,
                  }
                : null,
            },
          },
        },
        {
          mark: {
            type: 'line',
            point: styles.showPoints,
            tooltip: true,
            strokeWidth: styles.lineWidth,
            interpolate: styles.interpolate,
          },
          encoding: {
            x: {
              field: dateField,
              type: 'temporal',
            },
            y: {
              field: metric2Field,
              type: 'quantitative',
              axis: {
                title: metric2Name,
                orient: 'right',
              },
              scale: { zero: false },
            },
            color: {
              datum: metric2Name,
              legend: styles.addLegend
                ? {
                    title: 'Metrics',
                    orient: styles.legendPosition,
                  }
                : null,
            },
          },
        },
      ],
      resolve: {
        scale: { y: 'independent' },
      },
    };
  }

  // Rule 3: 1 Metric & 1 Date & 1 Categorical → Multi-line Chart
  else if (numMetrics === 1 && numDates === 1 && numCategories === 1) {
    const metricField = numericalColumns[0].column;
    const dateField = dateColumns[0].column;
    const categoryField = categoricalColumns[0].column;
    const metricName = numericalColumns[0].name;
    const dateName = dateColumns[0].name;
    const categoryName = categoricalColumns[0].name;

    newSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: `${metricName} Over Time by ${categoryName}`,
      data: { values: transformedData },
      mark: {
        type: 'line',
        point: styles.showPoints,
        tooltip: true,
        strokeWidth: styles.lineWidth,
        interpolate: styles.interpolate,
      },
      encoding: {
        x: {
          field: dateField,
          type: 'temporal',
          axis: {
            title: dateName,
            labelAngle: -45,
          },
        },
        y: {
          field: metricField,
          type: 'quantitative',
          axis: { title: metricName },
        },
        color: {
          field: categoryField,
          type: 'nominal',
          legend: styles.addLegend
            ? {
                title: categoryName,
                orient: styles.legendPosition,
              }
            : null,
        },
      },
    };
  }

  // Rule 4: 1 Metric & 1 Date & 2 Categorical → Faceted Multi-line Chart
  else if (numMetrics === 1 && numDates === 1 && numCategories === 2) {
    const metricField = numericalColumns[0].column;
    const dateField = dateColumns[0].column;
    const category1Field = categoricalColumns[0].column;
    const category2Field = categoricalColumns[1].column;
    const metricName = numericalColumns[0].name;
    const dateName = dateColumns[0].name;
    const category1Name = categoricalColumns[0].name;
    const category2Name = categoricalColumns[1].name;

    newSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: `${metricName} Over Time by ${category1Name} (Faceted by ${category2Name})`,
      data: { values: transformedData },
      facet: {
        field: category2Field,
        type: 'nominal',
        columns: 2,
        header: { title: category2Name },
      },
      spec: {
        width: 300,
        height: 200,
        mark: {
          type: 'line',
          point: styles.showPoints,
          tooltip: true,
          strokeWidth: styles.lineWidth,
          interpolate: styles.interpolate,
        },
        encoding: {
          x: {
            field: dateField,
            type: 'temporal',
            axis: {
              title: dateName,
              labelAngle: -45,
            },
          },
          y: {
            field: metricField,
            type: 'quantitative',
            axis: { title: metricName },
          },
          color: {
            field: category1Field,
            type: 'nominal',
            legend: styles.addLegend
              ? {
                  title: category1Name,
                  orient: styles.legendPosition,
                }
              : null,
          },
        },
      },
    };
  }

  // No matching rule found
  else {
    console.warn('No matching visualization rule found for the given field combination');
    return null;
  }

  return newSpec;
};

// // Transform data to a format Vega can use
// const data = rows.map((row: OpenSearchSearchHit) => {
//   const transformedRow: Record<number, any> = {};
//   for (const column of columns) {
//     // Make sure we're consistent with field vs name
//     const fieldName = column.name;
//     transformedRow[column.column] = row._source[fieldName];
//   }
//   return transformedRow;
// });

// // Colors for different lines
// const colors = ['#4C78A8', '#E45756', '#72B7B2', '#F58518', '#54A24B', '#B279A2'];

// // Create a layer for each numeric field
// const layers = numericFields.map((numericField, index) => {
//   const colorIndex = index % colors.length;

//   return {
//     mark: {
//       type: 'line',
//       point: true,
//       tooltip: true,
//       stroke: colors[colorIndex],
//     },
//     encoding: {
//       x: {
//         field: categoryField,
//         type: 'nominal',
//         axis: {
//           // Only first layer needs axis config
//           title: categoryField,
//           labelAngle: -45,
//         },
//       },
//       y: {
//         field: numericField,
//         type: 'quantitative',
//         title: numericField,
//         axis: { title: categoryField }, // Only first layer needs Y-axis
//       },
//       color: {
//         datum: numericField, // Use field name for color legend
//         legend: {
//           title: null,
//         },
//       },
//       tooltip: [
//         { field: categoryField, title: categoryField },
//         { field: numericField, title: numericField },
//       ],
//     },
//   };
// });

// // Create the base Vega spec
// const baseSpec = {
//   $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
//   autosize: { type: 'fit', contains: 'padding' },
//   data: { values: data },
//   layer: layers,
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

// const newSpec = { ...baseSpec };

// // Apply style options
// if (styleOptions) {
//   if (newSpec.layer) {
//     newSpec.layer = newSpec.layer.map((layer: any) => {
//       if (layer.encoding?.color) {
//         if (!styleOptions.addLegend) {
//           layer.encoding.color.legend = null;
//         } else {
//           layer.encoding.color.legend = {
//             ...layer.encoding.color.legend,
//             orient: styleOptions.legendPosition,
//           };
//         }
//       }
//       return layer;
//     });
//   }
// }

// console.log('vega spec REVISED:', newSpec);
