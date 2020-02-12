import { PointGeometry } from '../../../../utils/geometry';
import { PointStyle, GeometryStateStyle } from '../../../../utils/themes/theme';
import { renderCircle } from './primitives/arc';
import { Circle } from '../../../../geoms/types';
import { buildPointStyles } from './styles/point';

export function renderPoints(
  ctx: CanvasRenderingContext2D,
  points: PointGeometry[],
  themeStyle: PointStyle,
  geometryStateStyle: GeometryStateStyle,
) {
  return points.map((point) => {
    const { x, y, color, transform, styleOverrides } = point;
    const { fill, stroke, radius } = buildPointStyles(color, themeStyle, geometryStateStyle, styleOverrides);

    const circle: Circle = {
      x: x + transform.x,
      y,
      radius,
    };

    renderCircle(ctx, circle, fill, stroke);
  });
}
