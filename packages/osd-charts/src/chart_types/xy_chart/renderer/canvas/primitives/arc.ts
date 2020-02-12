import { withContext } from '../../../../../renderers/canvas';
import { Circle, Stroke, Fill, Arc } from '../../../../../geoms/types';
import { RGBtoString } from '../../../../partition_chart/layout/utils/d3_utils';
import { MIN_STROKE_WIDTH } from './line';

export function renderCircle(ctx: CanvasRenderingContext2D, circle: Circle, fill?: Fill, stroke?: Stroke) {
  if (!fill && !stroke) {
    return;
  }
  renderArc(
    ctx,
    {
      ...circle,
      startAngle: 0,
      endAngle: Math.PI * 2,
    },
    fill,
    stroke,
  );
}

export function renderArc(ctx: CanvasRenderingContext2D, arc: Arc, fill?: Fill, stroke?: Stroke) {
  if (!fill && !stroke) {
    return;
  }
  withContext(ctx, (ctx) => {
    const { x, y, radius, startAngle, endAngle } = arc;
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, endAngle, false);
    if (fill) {
      ctx.fillStyle = RGBtoString(fill.color);
      ctx.fill();
    }
    if (stroke && stroke.width > MIN_STROKE_WIDTH) {
      ctx.strokeStyle = RGBtoString(stroke.color);
      ctx.lineWidth = stroke.width;
      if (stroke.dash) {
        ctx.setLineDash(stroke.dash);
      }
      ctx.stroke();
    }
  });
}
