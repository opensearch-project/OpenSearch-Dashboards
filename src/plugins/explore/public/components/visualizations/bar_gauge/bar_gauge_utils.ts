/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarSeriesOption } from 'echarts';
import { graphic } from 'echarts';
import { AxisColumnMappings, Threshold, VisFieldType, AxisRole, VisColumn } from '../types';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { DEFAULT_GREY, getColors } from '../theme/default_colors';
import { BaseChartStyle, PipelineFn, EChartsSpecState, getAxisType } from '../utils/echarts_spec';
import { getUnitById } from '../style_panel/unit/collection';

export const getBarOrientation = (
  styles: BarGaugeChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;
  const isHorizontal = styles?.exclusive.orientation === 'horizontal';
  const isXNumerical = xAxis?.schema === VisFieldType.Numerical;

  const axisStyle = {
    axis: { tickOpacity: 0, grid: false, title: null, labelAngle: 0, labelOverlap: 'greedy' },
  };
  const nullStyle = { axis: null };

  if (isHorizontal) {
    return {
      xAxis: yAxis,
      xAxisStyle: isXNumerical ? axisStyle : nullStyle,
      yAxis: xAxis,
      yAxisStyle: isXNumerical ? nullStyle : axisStyle,
    };
  }

  return {
    xAxis,
    xAxisStyle: isXNumerical ? nullStyle : axisStyle,
    yAxis,
    yAxisStyle: isXNumerical ? axisStyle : nullStyle,
  };
};

export const thresholdsToGradient = (thresholds: Threshold[]) => {
  return thresholds.map((threshold: Threshold, index) => {
    return {
      calculate: `${threshold.value}`,
      as: `threshold${index}`,
    };
  });
};

export const symbolOpposite = (orientationMode: string, symbol: string) => {
  if (orientationMode === 'horizontal') {
    return symbol === 'x' ? 'y' : 'x';
  }
  return symbol;
};

export const getGradientConfig = (
  orientationMode: string,
  displayMode: string,
  isXaxisNumerical: boolean
) => {
  if (
    (!isXaxisNumerical && orientationMode === 'horizontal') ||
    (isXaxisNumerical && orientationMode !== 'horizontal')
  ) {
    if (displayMode === 'gradient')
      return {
        x1: 0,
        y1: 0,
        x2: 1,
        y2: 0,
      };
  }

  if (displayMode === 'gradient')
    return {
      x1: 1,
      y1: 1,
      x2: 1,
      y2: 0,
    };
};

export const normalizeData = (data: number, start: number, end: number) => {
  if (start === end) return null;
  // normalize data value between start and end into 0–1 range
  return (data - start) / (end - start);
};

export const generateParams = (
  thresholds: Threshold[],
  styleOptions: BarGaugeChartStyle,
  isXaxisNumerical: boolean
) => {
  const result: any[] = [];

  for (let i = 0; i < thresholds.length; i++) {
    const start = thresholds[0].value;

    const end = thresholds[i].value;

    if (i === 0) {
      result.push({
        name: `gradient${i}`,
        value: thresholds[0]?.color,
      });
      continue;
    }

    const allStops = thresholds.slice(0, i + 1).map((t) => ({
      offset: normalizeData(t.value, start, end),
      color: t.color,
    }));

    const stops = [];
    for (let j = 0; j < allStops.length; j++) {
      const curr = allStops[j];
      const prev = allStops[j - 1];

      if (j === 0 || j === allStops.length - 1 || curr.color !== prev?.color) {
        stops.push(curr);
      }
    }

    if (stops.length > 2 && stops[stops.length - 1].color === stops[stops.length - 2].color) {
      stops.splice(stops.length - 2, 1);
    }

    result.push({
      name: `gradient${i}`,
      value: {
        gradient: 'linear',
        ...getGradientConfig(
          styleOptions.exclusive.orientation,
          styleOptions.exclusive.displayMode,
          isXaxisNumerical
        ),
        stops,
      },
    });
  }

  return result;
};

export const generateThresholds = (
  minBase: number,
  maxBase: number,
  thresholds: Threshold[],
  baseColor: string | undefined
) => {
  const defaultColor = baseColor ?? getColors().statusGreen;

  // sort thresholds by value and dedupe threshold by value
  thresholds = thresholds
    .sort((t1, t2) => t1.value - t2.value)
    .reduce((acc, t) => {
      const last = acc.pop();
      if (last) {
        if (last.value === t.value) {
          return [...acc, t];
        } else {
          return [...acc, last, t];
        }
      }
      return [...acc, t];
    }, [] as Threshold[]);

  const result: Threshold[] = [];

  const minThreshold: Threshold = { value: minBase, color: defaultColor };
  for (const threshold of thresholds) {
    if (minThreshold.value >= threshold.value) {
      minThreshold.color = threshold.color;
    }
    if (threshold.value > minThreshold.value && threshold.value <= maxBase) {
      result.push(threshold);
    }
  }
  result.unshift(minThreshold);

  return result;
};

export const generateValueThresholds = (
  minBase: number,
  maxBase: number,
  valueStops: number[],
  thresholds: Threshold[]
) => {
  const filteredValueStops = valueStops
    .filter((v) => v <= maxBase && v >= minBase)
    .sort((a, b) => a - b);

  const valueThresholds: Threshold[] = [];
  if (filteredValueStops.length > 0 && thresholds.length > 0) {
    const stops = [...new Set(filteredValueStops)];

    let thresholdIndex = 0;

    for (const stop of stops) {
      while (
        thresholdIndex < thresholds.length - 1 &&
        thresholds[thresholdIndex + 1].value <= stop
      ) {
        thresholdIndex++;
      }

      // Add valid threshold for this stop
      if (thresholds[thresholdIndex].value <= stop) {
        valueThresholds.push({ value: stop, color: thresholds[thresholdIndex].color });
      }
    }
  }
  return valueThresholds;
};

export const createBarGaugeSeries = <T extends BaseChartStyle>({
  styles,
  categoryField,
  valueField,
}: {
  styles: BarGaugeChartStyle;
  categoryField: string;
  valueField: string;
}): PipelineFn<T> => (state: EChartsSpecState<T>) => {
  const { transformedData, axisColumnMappings } = state;
  const newState = { ...state };

  // null is already identified as invalid numbers at the aggregate stage.
  // will convert null values to minBase as intended.
  const values = transformedData?.map((row) => row[valueField]) ?? [];
  const categories = transformedData?.map((item) => String(item[categoryField])) ?? [];

  const selectedUnit = getUnitById(styles?.unitId);

  const displayValues = values.map((value) =>
    value === null
      ? '-'
      : selectedUnit && selectedUnit?.display
      ? selectedUnit?.display(value, selectedUnit?.symbol)
      : `${Math.round(value * 100) / 100} ${selectedUnit?.symbol ?? ''}`
  );

  const barNumbers = values?.length;
  const validValues = values.filter((v) => v !== null);
  const maxNumber = validValues.length > 0 ? Math.max(...validValues) : 0;
  const minNumber = validValues.length > 0 ? Math.min(...validValues) : 0;

  let maxBase = styles?.max ?? Math.max(maxNumber, 0);
  let minBase = styles?.min ?? Math.min(minNumber, 0);

  const fontFactor =
    barNumbers * displayValues.reduce((acc, display) => Math.max(acc, String(display).length), 0);

  // text color only display the corresponding threshold color and ignore min/max control
  const fontColors = values.map((value) => {
    if (styles?.exclusive?.valueDisplay === 'textColor') return getColors().text;
    if (styles?.exclusive?.valueDisplay === 'hidden') return 'transparent';
    if (value === null) return DEFAULT_GREY;
    const thresholds = (styles.thresholdOptions.thresholds ?? []).filter(
      (t) => t.value <= Number(value)
    );

    return thresholds.length === 0
      ? styles.thresholdOptions.baseColor
      : thresholds[thresholds.length - 1].color;
  });

  const invalidCase = minBase >= maxBase || minBase > maxNumber;

  // if it is invalidCase, use a fake domain to keep rendering consistent
  if (invalidCase) {
    minBase = 0;
    maxBase = 100;
  }

  const { xAxisConfig, yAxisConfig } = createBarGaugeAxesConfig({
    styles,
    categories,
    axisColumnMappings,
    minBase,
    maxBase,
  });

  const gradientDirection = xAxisConfig.type === 'category' ? [0, 1, 0, 0] : [0, 0, 1, 0];

  const updatedValues = values.map((value) => (value === null ? minBase : value));
  const bars =
    createBarSeries({
      styles,
      values: updatedValues,
      minBase,
      maxBase,
      thresholds: styles.thresholdOptions.thresholds ?? [],
      gradientDirection,
    }) ?? [];

  const series = [
    {
      type: 'bar',
      name: 'unfilledArea',
      barGap: '-100%', // make sure unfilled area is below
      itemStyle: {
        color: styles?.exclusive.showUnfilledArea ? getColors().backgroundShade : 'transparent',
      },
      silent: true,
      emphasis: { disabled: true },
      tooltip: {
        show: false,
      },
      data: displayValues.map((_, i) => ({
        value: !invalidCase
          ? styles?.exclusive.showUnfilledArea
            ? maxBase
            : values[i]
          : styles?.exclusive.showUnfilledArea
          ? 100
          : 0,
        label: {
          show: true,
          position: 'top',
          color: fontColors[i],
          fontSize: Math.max(10, Math.min(25, 100 / Math.sqrt(fontFactor))), // font size between 10px  and 25px
          formatter: displayValues[i],
        },
      })),
    },
    ...(!invalidCase ? bars : []),
  ];

  newState.series = series as BarSeriesOption[];
  newState.xAxisConfig = xAxisConfig;
  newState.yAxisConfig = yAxisConfig;

  return newState;
};

const createBarSeries = ({
  styles,
  thresholds,
  values,
  minBase,
  maxBase,
  gradientDirection,
}: {
  styles: BarGaugeChartStyle;
  thresholds: Threshold[];
  values: number[];
  maxBase: number;
  minBase: number;
  gradientDirection: number[];
}) => {
  const defaultColor = styles?.thresholdOptions.baseColor ?? getColors().statusGreen;

  const tooltipFormatter = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: (param: any) => {
          const originalValue = values[param.dataIndex];
          return `
        <strong>${param.name}</strong>: ${originalValue}
      `;
        },
      },
    };
  };

  switch (styles?.exclusive.displayMode) {
    case 'gradient': {
      // clamp values to maxBase in gradient mode
      const updateValues = [...values].map((value) => Math.min(maxBase, value));
      const gradientMap = generateGradientMap({
        thresholds,
        defaultColor,
        valueStops: updateValues,
        maxBase,
        minBase,
      });
      const gradients = composeGradients(updateValues, gradientMap, gradientDirection);
      return [
        {
          type: 'bar',
          data: gradients,
          ...tooltipFormatter(),
        },
      ];
    }
    case 'stack': {
      // Stack mode: bars always start from 0, axis.min and axis.max handles visual baseline
      const allThresholds = [{ value: 0, color: defaultColor }, ...thresholds];
      const result = [];
      for (let i = 0; i < allThresholds.length; i++) {
        const lower = allThresholds[i]?.value;
        const upper = allThresholds[i + 1]?.value ?? maxBase;

        result.push({
          name: `${lower}-${upper}`,
          type: 'bar',
          stack: 'total',
          itemStyle: {
            color: allThresholds[i].color,
          },
          ...tooltipFormatter(),
          data: values.map((v) => Math.max(Math.min(v, upper) - lower, 0)),
        });
      }
      return result;
    }
    case 'basic': {
      const allThresholds = insertMinbaseThreshold({
        thresholds,
        defaultColor,
        valueStops: values,
        maxBase,
        minBase,
      });
      return [
        {
          type: 'bar',
          data: values.map((value) => {
            const applicableThresholds = allThresholds.filter((t) => t.value <= value);
            const color =
              applicableThresholds[applicableThresholds.length - 1]?.color ?? defaultColor;
            return { value, itemStyle: { color } };
          }),
          ...tooltipFormatter(),
        },
      ];
    }
  }
};

const insertMinbaseThreshold = ({
  thresholds,
  defaultColor,
  maxBase,
  minBase,
}: {
  thresholds: Threshold[];
  defaultColor: string;
  valueStops: number[];
  maxBase: number;
  minBase: number;
}) => {
  const minThreshold: Threshold = { value: minBase, color: defaultColor };

  const allThresholds: Threshold[] = [];
  for (const threshold of thresholds) {
    if (minThreshold.value >= threshold.value) {
      minThreshold.color = threshold.color;
    }
    if (threshold.value > minThreshold.value && threshold.value <= maxBase) {
      allThresholds.push(threshold);
    }
  }
  allThresholds.unshift(minThreshold);
  return allThresholds;
};

const generateGradientMap = ({
  thresholds,
  defaultColor,
  valueStops,
  maxBase,
  minBase,
}: {
  thresholds: Threshold[];
  defaultColor: string;
  valueStops: number[];
  maxBase: number;
  minBase: number;
}) => {
  // step 1: insert minBase as threshold and filter thresholds
  const allThresholds = insertMinbaseThreshold({
    thresholds,
    defaultColor,
    valueStops,
    maxBase,
    minBase,
  });

  // step 2: generate gradient steps for each value
  const filteredValueStops = valueStops
    .filter((v) => v <= maxBase && v >= minBase)
    .sort((a, b) => a - b);

  const valueGradients: Map<number, any> = new Map();

  if (filteredValueStops.length > 0 && allThresholds.length > 0) {
    const stops = [...new Set(filteredValueStops)];

    let thresholdIndex = 0;
    for (const stop of stops) {
      while (
        thresholdIndex < allThresholds.length - 1 &&
        allThresholds[thresholdIndex + 1].value <= stop
      ) {
        thresholdIndex++;
      }

      const valueThreshold = { value: stop, color: allThresholds[thresholdIndex].color };
      const formerThresholds = allThresholds.slice(0, thresholdIndex + 1);
      if (formerThresholds.length > 1) formerThresholds.pop();
      const computeGradient = formerThresholds.concat(valueThreshold);

      const start = computeGradient[0].value;
      const gradientSteps = computeGradient.map((t) => ({
        offset: normalizeData(t.value, start, stop),
        color: t.color,
      }));

      valueGradients.set(stop, gradientSteps);
    }
  }

  return valueGradients;
};

export const composeGradients = (
  values: number[],
  valueGradients: Map<number, any>,
  gradientDirection: number[]
) => {
  return values.map((value) => {
    const gradient = valueGradients.get(value);
    return {
      value,
      itemStyle: {
        color: new graphic.LinearGradient(
          gradientDirection[0],
          gradientDirection[1],
          gradientDirection[2],
          gradientDirection[3],
          gradient
        ),
      },
    };
  });
};

export const createBarGaugeAxesConfig = ({
  styles,
  categories,
  axisColumnMappings,
  minBase,
  maxBase,
}: {
  styles: BarGaugeChartStyle;
  categories: string[];
  axisColumnMappings: Partial<Record<AxisRole, VisColumn>>;
  minBase: number;
  maxBase: number;
}) => {
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getAxesStyleConfig(styles, axisColumnMappings);

  const isXNumerical = xAxis?.schema === VisFieldType.Numerical;

  const xAxisConfig = {
    type: getAxisType(xAxis),
    ...xAxisStyle,
    ...(!isXNumerical && { data: categories }),
    ...(isXNumerical && { max: maxBase, min: minBase }),
    ...(isXNumerical && { startValue: minBase }),
  };

  const yAxisConfig = {
    type: getAxisType(yAxis),
    ...yAxisStyle,
    ...(isXNumerical && { data: categories }),
    ...(!isXNumerical && { max: maxBase, min: minBase }),
    ...(!isXNumerical && { startValue: minBase }),
  };

  return { xAxisConfig, yAxisConfig };
};

const getAxesStyleConfig = (
  styles: BarGaugeChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;
  const isHorizontal = styles?.exclusive.orientation === 'horizontal';
  const isXNumerical = xAxis?.schema === VisFieldType.Numerical;

  const axisStyle = {
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
  };
  const nullStyle = { show: false };

  if (isHorizontal) {
    return {
      xAxis: yAxis,
      xAxisStyle: isXNumerical ? axisStyle : nullStyle,
      yAxis: xAxis,
      yAxisStyle: isXNumerical ? nullStyle : axisStyle,
    };
  }

  return {
    xAxis,
    xAxisStyle: isXNumerical ? nullStyle : axisStyle,
    yAxis,
    yAxisStyle: isXNumerical ? axisStyle : nullStyle,
  };
};

export const assembleBarGaugeSpec = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { baseConfig, transformedData = [], xAxisConfig, yAxisConfig, series } = state;

  const spec = {
    ...baseConfig,
    dataset: { source: transformedData },
    xAxis: xAxisConfig,
    yAxis: yAxisConfig,
    series,
    grid: { top: 50, right: 30, bottom: 40, left: 30 },
  };

  return { ...state, spec };
};
