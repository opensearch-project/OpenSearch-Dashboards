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

import { LegendItem } from '../../../common/legend';
import { Scale } from '../../../scales';
import { getDomainPolarity } from '../../../scales/scale_continuous';
import { isLogarithmicScale } from '../../../scales/types';
import { MarkBuffer } from '../../../specs';
import { getDistance } from '../../../utils/common';
import { BarGeometry, ClippedRanges, isPointGeometry, PointGeometry } from '../../../utils/geometry';
import { GeometryStateStyle, SharedGeometryStateStyle } from '../../../utils/themes/theme';
import { DataSeriesDatum, FilledValues, XYChartSeriesIdentifier } from '../utils/series';
import { DEFAULT_HIGHLIGHT_PADDING } from './constants';

/** @internal */
export interface MarkSizeOptions {
  enabled: boolean;
  ratio?: number;
}

/**
 * Returns value of `y1` or `filled.y1` or null by default.
 * Passing a filled key (x, y1, y0) it will return that value or the filled one
 * @internal
 */
export function getYDatumValueFn(valueName: keyof Omit<FilledValues, 'x'> = 'y1') {
  return (datum: DataSeriesDatum, returnFilled = true): number | null => {
    const value = datum[valueName];
    if (value !== null || !returnFilled) {
      return value;
    }
    return datum.filled?.[valueName] ?? null;
  };
}

/**
 *
 * @param param0
 * @internal
 */
export function isDatumFilled({ filled, initialY1 }: DataSeriesDatum) {
  return filled?.x !== undefined || filled?.y1 !== undefined || initialY1 === null || initialY1 === undefined;
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

  const completeDatasetIsNull = dataset.every((datum) => isDatumFilled(datum));

  if (completeDatasetIsNull) return [[xScale.range[0], xScale.range[1]]];

  return dataset.reduce<ClippedRanges>((acc, data) => {
    const xScaled = xScale.scale(data.x);
    if (xScaled === null) {
      return acc;
    }

    const xValue = xScaled - xScaleOffset + xScale.bandwidth / 2;

    if (isDatumFilled(data)) {
      const endXValue = xScale.range[1] - xScale.bandwidth * (2 / 3);
      if (firstNonNullX !== null && xValue === endXValue) {
        acc.push([firstNonNullX, xValue]);
      }
      hasNull = true;
    } else {
      if (hasNull) {
        if (firstNonNullX !== null) {
          acc.push([firstNonNullX, xValue]);
        } else {
          acc.push([0, xValue]);
        }
        hasNull = false;
      }

      firstNonNullX = xValue;
    }
    return acc;
  }, []);
}

/** @internal */
export function getGeometryStateStyle(
  seriesIdentifier: XYChartSeriesIdentifier,
  sharedGeometryStyle: SharedGeometryStateStyle,
  highlightedLegendItem?: LegendItem,
  individualHighlight?: { [key: string]: boolean },
): GeometryStateStyle {
  const { default: defaultStyles, highlighted, unhighlighted } = sharedGeometryStyle;

  if (highlightedLegendItem) {
    const isPartOfHighlightedSeries = highlightedLegendItem.seriesIdentifiers.some(
      ({ key }) => key === seriesIdentifier.key,
    );

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
  const { x, y, transform } = indexedGeometry;
  if (isPointGeometry(indexedGeometry)) {
    const { radius } = indexedGeometry;
    const distance = getDistance(
      {
        x: xCoordinate,
        y: yCoordinate,
      },
      {
        x: x + transform.x,
        y: y + transform.y,
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

/**
 * The default zero baseline for area charts.
 */
const DEFAULT_ZERO_BASELINE = 0;

/** @internal */
export type YDefinedFn = (
  datum: DataSeriesDatum,
  getValueAccessor: (datum: DataSeriesDatum) => number | null,
) => boolean;

/** @internal */
export function isYValueDefinedFn(yScale: Scale, xScale: Scale): YDefinedFn {
  const isLogScale = isLogarithmicScale(yScale);
  const domainPolarity = getDomainPolarity(yScale.domain);
  return (datum, getValueAccessor) => {
    const yValue = getValueAccessor(datum);
    return (
      yValue !== null &&
      !((isLogScale && domainPolarity >= 0 && yValue <= 0) || (domainPolarity < 0 && yValue >= 0)) &&
      xScale.isValueInDomain(datum.x)
    );
  };
}

/** @internal */
export const CHROME_PINCH_BUG_EPSILON = 0.5;
/**
 * Temporary fix for Chromium bug
 * Shift a small pixel value when pixel diff is <= 0.5px
 * https://github.com/elastic/elastic-charts/issues/1053
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1163912
 */
function chromeRenderBugBuffer(y1: number, y0: number): number {
  const diff = Math.abs(y1 - y0);
  return diff <= CHROME_PINCH_BUG_EPSILON ? 0.5 : 0;
}

/** @internal */
export function getY1ScaledValueOrThrowFn(yScale: Scale): (datum: DataSeriesDatum) => number {
  const datumAccessor = getYDatumValueFn();
  const scaleY0Value = getY0ScaledValueOrThrowFn(yScale);
  return (datum) => {
    const y1Value = yScale.scaleOrThrow(datumAccessor(datum));
    const y0Value = scaleY0Value(datum);
    return y1Value - chromeRenderBugBuffer(y1Value, y0Value);
  };
}

/** @internal */
export function getY0ScaledValueOrThrowFn(yScale: Scale): (datum: DataSeriesDatum) => number {
  const isLogScale = isLogarithmicScale(yScale);
  const domainPolarity = getDomainPolarity(yScale.domain);
  const logBaseline = domainPolarity >= 0 ? Math.min(...yScale.domain) : Math.max(...yScale.domain);

  return ({ y0 }) => {
    if (y0 === null) {
      if (isLogScale) {
        // if all positive domain use 1 as baseline, -1 otherwise
        return yScale.scaleOrThrow(logBaseline);
      }
      return yScale.scaleOrThrow(DEFAULT_ZERO_BASELINE);
    }
    if (isLogScale) {
      // wrong y0 polarity
      if ((domainPolarity >= 0 && y0 <= 0) || (domainPolarity < 0 && y0 >= 0)) {
        // if all positive domain use 1 as baseline, -1 otherwise
        return yScale.scaleOrThrow(logBaseline);
      }
      // if negative value, use -1 as max reference, 1 otherwise
      return yScale.scaleOrThrow(y0);
    }
    return yScale.scaleOrThrow(y0);
  };
}
