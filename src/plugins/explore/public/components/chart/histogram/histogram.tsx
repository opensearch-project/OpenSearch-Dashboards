/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiSpacer, EuiText } from '@elastic/eui';
import moment from 'moment-timezone';
import { unitOfTime } from 'moment';
import React, { useEffect, useCallback, useMemo } from 'react';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { euiPaletteColorBlind } from '@elastic/eui';

import {
  AnnotationDomainType,
  Axis,
  Chart,
  HistogramBarSeries,
  LineAnnotation,
  Position,
  ScaleType,
  Settings,
  RectAnnotation,
  TooltipValue,
  TooltipType,
  ElementClickListener,
  XYChartElementEvent,
  BrushEndListener,
  LineSeries,
} from '@elastic/charts';

import { i18n } from '@osd/i18n';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { combineLatest } from 'rxjs';
import { Chart as IChart } from '../utils/point_series';
import { ExploreServices } from '../../../types';

export interface DiscoverHistogramProps {
  chartData: IChart;
  chartType: 'HistogramBar' | 'Line';
  timefilterUpdateHandler: (ranges: { from: number; to: number }) => void;
  services: ExploreServices;
  showYAxisLabel?: boolean;
  customChartsTheme?: Record<string, any>;
  /**
   * When true, uses a smarter date format that hides the year for intervals
   * smaller than month, making the x-axis labels more compact and readable.
   */
  useSmartDateFormat?: boolean;
}

/**
 * Determines the optimal date format based on the time range duration.
 * The format is chosen to match what Elastic Charts will display as axis ticks,
 * which are determined by the overall time range, not the histogram interval.
 *
 * For ranges < 1 minute: show time with milliseconds
 * For ranges 1 minute - 1 hour: show time with seconds (hours/minutes/seconds)
 * For ranges 1 hour - 1 day: show time (hours/minutes)
 * For ranges 1-7 days: show day + time
 * For ranges 1 week - 2 months: show month + day
 * For ranges > 2 months: show month (+ year if > 1 year)
 */
function getSmartDateFormat(rangeInMs: number): string {
  const ONE_MINUTE = 60 * 1000;
  const ONE_HOUR = 60 * ONE_MINUTE;
  const ONE_DAY = 24 * ONE_HOUR;
  const ONE_WEEK = 7 * ONE_DAY;
  const TWO_MONTHS = 60 * ONE_DAY;
  const ONE_YEAR = 365 * ONE_DAY;

  if (rangeInMs < ONE_MINUTE) {
    // Sub-minute range: show hours, minutes, seconds, and milliseconds
    return 'HH:mm:ss.SSS';
  } else if (rangeInMs < ONE_HOUR) {
    // Sub-hour range: show hours, minutes, and seconds
    return 'HH:mm:ss';
  } else if (rangeInMs < ONE_DAY) {
    // Sub-day range: show hours and minutes
    return 'HH:mm';
  } else if (rangeInMs < ONE_WEEK) {
    // 1-7 days: show day and time
    return 'MMM D, HH:mm';
  } else if (rangeInMs < TWO_MONTHS) {
    // 1 week to 2 months: show month and day
    return 'MMM D';
  } else if (rangeInMs < ONE_YEAR) {
    // 2 months to 1 year: ticks will be at month boundaries, show just month
    return 'MMM';
  } else {
    // Over 1 year: show month and year
    return 'MMM YYYY';
  }
}

function findIntervalFromDuration(
  dateValue: number,
  opensearchValue: number,
  opensearchUnit: unitOfTime.Base,
  timeZone: string
) {
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

function getTimezone(uiSettings: IUiSettingsClient) {
  if (uiSettings.isDefault('dateFormat:tz')) {
    const detectedTimezone = moment.tz.guess();
    if (detectedTimezone) return detectedTimezone;
    else return moment().format('Z');
  } else {
    return uiSettings.get('dateFormat:tz', 'Browser');
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

export const DiscoverHistogram: React.FC<DiscoverHistogramProps> = ({
  chartData,
  chartType,
  timefilterUpdateHandler,
  services,
  showYAxisLabel = false,
  customChartsTheme,
  useSmartDateFormat = false,
}) => {
  useEffect(() => {
    const subscription = combineLatest([
      services.theme.chartsTheme$,
      services.theme.chartsBaseTheme$,
    ]).subscribe(([chartsTheme, chartsBaseTheme]) => {
      // Note: State is not needed as we use the services directly
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [services.theme.chartsTheme$, services.theme.chartsBaseTheme$]);

  const onBrushEnd: BrushEndListener = useCallback(
    ({ x }) => {
      if (!x) {
        return;
      }
      const [from, to] = x;
      timefilterUpdateHandler({ from, to });
    },
    [timefilterUpdateHandler]
  );

  const onElementClick = useCallback(
    (xInterval: number): ElementClickListener => ([elementData]) => {
      const startRange = (elementData as XYChartElementEvent)[0].x;

      const range = {
        from: startRange,
        to: startRange + xInterval,
      };

      timefilterUpdateHandler(range);
    },
    [timefilterUpdateHandler]
  );

  const formatXValue = useCallback(
    (val: string) => {
      let format: string;
      if (useSmartDateFormat) {
        const rangeInMs = chartData.ordered.max.valueOf() - chartData.ordered.min.valueOf();
        format = getSmartDateFormat(rangeInMs);
      } else {
        format = chartData.xAxisFormat.params!.pattern;
      }
      return moment(val).format(format);
    },
    [chartData, useSmartDateFormat]
  );

  const renderBarTooltip = useCallback(
    (xInterval: number, domainStart: number, domainEnd: number) => (
      headerData: TooltipValue
    ): JSX.Element | string => {
      const headerDataValue = headerData.value;
      const formattedValue = formatXValue(headerDataValue);

      const partialDataText = i18n.translate(
        'explore.discover.histogram.partialData.bucketTooltipText',
        {
          defaultMessage:
            'The selected time range does not include this entire bucket, it may contain partial data.',
        }
      );

      if (headerDataValue < domainStart || headerDataValue + xInterval > domainEnd) {
        return (
          <React.Fragment>
            <EuiFlexGroup
              alignItems="center"
              className="exploreHistogram__header--partial"
              data-test-subj="dscHistogramHeader"
              responsive={false}
              gutterSize="xs"
            >
              <EuiFlexItem grow={false}>
                <EuiIcon type="iInCircle" />
              </EuiFlexItem>
              <EuiFlexItem>{partialDataText}</EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="xs" />
            <EuiText size="s">
              <p>{formattedValue}</p>
            </EuiText>
          </React.Fragment>
        );
      }

      return formattedValue;
    },
    [formatXValue]
  );

  const { uiSettings } = services;
  const timeZone = getTimezone(uiSettings);
  const chartsBaseTheme = services.theme.chartsDefaultBaseTheme;

  const chartsTheme = useMemo(() => {
    const theme = { ...services.theme.chartsDefaultTheme };
    // These styles override the chartsTheme so that the correct base chart colors are used
    delete theme.axes?.gridLine?.horizontal?.stroke;
    delete theme.axes?.gridLine?.vertical?.stroke;
    delete theme.axes?.axisLine;
    theme.axes = { ...theme.axes, axisTitle: { fill: euiThemeVars.euiTextColor } };
    theme.colors = theme.colors ?? {};
    theme.colors.vizColors = [euiThemeVars.euiColorVis1_behindText];
    return { ...theme, ...customChartsTheme };
  }, [services.theme.chartsDefaultTheme, customChartsTheme]);

  if (!chartData) {
    return null;
  }

  const data = chartData.values;

  /**
   * Deprecation: [interval] on [date_histogram] is deprecated, use [fixed_interval] or [calendar_interval].
   * see https://github.com/elastic/kibana/issues/27410
   * TODO: Once the Discover query has been update, we should change the below to use the new field
   */
  const { intervalOpenSearchValue, intervalOpenSearchUnit, interval } = chartData.ordered;
  const xInterval = interval.asMilliseconds();

  const xValues = chartData.xAxisOrderedValues;
  const lastXValue = xValues[xValues.length - 1];

  const domain = chartData.ordered;
  const domainStart = domain.min.valueOf();
  const domainEnd = domain.max.valueOf();

  const domainMin = data[0]?.x > domainStart ? domainStart : data[0]?.x;
  const domainMax = domainEnd - xInterval > lastXValue ? domainEnd - xInterval : lastXValue;

  const xDomain = {
    min: domainMin,
    max: domainMax,
    minInterval: findMinInterval(
      xValues,
      intervalOpenSearchValue,
      intervalOpenSearchUnit,
      timeZone
    ),
  };

  // Domain end of 'now' will be milliseconds behind current time, so we extend time by 1 minute and check if
  // the annotation is within this range; if so, the line annotation uses the domainEnd as its value
  const now = moment();
  const isAnnotationAtEdge = moment(domainEnd).add(60000).isAfter(now) && now.isAfter(domainEnd);
  const lineAnnotationValue = isAnnotationAtEdge ? domainEnd : now;

  const lineAnnotationData = [
    {
      dataValue: lineAnnotationValue,
    },
  ];
  const isDarkMode = uiSettings.get('theme:darkMode');

  const lineAnnotationStyle = {
    line: {
      strokeWidth: 2,
      stroke: euiThemeVars.euiColorDanger,
      opacity: 0.7,
    },
  };

  const rectAnnotations = [];
  if (domainStart !== domainMin) {
    rectAnnotations.push({
      coordinates: {
        x1: domainStart,
      },
    });
  }
  if (domainEnd !== domainMax) {
    rectAnnotations.push({
      coordinates: {
        x0: domainEnd,
      },
    });
  }

  const rectAnnotationStyle = {
    stroke: isDarkMode ? euiThemeVars.euiColorLightShade : euiThemeVars.euiColorDarkShade,
    strokeWidth: 0,
    opacity: isDarkMode ? 0.6 : 0.2,
    fill: isDarkMode ? euiThemeVars.euiColorLightShade : euiThemeVars.euiColorDarkShade,
  };

  const tooltipProps = {
    headerFormatter: renderBarTooltip(xInterval, domainStart, domainEnd),
    type: TooltipType.VerticalCursor,
  };

  const renderHistogramSeries = () => {
    if (!chartData.series || chartData.series.length === 0) {
      return null;
    }

    const colorPalette = euiPaletteColorBlind();

    return chartData.series.map((series, index) => (
      <HistogramBarSeries
        key={series.id}
        id={series.id}
        name={series.name}
        minBarHeight={2}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={series.data}
        timeZone={timeZone}
        color={colorPalette[index % colorPalette.length]}
      />
    ));
  };

  const hasMultipleSeries = chartData.series && chartData.series.length > 0;
  const showLegend = hasMultipleSeries;

  return (
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    <Chart size="100%">
      <Settings
        xDomain={xDomain}
        onBrushEnd={onBrushEnd}
        onElementClick={onElementClick(xInterval)}
        tooltip={tooltipProps}
        theme={chartsTheme}
        baseTheme={chartsBaseTheme}
        showLegend={showLegend}
        legendPosition={Position.Right}
      />
      <Axis
        id="discover-histogram-left-axis"
        position={Position.Left}
        ticks={5}
        title={showYAxisLabel ? chartData.yAxisLabel : undefined}
      />
      <Axis
        id="discover-histogram-bottom-axis"
        position={Position.Bottom}
        tickFormat={formatXValue}
        ticks={10}
      />
      <LineAnnotation
        id="line-annotation"
        domainType={AnnotationDomainType.XDomain}
        dataValues={lineAnnotationData}
        hideTooltips={true}
        style={lineAnnotationStyle}
      />
      <RectAnnotation
        dataValues={rectAnnotations}
        id="rect-annotation"
        zIndex={2}
        style={rectAnnotationStyle}
        hideTooltips={true}
      />
      {chartType === 'HistogramBar' &&
        (hasMultipleSeries ? (
          renderHistogramSeries()
        ) : (
          <HistogramBarSeries
            id="discover-histogram"
            minBarHeight={2}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['y']}
            data={data}
            timeZone={timeZone}
            name={chartData.yAxisLabel}
          />
        ))}
      {chartType === 'Line' && (
        <LineSeries
          id="discover-histogram"
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data}
          timeZone={timeZone}
          name={chartData.yAxisLabel}
        />
      )}
    </Chart>
  );
};
