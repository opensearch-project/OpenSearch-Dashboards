/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StandardAxes,
  VisFieldType,
  VisColumn,
  TimeUnit,
  AggregationType,
  AxisRole,
} from '../types';
import { applyAxisStyling, getSchemaByAxis } from '../utils/utils';
import { AreaChartStyle } from './area_vis_config';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';
import { BaseChartStyle, EChartsSpecState, PipelineFn } from '../utils/echarts_spec';

export const inferTimeIntervals = (data: Array<Record<string, any>>, field: string | undefined) => {
  if (!data || data.length === 0 || !field) {
    return TimeUnit.DATE;
  }

  const timestamps = data
    .map((row) => new Date(row[field]).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  const last = timestamps[timestamps.length - 1];
  const first = timestamps[0];
  const minDiff = last - first;

  const interval = minDiff / 30;

  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;

  if (interval <= second) return TimeUnit.SECOND;
  if (interval <= minute) return TimeUnit.MINUTE;
  if (interval <= hour) return TimeUnit.HOUR;
  if (interval <= day) return TimeUnit.DATE;
  if (interval <= month) return TimeUnit.MONTH;
  return TimeUnit.YEAR;
};

export const transformIntervalsToTickCount = (interval: TimeUnit | undefined) => {
  switch (interval) {
    case TimeUnit.YEAR:
      return 'year';
    case TimeUnit.MONTH:
      return 'month';
    case TimeUnit.DATE:
      return 'day';
    case TimeUnit.HOUR:
      return 'hour';
    case TimeUnit.MINUTE:
      return 'minute';
    case TimeUnit.SECOND:
      return 'second';
    default:
      return 'day';
  }
};

export const buildEncoding = (
  axis: VisColumn | undefined,
  axisStyle: StandardAxes | undefined,
  interval: TimeUnit | undefined,
  aggregationType?: AggregationType | undefined
) => {
  const defaultAxisTitle = '';
  const encoding: any = {
    field: axis?.column,
    type: getSchemaByAxis(axis),
    axis: applyAxisStyling({ axis, axisStyle, defaultAxisTitle }),
  };

  if (axis?.schema === VisFieldType.Date && interval) {
    encoding.timeUnit = interval;
    encoding.axis.tickCount = transformIntervalsToTickCount(interval);
  }

  if (axis?.schema === VisFieldType.Numerical && aggregationType) {
    encoding.aggregate = aggregationType;
  }

  return encoding;
};

export const buildTooltipEncoding = (
  axis: VisColumn | undefined,
  axisStyle: StandardAxes | undefined,
  interval: TimeUnit | undefined,
  aggregationType?: AggregationType | undefined
) => {
  const encoding: any = {
    field: axis?.column,
    type: getSchemaByAxis(axis),
    title: axisStyle?.title?.text || axis?.name,
  };

  if (axis?.schema === VisFieldType.Date && interval) {
    encoding.timeUnit = interval;
  }

  if (axis?.schema === VisFieldType.Numerical && aggregationType) {
    encoding.aggregate = aggregationType;
    encoding.title = axisStyle?.title?.text || `${axis?.name}(${aggregationType})`;
  }
  return encoding;
};

export const buildThresholdColorEncoding = (
  numericalField: VisColumn | undefined,
  styleOptions: Partial<AreaChartStyle>
) => {
  // support old thresholdLines config to be compatible with new thresholds

  const activeThresholds = styleOptions?.thresholdOptions?.thresholds ?? [];

  const thresholdWithBase = [
    { value: 0, color: styleOptions?.thresholdOptions?.baseColor ?? getColors().statusGreen },
    ...activeThresholds,
  ];

  const colorDomain = thresholdWithBase.reduce<number[]>((acc, val) => [...acc, val.value], []);

  const colorRange = thresholdWithBase.reduce<string[]>((acc, val) => [...acc, val.color], []);

  // exclusive for single numerical bucket area
  if (!numericalField)
    return {
      aggregate: AggregationType.COUNT,
      type: 'quantitative',
      scale: {
        type: 'threshold',
        domain: colorDomain,
        // require one more color for values below the first threshold(base)
        range: [DEFAULT_GREY, ...colorRange],
      },
      legend: styleOptions.addLegend
        ? {
            orient: styleOptions.legendPosition?.toLowerCase() || 'right',
            title: 'Thresholds',
          }
        : null,
    };

  const colorLayer = {
    field: numericalField?.column,
    type: 'quantitative',
    scale: {
      type: 'threshold',
      domain: colorDomain,
      range: [DEFAULT_GREY, ...colorRange],
    },
    legend: styleOptions.addLegend
      ? {
          orient: styleOptions.legendPosition?.toLowerCase() || 'right',
          title: 'Thresholds',
        }
      : null,
  };

  return colorLayer;
};

/**
 * Create area series configuration for ECharts
 */
export const createAreaSeries = <T extends BaseChartStyle>(
  styles: AreaChartStyle
): PipelineFn<T> => (state) => {
  const { axisConfig, aggregatedData } = state;
  const newState = { ...state };
  newState.series = [];
  delete newState.spec;

  if (!axisConfig) {
    throw new Error('axisConfig must be derived before createAreaSeries');
  }

  if (!aggregatedData || !Array.isArray(aggregatedData) || aggregatedData.length < 2) {
    throw new Error('aggregatedData must be a 2D array with header and data rows');
  }

  const numericalAxis = [axisConfig.xAxis, axisConfig.yAxis].find(
    (axis) => axis?.schema === VisFieldType.Numerical
  );

  // Simple single area series using dataset + encode
  const series = [
    {
      type: 'line' as const,
      name: numericalAxis?.name || 'Area',
      areaStyle: {
        opacity: styles.areaOpacity || 0.3,
      },
      smooth: true,
      encode: {
        x: axisConfig.xAxis?.column,
        y: axisConfig.yAxis?.column,
      },
    },
  ];

  newState.series = series;
  return newState;
};

/**
 * Create stacked area series configuration for ECharts
 */
export const createStackAreaSeries = <T extends BaseChartStyle>(
  styles: AreaChartStyle
): PipelineFn<T> => (state) => {
  const { axisConfig, aggregatedData } = state;
  const newState = { ...state };
  newState.series = [];
  delete newState.spec;

  if (!axisConfig) {
    throw new Error('axisConfig must be derived before createStackAreaSeries');
  }

  if (!aggregatedData) {
    throw new Error('aggregatedData must be available for createStackAreaSeries');
  }

  // Check if aggregatedData is in the expected 2D array format
  if (!Array.isArray(aggregatedData) || aggregatedData.length < 2) {
    throw new Error('aggregatedData must be a 2D array with header and data rows');
  }

  // Find the x-axis column (group field) - similar to bar chart logic
  const actualX = axisConfig.xAxis;

  if (!actualX?.column) {
    throw new Error('xAxis column must be available for createStackAreaSeries');
  }

  // Get category columns from the first row (header), excluding the x-axis column
  const headerRow = aggregatedData[0] as string[];
  const cateColumns = headerRow.filter((c: string) => c !== actualX.column);

  // Debug logs removed for cleaner output

  if (!cateColumns || cateColumns.length === 0) {
    throw new Error('No category columns found for stacked area series');
  }

  // Create multi-series for each category column
  const newseries = cateColumns.map((categoryName: string) => ({
    name: String(categoryName),
    type: 'line' as const,
    stack: 'Total',
    areaStyle: {
      opacity: styles.areaOpacity || 0.3,
    },
    smooth: true, // Area charts typically use smooth lines
    encode: {
      x: actualX.column,
      y: categoryName,
    },
    emphasis: {
      focus: 'self' as const,
    },
  }));

  // Series created successfully
  newState.series = newseries;

  return newState;
};

/**
 * Create faceted area series configuration for ECharts
 * Implements proper multi-grid faceting based on official ECharts pattern
 */
export const createFacetedAreaSeries = <T extends BaseChartStyle>(
  styles: AreaChartStyle
): PipelineFn<T> => (state) => {
  const { axisConfig, data, axisColumnMappings } = state;
  const newState = { ...state };
  newState.series = [];
  delete newState.spec;

  if (!axisConfig) {
    throw new Error('axisConfig must be derived before createFacetedAreaSeries');
  }

  // Get facet column and color column
  const facetColumn = axisColumnMappings?.[AxisRole.FACET];
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];

  if (!facetColumn) {
    return createAreaSeries(styles)(state) as EChartsSpecState<T>;
  }

  // Ensure we have valid column names
  const xColumn = axisConfig.xAxis?.column;
  const yColumn = axisConfig.yAxis?.column;
  const facetColumnName = facetColumn.column;

  if (!xColumn || !yColumn) {
    throw new Error('Both X and Y axis columns must be defined for faceted area chart');
  }

  // Get unique values for faceting and stacking
  const uniqueFacetValues = Array.from(new Set(data.map((row) => row[facetColumnName]))).filter(
    (val) => val !== null && val !== undefined && val !== ''
  );
  const uniqueColorValues = colorColumn
    ? Array.from(new Set(data.map((row) => row[colorColumn.column]))).filter(
        (val) => val !== null && val !== undefined
      )
    : ['default'];

  // Check if x-axis is categorical
  const isXAxisCategorical = axisConfig.xAxis?.schema === VisFieldType.Categorical;

  // Create grids, axes, and series for each facet
  const grids: any[] = [];
  const xAxes: any[] = [];
  const yAxes: any[] = [];
  const series: any[] = [];

  const numFacets = uniqueFacetValues.length;

  if (numFacets < 1) {
    // No facets, fall back to regular area chart
    return createAreaSeries(styles)(state) as EChartsSpecState<T>;
  }

  // Create grids dynamically based on number of facets
  if (numFacets === 1) {
    // Single grid
    grids.push({ left: '10%', width: '80%', top: '10%', height: '70%' });
  } else if (numFacets === 2) {
    // Side by side
    grids.push(
      { left: '7%', width: '38%', top: '10%', height: '70%' },
      { left: '55%', width: '38%', top: '10%', height: '70%' }
    );
  } else if (numFacets === 3) {
    // 3 facets: use scrolling layout
    const baseGridWidth = 30;
    const marginBetweenGrids = 5;

    for (let i = 0; i < numFacets; i++) {
      grids.push({
        left: `${5 + i * (baseGridWidth + marginBetweenGrids)}%`,
        width: `${baseGridWidth}%`,
        top: '10%',
        height: '70%',
      });
    }
  } else if (numFacets === 4) {
    // 4 facets: 2x2 grid layout
    const positions = [
      { left: '7%', width: '38%', top: '10%', height: '35%' }, // top-left
      { left: '55%', width: '38%', top: '10%', height: '35%' }, // top-right
      { left: '7%', width: '38%', top: '55%', height: '35%' }, // bottom-left
      { left: '55%', width: '38%', top: '55%', height: '35%' }, // bottom-right
    ];
    for (let i = 0; i < numFacets; i++) {
      grids.push(positions[i]);
    }
  } else {
    // For 5+ facets, use horizontal scrolling layout with fixed-size grids
    const targetGridWidth = 30; // Target width as percentage of viewport (not container)
    const marginBetweenGrids = 3; // Margin as percentage of viewport
    const numCols = Math.ceil(numFacets / 2); // Number of columns needed

    // Calculate total width needed
    const totalWidthNeeded = 6 + numCols * (targetGridWidth + marginBetweenGrids);

    // Adjust grid width to maintain target size relative to viewport
    const adjustedGridWidth = (targetGridWidth * 100) / totalWidthNeeded;
    const adjustedMargin = (marginBetweenGrids * 100) / totalWidthNeeded;

    // Simple 2-row layout, grids distributed across rows
    for (let i = 0; i < numFacets; i++) {
      const row = i % 2; // Alternate between row 0 and 1
      const colInRow = Math.floor(i / 2); // Column position (0, 1, 2, ...)

      grids.push({
        left: `${(3 * 100) / totalWidthNeeded + colInRow * (adjustedGridWidth + adjustedMargin)}%`,
        width: `${adjustedGridWidth}%`,
        top: `${10 + row * 45}%`,
        height: '35%',
      });
    }
  }

  // Create axes dynamically
  for (let i = 0; i < numFacets; i++) {
    xAxes.push({ type: isXAxisCategorical ? 'category' : 'time', gridIndex: i });
    yAxes.push({ type: 'value', gridIndex: i });
  }

  // Create series for each facet
  for (let facetIndex = 0; facetIndex < numFacets; facetIndex++) {
    const facetValue = uniqueFacetValues[facetIndex];

    // Get all data for this facet
    const facetData = data.filter((row) => row[facetColumnName] === facetValue);

    if (facetData.length === 0) {
      continue;
    }

    // Get time points for this specific facet only
    const facetTimePoints = isXAxisCategorical
      ? Array.from(new Set(facetData.map((row) => row[xColumn]))).sort((a, b) =>
          String(a).localeCompare(String(b))
        )
      : Array.from(new Set(facetData.map((row) => row[xColumn]))).sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );

    // Create series for each color value within this facet
    uniqueColorValues.forEach((colorValue) => {
      const colorData = facetData.filter(
        (row) => !colorColumn || row[colorColumn.column] === colorValue
      );

      if (colorData.length === 0) return;

      // Aggregate data by time points
      let seriesData;
      if (isXAxisCategorical) {
        const categoryMap = new Map();
        colorData.forEach((row) => {
          const category = row[xColumn];
          const currentValue = categoryMap.get(category) || 0;
          categoryMap.set(category, currentValue + (row[yColumn] || 0));
        });
        seriesData = facetTimePoints.map((category) => [category, categoryMap.get(category) || 0]);
      } else {
        const timeMap = new Map();
        colorData.forEach((row) => {
          const timePoint = row[xColumn];
          const currentValue = timeMap.get(timePoint) || 0;
          timeMap.set(timePoint, currentValue + (row[yColumn] || 0));
        });
        seriesData = facetTimePoints.map((timePoint) => [timePoint, timeMap.get(timePoint) || 0]);
      }

      const seriesName = colorColumn
        ? String(colorValue || 'Unknown')
        : String(facetValue || 'Unknown');

      series.push({
        type: 'line',
        name: seriesName,
        data: seriesData,
        xAxisIndex: facetIndex,
        yAxisIndex: facetIndex,
        stack: `Total_${facetIndex}`,
        areaStyle: { opacity: styles.areaOpacity || 0.3 },
        smooth: !isXAxisCategorical,
      });
    });
  }

  // Calculate total width needed for horizontal scrolling
  let totalWidthPercent = 100; // Default width percentage

  if (numFacets === 3) {
    // 3 facets in a row
    const baseGridWidth = 30;
    const marginBetweenGrids = 5;
    totalWidthPercent = Math.max(100, 10 + numFacets * (baseGridWidth + marginBetweenGrids));
  } else if (numFacets > 4) {
    // 5+ facets in 2 rows - calculate based on target viewport sizes
    const targetGridWidth = 30; // Target width as percentage of viewport
    const marginBetweenGrids = 3; // Margin as percentage of viewport
    const numCols = Math.ceil(numFacets / 2); // Number of columns (since we have 2 rows)
    totalWidthPercent = Math.max(100, 6 + numCols * (targetGridWidth + marginBetweenGrids));
  }

  // Set the grids, axes, and series in the state
  (newState as any).grids = grids;
  (newState as any).xAxes = xAxes;
  (newState as any).yAxes = yAxes;
  (newState as any).totalWidth = totalWidthPercent; // Pass total width for scrolling
  newState.series = series;

  return newState;
};
