/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';
import { MetricChartStyle } from './metric_vis_config';
import { AxisColumnMappings, VisColumn, AxisRole } from '../types';
import { calculatePercentage, calculateValue } from '../utils/calculation';
import { getUnitById, showDisplayValue } from '../style_panel/unit/collection';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';

interface MetricTextData {
  displayValue: string;
  fillColor: string;
  changeText: string;
  changeColor: string;
  title: string;
}

interface MetricComponentProps {
  data: Array<Record<string, any>>;
  styles: MetricChartStyle;
  metricField: string;
  timeField?: string;
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  dateColumns: VisColumn[];
  axisColumnMappings?: AxisColumnMappings;
}

function calculateMetricTextData(
  data: Array<Record<string, any>>,
  styles: MetricChartStyle,
  metricField: string,
  fieldName?: string
): MetricTextData {
  const colorPalette = getColors();

  const numericalValues: number[] = data.map((d) => d[metricField]);
  const calculatedValue = calculateValue(numericalValues, styles.valueCalculation);
  const isValidNumber =
    calculatedValue !== undefined && typeof calculatedValue === 'number' && !isNaN(calculatedValue);

  const selectedUnit = getUnitById(styles?.unitId);
  const displayValue = showDisplayValue(isValidNumber, selectedUnit, calculatedValue);

  // Calculate fill color based on thresholds
  const newThreshold = styles.thresholdOptions?.thresholds ?? [];
  let textColor = styles.thresholdOptions?.baseColor ?? getColors().statusGreen;

  if (calculatedValue !== undefined) {
    for (let i = 0; i < newThreshold.length; i++) {
      const { value, color } = newThreshold[i];
      if (calculatedValue >= value) textColor = color;
    }
  }

  const fillColor =
    calculatedValue === undefined
      ? styles.useThresholdColor
        ? DEFAULT_GREY
        : colorPalette.text
      : styles.useThresholdColor
      ? textColor
      : colorPalette.text;

  // Calculate percentage change
  let changeText = '';
  let changeColor = colorPalette.text;
  if (styles.showPercentage) {
    const percentage = calculatePercentage(numericalValues);
    if (percentage === undefined) {
      changeText = '-';
    } else {
      changeText = `${percentage > 0 ? '+' : ''}${(percentage * 100).toFixed(2)}%`;
    }

    if (percentage !== undefined && percentage > 0) {
      if (styles.percentageColor === 'standard') {
        changeColor = colorPalette.statusGreen;
      } else if (styles.percentageColor === 'inverted') {
        changeColor = colorPalette.statusRed;
      } else {
        changeColor = colorPalette.statusGreen;
      }
    }
    if (percentage !== undefined && percentage < 0) {
      if (styles.percentageColor === 'standard') {
        changeColor = colorPalette.statusRed;
      } else if (styles.percentageColor === 'inverted') {
        changeColor = colorPalette.statusGreen;
      } else {
        changeColor = colorPalette.statusRed;
      }
    }
  }

  // Use custom title if provided, otherwise use field name as default
  const title = styles.showTitle ? styles.title || fieldName || metricField : '';

  return {
    displayValue: displayValue ?? '-',
    fillColor,
    changeText,
    changeColor,
    title,
  };
}

export const MetricComponent: React.FC<MetricComponentProps> = ({
  data,
  styles,
  metricField,
  timeField,
  axisColumnMappings,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const valueMapping = axisColumnMappings?.[AxisRole.Value];
  const fieldName = valueMapping?.name;

  // Calculate text data with memoization
  const textData = useMemo(() => {
    return calculateMetricTextData(data, styles, metricField, fieldName);
  }, [data, styles, metricField, fieldName]);

  // Create sparkline ECharts option
  useEffect(() => {
    if (!timeField || !chartRef.current) return;

    const chartInstance = echarts.init(chartRef.current);
    chartInstanceRef.current = chartInstance;

    const colorPalette = getColors();

    const option = {
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
      xAxis: {
        type: 'time',
        show: false,
        silent: true,
      },
      yAxis: {
        type: 'value',
        show: false,
        silent: true,
      },
      series: [
        {
          name: fieldName || metricField,
          type: 'line',
          data: data.map((d) => [d[timeField], d[metricField]]),
          symbol: 'none',
          areaStyle: {
            opacity: 0.5,
          },
          lineStyle: {
            color: colorPalette.categories[0],
          },
        },
      ],
      tooltip: {
        show: false,
      },
      legend: {
        show: false,
      },
    };

    chartInstance.setOption(option);

    return () => {
      chartInstance.dispose();
    };
  }, [data, timeField, metricField, fieldName, axisColumnMappings]);

  const selectedUnit = getUnitById(styles?.unitId);

  // Dynamic font sizes
  const titleFontSize = styles.titleSize || 18;
  const valueFontSize = styles.fontSize || 40 * (selectedUnit?.fontScale ?? 1);
  const changeFontSize = styles.percentageSize || 24;

  return (
    <div className="metric-component">
      {/* Sparkline chart - only rendered if timeField exists */}
      {timeField && <div ref={chartRef} className="metric-sparkline" />}

      {/* HTML rendered text content */}
      <div className="metric-text-overlay">
        {textData.title && (
          <div
            className="metric-title"
            style={{
              fontSize: titleFontSize,
              color: getColors().text,
            }}
          >
            {textData.title}
          </div>
        )}

        <div
          className="metric-value"
          style={{
            fontSize: valueFontSize,
            color: textData.fillColor,
          }}
        >
          {textData.displayValue}
        </div>

        {styles.showPercentage && textData.changeText && (
          <div
            className="metric-change"
            style={{
              fontSize: changeFontSize,
              color: textData.changeColor,
            }}
          >
            {textData.changeText}
          </div>
        )}
      </div>
    </div>
  );
};
