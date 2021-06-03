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

import { cssFontShorthand, Font, measureText, TextAlign, TextBaseline } from '../../../../../common/text_utils';
import { withContext, withRotatedOrigin } from '../../../../../renderers/canvas';
import { Point } from '../../../../../utils/point';

/** @internal */
export type TextFont = Font & {
  fill: string;
  fontSize: number;
  align: TextAlign;
  baseline: TextBaseline;
  shadow?: string;
  shadowSize?: number;
};

/** @internal */
export function renderText(
  ctx: CanvasRenderingContext2D,
  origin: Point,
  text: string,
  font: TextFont,
  degree: number = 0,
  translation?: Partial<Point>,
  scale: number = 1,
) {
  if (text === undefined || text === null) {
    return;
  }

  withRotatedOrigin(ctx, origin, degree, (ctx) => {
    withContext(ctx, (ctx) => {
      ctx.fillStyle = font.fill;
      ctx.textAlign = font.align;
      ctx.textBaseline = font.baseline;
      ctx.font = cssFontShorthand(font, font.fontSize);
      if (translation?.x || translation?.y) {
        ctx.translate(translation?.x ?? 0, translation?.y ?? 0);
      }
      ctx.translate(origin.x, origin.y);
      ctx.scale(scale, scale);
      const shadowSize = font.shadowSize ?? 0;
      if (font.shadow && shadowSize > 0) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = shadowSize;
        ctx.strokeStyle = font.shadow;
        ctx.strokeText(text, 0, 0);
      }
      ctx.fillText(text, 0, 0);
    });
  });
}

const SPACE = ' ';
const ELLIPSIS = '…';
const DASH = '-';

interface Options {
  wrapAtWord: boolean;
  shouldAddEllipsis: boolean;
}

/** @internal */
export function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: Font,
  fontSize: number,
  fixedWidth: number,
  fixedHeight: number,
  { wrapAtWord, shouldAddEllipsis }: Options = { wrapAtWord: true, shouldAddEllipsis: false },
) {
  const lineHeight = 1;
  const lines = text.split('\n');
  let textWidth = 0;
  const lineHeightPx = lineHeight * fontSize;

  const padding = 0;
  const maxWidth = fixedWidth - padding * 2;
  const maxHeightPx = fixedHeight - padding * 2;
  let currentHeightPx = 0;
  const shouldWrap = true;
  const textArr: string[] = [];
  const textMeasureProcessor = measureText(ctx);
  const getTextWidth = (textString: string) => {
    const measuredText = textMeasureProcessor(fontSize, [
      {
        text: textString,
        ...font,
      },
    ]);
    const [measure] = measuredText;
    if (measure) {
      return measure.width;
    }
    return 0;
  };

  const additionalWidth = shouldAddEllipsis ? getTextWidth(ELLIPSIS) : 0;
  for (let i = 0, max = lines.length; i < max; ++i) {
    let line = lines[i];
    let lineWidth = getTextWidth(line);
    if (fixedWidth && lineWidth > maxWidth) {
      while (line.length > 0) {
        let low = 0;
        let high = line.length;
        let match = '';
        let matchWidth = 0;
        while (low < high) {
          const mid = (low + high) >>> 1;
          const substr = line.slice(0, mid + 1);
          const substrWidth = getTextWidth(substr) + additionalWidth;
          if (substrWidth <= maxWidth) {
            low = mid + 1;
            match = substr + (shouldAddEllipsis ? ELLIPSIS : '');
            matchWidth = substrWidth;
          } else {
            high = mid;
          }
        }
        if (match) {
          if (wrapAtWord) {
            const nextChar = line[match.length];
            const nextIsSpaceOrDash = nextChar === SPACE || nextChar === DASH;
            const wrapIndex =
              nextIsSpaceOrDash && matchWidth <= maxWidth
                ? match.length
                : Math.max(match.lastIndexOf(SPACE), match.lastIndexOf(DASH)) + 1;
            if (wrapIndex > 0) {
              low = wrapIndex;
              match = match.slice(0, low);
              matchWidth = getTextWidth(match);
            }
          }
          match = match.trimEnd();
          textArr.push(match);
          textWidth = Math.max(textWidth, matchWidth);
          currentHeightPx += lineHeightPx;
          if (!shouldWrap || (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx)) {
            break;
          }
          line = line.slice(low);
          line = line.trimStart();
          if (line.length > 0) {
            lineWidth = getTextWidth(line);
            if (lineWidth <= maxWidth) {
              textArr.push(line);
              currentHeightPx += lineHeightPx;
              textWidth = Math.max(textWidth, lineWidth);
              break;
            }
          }
        } else {
          break;
        }
      }
    } else {
      textArr.push(line);
      currentHeightPx += lineHeightPx;
      textWidth = Math.max(textWidth, lineWidth);
    }
    if (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx) {
      break;
    }
  }
  return {
    lines: textArr,
    height: fontSize,
    width: textWidth,
  };
}
