import { GeometryStyle } from '../../../lib/series/rendering';
import { GlobalKonvaElementProps } from '../globals';

export function buildAreaPointProps({
  areaIndex,
  pointIndex,
  x,
  y,
  radius,
  strokeWidth,
  color,
  opacity,
}: {
  areaIndex: number;
  pointIndex: number;
  x: number;
  y: number;
  radius: number;
  strokeWidth: number;
  color: string;
  opacity: number;
}) {
  return {
    key: `area-point-${areaIndex}-${pointIndex}`,
    x,
    y,
    radius,
    strokeWidth,
    strokeEnabled: strokeWidth !== 0,
    stroke: color,
    fill: 'white',
    opacity,
    ...GlobalKonvaElementProps,
  };
}

export function buildAreaProps({
  index,
  areaPath,
  color,
  opacity,
}: {
  index: number;
  areaPath: string;
  color: string;
  opacity: number;
}) {
  return {
    key: `area-${index}`,
    data: areaPath,
    fill: color,
    lineCap: 'round',
    lineJoin: 'round',
    opacity,
    ...GlobalKonvaElementProps,
  };
}

export function buildAreaLineProps({
  index,
  linePath,
  color,
  strokeWidth,
  geometryStyle,
}: {
  index: number;
  linePath: string;
  color: string;
  strokeWidth: number;
  geometryStyle: GeometryStyle;
}) {
  return {
    key: `area-line-${index}`,
    data: linePath,
    stroke: color,
    strokeWidth,
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
  radius,
  strokeWidth,
  color,
  opacity,
}: {
  lineIndex: number;
  pointIndex: number;
  x: number;
  y: number;
  radius: number;
  strokeWidth: number;
  color: string;
  opacity: number;
}) {
  return {
    key: `line-point-${lineIndex}-${pointIndex}`,
    x,
    y,
    radius,
    stroke: color,
    strokeWidth,
    strokeEnabled: strokeWidth !== 0,
    fill: 'white',
    opacity,
    ...GlobalKonvaElementProps,
  };
}

export function buildLineProps({
  index,
  linePath,
  color,
  strokeWidth,
  opacity,
  geometryStyle,
}: {
  index: number;
  linePath: string;
  color: string;
  strokeWidth: number;
  opacity: number;
  geometryStyle: GeometryStyle;
}) {
  return {
    key: `line-${index}`,
    data: linePath,
    stroke: color,
    strokeWidth,
    opacity,
    lineCap: 'round',
    lineJoin: 'round',
    ...geometryStyle,
    ...GlobalKonvaElementProps,
  };
}
