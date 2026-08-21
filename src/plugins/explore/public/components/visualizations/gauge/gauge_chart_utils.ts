/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GaugeSeriesOption } from 'echarts';
import { VisColumn } from '../types';
import { GaugeChartStyle } from './gauge_vis_config';
import { calculateValue } from '../utils/calculation';
import { getUnitById } from '../style_panel/unit/collection';
import {
  getMaxAndMinBase,
  mergeThresholdsWithBase,
  locateThreshold,
} from '../style_panel/threshold/threshold_utils';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';

const GAUGE_RADIUS = '92%';
const GAUGE_CENTER: [string, string] = ['50%', '60%'];
const GAUGE_START_ANGLE = 200;
const GAUGE_END_ANGLE = -20;
const GAUGE_ARC_WIDTH = 12;

export interface GaugeTextRenderData {
  value: string;
  unit?: string;
  unitFirst: boolean;
  title?: {
    valueFieldName: string;
    customTitle?: string;
  };
  valueColor: string;
  titleColor: string;
  unitColor: string;
}

interface GaugeArcRenderData {
  calculatedValue: number | undefined;
  minBase: number;
  maxBase: number;
  normalizedThresholds: Array<[number, string]>;
  valueArcColor: string;
}

interface GaugeRenderData {
  arc: GaugeArcRenderData;
  text: GaugeTextRenderData;
}

interface BuildGaugeRenderDataArgs {
  transformedData: any[][];
  styles: GaugeChartStyle;
  valueColumn: VisColumn;
}

const isValidDisplayNumber = (value: unknown): value is number =>
  value !== undefined && typeof value === 'number' && !isNaN(value);

const createGaugeText = ({
  calculatedValue,
  selectedUnit,
  styles,
  valueFieldName,
  textColor,
}: {
  calculatedValue: number | undefined;
  selectedUnit: ReturnType<typeof getUnitById>;
  styles: GaugeChartStyle;
  valueFieldName: string;
  textColor: string;
}): GaugeTextRenderData => {
  const isValidNumber = isValidDisplayNumber(calculatedValue);
  const effectiveTextColor = styles.useThresholdColor ? textColor : getColors().text;
  const baseText = {
    unitFirst: false,
    ...(styles.showTitle && {
      title: {
        valueFieldName,
        customTitle: styles.title || undefined,
      },
    }),
    valueColor: effectiveTextColor,
    titleColor: getColors().text,
    unitColor: effectiveTextColor,
  };

  if (!isValidNumber) {
    return {
      ...baseText,
      value: '-',
    };
  }

  if (selectedUnit?.display) {
    const unitDisplay = selectedUnit.display(calculatedValue, selectedUnit.symbol);
    const segments = unitDisplay.segments;

    if (!segments?.length) {
      return {
        ...baseText,
        value: String(unitDisplay.label),
      };
    }

    const unitSegment = segments.find((segment) => segment.type === 'unit');
    const valueSegment = segments.find((segment) => segment.type === 'value');

    return {
      ...baseText,
      value: valueSegment !== undefined ? String(valueSegment.value) : String(unitDisplay.label),
      unit: unitSegment !== undefined ? String(unitSegment.value) : undefined,
      unitFirst: segments[0]?.type === 'unit',
    };
  }

  return {
    ...baseText,
    value: `${Math.round(calculatedValue * 100) / 100}`,
    unit: selectedUnit?.symbol,
  };
};

export const buildGaugeRenderData = ({
  transformedData,
  styles,
  valueColumn,
}: BuildGaugeRenderDataArgs): GaugeRenderData | undefined => {
  if (!transformedData.length || !Array.isArray(transformedData[0])) {
    return undefined;
  }

  const field = valueColumn.column;
  const seriesIndex = transformedData[0].indexOf(field);

  if (seriesIndex < 0) return undefined;

  const numericalValues: any[] = [];
  for (let i = 1; i < transformedData.length; i++) {
    numericalValues.push(transformedData[i][seriesIndex]);
  }

  const calculatedValue = calculateValue(numericalValues, styles.valueCalculation);
  const validValues = numericalValues.filter((value) => !isNaN(value));
  const maxNumber = validValues.length > 0 ? Math.max(...validValues) : 0;
  const minNumber = validValues.length > 0 ? Math.min(...validValues) : 0;
  const selectedUnit = getUnitById(styles.unitId);

  const { minBase, maxBase } = getMaxAndMinBase(
    minNumber,
    maxNumber,
    styles.min,
    styles.max,
    calculatedValue
  );

  const { textColor, mergedThresholds } = mergeThresholdsWithBase(
    minBase,
    maxBase,
    styles.thresholdOptions?.baseColor,
    styles.thresholdOptions?.thresholds,
    calculatedValue
  );

  const targetThreshold = locateThreshold(mergedThresholds, calculatedValue);
  const valueArcColor = targetThreshold?.color ?? 'transparent';

  // Gauge colors are defined as "up to this point", not "from this point".
  const normalizedThresholds: Array<[number, string]> =
    maxBase > minBase
      ? mergedThresholds.map((threshold, index) => {
          if (index > 0) {
            return [
              (threshold.value - minBase) / (maxBase - minBase),
              mergedThresholds[index - 1].color,
            ];
          }
          return [0, threshold.color];
        })
      : [];

  if (normalizedThresholds.length > 0) {
    normalizedThresholds.push([1, mergedThresholds[mergedThresholds.length - 1].color]);
  }

  return {
    arc: {
      calculatedValue,
      minBase,
      maxBase,
      normalizedThresholds,
      valueArcColor,
    },
    text: createGaugeText({
      calculatedValue,
      selectedUnit,
      styles,
      valueFieldName: valueColumn.name,
      textColor,
    }),
  };
};

const createThresholdArc = (arc: GaugeArcRenderData): GaugeSeriesOption =>
  ({
    type: 'gauge',
    center: GAUGE_CENTER,
    startAngle: GAUGE_START_ANGLE,
    radius: GAUGE_RADIUS,
    endAngle: GAUGE_END_ANGLE,
    z: 5,
    min: arc.minBase,
    max: arc.maxBase,
    tooltip: { show: false },
    progress: {
      show: true,
      width: GAUGE_ARC_WIDTH + 2,
      itemStyle: {
        color: getColors().backgroundShade,
      },
    },
    pointer: {
      show: false,
    },
    axisLine: {
      lineStyle: {
        width: GAUGE_ARC_WIDTH + 4,
        ...(arc.normalizedThresholds.length > 0 && { color: arc.normalizedThresholds }),
      },
    },
    axisTick: {
      show: false,
    },
    splitLine: {
      show: false,
    },
    axisLabel: {
      show: false,
    },
    anchor: {
      show: false,
    },
    title: {
      show: false,
    },
    detail: {
      show: false,
    },
    data: [
      {
        value: arc.maxBase,
      },
    ],
  }) as GaugeSeriesOption;

const createValueArc = (arc: GaugeArcRenderData): GaugeSeriesOption => ({
  type: 'gauge',
  center: GAUGE_CENTER,
  radius: GAUGE_RADIUS,
  startAngle: GAUGE_START_ANGLE,
  endAngle: GAUGE_END_ANGLE,
  z: 10,
  min: arc.minBase,
  max: arc.maxBase,
  tooltip: { show: false },
  itemStyle: {
    color: arc.valueArcColor,
  },
  progress: {
    show: true,
    width: GAUGE_ARC_WIDTH,
  },
  pointer: {
    show: false,
  },
  axisLine: {
    show: true,
    lineStyle: {
      width: GAUGE_ARC_WIDTH,
      color: [
        [1, DEFAULT_GREY], // remaining grey part
      ],
    },
  },
  axisTick: {
    show: false,
  },
  splitLine: {
    show: false,
  },
  axisLabel: {
    show: false,
  },
  title: {
    show: false,
  },
  detail: {
    show: false,
  },
  data: [
    {
      value: arc.calculatedValue,
    },
  ],
});

export const createGaugeSeries = (arc?: GaugeArcRenderData): GaugeSeriesOption[] =>
  arc ? [createValueArc(arc), createThresholdArc(arc)] : [];
