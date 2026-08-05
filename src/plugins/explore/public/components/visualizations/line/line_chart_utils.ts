/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarSeriesOption, LineSeriesOption } from 'echarts';
import { LineChartStyle, LineMode } from './line_vis_config';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { composeMarkLine } from '../utils/utils';
import { getSeriesDisplayName } from '../utils/series';
import { getColors } from '../theme/default_colors';
import {
  createSeriesLegendItem,
  getLegendColor,
  getLegendNameDomain,
  LegendItem,
} from '../utils/legend';

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

export const createLineSeries =
  <T extends BaseChartStyle>({
    styles,
    seriesFields,
    categoryField,
    addTimeMarker = true,
    allData,
    colorField,
  }: {
    styles: LineChartStyle;
    seriesFields: string[] | ((headers?: string[]) => string[]);
    categoryField: string;
    addTimeMarker?: boolean;
    allData?: Array<Record<string, any>>;
    colorField?: string;
  }): PipelineFn<T> =>
  (state) => {
    const { xAxisConfig, transformedData = [], axisColumnMappings } = state;
    const palette = getColors().categories;
    const newState = { ...state };
    const usedTimeMarker = addTimeMarker && styles.addTimeMarker;

    if (!Array.isArray(seriesFields)) {
      seriesFields = seriesFields(transformedData[0]);
    }

    const allColumns = Object.values(axisColumnMappings).flat();
    const sortedNames = getLegendNameDomain({
      data: allData,
      nameField: colorField,
      seriesFields,
      columns: allColumns,
    });
    const legendItems: LegendItem[] = [];

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
      const color = getLegendColor(name, palette, sortedNames);
      legendItems.push(createSeriesLegendItem(name, color));

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
          color,
        },
      };
    });

    newState.series = series as LineSeriesOption[];
    newState.legendItems = legendItems;

    return newState;
  };

export const createLineBarSeries =
  <T extends BaseChartStyle>({
    styles,
    valueField,
    value2Field,
    categoryField,
  }: {
    styles: LineChartStyle;
    valueField: string[];
    value2Field: string[];
    categoryField: string;
  }): PipelineFn<T> =>
  (state) => {
    const { xAxisConfig, axisColumnMappings } = state;
    const newState = { ...state };
    const palette = getColors().categories;
    const allColumns = Object.values(axisColumnMappings).flat();
    const seriesFields = [...valueField, ...value2Field];
    const sortedNames = getLegendNameDomain({
      seriesFields,
      columns: allColumns,
    });
    const legendItems: LegendItem[] = [];

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
        const name = getSeriesDisplayName(field, allColumns);
        const color = getLegendColor(name, palette, sortedNames);
        legendItems.push(createSeriesLegendItem(name, color));
        return {
          type: 'line',
          name,
          itemStyle: {
            color,
          },
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
        const name = getSeriesDisplayName(field, allColumns);
        const color = getLegendColor(name, palette, sortedNames);
        legendItems.push(createSeriesLegendItem(name, color));
        return {
          type: 'bar',
          name,
          itemStyle: {
            color,
          },
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

    newState.series = series as Array<LineSeriesOption | BarSeriesOption>;
    newState.legendItems = legendItems;

    return newState;
  };
