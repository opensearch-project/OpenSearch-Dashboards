/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as echarts from 'echarts';
import moment from 'moment-timezone';
import { unitOfTime } from 'moment';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { i18n } from '@osd/i18n';
import { IUiSettingsClient } from 'opensearch-dashboards/public';

import { Chart as IChart, HistogramDataPoint, HistogramSeries } from './point_series';
import { getColors } from '../../visualizations/theme/default_colors';

export interface HistogramOptions {
  chartType: 'HistogramBar' | 'Line';
  timeZone: string;
  isDarkMode: boolean;
  showYAxisLabel: boolean;
  yAxisLabel?: string;
  customColor?: string;
  useSmartDateFormat?: boolean;
  colorPalette?: string[];
}

/**
 * Determines the optimal date format based on the time range duration.
 */
export function getSmartDateFormat(rangeInMs: number): string {
  const ONE_MINUTE = 60 * 1000;
  const ONE_HOUR = 60 * ONE_MINUTE;
  const ONE_DAY = 24 * ONE_HOUR;
  const ONE_WEEK = 7 * ONE_DAY;
  const TWO_MONTHS = 60 * ONE_DAY;
  const ONE_YEAR = 365 * ONE_DAY;

  if (rangeInMs < ONE_MINUTE) {
    return 'HH:mm:ss.SSS';
  } else if (rangeInMs < ONE_HOUR) {
    return 'HH:mm:ss';
  } else if (rangeInMs < ONE_DAY) {
    return 'HH:mm';
  } else if (rangeInMs < ONE_WEEK) {
    return 'MMM D, HH:mm';
  } else if (rangeInMs < TWO_MONTHS) {
    return 'MMM D';
  } else if (rangeInMs < ONE_YEAR) {
    return 'MMM';
  } else {
    return 'MMM YYYY';
  }
}

export function getTimezone(uiSettings: IUiSettingsClient): string {
  if (uiSettings.isDefault('dateFormat:tz')) {
    const detectedTimezone = moment.tz.guess();
    if (detectedTimezone) return detectedTimezone;
    else return moment().format('Z');
  } else {
    return uiSettings.get('dateFormat:tz', 'Browser');
  }
}

function findIntervalFromDuration(
  dateValue: number,
  opensearchValue: number,
  opensearchUnit: unitOfTime.Base,
  timeZone: string
): number {
  const date = moment.tz(dateValue, timeZone);
  const startOfDate = moment.tz(date, timeZone).startOf(opensearchUnit);
  const endOfDate = moment
    .tz(date, timeZone)
    .startOf(opensearchUnit)
    .add(opensearchValue, opensearchUnit);
  return endOfDate.valueOf() - startOfDate.valueOf();
}

function getIntervalInMs(
  value: number,
  opensearchValue: number,
  opensearchUnit: unitOfTime.Base,
  timeZone: string
): number {
  switch (opensearchUnit) {
    case 's':
      return 1000 * opensearchValue;
    case 'ms':
      return 1 * opensearchValue;
    default:
      return findIntervalFromDuration(value, opensearchValue, opensearchUnit, timeZone);
  }
}

export function findMinInterval(
  xValues: number[],
  opensearchValue: number,
  opensearchUnit: string,
  timeZone: string
): number {
  return xValues.reduce((minInterval, currentXvalue, index) => {
    let currentDiff = minInterval;
    if (index > 0) {
      currentDiff = Math.abs(xValues[index - 1] - currentXvalue);
    }
    const singleUnitInterval = getIntervalInMs(
      currentXvalue,
      opensearchValue,
      opensearchUnit as unitOfTime.Base,
      timeZone
    );
    return Math.min(minInterval, singleUnitInterval, currentDiff);
  }, Number.MAX_SAFE_INTEGER);
}

/**
 * Creates the "now" mark line annotation (red vertical line at current time)
 */
export function createNowMarkLine(domainEnd: number): echarts.MarkLineComponentOption | undefined {
  const now = moment();
  const isAnnotationAtEdge = moment(domainEnd).add(60000).isAfter(now) && now.isAfter(domainEnd);
  const lineAnnotationValue = isAnnotationAtEdge ? domainEnd : now.valueOf();

  // Only show the line if it's within or near the visible domain
  if (lineAnnotationValue < domainEnd - 60000) {
    return undefined;
  }

  return {
    symbol: 'none',
    silent: true,
    lineStyle: {
      color: euiThemeVars.euiColorDanger,
      width: 2,
      opacity: 0.7,
    },
    label: {
      show: false, // Hide the label on the line itself
    },
    data: [
      {
        xAxis: lineAnnotationValue,
        label: {
          show: false, // Ensure label is hidden for data point
        },
      },
    ],
  };
}

/**
 * Creates the partial data mark area annotations (shaded regions)
 */
export function createPartialDataMarkArea(
  domainStart: number,
  domainEnd: number,
  dataMin: number,
  dataMax: number,
  isDarkMode: boolean
): echarts.MarkAreaComponentOption | undefined {
  const shadeColor = isDarkMode ? euiThemeVars.euiColorLightShade : euiThemeVars.euiColorDarkShade;
  const opacity = isDarkMode ? 0.6 : 0.2;

  const areas: Array<Array<{ xAxis: number }>> = [];

  // Left partial data area
  if (domainStart !== dataMin) {
    areas.push([{ xAxis: domainStart }, { xAxis: dataMin }]);
  }

  // Right partial data area
  if (domainEnd !== dataMax) {
    areas.push([{ xAxis: dataMax }, { xAxis: domainEnd }]);
  }

  if (areas.length === 0) {
    return undefined;
  }

  return {
    silent: true,
    itemStyle: {
      color: shadeColor,
      opacity,
    },
    data: areas as any,
  };
}

/**
 * Creates a tooltip formatter that handles partial data warnings
 */
export function createTooltipFormatter(
  xInterval: number,
  domainStart: number,
  domainEnd: number,
  dateFormat: string
): echarts.TooltipComponentOption['formatter'] {
  return (params: any) => {
    const paramsArray = Array.isArray(params) ? params : [params];
    if (paramsArray.length === 0) return '';

    const firstParam = paramsArray[0];
    const timestamp = firstParam.value?.[0] ?? firstParam.axisValue;
    const formattedDate = moment(timestamp).format(dateFormat);

    const isPartialData = timestamp < domainStart || timestamp + xInterval > domainEnd;

    let tooltipContent = '';

    if (isPartialData) {
      const partialDataText = i18n.translate(
        'explore.discover.histogram.partialData.bucketTooltipText',
        {
          defaultMessage:
            'The selected time range does not include this entire bucket, it may contain partial data.',
        }
      );
      tooltipContent += `<div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px; color: ${euiThemeVars.euiColorWarningText};">`;
      tooltipContent += `<span style="font-size: 12px;">ⓘ</span>`;
      tooltipContent += `<span style="font-size: 11px;">${partialDataText}</span>`;
      tooltipContent += `</div>`;
    }

    tooltipContent += `<div style="font-weight: 600; margin-bottom: 4px;">${formattedDate}</div>`;

    paramsArray.forEach((param: any) => {
      const seriesName = param.seriesName || '';
      const value = param.value?.[1] ?? param.value;
      const color = param.color || '';
      tooltipContent += `<div style="display: flex; align-items: center; gap: 4px;">`;
      tooltipContent += `<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${color};"></span>`;
      tooltipContent += `<span>${seriesName}: <strong>${value}</strong></span>`;
      tooltipContent += `</div>`;
    });

    return tooltipContent;
  };
}

/**
 * Creates a bar series configuration for ECharts
 */
export function createBarSeries(
  id: string,
  name: string,
  data: HistogramDataPoint[],
  color: string,
  markLine?: echarts.MarkLineComponentOption,
  markArea?: echarts.MarkAreaComponentOption
): echarts.BarSeriesOption {
  return {
    type: 'bar',
    id,
    name,
    data: data.map((d) => [d.x, d.y]),
    barMaxWidth: '90%',
    itemStyle: {
      color,
    },
    emphasis: {
      itemStyle: {
        color,
      },
    },
    ...(markLine && { markLine }),
    ...(markArea && { markArea }),
  };
}

/**
 * Creates a line series configuration for ECharts
 */
export function createLineSeries(
  id: string,
  name: string,
  data: HistogramDataPoint[],
  color: string,
  markLine?: echarts.MarkLineComponentOption,
  markArea?: echarts.MarkAreaComponentOption
): echarts.LineSeriesOption {
  return {
    type: 'line',
    id,
    name,
    data: data.map((d) => [d.x, d.y]),
    smooth: false,
    symbol: 'circle',
    symbolSize: 4,
    showSymbol: true,
    lineStyle: {
      color,
      width: 2,
    },
    itemStyle: {
      color,
    },
    ...(markLine && { markLine }),
    ...(markArea && { markArea }),
  };
}

/**
 * Creates the complete ECharts option spec for the histogram
 */
export function createHistogramSpec(
  chartData: IChart,
  options: HistogramOptions
): echarts.EChartsOption {
  const {
    chartType,
    timeZone,
    isDarkMode,
    showYAxisLabel,
    yAxisLabel,
    customColor,
    useSmartDateFormat,
    colorPalette,
  } = options;

  const colors = getColors();
  const defaultColor = colors.categories[0];
  const palette = colorPalette || colors.categories;

  const data = chartData.values;
  const { intervalOpenSearchValue, intervalOpenSearchUnit, interval } = chartData.ordered;
  const xInterval = interval.asMilliseconds();

  const xValues = chartData.xAxisOrderedValues;
  const lastXValue = xValues[xValues.length - 1];

  const domain = chartData.ordered;
  const domainStart = domain.min.valueOf();
  const domainEnd = domain.max.valueOf();

  const domainMin = data[0]?.x > domainStart ? domainStart : data[0]?.x;
  const domainMax = domainEnd - xInterval > lastXValue ? domainEnd - xInterval : lastXValue;

  // Determine date format
  let dateFormat: string;
  if (useSmartDateFormat) {
    const rangeInMs = domainEnd - domainStart;
    dateFormat = getSmartDateFormat(rangeInMs);
  } else {
    dateFormat = chartData.xAxisFormat.params?.pattern || 'YYYY-MM-DD HH:mm';
  }

  // Create mark annotations for the first series only
  const markLine = createNowMarkLine(domainEnd);
  const markArea = createPartialDataMarkArea(
    domainStart,
    domainEnd,
    domainMin,
    domainMax,
    isDarkMode
  );

  // Build series
  const series: Array<echarts.BarSeriesOption | echarts.LineSeriesOption> = [];
  const hasMultipleSeries = chartData.series && chartData.series.length > 0;

  if (hasMultipleSeries && chartData.series) {
    chartData.series.forEach((s: HistogramSeries, index: number) => {
      const seriesColor = palette[index % palette.length];
      const isFirstSeries = index === 0;

      if (chartType === 'HistogramBar') {
        series.push(
          createBarSeries(
            s.id,
            s.name,
            s.data,
            seriesColor,
            isFirstSeries ? markLine : undefined,
            isFirstSeries ? markArea : undefined
          )
        );
      } else {
        series.push(
          createLineSeries(
            s.id,
            s.name,
            s.data,
            seriesColor,
            isFirstSeries ? markLine : undefined,
            isFirstSeries ? markArea : undefined
          )
        );
      }
    });
  } else {
    // Single series
    const seriesColor = customColor || defaultColor;
    const seriesName = yAxisLabel || chartData.yAxisLabel || '';

    if (chartType === 'HistogramBar') {
      series.push(
        createBarSeries('discover-histogram', seriesName, data, seriesColor, markLine, markArea)
      );
    } else {
      series.push(
        createLineSeries('discover-histogram', seriesName, data, seriesColor, markLine, markArea)
      );
    }
  }

  const spec: echarts.EChartsOption = {
    animation: true,
    animationDuration: 300,
    xAxis: {
      type: 'time',
      min: domainMin,
      max: domainMax + xInterval, // Extend to show the last bar fully
      axisLabel: {
        formatter: (value: number) => moment(value).format(dateFormat),
        hideOverlap: true, // Automatically hide overlapping labels
        rotate: 0, // Keep labels horizontal
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: showYAxisLabel ? yAxisLabel || chartData.yAxisLabel : undefined,
      nameLocation: 'middle',
      nameGap: 30,
      splitLine: {
        show: true,
      },
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
          return String(value);
        },
      },
    },
    series,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: createTooltipFormatter(xInterval, domainStart, domainEnd, dateFormat),
    },
    legend: hasMultipleSeries
      ? {
          show: true,
          type: 'scroll',
          right: 10,
          orient: 'vertical',
        }
      : { show: false },
    grid: {
      top: 20,
      right: hasMultipleSeries ? 150 : 20,
      bottom: 40,
      left: 50,
      containLabel: false,
    },
  };

  return spec;
}
