/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as echarts from 'echarts';

import { getColors } from './default_colors';
import { Config } from './config';

const colorPalettes = getColors();

export const DEFAULT_THEME = 'osd-default';
echarts.registerTheme(DEFAULT_THEME, createEchartsTheme(colorPalettes));

export function createEchartsTheme(colors: ReturnType<typeof getColors>) {
  const axis = {
    axisLine: {
      show: true,
      lineStyle: {
        color: colors.grid,
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: colors.grid,
      },
    },
    axisLabel: {
      show: true,
      color: colors.text,
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: [colors.grid],
      },
    },
    splitArea: {
      show: false,
    },
    nameTextStyle: {
      color: colors.text,
      fontWeight: 'bold',
    },
  };

  return {
    color: colors.categories,
    title: {
      textStyle: {
        color: colors.text,
      },
      subtextStyle: {
        color: colors.subText,
      },
    },
    categoryAxis: axis,
    valueAxis: axis,
    logAxis: axis,
    timeAxis: axis,
    legend: {
      textStyle: {
        color: colors.text,
      },
    },
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: colors.grid,
          width: 1,
        },
        crossStyle: {
          color: colors.grid,
          width: 1,
        },
      },
    },
    visualMap: {
      color: [colors.statusGreen, colors.statusYellow, colors.statusOrange, colors.statusRed],
    },
    animationDuration: 500,
  };
}

export const defaultTheme: Config = {
  arc: { fill: colorPalettes.categories[0] },
  area: { fill: colorPalettes.categories[0] },
  // path: { stroke: colorPalettes.categories[0] },
  rect: { fill: colorPalettes.categories[0] },
  // shape: { stroke: colorPalettes.categories[0] },
  // symbol: { stroke: colorPalettes.categories[0] },
  circle: { fill: colorPalettes.categories[0] },
  bar: { fill: colorPalettes.categories[0] },
  line: { stroke: colorPalettes.categories[0] },
  point: { fill: colorPalettes.categories[0], filled: true },
  text: { fill: colorPalettes.text },
  mark: { color: colorPalettes.categories[0] },
  style: {
    'guide-label': {
      fontSize: 12,
    },
    'guide-title': {
      fontSize: 12,
    },
    'group-title': {
      fontSize: 12,
    },
  },
  title: {
    fontSize: 14,
  },
  axis: {
    gridColor: colorPalettes.grid,
    tickColor: colorPalettes.grid,
    labelColor: colorPalettes.text,
    domainColor: colorPalettes.grid,
    domain: true,
    grid: true,
  },
  range: {
    category: colorPalettes.categories,
  },
  view: {
    stroke: null,
  },
};
