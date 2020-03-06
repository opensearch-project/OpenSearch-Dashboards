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

import { $Values } from 'utility-types';
import { BarSeriesStyle, PointStyle, AreaStyle, LineStyle, ArcStyle } from './themes/theme';
import { XYChartSeriesIdentifier } from '../chart_types/xy_chart/utils/series';
import { Color } from './commons';

/**
 * The accessor type
 */
export const BandedAccessorType = Object.freeze({
  Y0: 'y0' as 'y0',
  Y1: 'y1' as 'y1',
});

export type BandedAccessorType = $Values<typeof BandedAccessorType>;

export interface GeometryValue {
  y: any;
  x: any;
  accessor: BandedAccessorType;
}

export type IndexedGeometry = PointGeometry | BarGeometry;

/**
 * Array of **range** clippings [x1, x2] to be excluded during rendering
 *
 * Note: Must be scaled **range** values (i.e. pixel coordinates) **NOT** domain values
 */
export type ClippedRanges = [number, number][];

export interface PointGeometry {
  x: number;
  y: number;
  radius: number;
  color: Color;
  transform: {
    x: number;
    y: number;
  };
  seriesIdentifier: XYChartSeriesIdentifier;
  value: GeometryValue;
  styleOverrides?: Partial<PointStyle>;
}
export interface BarGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  color: Color;
  displayValue?: {
    text: any;
    width: number;
    height: number;
    hideClippedValue?: boolean;
    isValueContainedInElement?: boolean;
  };
  seriesIdentifier: XYChartSeriesIdentifier;
  value: GeometryValue;
  seriesStyle: BarSeriesStyle;
}

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
}

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
}

export interface ArcGeometry {
  arc: string;
  color: Color;
  seriesIdentifier: XYChartSeriesIdentifier;
  seriesArcStyle: ArcStyle;
  transform: {
    x: number;
    y: number;
  };
}

export function isPointGeometry(ig: IndexedGeometry): ig is PointGeometry {
  return ig.hasOwnProperty('radius');
}

export function isBarGeometry(ig: IndexedGeometry): ig is BarGeometry {
  return ig.hasOwnProperty('width') && ig.hasOwnProperty('height');
}
