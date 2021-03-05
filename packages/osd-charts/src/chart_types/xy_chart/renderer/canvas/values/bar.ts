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

import { colorIsDark, getTextColorIfTextInvertible } from '../../../../../common/color_calcs';
import { fillTextColor } from '../../../../../common/fill_text_color';
import { Font, FontStyle, TextAlign, TextBaseline } from '../../../../../common/text_utils';
import { Rect } from '../../../../../geoms/types';
import { Rotation, VerticalAlignment, HorizontalAlignment } from '../../../../../utils/common';
import { Dimensions } from '../../../../../utils/dimensions';
import { BarGeometry } from '../../../../../utils/geometry';
import { Point } from '../../../../../utils/point';
import { Theme, TextAlignment } from '../../../../../utils/themes/theme';
import { renderText, wrapLines } from '../primitives/text';
import { renderDebugRect } from '../utils/debug';
import { withPanelTransform } from '../utils/panel_transform';

interface BarValuesProps {
  barSeriesStyle: Theme['barSeriesStyle'];
  renderingArea: Dimensions;
  rotation: Rotation;
  debug: boolean;
  bars: BarGeometry[];
  panel: Dimensions;
}

const CHART_DIRECTION: Record<string, Rotation> = {
  BottomUp: 0,
  TopToBottom: 180,
  LeftToRight: 90,
  RightToLeft: -90,
};

/** @internal */
export function renderBarValues(ctx: CanvasRenderingContext2D, props: BarValuesProps) {
  const { bars, debug, rotation, renderingArea, barSeriesStyle, panel } = props;
  const { fontFamily, fontStyle, fill, alignment } = barSeriesStyle.displayValue;
  const barsLength = bars.length;
  for (let i = 0; i < barsLength; i++) {
    const { displayValue } = bars[i];
    if (!displayValue) {
      continue;
    }
    const { text, fontSize, fontScale } = displayValue;
    let textLines = {
      lines: [text],
      width: displayValue.width,
      height: displayValue.height,
    };
    const font: Font = {
      fontFamily,
      fontStyle: fontStyle ? (fontStyle as FontStyle) : 'normal',
      fontVariant: 'normal',
      fontWeight: 'normal',
      textColor: 'black',
      textOpacity: 1,
    };

    const { x, y, align, baseline, rect } = positionText(
      bars[i],
      displayValue,
      rotation,
      barSeriesStyle.displayValue,
      alignment,
    );

    if (displayValue.isValueContainedInElement) {
      const width = rotation === 0 || rotation === 180 ? bars[i].width : bars[i].height;
      textLines = wrapLines(ctx, textLines.lines[0], font, fontSize, width, 100);
    }
    if (displayValue.hideClippedValue && isOverflow(rect, renderingArea, rotation)) {
      continue;
    }
    if (debug) {
      renderDebugRect(ctx, rect);
    }
    const { width, height } = textLines;
    const linesLength = textLines.lines.length;
    const shadowSize = getTextBorderSize(fill);
    const { fillColor, shadowColor } = getTextColors(fill, bars[i].color, shadowSize);

    for (let j = 0; j < linesLength; j++) {
      const textLine = textLines.lines[j];
      const origin = repositionTextLine({ x, y }, rotation, j, linesLength, { height, width });
      withPanelTransform(ctx, panel, rotation, renderingArea, (ctx) => {
        renderText(
          ctx,
          origin,
          textLine,
          {
            ...font,
            fill: fillColor,
            fontSize,
            align,
            baseline,
            shadow: shadowColor,
            shadowSize,
          },
          -rotation,
          undefined,
          fontScale,
        );
      });
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
  let lineX: number;
  let lineY: number;
  switch (chartRotation) {
    case 180:
      lineX = x;
      lineY = y - (i - max + 1) * height;
      break;
    case -90:
      lineX = x;
      lineY = y;
      break;
    case 90:
      lineX = x;
      lineY = y - (i - max + 1) * width;
      break;
    case 0:
    default:
      lineX = x;
      lineY = y + i * height;
  }

  return { x: lineX, y: lineY };
}

function computeHorizontalOffset(
  geom: BarGeometry,
  valueBox: { width: number; height: number },
  chartRotation: Rotation,
  { horizontal }: Partial<TextAlignment> = {},
) {
  switch (chartRotation) {
    case CHART_DIRECTION.LeftToRight: {
      if (horizontal === HorizontalAlignment.Left) {
        return geom.height - valueBox.width;
      }
      if (horizontal === HorizontalAlignment.Center) {
        return geom.height / 2 - valueBox.width / 2;
      }
      break;
    }
    case CHART_DIRECTION.RightToLeft: {
      if (horizontal === HorizontalAlignment.Right) {
        return geom.height - valueBox.width;
      }
      if (horizontal === HorizontalAlignment.Center) {
        return geom.height / 2 - valueBox.width / 2;
      }
      break;
    }
    case CHART_DIRECTION.TopToBottom: {
      if (horizontal === HorizontalAlignment.Left) {
        return geom.width / 2 - valueBox.width / 2;
      }
      if (horizontal === HorizontalAlignment.Right) {
        return -geom.width / 2 + valueBox.width / 2;
      }
      break;
    }
    case CHART_DIRECTION.BottomUp:
    default: {
      if (horizontal === HorizontalAlignment.Left) {
        return -geom.width / 2 + valueBox.width / 2;
      }
      if (horizontal === HorizontalAlignment.Right) {
        return geom.width / 2 - valueBox.width / 2;
      }
    }
  }
  return 0;
}

function computeVerticalOffset(
  geom: BarGeometry,
  valueBox: { width: number; height: number },
  chartRotation: Rotation,
  { vertical }: Partial<TextAlignment> = {},
) {
  switch (chartRotation) {
    case CHART_DIRECTION.LeftToRight: {
      if (vertical === VerticalAlignment.Bottom) {
        return geom.width - valueBox.height;
      }
      if (vertical === VerticalAlignment.Middle) {
        return geom.width / 2 - valueBox.height / 2;
      }
      break;
    }
    case CHART_DIRECTION.RightToLeft: {
      if (vertical === VerticalAlignment.Bottom) {
        return -geom.width + valueBox.height;
      }
      if (vertical === VerticalAlignment.Middle) {
        return -geom.width / 2 + valueBox.height / 2;
      }
      break;
    }
    case CHART_DIRECTION.TopToBottom: {
      if (vertical === VerticalAlignment.Top) {
        return geom.height - valueBox.height;
      }
      if (vertical === VerticalAlignment.Middle) {
        return geom.height / 2 - valueBox.height / 2;
      }
      break;
    }
    case CHART_DIRECTION.BottomUp:
    default: {
      if (vertical === VerticalAlignment.Bottom) {
        return geom.height - valueBox.height;
      }
      if (vertical === VerticalAlignment.Middle) {
        return geom.height / 2 - valueBox.height / 2;
      }
    }
  }
  return 0;
}

function computeAlignmentOffset(
  geom: BarGeometry,
  valueBox: { width: number; height: number },
  chartRotation: Rotation,
  textAlignment: Partial<TextAlignment> = {},
) {
  return {
    alignmentOffsetX: computeHorizontalOffset(geom, valueBox, chartRotation, textAlignment),
    alignmentOffsetY: computeVerticalOffset(geom, valueBox, chartRotation, textAlignment),
  };
}

function positionText(
  geom: BarGeometry,
  valueBox: { width: number; height: number },
  chartRotation: Rotation,
  offsets: { offsetX: number; offsetY: number },
  alignment?: TextAlignment,
): { x: number; y: number; align: TextAlign; baseline: TextBaseline; rect: Rect } {
  const { offsetX, offsetY } = offsets;

  const { alignmentOffsetX, alignmentOffsetY } = computeAlignmentOffset(geom, valueBox, chartRotation, alignment);

  switch (chartRotation) {
    case CHART_DIRECTION.TopToBottom: {
      const x = geom.x + geom.width / 2 - offsetX + alignmentOffsetX;
      const y = geom.y + offsetY + alignmentOffsetY;
      return {
        x,
        y,
        align: 'center',
        baseline: 'bottom',
        rect: {
          x: x - valueBox.width / 2,
          y,
          width: valueBox.width,
          height: valueBox.height,
        },
      };
    }
    case CHART_DIRECTION.RightToLeft: {
      const x = geom.x + geom.width + offsetY + alignmentOffsetY;
      const y = geom.y - offsetX + alignmentOffsetX;
      return {
        x,
        y,
        align: 'left',
        baseline: 'top',
        rect: {
          x: x - valueBox.height,
          y,
          width: valueBox.height,
          height: valueBox.width,
        },
      };
    }
    case CHART_DIRECTION.LeftToRight: {
      const x = geom.x - offsetY + alignmentOffsetY;
      const y = geom.y + offsetX + alignmentOffsetX;
      return {
        x,
        y,
        align: 'right',
        baseline: 'top',
        rect: {
          x,
          y,
          width: valueBox.height,
          height: valueBox.width,
        },
      };
    }
    case CHART_DIRECTION.BottomUp:
    default: {
      const x = geom.x + geom.width / 2 - offsetX + alignmentOffsetX;
      const y = geom.y - offsetY + alignmentOffsetY;
      return {
        x,
        y,
        align: 'center',
        baseline: 'top',
        rect: {
          x: x - valueBox.width / 2,
          y,
          width: valueBox.width,
          height: valueBox.height,
        },
      };
    }
  }
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

const DEFAULT_VALUE_COLOR = 'black';
// a little bit of alpha makes black font more readable
const DEFAULT_VALUE_BORDER_COLOR = 'rgba(255, 255, 255, 0.8)';
const DEFAULT_VALUE_BORDER_SOLID_COLOR = 'rgb(255, 255, 255)';
const TRANSPARENT_COLOR = 'rgba(0,0,0,0)';
type ValueFillDefinition = Theme['barSeriesStyle']['displayValue']['fill'];

function getTextColors(
  fillDefinition: ValueFillDefinition,
  geometryColor: string,
  borderSize: number,
): { fillColor: string; shadowColor: string } {
  if (typeof fillDefinition === 'string') {
    return { fillColor: fillDefinition, shadowColor: TRANSPARENT_COLOR };
  }
  if ('color' in fillDefinition) {
    return {
      fillColor: fillDefinition.color,
      shadowColor: fillDefinition.borderColor || TRANSPARENT_COLOR,
    };
  }
  const fillColor =
    fillTextColor(
      DEFAULT_VALUE_COLOR,
      fillDefinition.textInvertible,
      fillDefinition.textContrast || false,
      geometryColor,
      'white',
    ) || DEFAULT_VALUE_COLOR;

  // If the border is too wide it can overlap between a letter or another
  // therefore use a solid color for thinker borders
  const defaultBorderColor = borderSize < 2 ? DEFAULT_VALUE_BORDER_COLOR : DEFAULT_VALUE_BORDER_SOLID_COLOR;
  const shadowColor =
    'textBorder' in fillDefinition
      ? getTextColorIfTextInvertible(
          colorIsDark(fillColor),
          colorIsDark(defaultBorderColor),
          defaultBorderColor,
          false,
          geometryColor,
        ) || TRANSPARENT_COLOR
      : TRANSPARENT_COLOR;

  return {
    fillColor,
    shadowColor,
  };
}

const DEFAULT_BORDER_WIDTH = 1.5;
const MAX_BORDER_WIDTH = 8;

function getTextBorderSize(fill: ValueFillDefinition): number {
  if (typeof fill === 'string') {
    return DEFAULT_BORDER_WIDTH;
  }
  if ('borderWidth' in fill) {
    return Math.min(fill.borderWidth || DEFAULT_BORDER_WIDTH, MAX_BORDER_WIDTH);
  }
  const borderWidth =
    'textBorder' in fill && typeof fill.textBorder === 'number' ? fill.textBorder : DEFAULT_BORDER_WIDTH;
  return Math.min(borderWidth, MAX_BORDER_WIDTH);
}
