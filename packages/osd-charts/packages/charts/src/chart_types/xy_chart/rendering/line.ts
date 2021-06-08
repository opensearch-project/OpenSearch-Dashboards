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

import { line } from 'd3-shape';

import { Scale } from '../../../scales';
import { Color } from '../../../utils/common';
import { CurveType, getCurveFactory } from '../../../utils/curves';
import { Dimensions } from '../../../utils/dimensions';
import { LineGeometry } from '../../../utils/geometry';
import { LineSeriesStyle } from '../../../utils/themes/theme';
import { IndexedGeometryMap } from '../utils/indexed_geometry_map';
import { DataSeries, DataSeriesDatum } from '../utils/series';
import { PointStyleAccessor } from '../utils/specs';
import { renderPoints } from './points';
import {
  getClippedRanges,
  getY1ScaledValueOrThrowFn,
  getYDatumValueFn,
  isYValueDefinedFn,
  MarkSizeOptions,
} from './utils';

/** @internal */
export function renderLine(
  shift: number,
  dataSeries: DataSeries,
  xScale: Scale,
  yScale: Scale,
  panel: Dimensions,
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
  const y1Fn = getY1ScaledValueOrThrowFn(yScale);
  const definedFn = isYValueDefinedFn(yScale, xScale);
  const y1Accessor = getYDatumValueFn();

  const pathGenerator = line<DataSeriesDatum>()
    .x(({ x }) => xScale.scaleOrThrow(x) - xScaleOffset)
    .y(y1Fn)
    .defined((datum) => {
      return definedFn(datum, y1Accessor);
    })
    .curve(getCurveFactory(curve));

  const { pointGeometries, indexedGeometryMap } = renderPoints(
    shift - xScaleOffset,
    dataSeries,
    xScale,
    yScale,
    panel,
    color,
    seriesStyle.point,
    hasY0Accessors,
    markSizeOptions,
    pointStyleAccessor,
  );

  const clippedRanges = getClippedRanges(dataSeries.data, xScale, xScaleOffset);
  let linePath: string;

  try {
    linePath = pathGenerator(dataSeries.data) || '';
  } catch {
    // When values are not scalable
    linePath = '';
  }

  const lineGeometry = {
    line: linePath,
    points: pointGeometries,
    color,
    transform: {
      x: shift,
      y: 0,
    },
    seriesIdentifier: {
      key: dataSeries.key,
      specId: dataSeries.specId,
      yAccessor: dataSeries.yAccessor,
      splitAccessors: dataSeries.splitAccessors,
      seriesKeys: dataSeries.seriesKeys,
      smHorizontalAccessorValue: dataSeries.smHorizontalAccessorValue,
      smVerticalAccessorValue: dataSeries.smVerticalAccessorValue,
    },
    seriesLineStyle: seriesStyle.line,
    seriesPointStyle: seriesStyle.point,
    clippedRanges,
    hideClippedRanges: !hasFit,
  };
  return {
    lineGeometry,
    indexedGeometryMap,
  };
}
