/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { bisectLeft } from 'd3-array';
import { scaleBand, scaleQuantize } from 'd3-scale';

import { stringToRGB } from '../../../../common/color_library_wrappers';
import { Pixels } from '../../../../common/geometry';
import { Box, TextMeasure } from '../../../../common/text_utils';
import { ScaleContinuous } from '../../../../scales';
import { ScaleType } from '../../../../scales/constants';
import { SettingsSpec } from '../../../../specs';
import { CanvasTextBBoxCalculator } from '../../../../utils/bbox/canvas_text_bbox_calculator';
import { clamp } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { PrimitiveValue } from '../../../partition_chart/layout/utils/group_by_rollup';
import { HeatmapSpec } from '../../specs';
import { HeatmapTable } from '../../state/selectors/compute_chart_dimensions';
import { ColorScaleType } from '../../state/selectors/get_color_scale';
import { GridHeightParams } from '../../state/selectors/get_grid_full_height';
import { Config } from '../types/config_types';
import {
  Cell,
  PickDragFunction,
  PickDragShapeFunction,
  PickHighlightedArea,
  ShapeViewModel,
  TextBox,
} from '../types/viewmodel_types';

/** @public */
export interface HeatmapCellDatum {
  x: NonNullable<PrimitiveValue>;
  y: NonNullable<PrimitiveValue>;
  value: number;
  originalIndex: number;
}

function getValuesInRange(
  values: NonNullable<PrimitiveValue>[],
  startValue: NonNullable<PrimitiveValue>,
  endValue: NonNullable<PrimitiveValue>,
) {
  const startIndex = values.indexOf(startValue);
  const endIndex = Math.min(values.indexOf(endValue) + 1, values.length);
  return values.slice(startIndex, endIndex);
}

/**
 * Resolves the maximum number of ticks based on the chart width and sample label based on formatter config.
 */
function getTicks(chartWidth: number, xAxisLabelConfig: Config['xAxisLabel']): number {
  const bboxCompute = new CanvasTextBBoxCalculator();
  const labelSample = xAxisLabelConfig.formatter(Date.now());
  const { width } = bboxCompute.compute(
    labelSample,
    xAxisLabelConfig.padding,
    xAxisLabelConfig.fontSize,
    xAxisLabelConfig.fontFamily,
  );
  bboxCompute.destroy();
  const maxTicks = Math.floor(chartWidth / width);
  // Dividing by 2 is a temp fix to make sure {@link ScaleContinuous} won't produce
  // to many ticks creating nice rounded tick values
  // TODO add support for limiting the number of tick in {@link ScaleContinuous}
  return maxTicks / 2;
}

/** @internal */
export function shapeViewModel(
  textMeasure: TextMeasure,
  spec: HeatmapSpec,
  config: Config,
  settingsSpec: SettingsSpec,
  chartDimensions: Dimensions,
  heatmapTable: HeatmapTable,
  colorScale: ColorScaleType,
  filterRanges: Array<[number, number | null]>,
  { height, pageSize }: GridHeightParams,
): ShapeViewModel {
  const gridStrokeWidth = config.grid.stroke.width ?? 1;

  const { table, yValues, xDomain } = heatmapTable;

  // measure the text width of all rows values to get the grid area width
  const boxedYValues = yValues.map<Box & { value: NonNullable<PrimitiveValue> }>((value) => {
    return {
      text: config.yAxisLabel.formatter(value),
      value,
      ...config.yAxisLabel,
    };
  });

  // compute the scale for the rows positions
  const yScale = scaleBand<NonNullable<PrimitiveValue>>().domain(yValues).range([0, height]);

  const yInvertedScale = scaleQuantize<NonNullable<PrimitiveValue>>().domain([0, height]).range(yValues);

  // TODO: Fix domain type to be `Array<number | string>`
  let xValues = xDomain.domain as any[];

  const timeScale =
    xDomain.type === ScaleType.Time
      ? new ScaleContinuous(
          {
            type: ScaleType.Time,
            domain: xDomain.domain,
            range: [0, chartDimensions.width],
            nice: false,
          },
          {
            desiredTickCount: getTicks(chartDimensions.width, config.xAxisLabel),
            timeZone: config.timeZone,
          },
        )
      : null;

  if (timeScale) {
    const result = [];
    let [timePoint] = xValues;
    while (timePoint < xValues[1]) {
      result.push(timePoint);
      timePoint += xDomain.minInterval;
    }

    xValues = result;
  }

  // compute the scale for the columns positions
  const xScale = scaleBand<NonNullable<PrimitiveValue>>().domain(xValues).range([0, chartDimensions.width]);

  const xInvertedScale = scaleQuantize<NonNullable<PrimitiveValue>>().domain([0, chartDimensions.width]).range(xValues);

  // compute the cell width (can be smaller then the available size depending on config
  const cellWidth =
    config.cell.maxWidth !== 'fill' && xScale.bandwidth() > config.cell.maxWidth
      ? config.cell.maxWidth
      : xScale.bandwidth();

  // compute the cell height (we already computed the max size for that)
  const cellHeight = yScale.bandwidth();

  const currentGridHeight = cellHeight * pageSize;

  const getTextValue = (
    formatter: (v: any, options: any) => string,
    scaleCallback: (x: any) => number | undefined | null = xScale,
  ) => (value: any): TextBox => {
    return {
      text: formatter(value, { timeZone: config.timeZone }),
      value,
      ...config.xAxisLabel,
      x: chartDimensions.left + (scaleCallback(value) || 0),
      y: cellHeight * pageSize + config.xAxisLabel.fontSize / 2 + config.xAxisLabel.padding,
    };
  };

  // compute the position of each column label
  const textXValues: Array<TextBox> = timeScale
    ? timeScale.ticks().map<TextBox>(getTextValue(config.xAxisLabel.formatter, (x: any) => timeScale.scale(x)))
    : xValues.map<TextBox>((textBox: any) => {
        return {
          ...getTextValue(config.xAxisLabel.formatter)(textBox),
          x: chartDimensions.left + (xScale(textBox) || 0) + xScale.bandwidth() / 2,
        };
      });

  const { padding } = config.yAxisLabel;
  const rightPadding = typeof padding === 'number' ? padding : padding.right ?? 0;

  // compute the position of each row label
  const textYValues = boxedYValues.map<TextBox>((d) => {
    return {
      ...d,
      // position of the Y labels
      x: chartDimensions.left - rightPadding,
      y: cellHeight / 2 + (yScale(d.value) || 0),
    };
  });

  // compute each available cell position, color and value
  const cellMap = table.reduce<Record<string, Cell>>((acc, d) => {
    const x = xScale(String(d.x));
    const y = yScale(String(d.y))! + gridStrokeWidth;
    const yIndex = yValues.indexOf(d.y);
    const color = colorScale.config(d.value);
    if (x === undefined || y === undefined || yIndex === -1) {
      return acc;
    }
    const cellKey = getCellKey(d.x, d.y);
    acc[cellKey] = {
      x:
        (config.cell.maxWidth !== 'fill' ? x + xScale.bandwidth() / 2 - config.cell.maxWidth / 2 : x) + gridStrokeWidth,
      y,
      yIndex,
      width: cellWidth - gridStrokeWidth * 2,
      height: cellHeight - gridStrokeWidth * 2,
      datum: d,
      fill: {
        color: stringToRGB(color),
      },
      stroke: {
        color: stringToRGB(config.cell.border.stroke),
        width: config.cell.border.strokeWidth,
      },
      value: d.value,
      visible: !isFilteredValue(filterRanges, d.value),
      formatted: spec.valueFormatter(d.value),
    };
    return acc;
  }, {});

  /**
   * Returns selected elements based on coordinates.
   * @param x
   * @param y
   */
  const pickQuads = (x: Pixels, y: Pixels): Array<Cell> | TextBox => {
    if (x > 0 && x < chartDimensions.left && y > chartDimensions.top && y < chartDimensions.height) {
      // look up for a Y axis elements
      const yLabelKey = yInvertedScale(y);
      const yLabelValue = textYValues.find((v) => v.value === yLabelKey);
      if (yLabelValue) {
        return yLabelValue;
      }
    }

    if (x < chartDimensions.left || y < chartDimensions.top) {
      return [];
    }
    if (x > chartDimensions.width + chartDimensions.left || y > chartDimensions.height) {
      return [];
    }
    const xValue = xInvertedScale(x - chartDimensions.left);
    const yValue = yInvertedScale(y);
    if (xValue === undefined || yValue === undefined) {
      return [];
    }
    const cellKey = getCellKey(xValue, yValue);
    const cell = cellMap[cellKey];
    if (cell) {
      return [cell];
    }
    return [];
  };

  /**
   * Return selected cells and X,Y ranges based on the drag selection.
   */
  const pickDragArea: PickDragFunction = (bound) => {
    const [start, end] = bound;

    const { left, top, width } = chartDimensions;
    const topLeft = [Math.min(start.x, end.x) - left, Math.min(start.y, end.y) - top];
    const bottomRight = [Math.max(start.x, end.x) - left, Math.max(start.y, end.y) - top];

    const startX = xInvertedScale(clamp(topLeft[0], 0, width));
    const endX = xInvertedScale(clamp(bottomRight[0], 0, width));
    const startY = yInvertedScale(clamp(topLeft[1], 0, currentGridHeight - 1));
    const endY = yInvertedScale(clamp(bottomRight[1], 0, currentGridHeight - 1));

    let allXValuesInRange: Array<NonNullable<PrimitiveValue>> = [];
    const invertedXValues: Array<NonNullable<PrimitiveValue>> = [];

    if (timeScale && typeof endX === 'number') {
      invertedXValues.push(startX);
      invertedXValues.push(endX + xDomain.minInterval);
      let [startXValue] = invertedXValues;
      if (typeof startXValue === 'number') {
        while (startXValue < invertedXValues[1]) {
          allXValuesInRange.push(startXValue);
          startXValue += xDomain.minInterval;
        }
      }
    } else {
      allXValuesInRange = getValuesInRange(xValues, startX, endX);
      invertedXValues.push(...allXValuesInRange);
    }

    const allYValuesInRange: Array<NonNullable<PrimitiveValue>> = getValuesInRange(yValues, startY, endY);

    const cells: Cell[] = [];

    allXValuesInRange.forEach((x) => {
      allYValuesInRange.forEach((y) => {
        const cellKey = getCellKey(x, y);
        cells.push(cellMap[cellKey]);
      });
    });

    return {
      cells: cells.filter(Boolean),
      x: invertedXValues,
      y: allYValuesInRange,
    };
  };

  /**
   * Resolves rect area based on provided X and Y ranges
   * @param x
   * @param y
   */
  const pickHighlightedArea: PickHighlightedArea = (
    x: Array<NonNullable<PrimitiveValue>>,
    y: Array<NonNullable<PrimitiveValue>>,
  ) => {
    const startValue = x[0];
    const endValue = x[x.length - 1];

    // find X coordinated based on the time range
    const leftIndex = typeof startValue === 'number' ? bisectLeft(xValues, startValue) : xValues.indexOf(startValue);
    const rightIndex = typeof endValue === 'number' ? bisectLeft(xValues, endValue) : xValues.indexOf(endValue);

    const isRightOutOfRange = rightIndex > xValues.length - 1 || rightIndex < 0;
    const isLeftOutOfRange = leftIndex > xValues.length - 1 || leftIndex < 0;

    const startFromScale = xScale(isLeftOutOfRange ? xValues[0] : xValues[leftIndex]);
    const endFromScale = xScale(isRightOutOfRange ? xValues[xValues.length - 1] : xValues[rightIndex]);

    if (startFromScale === undefined || endFromScale === undefined) {
      return null;
    }

    const xStart = chartDimensions.left + startFromScale;

    // extend the range in case the right boundary has been selected
    const width = endFromScale - startFromScale + cellWidth; // (isRightOutOfRange || isLeftOutOfRange ? cellWidth : 0);

    // resolve Y coordinated making sure the order is correct
    const { y: yStart, totalHeight } = y
      .filter((v) => yValues.includes(v))
      .reduce(
        (acc, current, i) => {
          if (i === 0) {
            acc.y = yScale(current) || 0;
          }
          acc.totalHeight += cellHeight;
          return acc;
        },
        { y: 0, totalHeight: 0 },
      );
    return {
      x: xStart,
      y: yStart,
      width,
      height: totalHeight,
    };
  };

  /**
   * Resolves coordinates and metrics of the selected rect area.
   */
  const pickDragShape: PickDragShapeFunction = (bound) => {
    const area = pickDragArea(bound);
    return pickHighlightedArea(area.x, area.y);
  };

  // vertical lines
  const xLines = [];
  for (let i = 0; i < xValues.length + 1; i++) {
    const x = chartDimensions.left + i * cellWidth;
    const y1 = chartDimensions.top;
    const y2 = cellHeight * pageSize;
    xLines.push({ x1: x, y1, x2: x, y2 });
  }
  // horizontal lines
  const yLines = [];
  for (let i = 0; i < pageSize + 1; i++) {
    const y = i * cellHeight;
    yLines.push({ x1: chartDimensions.left, y1: y, x2: chartDimensions.width + chartDimensions.left, y2: y });
  }

  return {
    config,
    heatmapViewModel: {
      gridOrigin: {
        x: chartDimensions.left,
        y: chartDimensions.top,
      },
      gridLines: {
        x: xLines,
        y: yLines,
        stroke: {
          color: stringToRGB(config.grid.stroke.color),
          width: gridStrokeWidth,
        },
      },
      pageSize,
      cells: Object.values(cellMap),
      xValues: textXValues,
      yValues: textYValues,
    },
    pickQuads,
    pickDragArea,
    pickDragShape,
    pickHighlightedArea,
  };
}

function getCellKey(x: NonNullable<PrimitiveValue>, y: NonNullable<PrimitiveValue>) {
  return [String(x), String(y)].join('&_&');
}

function isFilteredValue(filterRanges: Array<[number, number | null]>, value: number) {
  return filterRanges.some(([min, max]) => {
    if (max !== null && value > min && value < max) {
      return true;
    }
    return max === null && value > min;
  });
}
