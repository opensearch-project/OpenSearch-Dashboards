/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as echarts from 'echarts';

import { getColors } from './default_colors';

export const DEFAULT_THEME = 'osd-default';
echarts.registerTheme(DEFAULT_THEME, createEchartsTheme(getColors()));

function createEchartsTheme(colors: ReturnType<typeof getColors>) {
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
