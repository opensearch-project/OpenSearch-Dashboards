import { GeometryStyle } from '../../../lib/series/rendering';
import { AreaStyle, LineStyle, PointStyle } from '../../../lib/themes/theme';
import { GlobalKonvaElementProps } from '../globals';

export interface PointStyleProps {
  radius: number;
  strokeWidth: number;
  strokeEnabled: boolean;
  fill: string;
  opacity: number;
}

export function buildAreaPointProps({
  areaIndex,
  pointIndex,
  x,
  y,
  color,
  pointStyleProps,
}: {
  areaIndex: number;
  pointIndex: number;
  x: number;
  y: number;
  color: string;
  pointStyleProps: PointStyleProps;
}) {
  return {
    key: `area-point-${areaIndex}-${pointIndex}`,
    x,
    y,
    stroke: color,
    ...pointStyleProps,
    ...GlobalKonvaElementProps,
  };
}

export function buildPointStyleProps({
  radius,
  strokeWidth,
  opacity,
  seriesPointStyle,
}: {
  radius: number;
  strokeWidth: number;
  opacity: number;
  seriesPointStyle?: PointStyle;
}): PointStyleProps {
  const pointStrokeWidth = seriesPointStyle ? seriesPointStyle.strokeWidth : strokeWidth;
  return {
    radius: seriesPointStyle ? seriesPointStyle.radius : radius,
    strokeWidth: pointStrokeWidth,
    strokeEnabled: pointStrokeWidth !== 0,
    fill: 'white',
    opacity: seriesPointStyle ? seriesPointStyle.opacity : opacity,
  };
}

export function buildAreaProps({
  index,
  areaPath,
  xTransform,
  color,
  opacity,
  seriesAreaStyle,
}: {
  index: number;
  areaPath: string;
  xTransform: number;
  color: string;
  opacity: number;
  seriesAreaStyle?: AreaStyle,
}) {
  return {
    key: `area-${index}`,
    data: areaPath,
    x: xTransform,
    fill: color,
    lineCap: 'round',
    lineJoin: 'round',
    opacity: seriesAreaStyle ? seriesAreaStyle.opacity : opacity,
    ...GlobalKonvaElementProps,
  };
}

export function buildAreaLineProps({
  areaIndex,
  lineIndex,
  xTransform,
  linePath,
  color,
  strokeWidth,
  geometryStyle,
  seriesAreaLineStyle,
}: {
  areaIndex: number;
  lineIndex: number;
  xTransform: number;
  linePath: string;
  color: string;
  strokeWidth: number;
  geometryStyle: GeometryStyle;
  seriesAreaLineStyle?: LineStyle;
}) {
  return {
    key: `area-${areaIndex}-line-${lineIndex}`,
    data: linePath,
    x: xTransform,
    stroke: color,
    strokeWidth: seriesAreaLineStyle ? seriesAreaLineStyle.strokeWidth : strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
    ...geometryStyle,
    ...GlobalKonvaElementProps,
  };
}

export function buildBarProps({
  index,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
  borderEnabled,
  geometryStyle,
}: {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderEnabled: boolean;
  geometryStyle: GeometryStyle;
}) {
  return {
    key: `bar-${index}`,
    x,
    y,
    width,
    height,
    fill,
    strokeWidth,
    stroke,
    strokeEnabled: borderEnabled,
    ...GlobalKonvaElementProps,
    ...geometryStyle,
  };
}

export function buildLinePointProps({
  lineIndex,
  pointIndex,
  x,
  y,
  color,
  pointStyleProps,
}: {
  lineIndex: number;
  pointIndex: number;
  x: number;
  y: number;
  color: string;
  pointStyleProps: PointStyleProps;
}) {
  return {
    key: `line-point-${lineIndex}-${pointIndex}`,
    x,
    y,
    stroke: color,
    ...pointStyleProps,
    ...GlobalKonvaElementProps,
  };
}

export function buildLineProps({
  index,
  xTransform,
  linePath,
  color,
  strokeWidth,
  geometryStyle,
  seriesLineStyle,
}: {
  index: number;
  xTransform: number;
  linePath: string;
  color: string;
  strokeWidth: number;
  geometryStyle: GeometryStyle;
  seriesLineStyle?: LineStyle;
}) {
  return {
    key: `line-${index}`,
    x: xTransform,
    data: linePath,
    stroke: color,
    strokeWidth: seriesLineStyle ? seriesLineStyle.strokeWidth : strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
    ...geometryStyle,
    ...GlobalKonvaElementProps,
  };
}
