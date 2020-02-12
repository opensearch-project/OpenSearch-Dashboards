import { RgbObject } from '../chart_types/partition_chart/layout/utils/d3_utils';
import { Radian } from '../chart_types/partition_chart/layout/types/geometry_types';
export interface Text {
  text: string;
  x: number;
  y: number;
}
export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Arc {
  x: number;
  y: number;
  radius: number;
  startAngle: Radian;
  endAngle: Radian;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Fill style for every geometry
 */
export interface Fill {
  /**
   * fill color in rgba
   */
  color: RgbObject;
}

/**
 * Stroke style for every geometry
 */
export interface Stroke {
  /**
   * stroke rgba
   */
  color: RgbObject;
  /**
   * stroke width
   */
  width: number;
  /**
   * stroke dash array
   */
  dash?: number[];
}
