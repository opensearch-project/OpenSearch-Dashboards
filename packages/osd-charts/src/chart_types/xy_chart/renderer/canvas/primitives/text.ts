import { withContext, withRotatedOrigin } from '../../../../../renderers/canvas';
import { Font, TextAlign, TextBaseline } from '../../../../partition_chart/layout/types/types';
import { cssFontShorthand, measureText } from '../../../../partition_chart/layout/utils/measure';
import { Point } from '../../../../../utils/point';

export function renderText(
  ctx: CanvasRenderingContext2D,
  origin: Point,
  text: string,
  font: Font & { fill: string; fontSize: number; align: TextAlign; baseline: TextBaseline },
  degree: number = 0,
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
      ctx.fillText(text, origin.x, origin.y);
    });
  });
}

const SPACE = ' ';
const ELLIPSIS = '…';
const DASH = '-';

export function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: Font,
  fontSize: number,
  fixedWidth: number,
  fixedHeight: number,
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
  const wrapAtWord = true;
  const shouldAddEllipsis = false;
  const textArr: string[] = [];
  const textMeasureProcessor = measureText(ctx);
  const getTextWidth = (text: string) => {
    const measuredText = textMeasureProcessor(fontSize, [
      {
        text,
        ...font,
      },
    ]);
    const measure = measuredText[0];
    if (measure) {
      return measure.width;
    }
    return 0;
  };

  const additionalWidth = 0;

  for (let i = 0, max = lines.length; i < max; ++i) {
    let line = lines[i];
    let lineWidth = getTextWidth(line);
    if (fixedWidth && lineWidth > maxWidth) {
      while (line.length > 0) {
        let low = 0,
          high = line.length,
          match = '',
          matchWidth = 0;
        while (low < high) {
          const mid = (low + high) >>> 1,
            substr = line.slice(0, mid + 1),
            substrWidth = getTextWidth(substr) + additionalWidth;
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
            let wrapIndex;
            const nextChar = line[match.length];
            const nextIsSpaceOrDash = nextChar === SPACE || nextChar === DASH;
            if (nextIsSpaceOrDash && matchWidth <= maxWidth) {
              wrapIndex = match.length;
            } else {
              wrapIndex = Math.max(match.lastIndexOf(SPACE), match.lastIndexOf(DASH)) + 1;
            }
            if (wrapIndex > 0) {
              low = wrapIndex;
              match = match.slice(0, low);
              matchWidth = getTextWidth(match);
            }
          }
          match = match.trimRight();
          textArr.push(match);
          textWidth = Math.max(textWidth, matchWidth);
          currentHeightPx += lineHeightPx;
          if (!shouldWrap || (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx)) {
            break;
          }
          line = line.slice(low);
          line = line.trimLeft();
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
