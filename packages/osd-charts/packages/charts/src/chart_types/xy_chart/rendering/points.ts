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

import { Scale } from '../../../scales';
import { Color, isNil } from '../../../utils/common';
import { Dimensions } from '../../../utils/dimensions';
import { BandedAccessorType, PointGeometry } from '../../../utils/geometry';
import { PointStyle } from '../../../utils/themes/theme';
import { GeometryType, IndexedGeometryMap } from '../utils/indexed_geometry_map';
import { DataSeries, DataSeriesDatum, FilledValues, XYChartSeriesIdentifier } from '../utils/series';
import { PointStyleAccessor, StackMode } from '../utils/specs';
import { buildPointGeometryStyles } from './point_style';
import {
  getY0ScaledValueOrThrowFn,
  getY1ScaledValueOrThrowFn,
  getYDatumValueFn,
  isDatumFilled,
  isYValueDefinedFn,
  MarkSizeOptions,
  YDefinedFn,
} from './utils';

/** @internal */
export function renderPoints(
  shift: number,
  dataSeries: DataSeries,
  xScale: Scale,
  yScale: Scale,
  panel: Dimensions,
  color: Color,
  pointStyle: PointStyle,
  hasY0Accessors: boolean,
  markSizeOptions: MarkSizeOptions,
  styleAccessor?: PointStyleAccessor,
  spatial = false,
): {
  pointGeometries: PointGeometry[];
  indexedGeometryMap: IndexedGeometryMap;
} {
  const indexedGeometryMap = new IndexedGeometryMap();
  const getRadius = markSizeOptions.enabled
    ? getRadiusFn(dataSeries.data, pointStyle.strokeWidth, markSizeOptions.ratio)
    : () => 0;
  const geometryType = spatial ? GeometryType.spatial : GeometryType.linear;

  const y1Fn = getY1ScaledValueOrThrowFn(yScale);
  const y0Fn = getY0ScaledValueOrThrowFn(yScale);
  const yDefined = isYValueDefinedFn(yScale, xScale);

  const pointGeometries = dataSeries.data.reduce((acc, datum, dataIndex) => {
    const { x: xValue, mark } = datum;
    const prev = dataSeries.data[dataIndex - 1];
    const next = dataSeries.data[dataIndex + 1];
    // don't create the point if not within the xScale domain
    if (!xScale.isValueInDomain(xValue)) {
      return acc;
    }
    // don't create the point if it that point was filled
    if (isDatumFilled(datum)) {
      return acc;
    }
    const x = xScale.scale(xValue);

    if (x === null) {
      return acc;
    }

    const points: PointGeometry[] = [];
    const yDatumKeyNames: Array<keyof Omit<FilledValues, 'x'>> = hasY0Accessors ? ['y0', 'y1'] : ['y1'];

    yDatumKeyNames.forEach((yDatumKeyName, keyIndex) => {
      const valueAccessor = getYDatumValueFn(yDatumKeyName);

      let y: number | null;
      try {
        y = yDatumKeyName === 'y1' ? y1Fn(datum) : y0Fn(datum);
        // skip rendering point if y1 is null
        if (y === null) {
          return;
        }
      } catch {
        return;
      }

      const originalY = getDatumYValue(datum, keyIndex === 0, hasY0Accessors, dataSeries.stackMode);
      const seriesIdentifier: XYChartSeriesIdentifier = {
        key: dataSeries.key,
        specId: dataSeries.specId,
        yAccessor: dataSeries.yAccessor,
        splitAccessors: dataSeries.splitAccessors,
        seriesKeys: dataSeries.seriesKeys,
        smVerticalAccessorValue: dataSeries.smVerticalAccessorValue,
        smHorizontalAccessorValue: dataSeries.smHorizontalAccessorValue,
      };
      const styleOverrides = getPointStyleOverrides(datum, seriesIdentifier, styleAccessor);
      const style = buildPointGeometryStyles(color, pointStyle, styleOverrides);
      const orphan = isOrphanDataPoint(dataIndex, dataSeries.data.length, yDefined, prev, next);
      // if radius is defined with the mark, limit the minimum radius to the theme radius value
      const radius = markSizeOptions.enabled
        ? Math.max(getRadius(mark), pointStyle.radius)
        : styleOverrides?.radius ?? pointStyle.radius;
      const pointGeometry: PointGeometry = {
        x,
        y,
        radius,
        color,
        style,
        value: {
          x: xValue,
          y: originalY,
          mark,
          accessor: hasY0Accessors && keyIndex === 0 ? BandedAccessorType.Y0 : BandedAccessorType.Y1,
          datum: datum.datum,
        },
        transform: {
          x: shift,
          y: 0,
        },
        seriesIdentifier,
        panel,
        orphan,
      };
      indexedGeometryMap.set(pointGeometry, geometryType);
      // use the geometry only if the yDatum in contained in the current yScale domain
      if (yDefined(datum, valueAccessor)) {
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

/**
 * Get the original/initial Y value from the datum
 * @param datum a DataSeriesDatum
 * @param lookingForY0 if we are interested in the y0 value, false for y1
 * @param isBandChart if the chart is a band chart
 * @param stackMode an optional stack mode
 */
function getDatumYValue(
  { y1, y0, initialY1, initialY0 }: DataSeriesDatum,
  lookingForY0: boolean,
  isBandChart: boolean,
  stackMode?: StackMode,
) {
  if (isBandChart) {
    return stackMode === StackMode.Percentage
      ? // on band stacked charts in percentage mode, the values I'm looking for are the percentage value
        // that are already computed and available on y0 and y1
        lookingForY0
        ? y0
        : y1
      : // in all other cases for band charts, I want to get back the original/initial value of y0 and y1
      // not the computed value
      lookingForY0
      ? initialY0
      : initialY1;
  }
  // if not a band chart get use the original/initial value in every case except for stack as percentage
  // in this case, we should take the difference between the bottom position of the bar and the top position
  // of the bar
  return stackMode === StackMode.Percentage ? (y1 ?? 0) - (y0 ?? 0) : initialY1;
}

/**
 * Get radius function form ratio and min/max mark size
 *
 * @todo add continuous/non-stepped function
 *
 * @param  {DataSeriesDatum[]} data
 * @param  {number} lineWidth
 * @param  {number=50} markSizeRatio - 0 to 100
 * @internal
 */
export function getRadiusFn(
  data: DataSeriesDatum[],
  lineWidth: number,
  markSizeRatio: number = 50,
): (mark: number | null, defaultRadius?: number) => number {
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
    return circleRadius ? Math.sqrt(circleRadius + baseMagicNumber) + lineWidth : lineWidth;
  };
}

function yAccessorForOrphanCheck(datum: DataSeriesDatum): number | null {
  return datum.filled?.y1 ? null : datum.y1;
}

function isOrphanDataPoint(
  index: number,
  length: number,
  yDefined: YDefinedFn,
  prev?: DataSeriesDatum,
  next?: DataSeriesDatum,
): boolean {
  if (index === 0 && (isNil(next) || !yDefined(next, yAccessorForOrphanCheck))) {
    return true;
  }
  if (index === length - 1 && (isNil(prev) || !yDefined(prev, yAccessorForOrphanCheck))) {
    return true;
  }
  return (
    (isNil(prev) || !yDefined(prev, yAccessorForOrphanCheck)) &&
    (isNil(next) || !yDefined(next, yAccessorForOrphanCheck))
  );
}
