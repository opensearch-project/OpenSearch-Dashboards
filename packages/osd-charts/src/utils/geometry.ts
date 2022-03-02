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

import { $Values } from 'utility-types';

import { XYChartSeriesIdentifier } from '../chart_types/xy_chart/utils/series';
import { Fill, Stroke } from '../geoms/types';
import { Color } from './common';
import { Dimensions } from './dimensions';
import { BarSeriesStyle, PointStyle, AreaStyle, LineStyle, PointShape } from './themes/theme';

/**
 * The accessor type
 * @public
 */
export const BandedAccessorType = Object.freeze({
  Y0: 'y0' as const,
  Y1: 'y1' as const,
});

/** @public */
export type BandedAccessorType = $Values<typeof BandedAccessorType>;

/** @public */
export interface GeometryValue {
  y: any;
  x: any;
  mark: number | null;
  accessor: BandedAccessorType;
  /**
   * The original datum used for this geometry
   */
  datum: any;
}

/** @internal */
export type IndexedGeometry = PointGeometry | BarGeometry;

/**
 * Array of **range** clippings [x1, x2] to be excluded during rendering
 *
 * Note: Must be scaled **range** values (i.e. pixel coordinates) **NOT** domain values
 * @internal
 */
export type ClippedRanges = [number, number][];

/** @internal */
export interface PointGeometry {
  seriesIdentifier: XYChartSeriesIdentifier;
  x: number;
  y: number;
  radius: number;
  color: Color;
  transform: {
    x: number;
    y: number;
  };
  value: GeometryValue;
  style: PointGeometryStyle;
  panel: Dimensions;
  orphan: boolean;
}
/** @internal */
export interface PointGeometryStyle {
  fill: Fill;
  stroke: Stroke;
  shape: PointShape;
}

/** @internal */
export interface PerPanel<T> {
  panel: Dimensions;
  value: T;
}

/** @internal */
export interface BarGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  transform: {
    x: number;
    y: number;
    rotation?: number;
  };
  color: Color;
  displayValue?: {
    fontScale?: number;
    fontSize: number;
    text: any;
    width: number;
    height: number;
    hideClippedValue?: boolean;
    isValueContainedInElement?: boolean;
  };
  seriesIdentifier: XYChartSeriesIdentifier;
  value: GeometryValue;
  seriesStyle: BarSeriesStyle;
  panel: Dimensions;
}

/** @internal */
export interface LineGeometry {
  line: string;
  points: PointGeometry[];
  color: Color;
  transform: {
    x: number;
    y: number;
  };
  seriesIdentifier: XYChartSeriesIdentifier;
  seriesLineStyle: LineStyle;
  seriesPointStyle: PointStyle;
  /**
   * Ranges of `[x0, x1]` pairs to clip from series
   */
  clippedRanges: ClippedRanges;
  hideClippedRanges?: boolean;
}

/** @internal */
export interface AreaGeometry {
  area: string;
  lines: string[];
  points: PointGeometry[];
  color: Color;
  transform: {
    x: number;
    y: number;
  };
  seriesIdentifier: XYChartSeriesIdentifier;
  seriesAreaStyle: AreaStyle;
  seriesAreaLineStyle: LineStyle;
  seriesPointStyle: PointStyle;
  isStacked: boolean;
  /**
   * Ranges of `[x0, x1]` pairs to clip from series
   */
  clippedRanges: ClippedRanges;
  hideClippedRanges?: boolean;
}

/** @internal */
export interface BubbleGeometry {
  points: PointGeometry[];
  color: Color;
  seriesIdentifier: XYChartSeriesIdentifier;
  seriesPointStyle: PointStyle;
}

/** @internal */
export function isPointGeometry(ig: IndexedGeometry): ig is PointGeometry {
  return ig.hasOwnProperty('radius');
}

/** @internal */
export function isBarGeometry(ig: IndexedGeometry): ig is BarGeometry {
  return ig.hasOwnProperty('width') && ig.hasOwnProperty('height');
}
