import { withContext, withClip } from '../../../../renderers/canvas';
import { BarGeometry } from '../../../../utils/geometry';
import { buildBarStyles } from './styles/bar';
import { SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { getGeometryStateStyle } from '../../rendering/rendering';
import { LegendItem } from '../../legend/legend';
import { renderRect } from './primitives/rect';
import { Rect } from '../../../../geoms/types';

export function renderBars(
  ctx: CanvasRenderingContext2D,
  barGeometries: BarGeometry[],
  sharedStyle: SharedGeometryStateStyle,
  clippings: Rect,
  highlightedLegendItem?: LegendItem,
) {
  withContext(ctx, (ctx) => {
    withClip(ctx, clippings, (ctx: CanvasRenderingContext2D) => {
      // ctx.scale(1, -1); // D3 and Canvas2d use a left-handed coordinate system (+y = down) but the ViewModel uses +y = up, so we must locally invert Y
      barGeometries.forEach((barGeometry) => {
        const { x, y, width, height, color, seriesStyle } = barGeometry;
        const geometryStateStyle = getGeometryStateStyle(
          barGeometry.seriesIdentifier,
          highlightedLegendItem || null,
          sharedStyle,
        );
        const { fill, stroke } = buildBarStyles(color, seriesStyle.rect, seriesStyle.rectBorder, geometryStateStyle);
        const rect = { x, y, width, height };
        renderRect(ctx, rect, fill, stroke);
      });
    });
  });
}
