import { getGeometryStateStyle } from '../../rendering/rendering';
import { LineGeometry } from '../../../../utils/geometry';
import { SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { LegendItem } from '../../legend/legend';
import { withContext } from '../../../../renderers/canvas';
import { renderPoints } from './points';
import { renderLinePaths } from './primitives/path';
import { Rect } from '../../../../geoms/types';
import { buildLineStyles } from './styles/line';

interface LineGeometriesDataProps {
  animated?: boolean;
  lines: LineGeometry[];
  sharedStyle: SharedGeometryStateStyle;
  highlightedLegendItem: LegendItem | null;
  clippings: Rect;
}
export function renderLines(ctx: CanvasRenderingContext2D, props: LineGeometriesDataProps) {
  withContext(ctx, (ctx) => {
    const { lines, sharedStyle, highlightedLegendItem, clippings } = props;

    lines.forEach((line) => {
      const { seriesLineStyle, seriesPointStyle } = line;

      if (seriesLineStyle.visible) {
        withContext(ctx, (ctx) => {
          renderLine(ctx, line, highlightedLegendItem, sharedStyle, clippings);
        });
      }

      if (seriesPointStyle.visible) {
        withContext(ctx, (ctx) => {
          const geometryStyle = getGeometryStateStyle(line.seriesIdentifier, highlightedLegendItem, sharedStyle);
          renderPoints(ctx, line.points, line.seriesPointStyle, geometryStyle);
        });
      }
    });
  });
}

function renderLine(
  ctx: CanvasRenderingContext2D,
  line: LineGeometry,
  highlightedLegendItem: LegendItem | null,
  sharedStyle: SharedGeometryStateStyle,
  clippings: Rect,
) {
  const { color, transform, seriesIdentifier, seriesLineStyle, clippedRanges } = line;
  const geometryStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedStyle);
  const stroke = buildLineStyles(color, seriesLineStyle, geometryStyle);
  renderLinePaths(ctx, transform.x, [line.line], stroke, clippedRanges, clippings);
}
