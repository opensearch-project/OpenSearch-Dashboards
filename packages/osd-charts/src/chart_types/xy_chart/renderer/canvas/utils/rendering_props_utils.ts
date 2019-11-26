import { RectConfig, PathConfig, CircleConfig } from 'konva';
import {
  AreaStyle,
  LineStyle,
  PointStyle,
  RectBorderStyle,
  RectStyle,
  GeometryStateStyle,
} from '../../../../../utils/themes/theme';
import { GlobalKonvaElementProps } from '../../../../../components/react_canvas/globals';

export interface PointStyleProps {
  radius: number;
  stroke: string;
  strokeWidth: number;
  strokeEnabled: boolean;
  fill: string;
  opacity: number;
}

/**
 * Return the style of a point.
 * The color value is used for stroke or fill if they are undefind in the PointStyle
 * @param color the series color
 * @param pointStyle the merged point style
 */
export function buildPointStyleProps(
  color: string,
  pointStyle: PointStyle,
  geometryStateStyle: GeometryStateStyle,
): PointStyleProps {
  const { strokeWidth, opacity } = pointStyle;
  const stroke = pointStyle.stroke || color;
  const fill = pointStyle.fill || color;
  return {
    radius: pointStyle.radius,
    stroke,
    strokeWidth,
    strokeEnabled: strokeWidth !== 0,
    fill: fill,
    ...geometryStateStyle,
    opacity: opacity * geometryStateStyle.opacity,
  };
}

/**
 * Return the rendering props for a point
 * @param x the x position of the point
 * @param y the y position of the point
 * @param pointStyleProps the style props of the point
 */
export function buildPointRenderProps(x: number, y: number, pointStyleProps: PointStyleProps): CircleConfig {
  return {
    x,
    y,
    ...pointStyleProps,
    ...GlobalKonvaElementProps,
  };
}

/**
 * Return the rendering props for a line. The color of the line will be overwritten
 * by the stroke color of the lineStyle parameter if present
 * @param x the horizontal offset to place the line
 * @param linePath the SVG line path
 * @param color the computed color of the line for this series
 * @param lineStyle the line style
 * @param geometryStateStyle the highlight geometry style
 */
export function buildLineRenderProps(
  x: number,
  linePath: string,
  color: string,
  lineStyle: LineStyle,
  geometryStateStyle: GeometryStateStyle,
): PathConfig {
  const opacity = lineStyle.opacity * geometryStateStyle.opacity;

  return {
    x,
    data: linePath,
    stroke: lineStyle.stroke || color,
    strokeWidth: lineStyle.strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
    ...geometryStateStyle,
    opacity, // want to override opactiy of geometryStateStyle
    ...GlobalKonvaElementProps,
  };
}

/**
 * Return the rendering props for an area. The color of the area will be overwritten
 * by the fill color of the areaStyle parameter if present
 * @param areaPath the SVG area path
 * @param x the horizontal offset to place the area
 * @param color the computed color of the line for this series
 * @param areaStyle the area style
 * @param geometryStateStyle the highlight geometry style
 */
export function buildAreaRenderProps(
  xTransform: number,
  areaPath: string,
  color: string,
  areaStyle: AreaStyle,
  geometryStateStyle: GeometryStateStyle,
): PathConfig {
  const opacity = areaStyle.opacity * geometryStateStyle.opacity;

  return {
    x: xTransform,
    data: areaPath,
    fill: areaStyle.fill || color,
    lineCap: 'round',
    lineJoin: 'round',
    ...geometryStateStyle,
    opacity, // want to override opactiy of geometryStateStyle
    ...GlobalKonvaElementProps,
  };
}

/**
 * Return the rendering props for a bar. The color of the bar will be overwritten
 * by the fill color of the rectStyle parameter if present
 * @param x the x position of the rect
 * @param y the y position of the rect
 * @param width the width of the rect
 * @param height the height of the rect
 * @param color the computed color of the rect for this series
 * @param rectStyle the rect style
 * @param geometryStateStyle the highlight geometry style
 */
export function buildBarRenderProps(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  rectStyle: RectStyle,
  borderStyle: RectBorderStyle,
  geometryStateStyle: GeometryStateStyle,
): RectConfig {
  const opacity = rectStyle.opacity * geometryStateStyle.opacity;
  const { stroke, visible, strokeWidth, strokeOpacity = 0 } = borderStyle;
  const offset = !visible || strokeWidth <= 0 || !stroke || strokeOpacity <= 0 || opacity <= 0 ? 0 : strokeWidth;

  return {
    x: x + offset,
    y: y + offset,
    width: width - 2 * offset,
    height: height - 2 * offset,
    fill: rectStyle.fill || color,
    strokeEnabled: false,
    ...geometryStateStyle,
    opacity, // want to override opactiy of geometryStateStyle
    ...GlobalKonvaElementProps,
  };
}

/**
 * Return the rendering props for a bar. The color of the bar will be overwritten
 * by the fill color of the rectStyle parameter if present
 * @param x the x position of the rect
 * @param y the y position of the rect
 * @param width the width of the rect
 * @param height the height of the rect
 * @param color the computed color of the rect for this series
 * @param rectStyle the rect style
 * @param borderStyle the border rect style
 * @param geometryStyle the highlight geometry style
 */
export function buildBarBorderRenderProps(
  x: number,
  y: number,
  width: number,
  height: number,
  rectStyle: RectStyle,
  borderStyle: RectBorderStyle,
  geometryStateStyle: GeometryStateStyle,
): RectConfig | null {
  const { stroke, visible, strokeWidth, strokeOpacity = rectStyle.opacity } = borderStyle;
  const opacity = strokeOpacity * geometryStateStyle.opacity;

  if (!visible || strokeWidth <= 0 || !stroke || opacity <= 0) {
    return null;
  }

  return {
    x: x + strokeWidth / 2,
    y: y + strokeWidth / 2,
    width: width - strokeWidth,
    height: height - strokeWidth,
    fillEnabled: false,
    strokeEnabled: true,
    strokeWidth,
    stroke,
    ...geometryStateStyle,
    opacity, // want to override opactiy of geometryStateStyle
    ...GlobalKonvaElementProps,
  };
}
