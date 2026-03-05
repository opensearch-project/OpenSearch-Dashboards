/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { debounce, throttle } from 'lodash';

import { MetricChartStyle } from './metric_vis_config';
import { AxisColumnMappings, AxisRole } from '../types';
import { calculatePercentage, calculateValue } from '../utils/calculation';
import { getUnitById } from '../style_panel/unit/collection';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';
import { EchartsRender } from '../echarts_render';
import { darkenHexColor, getContrastTextColor, normalizeHexColor } from '../utils/color';
import { constrainFontSizeByWidth } from './metric_utils';

import './metric_component.scss';

interface MetricTextData {
  numericValue: string;
  unitText: string;
  unitFirst: boolean; // True if unit should be displayed before value (e.g., currency)
  fillColor: string;
  changeText: string;
  changeColor: string;
  backgroundColor?: string;
  backgroundGradient?: string;
}

interface MetricChartProps {
  name: string;
  data?: Array<Record<string, any>>;
  styles: MetricChartStyle;
  axisColumnMappings?: AxisColumnMappings;
  spec?: echarts.EChartsOption;
}

interface SpecConfig {
  spec: echarts.EChartsOption;
  name: string;
  data: Array<Record<string, any>>;
}
interface MetricChartRenderProps {
  styles: MetricChartStyle;
  axisColumnMappings?: AxisColumnMappings;
  spec?: SpecConfig | SpecConfig[];
}

// Helper functions for metric text data calculation

/**
 * Finds the appropriate color based on threshold rules
 */
function getThresholdColor(
  value: number | undefined,
  thresholds: Array<{ value: number; color: string }>,
  baseColor: string
): string {
  if (value === undefined) return baseColor;

  // Find the last threshold that the value meets or exceeds
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value >= thresholds[i].value) {
      return thresholds[i].color;
    }
  }

  return baseColor;
}

/**
 * Applies color mode styling to determine text, background colors
 */
function applyColorMode(
  colorMode: string | undefined,
  thresholdColor: string,
  textColor: string
): {
  fillColor: string;
  backgroundColor?: string;
  backgroundGradient?: string;
} {
  switch (colorMode) {
    case 'value':
      return { fillColor: thresholdColor };

    case 'background_solid':
      return {
        fillColor: getContrastTextColor(thresholdColor),
        backgroundColor: thresholdColor,
      };

    case 'background_gradient': {
      const normalized = normalizeHexColor(thresholdColor);
      const darkened = darkenHexColor(normalized, 0.7);
      return {
        fillColor: getContrastTextColor(thresholdColor),
        backgroundGradient: `linear-gradient(135deg, ${normalized}, ${darkened})`,
      };
    }

    case 'none':
    default:
      return { fillColor: textColor };
  }
}

/**
 * Determines the color for percentage change based on value and color mode
 */
function getPercentageChangeColor(
  percentage: number | undefined,
  percentageColorMode: string | undefined,
  palette: ReturnType<typeof getColors>
): string {
  if (percentage === undefined || percentage === 0) {
    return palette.text;
  }

  const isPositive = percentage > 0;
  const isInverted = percentageColorMode === 'inverted';

  // Standard mode: green for positive, red for negative
  // Inverted mode: red for positive, green for negative
  if (isPositive) {
    return isInverted ? palette.statusRed : palette.statusGreen;
  } else {
    return isInverted ? palette.statusGreen : palette.statusRed;
  }
}

/**
 * Determines the title text based on text mode setting
 */
function getTitleText(textMode: string | undefined, title: string): string {
  const mode = textMode || 'value_and_name';

  // Both 'name' and 'value_and_name' show the title
  if (mode === 'name' || mode === 'value_and_name') {
    return title;
  }

  // 'none' and 'value' don't show title
  return '';
}

/**
 * Determines whether to show the display value based on text mode
 */
function shouldShowValue(textMode: string | undefined): boolean {
  const mode = textMode || 'value_and_name';
  return mode === 'value' || mode === 'value_and_name';
}

function calculateMetricTextData(
  data: Array<Record<string, any>>,
  styles: MetricChartStyle,
  metricField: string
): MetricTextData {
  const colorPalette = getColors();

  // Calculate the metric value and its display representation
  const numericalValues: unknown[] = data.map((d) => d[metricField]);
  const calculatedValue = calculateValue(numericalValues, styles.valueCalculation);
  const isValidNumber =
    calculatedValue !== undefined && typeof calculatedValue === 'number' && !isNaN(calculatedValue);

  const selectedUnit = getUnitById(styles?.unitId);

  // Determine threshold-based color
  const thresholds = styles.thresholdOptions?.thresholds ?? [];
  const baseColor = styles.thresholdOptions?.baseColor ?? colorPalette.statusGreen;
  const thresholdColor = getThresholdColor(calculatedValue, thresholds, baseColor);

  // Apply color mode to determine fill, background colors
  let fillColor = colorPalette.text;
  let backgroundColor: string | undefined;
  let backgroundGradient: string | undefined;

  if (calculatedValue === undefined) {
    // No value available - use grey or default text color
    fillColor = styles.useThresholdColor ? DEFAULT_GREY : colorPalette.text;
  } else {
    // Use threshold color or category color based on settings
    const effectiveColor = styles.useThresholdColor ? thresholdColor : colorPalette.categories[0];
    const colorResult = applyColorMode(styles.colorMode, effectiveColor, colorPalette.text);

    fillColor = colorResult.fillColor;
    backgroundColor = colorResult.backgroundColor;
    backgroundGradient = colorResult.backgroundGradient;
  }

  // Calculate percentage change text and color
  let changeText = '';
  let changeColor = colorPalette.text;

  if (styles.showPercentage) {
    const percentage = calculatePercentage(numericalValues);

    if (percentage === undefined) {
      changeText = '-';
    } else {
      changeText = `${percentage > 0 ? '+' : ''}${(percentage * 100).toFixed(2)}%`;
      changeColor = getPercentageChangeColor(percentage, styles.percentageColor, colorPalette);
    }
  }

  const showValue = shouldShowValue(styles.textMode);

  // Separate numeric value and unit for individual styling
  let valueText = '';
  let unitText = '';
  let unitFirst = false;

  if (showValue) {
    if (isValidNumber && calculatedValue !== undefined) {
      // Format the numeric value
      if (selectedUnit?.display) {
        const unitDisplay = selectedUnit.display(calculatedValue, selectedUnit.symbol);

        // Check if we have segments to extract value and unit separately
        if (unitDisplay.segments) {
          const segments = unitDisplay.segments;

          // Check if unit comes first (e.g., currency: $ 50)
          if (segments.length > 0 && segments[0].type === 'unit') {
            unitFirst = true;
            unitText = String(segments[0].value);
            valueText = segments.length > 1 ? String(segments[1].value) : '';
          } else {
            // Value comes first (e.g., data: 100 KB)
            unitFirst = false;
            valueText = segments.length > 0 ? String(segments[0].value) : '';
            unitText = segments.length > 1 ? String(segments[1].value) : '';
          }
        } else {
          // No segments, use label as combined value (e.g., date/time formats)
          valueText = String(unitDisplay.label);
          unitText = '';
          unitFirst = false;
        }
      } else {
        // Simple formatting without custom display
        valueText = `${Math.round(calculatedValue * 100) / 100}`;
        unitText = selectedUnit?.symbol || '';
        unitFirst = false;
      }
    } else {
      valueText = '-';
      unitText = '';
      unitFirst = false;
    }
  }

  return {
    numericValue: valueText,
    unitText,
    unitFirst,
    fillColor,
    changeText: showValue && styles.showPercentage ? changeText : '',
    changeColor,
    backgroundColor,
    backgroundGradient,
  };
}

export const MetricChartRender: React.FC<MetricChartRenderProps> = ({
  styles,
  axisColumnMappings,
  spec,
}) => {
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setContainerDimensions({ width, height });
        }
      }, 100)
    );

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const itemFlexBasis = useMemo(() => {
    if (containerDimensions.width > 1600) {
      return 'calc(15% - 6px)';
    } else if (containerDimensions.width > 1200) {
      return 'calc(20% - 6px)';
    } else if (containerDimensions.width > 800) {
      return 'calc(33.3% - 6px)';
    } else if (containerDimensions.width > 500) {
      return 'calc(50% - 6px)';
    } else {
      return 'calc(100% - 6px)';
    }
  }, [containerDimensions]);

  if (!spec) {
    return null;
  }

  const layoutClass = `layout-${styles.layoutType || 'auto'}`;
  const containerStyle = {} as React.CSSProperties;
  const specs = Array.isArray(spec) ? spec : [spec];
  return (
    <div
      className={`multi-metric-container ${layoutClass}`}
      style={containerStyle}
      ref={containerRef}
    >
      {specs.map((s) => (
        <div
          key={s.name}
          className="multi-metric-item"
          style={{ width: itemFlexBasis, flexBasis: itemFlexBasis }}
        >
          <MetricChart
            spec={s.spec}
            data={s.data}
            styles={styles}
            name={s.name}
            axisColumnMappings={axisColumnMappings}
          />
        </div>
      ))}
    </div>
  );
};

export const MetricChart: React.FC<MetricChartProps> = ({
  data = [],
  styles,
  axisColumnMappings,
  spec,
  name,
}) => {
  const valueColumn = axisColumnMappings?.[AxisRole.Value];
  const numericField = valueColumn?.column ?? '';

  // State for container dimensions
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calculate text data with memoization
  const textData = useMemo(() => {
    return calculateMetricTextData(data, styles, numericField);
  }, [data, styles, numericField]);

  const title = getTitleText(styles.textMode, name);

  // ResizeObserver to track container dimensions
  useEffect(() => {
    const element = overlayRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setContainerDimensions({ width, height });
        }
      }, 100)
    );

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate dynamic font sizes based on container dimensions
  const dynamicFontSizes = useMemo(() => {
    const { width, height } = containerDimensions;

    // If container hasn't been measured yet, return defaults
    if (width === 0 || height === 0) {
      return {
        title: styles.titleSize || 18,
        value: styles.fontSize || 40,
        change: styles.percentageSize || 24,
      };
    }

    // If user has set custom sizes, use them
    if (styles.titleSize && styles.fontSize && styles.percentageSize) {
      return {
        title: styles.titleSize,
        value: styles.fontSize,
        change: styles.percentageSize,
      };
    }

    // Calculate number of visible elements
    const hasTitle = !!name;
    const hasValue = !!textData.numericValue;
    const hasChange = styles.showPercentage && !!textData.changeText;
    const visibleElements = [hasTitle, hasValue, hasChange].filter(Boolean).length;

    // Calculate base sizes as percentage of available height
    // Distribute height proportionally based on visual hierarchy
    let titleSize = 0;
    let valueSize = 0;
    let changeSize = 0;

    if (visibleElements === 1) {
      // Only one element - use most of the space
      if (hasValue) {
        valueSize = height * 0.45;
      } else if (hasTitle) {
        titleSize = height * 0.3;
      } else if (hasChange) {
        changeSize = height * 0.35;
      }
    } else if (visibleElements === 2) {
      // Two elements
      if (hasTitle && hasValue) {
        titleSize = height * 0.15;
        valueSize = height * 0.45;
      } else if (hasValue && hasChange) {
        valueSize = height * 0.45;
        changeSize = height * 0.25;
      } else if (hasTitle && hasChange) {
        titleSize = height * 0.2;
        changeSize = height * 0.3;
      }
    } else if (visibleElements === 3) {
      // All three elements
      titleSize = height * 0.12;
      valueSize = height * 0.4;
      changeSize = height * 0.2;
    }

    // Build the full text string for each element
    const fullValueText = textData.unitFirst
      ? `${textData.unitText}${textData.numericValue}`
      : `${textData.numericValue}${textData.unitText}`;

    const titleText = title || '';
    const changeText = textData.changeText || '';

    // Apply width-based constraint using utility function
    titleSize = constrainFontSizeByWidth({
      containerWidth: width,
      text: titleText,
      fontSize: titleSize,
      minSize: 12,
      maxSize: 24,
    });

    valueSize = constrainFontSizeByWidth({
      containerWidth: width,
      text: fullValueText,
      fontSize: valueSize,
      minSize: 20,
      maxSize: 90,
    });

    changeSize = constrainFontSizeByWidth({
      containerWidth: width,
      text: changeText,
      fontSize: changeSize,
      minSize: 14,
      maxSize: 32,
    });

    // Override with user-defined sizes if provided
    return {
      title: styles.titleSize || titleSize,
      value: styles.fontSize || valueSize,
      change: styles.percentageSize || changeSize,
    };
  }, [
    containerDimensions,
    styles.titleSize,
    styles.fontSize,
    styles.percentageSize,
    styles.showPercentage,
    name,
    textData.numericValue,
    textData.unitText,
    textData.unitFirst,
    textData.changeText,
    title,
  ]);

  // Use calculated dynamic font sizes
  const titleFontSize = dynamicFontSizes.title;
  const valueFontSize = dynamicFontSizes.value;
  const changeFontSize = dynamicFontSizes.change;

  // Determine container styles based on color mode
  const containerStyle: React.CSSProperties = {};

  if (textData.backgroundColor) {
    containerStyle.backgroundColor = textData.backgroundColor;
  } else if (textData.backgroundGradient) {
    containerStyle.background = textData.backgroundGradient;
  }

  return (
    <div className="metric-component" style={containerStyle}>
      {/* Sparkline */}
      {spec && (
        <div className="metric-sparkline">
          <EchartsRender spec={spec} />
        </div>
      )}

      {/* HTML rendered text content */}
      <div className="metric-text-overlay" ref={overlayRef}>
        {title && (
          <div
            className="metric-title"
            style={{
              fontSize: titleFontSize,
              color:
                textData.backgroundColor || textData.backgroundGradient
                  ? textData.fillColor
                  : getColors().text,
            }}
          >
            {title}
          </div>
        )}

        <div className="metric-value">
          {textData.unitFirst && textData.unitText && (
            <span
              className="metric-value-unit"
              style={{
                fontSize: valueFontSize,
                color: textData.fillColor,
              }}
            >
              {textData.unitText}
            </span>
          )}
          <span
            className="metric-value-number"
            style={{
              fontSize: valueFontSize,
              color: textData.fillColor,
            }}
          >
            {textData.numericValue}
          </span>
          {!textData.unitFirst && textData.unitText && (
            <span
              className="metric-value-unit"
              style={{
                fontSize: valueFontSize * 0.45,
                color: textData.fillColor,
                marginLeft: '0.2em',
              }}
            >
              {textData.unitText}
            </span>
          )}
        </div>

        {styles.showPercentage && textData.changeText && (
          <div
            className="metric-change"
            style={{
              fontSize: changeFontSize,
              color:
                textData.backgroundColor || textData.backgroundGradient
                  ? textData.fillColor
                  : textData.changeColor,
            }}
          >
            {textData.changeText}
          </div>
        )}
      </div>
    </div>
  );
};
