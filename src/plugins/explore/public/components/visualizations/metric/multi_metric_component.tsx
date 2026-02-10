/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { MetricChartStyle } from './metric_vis_config';
import { AxisColumnMappings, VisColumn } from '../types';
import { calculatePercentage, calculateValue } from '../utils/calculation';
import { getUnitById, showDisplayValue } from '../style_panel/unit/collection';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';

interface MetricTextData {
  displayValue: string;
  fillColor: string;
  changeText: string;
  changeColor: string;
  title: string;
  backgroundColor?: string;
  backgroundGradient?: string;
}

function calculateMultiMetricTextData(
  data: Array<Record<string, any>>,
  styles: MetricChartStyle,
  metricField: string,
  categoryName: string,
  colorIndex: number = 0
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

  // Determine colors based on color mode
  let fillColor = colorPalette.text;
  let backgroundColor: string | undefined;
  let backgroundGradient: string | undefined;

  if (calculatedValue === undefined) {
    fillColor = styles.useThresholdColor ? DEFAULT_GREY : colorPalette.text;
  } else {
    const defaultThemeColor = colorPalette.categories[colorIndex % colorPalette.categories.length];
    const thresholdColor = styles.useThresholdColor ? textColor : defaultThemeColor;

    switch (styles.colorMode) {
      case 'value':
        fillColor = thresholdColor;
        break;
      case 'background_solid':
        fillColor = colorPalette.text;
        backgroundColor = thresholdColor;
        break;
      case 'background_gradient':
        fillColor = colorPalette.text;
        // Convert 3-digit hex to 6-digit hex before adding alpha
        const normalizedColor =
          thresholdColor.length === 4
            ? thresholdColor.replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3')
            : thresholdColor;
        backgroundGradient = `linear-gradient(135deg, ${normalizedColor}33, ${normalizedColor})`;
        break;
      case 'none':
      default:
        fillColor = colorPalette.text;
        break;
    }
  }

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

  // Calculate title based on text mode - for multi metric, always use category name when showing name
  let title = '';
  const textMode = styles.textMode || 'value_and_name';

  if (textMode === 'none') {
    title = '';
  } else if (textMode === 'name') {
    title = categoryName; // Always use category name for multi metric
  } else if (textMode === 'value') {
    title = '';
  } else if (textMode === 'value_and_name') {
    title = categoryName; // Always use category name for multi metric
  }

  return {
    displayValue: textMode === 'value' || textMode === 'value_and_name' ? displayValue ?? '-' : '',
    fillColor,
    changeText:
      (textMode === 'value' || textMode === 'value_and_name') && styles.showPercentage
        ? changeText
        : '',
    changeColor,
    title,
    backgroundColor,
    backgroundGradient,
  };
}

interface SingleMetricProps {
  data: Array<Record<string, any>>;
  categoryName: string;
  styles: MetricChartStyle;
  metricField: string;
  timeField?: string;
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  dateColumns: VisColumn[];
  axisColumnMappings?: AxisColumnMappings;
  colorIndex: number;
}

interface MultiMetricComponentProps {
  facetedData: any[][];
  categoryNames: string[];
  styles: MetricChartStyle;
  metricField: string;
  timeField?: string;
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  dateColumns: VisColumn[];
  axisColumnMappings?: AxisColumnMappings;
}

// Single Metric component that renders one metric with HTML text and ECharts sparkline
const SingleMetricComponent: React.FC<SingleMetricProps> = ({
  data,
  categoryName,
  styles,
  metricField,
  timeField,
  numericalColumns,
  categoricalColumns,
  dateColumns,
  axisColumnMappings,
  colorIndex,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Calculate text data using multi metric function
  const textData = useMemo(() => {
    return calculateMultiMetricTextData(data, styles, metricField, categoryName, colorIndex);
  }, [data, styles, metricField, categoryName, colorIndex]);

  // Create sparkline ECharts option
  useEffect(() => {
    if (!timeField || !chartRef.current) return;

    const chartInstance = echarts.init(chartRef.current);
    chartInstanceRef.current = chartInstance;

    const colorPalette = getColors();

    let sparklineColor: string;
    if (styles.colorMode === 'background_solid' || styles.colorMode === 'background_gradient') {
      sparklineColor = 'rgba(255, 255, 255, 0.7)';
    } else {
      if (
        styles.useThresholdColor &&
        (styles.colorMode === 'value' || styles.colorMode === 'none')
      ) {
        const numericalValues: number[] = data.map((d) => d[metricField]);
        const calculatedValue = calculateValue(numericalValues, styles.valueCalculation);
        const thresholds = styles.thresholdOptions?.thresholds ?? [];
        let thresholdColor = styles.thresholdOptions?.baseColor ?? colorPalette.statusGreen;

        if (calculatedValue !== undefined) {
          for (let i = 0; i < thresholds.length; i++) {
            const { value, color } = thresholds[i];
            if (calculatedValue >= value) thresholdColor = color;
          }
        }
        sparklineColor = thresholdColor;
      } else {
        sparklineColor = colorPalette.categories[colorIndex % colorPalette.categories.length];
      }
    }

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
          name: categoryName,
          type: 'line',
          data: data
            .filter((d) => d[timeField] != null && d[metricField] != null)
            .sort((a, b) => new Date(a[timeField]).getTime() - new Date(b[timeField]).getTime())
            .map((d) => [d[timeField], d[metricField]]),
          symbol: 'none',
          smooth: true,
          areaStyle: {
            color: sparklineColor,
            opacity: 0.5,
          },
          lineStyle: {
            color: sparklineColor,
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
  }, [
    data,
    timeField,
    metricField,
    categoryName,
    styles.colorMode,
    colorIndex,
    styles.useThresholdColor,
    styles.thresholdOptions,
    styles.valueCalculation,
  ]);

  const selectedUnit = getUnitById(styles?.unitId);

  // Dynamic font sizes
  const titleFontSize = styles.titleSize || 18;
  const valueFontSize = styles.fontSize || 40 * (selectedUnit?.fontScale ?? 1);
  const changeFontSize = styles.percentageSize || 24;

  // Determine container styles based on color mode
  const containerStyle: React.CSSProperties = {};

  if (textData.backgroundColor) {
    containerStyle.backgroundColor = textData.backgroundColor;
    containerStyle.padding = '16px';
    containerStyle.borderRadius = '8px';
  } else if (textData.backgroundGradient) {
    containerStyle.background = textData.backgroundGradient;
    containerStyle.padding = '16px';
    containerStyle.borderRadius = '8px';
  }

  // Don't show the separate title since it's handled by textData.title based on text mode
  return (
    <div className="multi-metric-item">
      <div style={{ width: '100%', flex: 1 }}>
        <div className="metric-component" style={containerStyle}>
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
      </div>
    </div>
  );
};

// Main Multi-Metric component with flexbox layout
export const MultiMetricComponent: React.FC<MultiMetricComponentProps> = ({
  facetedData,
  categoryNames,
  styles,
  metricField,
  timeField,
  numericalColumns,
  categoricalColumns,
  dateColumns,
  axisColumnMappings,
}) => {
  const layoutClass = `layout-${styles.layoutType || 'auto'}`;

  const containerStyle = {} as React.CSSProperties;

  return (
    <div className={`multi-metric-container ${layoutClass}`} style={containerStyle}>
      {facetedData.map((dataset, index) => {
        const header = dataset[0];
        const rows = dataset.slice(1);
        const data = rows.map((row) => {
          const record: Record<string, any> = {};
          header.forEach((colName: string, colIndex: number) => {
            record[colName] = row[colIndex];
          });
          return record;
        });

        return (
          <SingleMetricComponent
            key={index}
            data={data}
            categoryName={categoryNames[index]}
            styles={styles}
            metricField={metricField}
            timeField={timeField}
            numericalColumns={numericalColumns}
            categoricalColumns={categoricalColumns}
            dateColumns={dateColumns}
            axisColumnMappings={axisColumnMappings}
            colorIndex={index}
          />
        );
      })}
    </div>
  );
};
