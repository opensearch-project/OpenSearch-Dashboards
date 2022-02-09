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
import { ScaleType } from '../../../scales/constants';
import { CanvasTextBBoxCalculator } from '../../../utils/bbox/canvas_text_bbox_calculator';
import { clamp, Color, mergePartial } from '../../../utils/common';
import { Dimensions } from '../../../utils/dimensions';
import { BandedAccessorType, BarGeometry } from '../../../utils/geometry';
import { BarSeriesStyle, DisplayValueStyle } from '../../../utils/themes/theme';
import { IndexedGeometryMap } from '../utils/indexed_geometry_map';
import { DataSeries, DataSeriesDatum, XYChartSeriesIdentifier } from '../utils/series';
import { BarStyleAccessor, DisplayValueSpec, StackMode } from '../utils/specs';

/** @internal */
export function renderBars(
  orderIndex: number,
  dataSeries: DataSeries,
  xScale: Scale,
  yScale: Scale,
  panel: Dimensions,
  color: Color,
  sharedSeriesStyle: BarSeriesStyle,
  displayValueSettings?: DisplayValueSpec,
  styleAccessor?: BarStyleAccessor,
  minBarHeight: number = 0,
  stackMode?: StackMode,
  chartRotation?: number,
): {
  barGeometries: BarGeometry[];
  indexedGeometryMap: IndexedGeometryMap;
} {
  const indexedGeometryMap = new IndexedGeometryMap();
  const barGeometries: BarGeometry[] = [];

  const bboxCalculator = new CanvasTextBBoxCalculator();

  // default padding to 1 for now
  const padding = 1;
  const { fontSize, fontFamily } = sharedSeriesStyle.displayValue;

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

    let y: number | null;
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
      // use always zero as baseline if y0 is null
      y0Scaled = y0 === null ? yScale.scale(0) : yScale.scale(y0);
    }

    if (y === null || y0Scaled === null) {
      return;
    }

    const absMinHeight = Math.abs(minBarHeight);
    let height = y0Scaled - y;
    if (absMinHeight !== undefined && height !== 0 && Math.abs(height) < absMinHeight) {
      const heightDelta = absMinHeight - Math.abs(height);
      if (height < 0) {
        height = -absMinHeight;
        y += heightDelta;
      } else {
        height = absMinHeight;
        y -= heightDelta;
      }
    }
    const isUpsideDown = height < 0;
    height = Math.abs(height);
    y = isUpsideDown ? y - height : y;

    const xScaled = xScale.scale(datum.x);

    if (xScaled === null) {
      return;
    }

    const seriesIdentifier: XYChartSeriesIdentifier = {
      key: dataSeries.key,
      specId: dataSeries.specId,
      yAccessor: dataSeries.yAccessor,
      splitAccessors: dataSeries.splitAccessors,
      seriesKeys: dataSeries.seriesKeys,
      smHorizontalAccessorValue: dataSeries.smHorizontalAccessorValue,
      smVerticalAccessorValue: dataSeries.smVerticalAccessorValue,
    };

    const seriesStyle = getBarStyleOverrides(datum, seriesIdentifier, sharedSeriesStyle, styleAccessor);

    const maxPixelWidth = clamp(seriesStyle.rect.widthRatio ?? 1, 0, 1) * xScale.bandwidth;
    const minPixelWidth = clamp(seriesStyle.rect.widthPixel ?? 0, 0, maxPixelWidth);

    const width = clamp(seriesStyle.rect.widthPixel ?? xScale.bandwidth, minPixelWidth, maxPixelWidth);
    const x = xScaled + xScale.bandwidth * orderIndex + xScale.bandwidth / 2 - width / 2;

    const originalY1Value = stackMode === StackMode.Percentage ? y1 - (y0 ?? 0) : initialY1;
    const formattedDisplayValue =
      displayValueSettings && displayValueSettings.valueFormatter
        ? displayValueSettings.valueFormatter(originalY1Value)
        : undefined;

    // only show displayValue for even bars if showOverlappingValue
    const displayValueText =
      displayValueSettings && displayValueSettings.isAlternatingValueLabel && barGeometries.length % 2
        ? undefined
        : formattedDisplayValue;

    const { displayValueWidth, fixedFontScale } = computeBoxWidth(
      displayValueText || '',
      { padding, fontSize, fontFamily, bboxCalculator, width },
      displayValueSettings,
    );

    const isHorizontalRotation = chartRotation == null || [0, 180].includes(chartRotation);
    // Take 70% of space for the label text
    const fontSizeFactor = 0.7;
    // Pick the right side of the label's box to use as factor reference
    const referenceWidth = Math.max(isHorizontalRotation ? displayValueWidth : fixedFontScale, 1);

    const textScalingFactor = getFinalFontScalingFactor(
      (width * fontSizeFactor) / referenceWidth,
      fixedFontScale,
      fontSize,
    );

    const hideClippedValue = displayValueSettings ? displayValueSettings.hideClippedValue : undefined;
    // Based on rotation scale the width of the text box
    const bboxWidthFactor = isHorizontalRotation ? textScalingFactor : 1;

    const displayValue =
      displayValueSettings && displayValueSettings.showValueLabel
        ? {
            fontScale: textScalingFactor,
            fontSize: fixedFontScale,
            text: displayValueText,
            width: bboxWidthFactor * displayValueWidth,
            height: textScalingFactor * fixedFontScale,
            hideClippedValue,
            isValueContainedInElement: displayValueSettings.isValueContainedInElement,
          }
        : undefined;

    const barGeometry: BarGeometry = {
      displayValue,
      x,
      y,
      transform: {
        x: 0,
        y: 0,
      },
      width,
      height,
      color,
      value: {
        x: datum.x,
        y: originalY1Value,
        mark: null,
        accessor: BandedAccessorType.Y1,
        datum: datum.datum,
      },
      seriesIdentifier,
      seriesStyle,
      panel,
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

/**
 * Workout the text box size and fixedFontSize based on a collection of options
 * @internal
 */
function computeBoxWidth(
  text: string,
  {
    padding,
    fontSize,
    fontFamily,
    bboxCalculator,
    width,
  }: {
    padding: number;
    fontSize: number | { min: number; max: number };
    fontFamily: string;
    bboxCalculator: CanvasTextBBoxCalculator;
    width: number;
  },
  displayValueSettings: DisplayValueSpec | undefined,
): { fixedFontScale: number; displayValueWidth: number } {
  const fixedFontScale = Math.max(typeof fontSize === 'number' ? fontSize : fontSize.min, 1);

  const computedDisplayValueWidth = bboxCalculator.compute(text || '', padding, fixedFontScale, fontFamily).width;
  if (typeof fontSize !== 'number') {
    return {
      fixedFontScale,
      displayValueWidth: computedDisplayValueWidth,
    };
  }
  return {
    fixedFontScale,
    displayValueWidth:
      displayValueSettings && displayValueSettings.isValueContainedInElement ? width : computedDisplayValueWidth,
  };
}

/**
 * Returns a safe scaling factor for label text for fixed or range size inputs
 * @internal
 */
function getFinalFontScalingFactor(
  scale: number,
  fixedFontSize: number,
  limits: DisplayValueStyle['fontSize'],
): number {
  if (typeof limits === 'number') {
    // it's a fixed size, so it's always ok
    return 1;
  }
  const finalFontSize = scale * fixedFontSize;
  if (finalFontSize > limits.max) {
    return limits.max / fixedFontSize;
  }
  if (finalFontSize < limits.min) {
    // it's technically 1, but keep it generic in case the fixedFontSize changes
    return limits.min / fixedFontSize;
  }
  return scale;
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
