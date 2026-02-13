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

import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';

import { Chart as IChart } from '../utils/point_series';
import { ExploreServices } from '../../../types';
import {
  createHistogramSpec,
  getTimezone,
  findMinInterval,
} from '../utils/echarts_histogram_utils';
import { getColors } from '../../visualizations/theme/default_colors';
import { DEFAULT_THEME } from '../../visualizations/theme/default';

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

// Re-export for backwards compatibility
export { findMinInterval };

export const DiscoverHistogram: React.FC<DiscoverHistogramProps> = ({
  chartData,
  chartType,
  timefilterUpdateHandler,
  services,
  showYAxisLabel = false,
  customChartsTheme,
  useSmartDateFormat = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const [instance, setInstance] = useState<echarts.ECharts | null>(null);

  const { uiSettings } = services;
  const timeZone = getTimezone(uiSettings);
  const isDarkMode = uiSettings.get('theme:darkMode');
  const colors = getColors();

  // Extract custom color from theme if provided
  const customColor = useMemo(() => {
    if (customChartsTheme?.colors?.vizColors?.[0]) {
      return customChartsTheme.colors.vizColors[0];
    }
    return undefined;
  }, [customChartsTheme]);

  // Initialize ECharts instance
  useEffect(() => {
    if (containerRef.current && !instanceRef.current) {
      const echartsInstance = echarts.init(containerRef.current, DEFAULT_THEME);
      instanceRef.current = echartsInstance;
      setInstance(echartsInstance);

      // Set up resize observer
      const resizeObserver = new ResizeObserver(() => {
        if (instanceRef.current) {
          instanceRef.current.resize();
        }
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
        if (instanceRef.current) {
          instanceRef.current.dispose();
          instanceRef.current = null;
        }
      };
    }
  }, []);

  // Handle brush selection for time range filtering
  useEffect(() => {
    if (!instance) return;

    const onBrushEnd = (params: any) => {
      const [from, to] = params.areas?.[0]?.coordRange ?? [];
      if (from !== undefined && to !== undefined) {
        timefilterUpdateHandler({ from, to });
      }
    };

    instance.on('brushEnd', onBrushEnd);

    return () => {
      if (instance && !instance.isDisposed()) {
        instance.off('brushEnd', onBrushEnd);
      }
    };
  }, [instance, timefilterUpdateHandler]);

  // Handle click on bars/points for zoom
  useEffect(() => {
    if (!instance || !chartData) return;

    const xInterval = chartData.ordered.interval.asMilliseconds();

    const onClick = (params: any) => {
      if (params.componentType === 'series' && params.value) {
        const startRange = params.value[0];
        timefilterUpdateHandler({
          from: startRange,
          to: startRange + xInterval,
        });
      }
    };

    instance.on('click', onClick);

    return () => {
      if (instance && !instance.isDisposed()) {
        instance.off('click', onClick);
      }
    };
  }, [instance, chartData, timefilterUpdateHandler]);

  // Show/hide grid lines on hover
  useEffect(() => {
    if (!instance || !containerRef.current) return;

    const container = containerRef.current;

    const showGridLines = () => {
      if (instance && !instance.isDisposed()) {
        instance.setOption({ yAxis: { splitLine: { show: true } } });
      }
    };

    const hideGridLines = () => {
      if (instance && !instance.isDisposed()) {
        instance.setOption({ yAxis: { splitLine: { show: false } } });
      }
    };

    container.addEventListener('mouseenter', showGridLines);
    container.addEventListener('mouseleave', hideGridLines);

    return () => {
      container.removeEventListener('mouseenter', showGridLines);
      container.removeEventListener('mouseleave', hideGridLines);
    };
  }, [instance]);

  // Build and update the chart spec
  const spec = useMemo(() => {
    if (!chartData) return null;

    return createHistogramSpec(chartData, {
      chartType,
      timeZone,
      isDarkMode,
      showYAxisLabel,
      yAxisLabel: chartData.yAxisLabel,
      customColor,
      useSmartDateFormat,
      colorPalette: colors.categories,
    });
  }, [
    chartData,
    chartType,
    timeZone,
    isDarkMode,
    showYAxisLabel,
    customColor,
    useSmartDateFormat,
    colors.categories,
  ]);

  // Apply spec to chart instance
  useEffect(() => {
    if (!instance || !spec) return;

    // Determine if we need brush based on x-axis type
    const xAxis = Array.isArray(spec.xAxis) ? spec.xAxis[0] : spec.xAxis;
    let option = { ...spec };

    // Enable time range selection brush for time-based x-axis
    if (xAxis?.type === 'time') {
      option = {
        ...option,
        brush: {
          toolbox: ['lineX'],
          xAxisIndex: 0,
        },
        toolbox: {
          show: false,
        },
      };
    }

    instance.setOption(option, { notMerge: true });

    // Enable brush mode
    if (xAxis?.type === 'time') {
      instance.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: {
          brushType: 'lineX',
          brushMode: 'single',
        },
      });
    }
  }, [instance, spec, chartData?.series]);

  if (!chartData) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-test-subj="discoverHistogramEcharts"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100px',
      }}
    />
  );
};
