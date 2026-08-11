/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarSeriesOption, LineSeriesOption } from 'echarts';
import { LineChartStyle } from './line_vis_config';
import { DisableMode } from '../types';
import { resolveConnectMode, groupSeries } from '../utils/data_transformation';
import { getLineInterpolation } from '../style_panel/share/line_shared_options';
import { getPointSymbol } from '../style_panel/share/point_size_options';
import { buildValueLabel } from '../style_panel/share/value_label_options';
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

const generateLineStyles = (styles: LineChartStyle, valueField?: string) => {
  const lineWidth = styles.lineStyle === 'dots' ? 0 : styles?.lineWidth;
  // Point size and value labels are only offered in dots mode
  // other modes keep drawing their symbols at the size ECharts picks and stay unlabelled
  const dotsOnlyOptions =
    styles.lineStyle === 'dots'
      ? {
          ...getPointSymbol(styles.pointSize, styles.showValues),
          ...(valueField ? buildValueLabel(styles.showValues, valueField) : {}),
        }
      : {};
  return {
    ...(styles.lineStyle === 'line' ? { showSymbol: false } : {}),
    ...dotsOnlyOptions,
    lineStyle: {
      width: lineWidth,
    },
    ...getLineInterpolation(styles.lineMode),
  };
};

export const buildConnectNulls = (styles: LineChartStyle): boolean =>
  resolveConnectMode(styles) === DisableMode.Always;

/**
 * Build one series per group, each bound to its own dataset.
 */
export const createGroupedLineSeries =
  <T extends BaseChartStyle>({
    styles,
    categoryField,
    valueField,
    addTimeMarker = true,
    allData,
    colorField,
  }: {
    styles: LineChartStyle;
    categoryField: string;
    valueField: string;
    addTimeMarker?: boolean;
    allData?: Array<Record<string, any>>;
    colorField?: string;
  }): PipelineFn<T> =>
  (state) => {
    const { xAxisConfig, axisColumnMappings, data = [] } = state;

    const palette = getColors().categories;
    const newState = { ...state };
    const usedTimeMarker = addTimeMarker && styles.addTimeMarker;

    const allColumns = Object.values(axisColumnMappings).flat();

    const allValues = colorField
      ? groupSeries(data, { groupField: colorField, valueField }).map(({ name }) => name)
      : [];
    const sortedNames = getLegendNameDomain({
      data: allData,
      nameField: colorField,
      seriesFields: allValues,
      columns: allColumns,
    });
    const legendItems: LegendItem[] = [];
    const connectNulls = buildConnectNulls(styles);

    if (usedTimeMarker) {
      const newXAxisConfig = { ...xAxisConfig };
      newXAxisConfig.max = new Date();
      newState.xAxisConfig = newXAxisConfig;
    }

    const series = allValues.map((name, index) => {
      const color = getLegendColor(name, palette, sortedNames);
      legendItems.push(createSeriesLegendItem(name, color));

      return {
        name,
        type: 'line',
        connectNulls,
        datasetIndex: index,
        encode: {
          x: categoryField,
          y: valueField,
        },
        emphasis: {
          focus: 'self',
        },
        ...generateLineStyles(styles, valueField),
        ...(index === 0 && composeMarkLine(styles?.thresholdOptions, styles?.addTimeMarker)),
        itemStyle: {
          color,
        },
      };
    });

    newState.series = series as LineSeriesOption[];
    newState.legendItems = legendItems;

    return newState;
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
    const connectNulls = buildConnectNulls(styles);

    if (usedTimeMarker) {
      {
        // manually extend xAxis range
        const newXAxisConfig = { ...xAxisConfig };
        newXAxisConfig.max = new Date();
        newState.xAxisConfig = newXAxisConfig;
      }
    }

    const series = seriesFields?.map((item: string, index: number) => {
      const name = getSeriesDisplayName(item, allColumns);
      const color = getLegendColor(name, palette, sortedNames);
      legendItems.push(createSeriesLegendItem(name, color));

      return {
        name,
        type: 'line',
        connectNulls,
        encode: {
          x: categoryField,
          y: item,
        },
        emphasis: {
          focus: 'self',
        },
        ...generateLineStyles(styles, item),
        ...(index === 0 && composeMarkLine(styles?.thresholdOptions, styles?.addTimeMarker)),
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
          ...generateLineStyles(styles, field),
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
