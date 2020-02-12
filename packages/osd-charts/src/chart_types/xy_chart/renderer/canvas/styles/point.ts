import { PointStyle, GeometryStateStyle } from '../../../../../utils/themes/theme';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { Fill, Stroke } from '../../../../../geoms/types';
import { mergePartial } from '../../../../../utils/commons';

/**
 * Return the fill, stroke and radius styles for a point geometry.
 * The color value is used for stroke or fill if they are undefind in the theme PointStyle.
 * If an override style is available it will overrides the style or the radius of the point.
 * @param baseColor the series color
 * @param themePointStyle the theme style or the merged point style if a custom PointStyle is applied
 * @param geometryStateStyle the state style of the geometry
 * @param overrides (optional) an override PointStyle
 */
export function buildPointStyles(
  baseColor: string,
  themePointStyle: PointStyle,
  geometryStateStyle: GeometryStateStyle,
  overrides?: Partial<PointStyle>,
): { fill: Fill; stroke: Stroke; radius: number } {
  const pointStyle = mergePartial(themePointStyle, overrides);
  const fillColor = stringToRGB(pointStyle.fill || baseColor);
  fillColor.opacity = fillColor.opacity * pointStyle.opacity * geometryStateStyle.opacity;
  const fill: Fill = {
    color: fillColor,
  };

  const strokeColor = stringToRGB(pointStyle.stroke || baseColor);
  strokeColor.opacity = strokeColor.opacity * pointStyle.opacity * geometryStateStyle.opacity;
  const stroke: Stroke = {
    color: strokeColor,
    width: pointStyle.strokeWidth,
  };

  const radius = overrides && overrides.radius ? overrides.radius : themePointStyle.radius;
  return { fill, stroke, radius };
}
