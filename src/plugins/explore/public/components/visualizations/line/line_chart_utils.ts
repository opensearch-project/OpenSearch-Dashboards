/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineSeriesOption } from 'echarts';
import { LineChartStyle, LineMode } from './line_vis_config';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { composeMarkLine } from '../utils/utils';
import { getSeriesDisplayName } from '../utils/series';
import { getColors } from '../theme/default_colors';

const getLineInterpolation = (lineMode: LineMode) => {
  switch (lineMode) {
    case 'straight':
      return {};
    case 'smooth':
      return {
        smooth: true,
      };
    case 'stepped':
      return {
        step: true,
      };
  }
};

const generateLineStyles = (styles: LineChartStyle) => {
  const lineWidth = styles.lineStyle === 'dots' ? 0 : styles?.lineWidth;
  return {
    ...(styles.lineStyle === 'line' ? { showSymbol: false } : {}),
    lineStyle: {
      width: lineWidth,
    },
    ...getLineInterpolation(styles.lineMode),
  };
};

export const createLineSeries = <T extends BaseChartStyle>({
  styles,
  seriesFields,
  categoryField,
  addTimeMarker = true,
}: {
  styles: LineChartStyle;
  seriesFields: string[] | ((headers?: string[]) => string[]);
  categoryField: string;
  addTimeMarker?: boolean;
}): PipelineFn<T> => (state) => {
  const { xAxisConfig, transformedData = [], axisColumnMappings } = state;
  const palette = getColors().categories;
  const newState = { ...state };
  const usedTimeMarker = addTimeMarker && styles.addTimeMarker;

  if (!Array.isArray(seriesFields)) {
    seriesFields = seriesFields(transformedData[0]);
  }

  const allColumns = Object.values(axisColumnMappings).flat();
  const sortedNames = seriesFields.map((f) => getSeriesDisplayName(f, allColumns)).sort();

  if (usedTimeMarker) {
    {
      // manually extend xAxis range
      const newXAxisConfig = { ...xAxisConfig };
      newXAxisConfig.max = new Date();
      newState.xAxisConfig = newXAxisConfig;
    }
  }

  const series = seriesFields?.map((item: string) => {
    const name = getSeriesDisplayName(item, allColumns);
    const colorIndex = sortedNames.indexOf(name);

    return {
      name,
      type: 'line',
      connectNulls: true,
      encode: {
        x: categoryField,
        y: item,
      },
      emphasis: {
        focus: 'self',
      },
      ...generateLineStyles(styles),
      ...composeMarkLine(styles?.thresholdOptions, styles?.addTimeMarker),
      itemStyle: {
        color: palette[colorIndex % palette.length],
      },
    };
  });

  newState.series = series as LineSeriesOption[];

  return newState;
};

export const createLineBarSeries = <T extends BaseChartStyle>({
  styles,
  valueField,
  value2Field,
  categoryField,
}: {
  styles: LineChartStyle;
  valueField: string[];
  value2Field: string[];
  categoryField: string;
}): PipelineFn<T> => (state) => {
  const { xAxisConfig, axisColumnMappings } = state;
  const newState = { ...state };

  // TODO: move this to buildAxisConfigs function
  if (styles.addTimeMarker) {
    {
      // manully extend xAxis range
      const newxAxisConfig = { ...xAxisConfig };
      newxAxisConfig.max = new Date();
      newState.xAxisConfig = newxAxisConfig;
    }
  }

  const series = [
    ...valueField.map((field) => {
      const name = getSeriesDisplayName(field, Object.values(axisColumnMappings).flat());
      return {
        type: 'line',
        name,
        ...generateLineStyles(styles),
        ...composeMarkLine(styles?.thresholdOptions, styles?.addTimeMarker),
        yAxisIndex: 0,
        encode: {
          x: categoryField,
          y: field,
        },
        emphasis: {
          focus: 'self',
        },
      };
    }),
    ...value2Field.map((field) => {
      const name = getSeriesDisplayName(field, Object.values(axisColumnMappings).flat());
      return {
        type: 'bar',
        name,
        yAxisIndex: 1,
        encode: {
          x: categoryField,
          y: field,
        },
        emphasis: {
          focus: 'self',
        },
      };
    }),
  ];

  newState.series = series as LineSeriesOption[];

  return newState;
};
