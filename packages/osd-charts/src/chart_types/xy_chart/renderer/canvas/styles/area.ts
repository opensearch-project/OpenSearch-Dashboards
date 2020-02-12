import { GeometryStateStyle, AreaStyle } from '../../../../../utils/themes/theme';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { Fill } from '../../../../../geoms/types';

/**
 * Return the rendering props for an area. The color of the area will be overwritten
 * by the fill color of the themeAreaStyle parameter if present
 * @param baseColor the assigned color of the area for this series
 * @param themeAreaStyle the theme style for the area series
 * @param geometryStateStyle the highlight geometry style
 */
export function buildAreaStyles(
  baseColor: string,
  themeAreaStyle: AreaStyle,
  geometryStateStyle: GeometryStateStyle,
): Fill {
  const fillColor = stringToRGB(themeAreaStyle.fill || baseColor);
  fillColor.opacity = fillColor.opacity * themeAreaStyle.opacity * geometryStateStyle.opacity;
  return {
    color: fillColor,
  };
}
