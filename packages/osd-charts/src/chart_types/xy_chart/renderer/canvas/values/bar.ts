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

import { Rotation } from '../../../../../utils/commons';
import { Dimensions } from '../../../../../utils/dimensions';
import { Theme } from '../../../../../utils/themes/theme';
import { BarGeometry } from '../../../../../utils/geometry';
import { renderText, wrapLines } from '../primitives/text';
import { renderDebugRect } from '../utils/debug';
import { Font, FontStyle, TextBaseline, TextAlign } from '../../../../partition_chart/layout/types/types';
import { Point } from '../../../../../utils/point';
import { Rect } from '../../../../../geoms/types';

interface BarValuesProps {
  theme: Theme;
  chartDimensions: Dimensions;
  chartRotation: Rotation;
  debug: boolean;
  bars: BarGeometry[];
}
export function renderBarValues(ctx: CanvasRenderingContext2D, props: BarValuesProps) {
  const { bars, debug, chartRotation, chartDimensions, theme } = props;
  const { fontFamily, fontStyle, fill, fontSize } = theme.barSeriesStyle.displayValue;
  const barsLength = bars.length;
  for (let i = 0; i < barsLength; i++) {
    const { displayValue } = bars[i];
    if (!displayValue) {
      continue;
    }
    const { text } = displayValue;
    let textLines = {
      lines: [text],
      width: displayValue.width,
      height: displayValue.height,
    };
    const font: Font = {
      fontFamily: fontFamily,
      fontStyle: fontStyle ? (fontStyle as FontStyle) : 'normal',
      fontVariant: 'normal',
      fontWeight: 'normal',
    };

    const { x, y, align, baseline, rect } = positionText(
      bars[i],
      displayValue,
      chartRotation,
      theme.barSeriesStyle.displayValue,
    );

    if (displayValue.isValueContainedInElement) {
      const width = chartRotation === 0 || chartRotation === 180 ? bars[i].width : bars[i].height;
      textLines = wrapLines(ctx, textLines.lines[0], font, fontSize, width, 100);
    }
    if (displayValue.hideClippedValue && isOverflow(rect, chartDimensions, chartRotation)) {
      continue;
    }
    if (debug) {
      renderDebugRect(ctx, rect);
    }
    const { width, height } = textLines;
    const linesLength = textLines.lines.length;

    for (let i = 0; i < linesLength; i++) {
      const text = textLines.lines[i];
      const origin = repositionTextLine({ x, y }, chartRotation, i, linesLength, { height, width });
      renderText(
        ctx,
        origin,
        text,
        {
          ...font,
          fill,
          fontSize,
          align,
          baseline,
        },
        -chartRotation,
      );
    }
  }
}
function repositionTextLine(
  origin: Point,
  chartRotation: Rotation,
  i: number,
  max: number,
  box: { height: number; width: number },
) {
  const { x, y } = origin;
  const { width, height } = box;
  let lineX = x;
  let lineY = y + i * height;
  switch (chartRotation) {
    case 180:
      lineX = x;
      lineY = y - (i - max + 1) * height;
      break;
    case -90:
      lineX = x;
      lineY = y;
    case 90:
      lineX = x;
      lineY = y - (i - max + 1) * width;
  }

  return { x: lineX, y: lineY };
}

function positionText(
  geom: BarGeometry,
  valueBox: { width: number; height: number },
  chartRotation: Rotation,
  offsets: { offsetX: number; offsetY: number },
) {
  const { offsetX, offsetY } = offsets;
  let baseline: TextBaseline = 'top';
  let align: TextAlign = 'center';

  let x = geom.x + geom.width / 2 - offsetX;
  let y = geom.y - offsetY;
  const rect: Rect = {
    x: x - valueBox.width / 2,
    y,
    width: valueBox.width,
    height: valueBox.height,
  };
  if (chartRotation === 180) {
    baseline = 'bottom';
    x = geom.x + geom.width / 2 + offsetX;
    y = geom.y + offsetY;
    rect.x = x - valueBox.width / 2;
    rect.y = y;
  }
  if (chartRotation === 90) {
    x = geom.x - offsetY;
    y = geom.y + offsetX;
    align = 'right';
    rect.x = x;
    rect.y = y;
    rect.width = valueBox.height;
    rect.height = valueBox.width;
  }
  if (chartRotation === -90) {
    x = geom.x + geom.width + offsetY;
    y = geom.y - offsetX;
    align = 'left';
    rect.x = x - valueBox.height;
    rect.y = y;
    rect.width = valueBox.height;
    rect.height = valueBox.width;
  }
  return {
    x,
    y,
    align,
    baseline,
    rect,
  };
}
function isOverflow(rect: Rect, chartDimensions: Dimensions, chartRotation: Rotation) {
  let cWidth = chartDimensions.width;
  let cHeight = chartDimensions.height;
  if (chartRotation === 90 || chartRotation === -90) {
    cWidth = chartDimensions.height;
    cHeight = chartDimensions.width;
  }

  if (rect.x < 0 || rect.x + rect.width > cWidth) {
    return true;
  }
  if (rect.y < 0 || rect.y + rect.height > cHeight) {
    return true;
  }

  return false;
}
