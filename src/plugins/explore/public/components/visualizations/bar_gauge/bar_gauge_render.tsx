/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CSSProperties, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { Threshold } from '../types';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { DEFAULT_GREY, getColors } from '../theme/default_colors';
import { getUnitById, appendUnitSuffix } from '../style_panel/unit/collection';
import { formatDecimal } from '../utils/data_transformation';
import { BarGaugeItem, BarGaugeItemData } from './bar_gauge_item';
import './bar_gauge_component.scss';

export type { BarGaugeData } from './bar_gauge_item';

interface BarGaugeRenderProps {
  data: Array<{ category: string; value: number | null }>;
  styles: BarGaugeChartStyle;
  isHorizontal: boolean;
}

interface BarGaugeContainerStyle extends CSSProperties {
  '--bar-gauge-value-width': string;
}

const DEFAULT_VALUE_FONT_SIZE = 14;
const VALUE_WIDTH_BUFFER = 2;
const DEFAULT_VALUE_FONT_FAMILY =
  'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

let measurementContext: CanvasRenderingContext2D | null = null;

const measureTextWidth = (text: string, fontSize: number, fontFamily: string): number => {
  if (!measurementContext && typeof document !== 'undefined') {
    measurementContext = document.createElement('canvas').getContext('2d');
  }

  if (!measurementContext) {
    return text.length * fontSize * 0.6;
  }

  measurementContext.font = `400 ${fontSize}px ${fontFamily}`;
  return measurementContext.measureText(text).width;
};

// Build thresholds for each bar
const buildItemThresholds = (
  value: number,
  minBase: number,
  rawThresholds: Threshold[],
  baseColor: string
): Threshold[] => {
  const base: Threshold = { value: minBase, color: baseColor };
  const applicable = rawThresholds.filter((t) => t.value > minBase && t.value <= value);

  // Update base color if a threshold is equal or below minBase
  for (const t of rawThresholds) {
    if (t.value <= minBase) base.color = t.color;
  }

  // add value threshold, colored by the last applicable threshold
  const lastColor = applicable.length > 0 ? applicable[applicable.length - 1].color : base.color;

  return [base, ...applicable, { value, color: lastColor }];
};

export const BarGaugeRender = ({ data, styles, isHorizontal }: BarGaugeRenderProps) => {
  // State for container dimensions
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [valueFontFamily, setValueFontFamily] = useState(DEFAULT_VALUE_FONT_FAMILY);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handlerRef = useRef(
    debounce((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerDimensions({ width, height });
      }
    }, 100)
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    setValueFontFamily(getComputedStyle(element).fontFamily || DEFAULT_VALUE_FONT_FAMILY);

    const handler = handlerRef.current;
    const resizeObserver = new ResizeObserver(handler);
    resizeObserver.observe(element);

    return () => {
      handler.cancel();
      resizeObserver.disconnect();
    };
  }, []);

  const { minBase, maxBase, baseColor, selectedUnit, rawThresholds, isInvalid } = useMemo(() => {
    const validValues = data.map((d) => d.value).filter((v): v is number => v !== null);
    const maxNumber = validValues.length > 0 ? Math.max(...validValues) : 0;
    const minNumber = validValues.length > 0 ? Math.min(...validValues) : 0;

    const min = styles.min ?? Math.min(minNumber, 0);
    const max = styles.max ?? Math.max(maxNumber, 0);
    const invalid = min >= max;

    return {
      minBase: invalid ? 0 : min,
      maxBase: invalid ? 100 : max,
      isInvalid: invalid,
      baseColor: styles.thresholdOptions.baseColor ?? getColors().statusGreen,
      selectedUnit: getUnitById(styles.unitId),
      rawThresholds: styles.thresholdOptions.thresholds ?? [],
    };
  }, [data, styles]);

  const formatValue = useCallback(
    (value: number | null): string => {
      if (value === null) return '-';
      const base = selectedUnit?.display
        ? String(selectedUnit.display(value, selectedUnit.symbol, styles.decimals).label)
        : `${formatDecimal(value, styles.decimals)}${
            selectedUnit?.symbol ? ` ${selectedUnit.symbol}` : ''
          }`;
      return appendUnitSuffix(base, styles.unitSuffix);
    },
    [selectedUnit, styles.decimals, styles.unitSuffix]
  );

  const getFontColor = useCallback(
    (value: number | null): string => {
      if (styles.exclusive.valueDisplay === 'textColor') return getColors().text;
      if (styles.exclusive.valueDisplay === 'hidden') return 'transparent';
      if (value === null) return DEFAULT_GREY;
      const leftThresholds = rawThresholds.filter((t) => t.value <= value);
      return leftThresholds.length > 0
        ? leftThresholds[leftThresholds.length - 1].color
        : baseColor;
    },
    [baseColor, rawThresholds, styles.exclusive.valueDisplay]
  );

  const items: BarGaugeItemData[] = useMemo(() => {
    const range = maxBase - minBase;

    return data.map((d) => {
      const { category, value } = d;

      // null value or invalid scale
      // only show unfilled area shadow shows if turn on showUnfilledArea
      if (value === null || isInvalid) {
        return {
          category,
          value,
          displayValue: formatValue(value),
          fontColor: DEFAULT_GREY,
          thresholds: [{ value: minBase, color: 'transparent' }],
          percentage: 0,
          stackSegments: null,
        };
      }

      const cutValue = Math.min(value, maxBase);
      // compute bar length percentage
      const percentage =
        range > 0 ? Math.max(0, Math.min(100, ((cutValue - minBase) / range) * 100)) : 0;
      const finalThresholds = buildItemThresholds(cutValue, minBase, rawThresholds, baseColor);

      // stack mode
      let stackSegments: BarGaugeItemData['stackSegments'] = null;
      if (styles.exclusive.displayMode === 'stack') {
        const filledRange = cutValue - minBase;
        if (filledRange > 0) {
          stackSegments = [];
          for (let i = 0; i < finalThresholds.length - 1; i++) {
            const lower = finalThresholds[i].value;
            const upper = finalThresholds[i + 1].value;
            const segPercentage = ((upper - lower) / filledRange) * 100;
            if (segPercentage > 0) {
              stackSegments.push({ segPercentage, color: finalThresholds[i].color });
            }
          }
        }
      }

      return {
        category,
        value,
        displayValue: formatValue(value),
        fontColor: getFontColor(value),
        thresholds: finalThresholds,
        percentage,
        stackSegments,
      };
    });
  }, [
    data,
    minBase,
    maxBase,
    isInvalid,
    baseColor,
    rawThresholds,
    styles.exclusive.displayMode,
    formatValue,
    getFontColor,
  ]);

  // scale font size  with bar thickness
  const valueFontSize = useMemo(() => {
    const barCount = data.length || 1;
    const size = isHorizontal ? containerDimensions.height : containerDimensions.width;
    if (size === 0) return undefined;

    // subtract padding (4% each side) and gaps (2% * gaps)
    const leftWidth = size * (1 - 0.04 * 2) - size * 0.02 * (barCount - 1);
    const computedThickness = (leftWidth / barCount) * 0.7;

    // when bars overflow and scroll, each bar is clamped to the min-height/min-width(40px)
    const minThickness = 40;
    const barThickness = Math.max(computedThickness, minThickness);

    const maxValueLen = items.reduce((max, item) => Math.max(max, item.displayValue.length), 1);
    const fontSize = isHorizontal ? barThickness / 2 : barThickness / (maxValueLen * 0.5);
    return Math.min(24, fontSize);
  }, [containerDimensions, data.length, isHorizontal, items]);

  const valueColumnWidth = useMemo(() => {
    if (!isHorizontal || styles.exclusive.valueDisplay === 'hidden' || items.length === 0) {
      return 0;
    }

    const fontSize = valueFontSize ?? DEFAULT_VALUE_FONT_SIZE;
    const widestValue = items.reduce(
      (maxWidth, item) =>
        Math.max(maxWidth, measureTextWidth(item.displayValue, fontSize, valueFontFamily)),
      0
    );

    return Math.ceil(widestValue) + VALUE_WIDTH_BUFFER;
  }, [isHorizontal, items, styles.exclusive.valueDisplay, valueFontFamily, valueFontSize]);

  const containerStyle: BarGaugeContainerStyle | undefined = isHorizontal
    ? { '--bar-gauge-value-width': `${valueColumnWidth}px` }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`main-bar-gauge-container ${isHorizontal ? 'horizontal' : 'vertical'}`}
      style={containerStyle}
    >
      {items.map((item, index) => (
        <BarGaugeItem
          key={`${item.category}-${index}`}
          item={item}
          styles={styles}
          isHorizontal={isHorizontal}
          valueFontSize={valueFontSize}
        />
      ))}
    </div>
  );
};
