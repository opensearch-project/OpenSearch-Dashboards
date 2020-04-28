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
 * under the License. */

import { area, line } from 'd3-shape';
import { CanvasTextBBoxCalculator } from '../../../utils/bbox/canvas_text_bbox_calculator';
import {
  AreaSeriesStyle,
  LineSeriesStyle,
  PointStyle,
  SharedGeometryStateStyle,
  BarSeriesStyle,
  GeometryStateStyle,
  LineStyle,
  BubbleSeriesStyle,
} from '../../../utils/themes/theme';
import { Scale, ScaleType } from '../../../scales';
import { CurveType, getCurveFactory } from '../../../utils/curves';
import { DataSeriesDatum, DataSeries, XYChartSeriesIdentifier } from '../utils/series';
import { DisplayValueSpec, PointStyleAccessor, BarStyleAccessor } from '../utils/specs';
import {
  PointGeometry,
  BarGeometry,
  AreaGeometry,
  LineGeometry,
  isPointGeometry,
  ClippedRanges,
  BandedAccessorType,
  BubbleGeometry,
} from '../../../utils/geometry';
import { mergePartial, Color } from '../../../utils/commons';
import { LegendItem } from '../../../commons/legend';
import { IndexedGeometryMap, GeometryType } from '../utils/indexed_geometry_map';
import { getDistance } from '../state/utils';
import { MarkBuffer } from '../../../specs';
import { isLogarithmicScale } from '../../../scales/types';

export const DEFAULT_HIGHLIGHT_PADDING = 10;

export interface MarkSizeOptions {
  enabled: boolean;
  ratio?: number;
}

/** @internal */
export function getPointStyleOverrides(
  datum: DataSeriesDatum,
  seriesIdentifier: XYChartSeriesIdentifier,
  pointStyleAccessor?: PointStyleAccessor,
): Partial<PointStyle> | undefined {
  const styleOverride = pointStyleAccessor && pointStyleAccessor(datum, seriesIdentifier);

  if (!styleOverride) {
    return;
  }

  if (typeof styleOverride === 'string') {
    return {
      stroke: styleOverride,
    };
  }

  return styleOverride;
}

/** @internal */
export function getBarStyleOverrides(
  datum: DataSeriesDatum,
  seriesIdentifier: XYChartSeriesIdentifier,
  seriesStyle: BarSeriesStyle,
  styleAccessor?: BarStyleAccessor,
): BarSeriesStyle {
  const styleOverride = styleAccessor && styleAccessor(datum, seriesIdentifier);

  if (!styleOverride) {
    return seriesStyle;
  }

  if (typeof styleOverride === 'string') {
    return {
      ...seriesStyle,
      rect: {
        ...seriesStyle.rect,
        fill: styleOverride,
      },
    };
  }

  return mergePartial(seriesStyle, styleOverride, {
    mergeOptionalPartialValues: true,
  });
}

type GetRadiusFnReturn = (mark: number | null, defaultRadius?: number) => number;

/**
 * Get radius function form ratio and min/max mark size
 *
 * @todo add continuous/non-stepped function
 *
 * @param  {Datum[]} radii
 * @param  {number} lineWidth
 * @param  {number=50} markSizeRatio - 0 to 100
 * @internal
 */
export function getRadiusFn(data: DataSeriesDatum[], lineWidth: number, markSizeRatio: number = 50): GetRadiusFnReturn {
  if (data.length === 0) {
    return () => 0;
  }
  const { min, max } = data.reduce(
    (acc, { mark }) =>
      mark === null
        ? acc
        : {
            min: Math.min(acc.min, mark / 2),
            max: Math.max(acc.max, mark / 2),
          },
    { min: Infinity, max: -Infinity },
  );
  const adjustedMarkSizeRatio = Math.min(Math.max(markSizeRatio, 0), 100);
  const radiusStep = (max - min || max * 100) / Math.pow(adjustedMarkSizeRatio, 2);
  return function getRadius(mark, defaultRadius = 0): number {
    if (mark === null) {
      return defaultRadius;
    }
    const circleRadius = (mark / 2 - min) / radiusStep;
    const baseMagicNumber = 2;
    const base = circleRadius ? Math.sqrt(circleRadius + baseMagicNumber) + lineWidth : lineWidth;
    return base;
  };
}

function renderPoints(
  shift: number,
  dataSeries: DataSeries,
  xScale: Scale,
  yScale: Scale,
  color: Color,
  lineStyle: LineStyle,
  hasY0Accessors: boolean,
  markSizeOptions: MarkSizeOptions,
  styleAccessor?: PointStyleAccessor,
  spatial = false,
): {
  pointGeometries: PointGeometry[];
  indexedGeometryMap: IndexedGeometryMap;
} {
  const indexedGeometryMap = new IndexedGeometryMap();
  const isLogScale = isLogarithmicScale(yScale);
  const getRadius = markSizeOptions.enabled
    ? getRadiusFn(dataSeries.data, lineStyle.strokeWidth, markSizeOptions.ratio)
    : () => 0;
  const geometryType = spatial ? GeometryType.spatial : GeometryType.linear;
  const pointGeometries = dataSeries.data.reduce((acc, datum) => {
    const { x: xValue, y0, y1, initialY0, initialY1, filled, mark } = datum;
    // don't create the point if not within the xScale domain or it that point was filled
    if (!xScale.isValueInDomain(xValue) || (filled && filled.y1 !== undefined)) {
      return acc;
    }
    const x = xScale.scale(xValue);

    if (x === null) {
      return acc;
    }

    const points: PointGeometry[] = [];
    const yDatums = hasY0Accessors ? [y0, y1] : [y1];

    yDatums.forEach((yDatum, index) => {
      // skip rendering point if y1 is null
      if (y1 === null) {
        return;
      }
      let y;
      let radius = getRadius(mark);
      // we fix 0 and negative values at y = 0
      if (yDatum === null || (isLogScale && yDatum <= 0)) {
        y = yScale.range[0];
        radius = 0;
      } else {
        y = yScale.scale(yDatum);
      }

      if (y === null) {
        return acc;
      }

      const originalY = hasY0Accessors && index === 0 ? initialY0 : initialY1;
      const seriesIdentifier: XYChartSeriesIdentifier = {
        key: dataSeries.key,
        specId: dataSeries.specId,
        yAccessor: dataSeries.yAccessor,
        splitAccessors: dataSeries.splitAccessors,
        seriesKeys: dataSeries.seriesKeys,
      };
      const styleOverrides = getPointStyleOverrides(datum, seriesIdentifier, styleAccessor);
      const pointGeometry: PointGeometry = {
        radius,
        x,
        y,
        color,
        value: {
          x: xValue,
          y: originalY,
          mark,
          accessor: hasY0Accessors && index === 0 ? BandedAccessorType.Y0 : BandedAccessorType.Y1,
        },
        transform: {
          x: shift,
          y: 0,
        },
        seriesIdentifier,
        styleOverrides,
      };
      indexedGeometryMap.set(pointGeometry, geometryType);
      // use the geometry only if the yDatum in contained in the current yScale domain
      const isHidden = yDatum === null || (isLogScale && yDatum <= 0);
      if (!isHidden && yScale.isValueInDomain(yDatum)) {
        points.push(pointGeometry);
      }
    });
    return [...acc, ...points];
  }, [] as PointGeometry[]);
  return {
    pointGeometries,
    indexedGeometryMap,
  };
}

/** @internal */
export function renderBars(
  orderIndex: number,
  dataSeries: DataSeries,
  xScale: Scale,
  yScale: Scale,
  color: Color,
  sharedSeriesStyle: BarSeriesStyle,
  displayValueSettings?: DisplayValueSpec,
  styleAccessor?: BarStyleAccessor,
  minBarHeight?: number,
): {
  barGeometries: BarGeometry[];
  indexedGeometryMap: IndexedGeometryMap;
} {
  const indexedGeometryMap = new IndexedGeometryMap();
  const barGeometries: BarGeometry[] = [];

  const bboxCalculator = new CanvasTextBBoxCalculator();

  // default padding to 1 for now
  const padding = 1;
  const fontSize = sharedSeriesStyle.displayValue.fontSize;
  const fontFamily = sharedSeriesStyle.displayValue.fontFamily;
  const absMinHeight = minBarHeight && Math.abs(minBarHeight);

  dataSeries.data.forEach((datum) => {
    const { y0, y1, initialY1, filled } = datum;
    // don't create a bar if the initialY1 value is null.
    if (y1 === null || initialY1 === null || (filled && filled.y1 !== undefined)) {
      return;
    }
    // don't create a bar if not within the xScale domain
    if (!xScale.isValueInDomain(datum.x)) {
      return;
    }

    let y: number | null = 0;
    let y0Scaled;
    if (yScale.type === ScaleType.Log) {
      y = y1 === 0 || y1 === null ? yScale.range[0] : yScale.scale(y1);
      if (yScale.isInverted) {
        y0Scaled = y0 === 0 || y0 === null ? yScale.range[1] : yScale.scale(y0);
      } else {
        y0Scaled = y0 === 0 || y0 === null ? yScale.range[0] : yScale.scale(y0);
      }
    } else {
      y = yScale.scale(y1);
      if (yScale.isInverted) {
        // use always zero as baseline if y0 is null
        y0Scaled = y0 === null ? yScale.scale(0) : yScale.scale(y0);
      } else {
        y0Scaled = y0 === null ? yScale.scale(0) : yScale.scale(y0);
      }
    }

    if (y === null || y0Scaled === null) {
      return;
    }

    let height = y0Scaled - y;

    // handle minBarHeight adjustment
    if (absMinHeight !== undefined && height !== 0 && Math.abs(height) < absMinHeight) {
      const heightDelta = absMinHeight - Math.abs(height);
      if (height < 0) {
        height = -absMinHeight;
        y = y + heightDelta;
      } else {
        height = absMinHeight;
        y = y - heightDelta;
      }
    }

    const xScaled = xScale.scale(datum.x);

    if (xScaled === null) {
      return;
    }

    const x = xScaled + xScale.bandwidth * orderIndex;
    const width = xScale.bandwidth;

    const formattedDisplayValue =
      displayValueSettings && displayValueSettings.valueFormatter
        ? displayValueSettings.valueFormatter(initialY1)
        : undefined;

    // only show displayValue for even bars if showOverlappingValue
    const displayValueText =
      displayValueSettings && displayValueSettings.isAlternatingValueLabel
        ? barGeometries.length % 2 === 0
          ? formattedDisplayValue
          : undefined
        : formattedDisplayValue;

    const computedDisplayValueWidth = bboxCalculator.compute(displayValueText || '', padding, fontSize, fontFamily)
      .width;
    const displayValueWidth =
      displayValueSettings && displayValueSettings.isValueContainedInElement ? width : computedDisplayValueWidth;

    const hideClippedValue = displayValueSettings ? displayValueSettings.hideClippedValue : undefined;

    const displayValue =
      displayValueSettings && displayValueSettings.showValueLabel
        ? {
            text: displayValueText,
            width: displayValueWidth,
            height: fontSize,
            hideClippedValue,
            isValueContainedInElement: displayValueSettings.isValueContainedInElement,
          }
        : undefined;

    const seriesIdentifier: XYChartSeriesIdentifier = {
      key: dataSeries.key,
      specId: dataSeries.specId,
      yAccessor: dataSeries.yAccessor,
      splitAccessors: dataSeries.splitAccessors,
      seriesKeys: dataSeries.seriesKeys,
    };

    const seriesStyle = getBarStyleOverrides(datum, seriesIdentifier, sharedSeriesStyle, styleAccessor);

    const barGeometry: BarGeometry = {
      displayValue,
      x,
      y, // top most value
      width,
      height,
      color,
      value: {
        x: datum.x,
        y: initialY1,
        mark: null,
        accessor: BandedAccessorType.Y1,
      },
      seriesIdentifier,
      seriesStyle,
    };
    indexedGeometryMap.set(barGeometry);
    barGeometries.push(barGeometry);
  });

  bboxCalculator.destroy();

  return {
    barGeometries,
    indexedGeometryMap,
  };
}

/** @internal */
export function renderLine(
  shift: number,
  dataSeries: DataSeries,
  xScale: Scale,
  yScale: Scale,
  color: Color,
  curve: CurveType,
  hasY0Accessors: boolean,
  xScaleOffset: number,
  seriesStyle: LineSeriesStyle,
  markSizeOptions: MarkSizeOptions,
  pointStyleAccessor?: PointStyleAccessor,
  hasFit?: boolean,
): {
  lineGeometry: LineGeometry;
  indexedGeometryMap: IndexedGeometryMap;
} {
  const isLogScale = isLogarithmicScale(yScale);

  const pathGenerator = line<DataSeriesDatum>()
    .x(({ x }) => xScale.scaleOrThrow(x) - xScaleOffset)
    .y((datum) => {
      const yValue = getYValue(datum);

      if (yValue !== null) {
        return yScale.scaleOrThrow(yValue);
      }

      // this should never happen thanks to the defined function
      return yScale.isInverted ? yScale.range[1] : yScale.range[0];
    })
    .defined((datum) => {
      const yValue = getYValue(datum);
      return yValue !== null && !(isLogScale && yValue <= 0) && xScale.isValueInDomain(datum.x);
    })
    .curve(getCurveFactory(curve));
  const y = 0;
  const x = shift;

  const { pointGeometries, indexedGeometryMap } = renderPoints(
    shift - xScaleOffset,
    dataSeries,
    xScale,
    yScale,
    color,
    seriesStyle.line,
    hasY0Accessors,
    markSizeOptions,
    pointStyleAccessor,
  );

  const clippedRanges = hasFit && !hasY0Accessors ? getClippedRanges(dataSeries.data, xScale, xScaleOffset) : [];
  let linePath: string;

  try {
    linePath = pathGenerator(dataSeries.data) || '';
  } catch (e) {
    // When values are not scalable
    linePath = '';
  }

  const lineGeometry = {
    line: linePath,
    points: pointGeometries,
    color,
    transform: {
      x,
      y,
    },
    seriesIdentifier: {
      key: dataSeries.key,
      specId: dataSeries.specId,
      yAccessor: dataSeries.yAccessor,
      splitAccessors: dataSeries.splitAccessors,
      seriesKeys: dataSeries.seriesKeys,
    },
    seriesLineStyle: seriesStyle.line,
    seriesPointStyle: seriesStyle.point,
    clippedRanges,
  };
  return {
    lineGeometry,
    indexedGeometryMap,
  };
}

/** @internal */
export function renderBubble(
  shift: number,
  dataSeries: DataSeries,
  xScale: Scale,
  yScale: Scale,
  color: Color,
  hasY0Accessors: boolean,
  seriesStyle: BubbleSeriesStyle,
  markSizeOptions: MarkSizeOptions,
  isMixedChart: boolean,
  pointStyleAccessor?: PointStyleAccessor,
): {
  bubbleGeometry: BubbleGeometry;
  indexedGeometryMap: IndexedGeometryMap;
} {
  const { pointGeometries, indexedGeometryMap } = renderPoints(
    shift,
    dataSeries,
    xScale,
    yScale,
    color,
    seriesStyle.point,
    hasY0Accessors,
    markSizeOptions,
    pointStyleAccessor,
    !isMixedChart,
  );

  const bubbleGeometry = {
    points: pointGeometries,
    color,
    seriesIdentifier: {
      key: dataSeries.key,
      specId: dataSeries.specId,
      yAccessor: dataSeries.yAccessor,
      splitAccessors: dataSeries.splitAccessors,
      seriesKeys: dataSeries.seriesKeys,
    },
    seriesPointStyle: seriesStyle.point,
  };
  return {
    bubbleGeometry,
    indexedGeometryMap,
  };
}

/**
 * Returns value of `y1` or `filled.y1` or null
 * @internal
 */
export const getYValue = ({ y1, filled }: DataSeriesDatum): number | null => {
  if (y1 !== null) {
    return y1;
  }

  if (filled && filled.y1 !== undefined) {
    return filled.y1;
  }

  return null;
};

/** @internal */
export function renderArea(
  shift: number,
  dataSeries: DataSeries,
  xScale: Scale,
  yScale: Scale,
  color: Color,
  curve: CurveType,
  hasY0Accessors: boolean,
  xScaleOffset: number,
  seriesStyle: AreaSeriesStyle,
  markSizeOptions: MarkSizeOptions,
  isStacked = false,
  pointStyleAccessor?: PointStyleAccessor,
  hasFit?: boolean,
): {
  areaGeometry: AreaGeometry;
  indexedGeometryMap: IndexedGeometryMap;
} {
  const isLogScale = isLogarithmicScale(yScale);
  const pathGenerator = area<DataSeriesDatum>()
    .x(({ x }) => xScale.scaleOrThrow(x) - xScaleOffset)
    .y1((datum) => {
      const yValue = getYValue(datum);
      if (yValue !== null) {
        return yScale.scaleOrThrow(yValue);
      }
      // this should never happen thanks to the defined function
      return yScale.isInverted ? yScale.range[1] : yScale.range[0];
    })
    .y0(({ y0 }) => {
      if (y0 === null || (isLogScale && y0 <= 0)) {
        return yScale.range[0];
      }

      return yScale.scaleOrThrow(y0);
    })
    .defined((datum) => {
      const yValue = getYValue(datum);
      return yValue !== null && !(isLogScale && yValue <= 0) && xScale.isValueInDomain(datum.x);
    })
    .curve(getCurveFactory(curve));

  const clippedRanges =
    hasFit && !hasY0Accessors && !isStacked ? getClippedRanges(dataSeries.data, xScale, xScaleOffset) : [];
  let y1Line: string | null;

  try {
    y1Line = pathGenerator.lineY1()(dataSeries.data);
  } catch (e) {
    // When values are not scalable
    y1Line = null;
  }

  const lines: string[] = [];
  if (y1Line) {
    lines.push(y1Line);
  }
  if (hasY0Accessors) {
    let y0Line: string | null;

    try {
      y0Line = pathGenerator.lineY0()(dataSeries.data);
    } catch (e) {
      // When values are not scalable
      y0Line = null;
    }
    if (y0Line) {
      lines.push(y0Line);
    }
  }

  const { pointGeometries, indexedGeometryMap } = renderPoints(
    shift - xScaleOffset,
    dataSeries,
    xScale,
    yScale,
    color,
    seriesStyle.line,
    hasY0Accessors,
    markSizeOptions,
    pointStyleAccessor,
  );

  let areaPath: string;

  try {
    areaPath = pathGenerator(dataSeries.data) || '';
  } catch (e) {
    // When values are not scalable
    areaPath = '';
  }

  const areaGeometry: AreaGeometry = {
    area: areaPath,
    lines,
    points: pointGeometries,
    color,
    transform: {
      y: 0,
      x: shift,
    },
    seriesIdentifier: {
      key: dataSeries.key,
      specId: dataSeries.specId,
      yAccessor: dataSeries.yAccessor,
      splitAccessors: dataSeries.splitAccessors,
      seriesKeys: dataSeries.seriesKeys,
    },
    seriesAreaStyle: seriesStyle.area,
    seriesAreaLineStyle: seriesStyle.line,
    seriesPointStyle: seriesStyle.point,
    isStacked,
    clippedRanges,
  };
  return {
    areaGeometry,
    indexedGeometryMap,
  };
}

/**
 * Gets clipped ranges that have been fitted to values
 * @param dataset
 * @param xScale
 * @param xScaleOffset
 * @internal
 */
export function getClippedRanges(dataset: DataSeriesDatum[], xScale: Scale, xScaleOffset: number): ClippedRanges {
  let firstNonNullX: number | null = null;
  let hasNull = false;

  return dataset.reduce<ClippedRanges>((acc, { x, y1 }) => {
    const xScaled = xScale.scale(x);
    if (xScaled === null) {
      return acc;
    }
    const xValue = xScaled - xScaleOffset + xScale.bandwidth / 2;

    if (y1 !== null) {
      if (hasNull) {
        if (firstNonNullX !== null) {
          acc.push([firstNonNullX, xValue]);
        } else {
          acc.push([0, xValue]);
        }
        hasNull = false;
      }

      firstNonNullX = xValue;
    } else {
      const endXValue = xScale.range[1] - xScale.bandwidth * (2 / 3);
      if (firstNonNullX !== null && xValue === endXValue) {
        acc.push([firstNonNullX, xValue]);
      }
      hasNull = true;
    }
    return acc;
  }, []);
}

/** @internal */
export function getGeometryStateStyle(
  seriesIdentifier: XYChartSeriesIdentifier,
  highlightedLegendItem: LegendItem | null,
  sharedGeometryStyle: SharedGeometryStateStyle,
  individualHighlight?: { [key: string]: boolean },
): GeometryStateStyle {
  const { default: defaultStyles, highlighted, unhighlighted } = sharedGeometryStyle;

  if (highlightedLegendItem != null) {
    const isPartOfHighlightedSeries = seriesIdentifier.key === highlightedLegendItem.seriesIdentifier.key;

    return isPartOfHighlightedSeries ? highlighted : unhighlighted;
  }

  if (individualHighlight) {
    const { hasHighlight, hasGeometryHover } = individualHighlight;
    if (!hasGeometryHover) {
      return highlighted;
    }
    return hasHighlight ? highlighted : unhighlighted;
  }

  return defaultStyles;
}

/** @internal */
export function isPointOnGeometry(
  xCoordinate: number,
  yCoordinate: number,
  indexedGeometry: BarGeometry | PointGeometry,
  buffer: MarkBuffer = DEFAULT_HIGHLIGHT_PADDING,
) {
  const { x, y } = indexedGeometry;
  if (isPointGeometry(indexedGeometry)) {
    const { radius, transform } = indexedGeometry;
    const distance = getDistance(
      {
        x: xCoordinate,
        y: yCoordinate,
      },
      {
        x: x + transform.x,
        y,
      },
    );
    const radiusBuffer = typeof buffer === 'number' ? buffer : buffer(radius);

    if (radiusBuffer === Infinity) {
      return distance <= radius + DEFAULT_HIGHLIGHT_PADDING;
    }

    return distance <= radius + radiusBuffer;
  }
  const { width, height } = indexedGeometry;
  return yCoordinate >= y && yCoordinate <= y + height && xCoordinate >= x && xCoordinate <= x + width;
}
