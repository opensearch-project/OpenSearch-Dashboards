import { ClippedRanges } from '../../../../../utils/geometry';
import { withContext, withClipRanges } from '../../../../../renderers/canvas';
import { RGBtoString } from '../../../../partition_chart/layout/utils/d3_utils';
import { Rect, Stroke, Fill } from '../../../../../geoms/types';
import { MIN_STROKE_WIDTH } from './line';

export function renderLinePaths(
  ctx: CanvasRenderingContext2D,
  transformX: number,
  linePaths: Array<string>,
  stroke: Stroke,
  clippedRanges: ClippedRanges,
  clippings: Rect,
) {
  ctx.translate(transformX, 0);
  if (clippedRanges.length > 0) {
    withClipRanges(ctx, clippedRanges, clippings, false, (ctx) => {
      linePaths.map((path) => {
        renderPathStroke(ctx, path, stroke);
      });
    });
    withClipRanges(ctx, clippedRanges, clippings, true, (ctx) => {
      linePaths.map((path) => {
        renderPathStroke(ctx, path, { ...stroke, dash: [5, 5] });
      });
    });
    return;
  }

  linePaths.map((path) => {
    withContext(ctx, (ctx) => {
      renderPathStroke(ctx, path, stroke);
    });
  });
}

export function renderAreaPath(
  ctx: CanvasRenderingContext2D,
  transformX: number,
  area: string,
  fill: Fill,
  clippedRanges: ClippedRanges,
  clippings: Rect,
) {
  if (clippedRanges.length > 0) {
    withClipRanges(ctx, clippedRanges, clippings, false, (ctx) => {
      ctx.translate(transformX, 0);
      renderPathFill(ctx, area, fill);
    });
    withClipRanges(ctx, clippedRanges, clippings, true, (ctx) => {
      ctx.translate(transformX, 0);
      const { opacity } = fill.color;
      const color = {
        ...fill.color,
        opacity: opacity / 2,
      };
      renderPathFill(ctx, area, { ...fill, color });
    });
    return;
  }
  withContext(ctx, (ctx) => {
    ctx.translate(transformX, 0);
    renderPathFill(ctx, area, fill);
  });
}

function renderPathStroke(ctx: CanvasRenderingContext2D, path: string, stroke: Stroke) {
  if (stroke.width < MIN_STROKE_WIDTH) {
    return;
  }
  const path2d = new Path2D(path);

  ctx.strokeStyle = RGBtoString(stroke.color);
  ctx.lineWidth = stroke.width;
  if (stroke.dash) {
    ctx.setLineDash(stroke.dash);
  }
  ctx.beginPath();
  ctx.stroke(path2d);
}

function renderPathFill(ctx: CanvasRenderingContext2D, path: string, fill: Fill) {
  const path2d = new Path2D(path);
  ctx.fillStyle = RGBtoString(fill.color);
  ctx.beginPath();
  ctx.fill(path2d);
}
