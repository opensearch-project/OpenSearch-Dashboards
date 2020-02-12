import { GeometryStateStyle, LineStyle } from '../../../../../utils/themes/theme';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { Stroke } from '../../../../../geoms/types';

/**
 * Return the rendering props for a line. The color of the line will be overwritten
 * by the stroke color of the themeLineStyle parameter if present
 * @param baseColor the assigned color of the line for this series
 * @param themeLineStyle the theme style for the line series
 * @param geometryStateStyle the highlight geometry style
 */
export function buildLineStyles(
  baseColor: string,
  themeLineStyle: LineStyle,
  geometryStateStyle: GeometryStateStyle,
): Stroke {
  const strokeColor = stringToRGB(themeLineStyle.stroke || baseColor);
  strokeColor.opacity = strokeColor.opacity * themeLineStyle.opacity * geometryStateStyle.opacity;
  return {
    color: strokeColor,
    width: themeLineStyle.strokeWidth,
    dash: themeLineStyle.dash,
  };
}
