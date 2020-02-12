import { getGeometryStateStyle } from '../../rendering/rendering';
import { AreaGeometry } from '../../../../utils/geometry';
import { SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { LegendItem } from '../../legend/legend';
import { withClip, withContext } from '../../../../renderers/canvas';
import { renderPoints } from './points';
import { renderLinePaths, renderAreaPath } from './primitives/path';
import { Rect } from '../../../../geoms/types';
import { buildAreaStyles } from './styles/area';
import { buildLineStyles } from './styles/line';

interface AreaGeometriesProps {
  areas: AreaGeometry[];
  sharedStyle: SharedGeometryStateStyle;
  highlightedLegendItem: LegendItem | null;
  clippings: Rect;
}

export function renderAreas(ctx: CanvasRenderingContext2D, props: AreaGeometriesProps) {
  withContext(ctx, (ctx) => {
    const { sharedStyle, highlightedLegendItem, areas, clippings } = props;
    withClip(ctx, clippings, (ctx: CanvasRenderingContext2D) => {
      ctx.save();

      for (let i = 0; i < areas.length; i++) {
        const glyph = areas[i];
        const { seriesAreaLineStyle, seriesAreaStyle } = glyph;
        if (seriesAreaStyle.visible) {
          withContext(ctx, () => {
            renderArea(ctx, glyph, sharedStyle, highlightedLegendItem, clippings);
          });
        }
        if (seriesAreaLineStyle.visible) {
          withContext(ctx, () => {
            renderAreaLines(ctx, glyph, sharedStyle, highlightedLegendItem, clippings);
          });
        }
      }
      ctx.rect(clippings.x, clippings.y, clippings.width, clippings.height);
      ctx.clip();
      ctx.restore();
    });
    for (let i = 0; i < areas.length; i++) {
      const glyph = areas[i];
      const { seriesPointStyle, seriesIdentifier } = glyph;
      if (seriesPointStyle.visible) {
        const geometryStateStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedStyle);
        withContext(ctx, () => {
          renderPoints(ctx, glyph.points, seriesPointStyle, geometryStateStyle);
        });
      }
    }
  });
}

function renderArea(
  ctx: CanvasRenderingContext2D,
  glyph: AreaGeometry,
  sharedStyle: SharedGeometryStateStyle,
  highlightedLegendItem: LegendItem | null,
  clippings: Rect,
) {
  const { area, color, transform, seriesIdentifier, seriesAreaStyle, clippedRanges } = glyph;
  const geometryStateStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedStyle);
  const fill = buildAreaStyles(color, seriesAreaStyle, geometryStateStyle);
  renderAreaPath(ctx, transform.x, area, fill, clippedRanges, clippings);
}
function renderAreaLines(
  ctx: CanvasRenderingContext2D,
  glyph: AreaGeometry,
  sharedStyle: SharedGeometryStateStyle,
  highlightedLegendItem: LegendItem | null,
  clippings: Rect,
) {
  const { lines, color, seriesIdentifier, transform, seriesAreaLineStyle, clippedRanges } = glyph;
  const geometryStateStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedStyle);
  const stroke = buildLineStyles(color, seriesAreaLineStyle, geometryStateStyle);
  renderLinePaths(ctx, transform.x, lines, stroke, clippedRanges, clippings);
}
