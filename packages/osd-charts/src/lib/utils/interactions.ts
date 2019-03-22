import { IndexedGeometry } from '../series/rendering';
import { Datum, Rotation } from '../series/specs';
import { Dimensions } from './dimensions';

/** The type of tooltip to use */
export enum TooltipType {
  /** Vertical cursor parallel to x axis */
  VerticalCursor = 'vertical',
  /** Vertical and horizontal cursors */
  Crosshairs = 'cross',
  /** Follor the mouse coordinates */
  Follow = 'follow',
  /** Hide every tooltip */
  None = 'none',
}
export interface TooltipValue {
  name: string;
  value: any;
  color: string;
  isHighlighted: boolean;
  isXValue: boolean;
}
export interface HighlightedElement {
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'rect' | 'circle';
  };
  value: Datum;
}
/**
 * Get the cursor position depending on the chart rotation
 * @param xPos x position relative to chart
 * @param yPos y position relative to chart
 * @param chartRotation the chart rotation
 * @param chartDimension the chart dimension
 */
export function getValidXPosition(
  xPos: number,
  yPos: number,
  chartRotation: Rotation,
  chartDimension: Dimensions,
) {
  switch (chartRotation) {
    case 0:
      return xPos;
    case 180:
      return chartDimension.width - xPos;
    case 90:
      return yPos;
    case -90:
      return chartDimension.height - yPos;
  }
}
export function getValidYPosition(
  xPos: number,
  yPos: number,
  chartRotation: Rotation,
  chartDimension: Dimensions,
) {
  switch (chartRotation) {
    case 0:
      return yPos;
    case 180:
      return chartDimension.height - yPos;
    case -90:
      return xPos;
    case 90:
      return chartDimension.width - xPos;
  }
}

export function isCrosshairTooltipType(type: TooltipType) {
  return type === TooltipType.VerticalCursor || type === TooltipType.Crosshairs;
}
export function isFollowTooltipType(type: TooltipType) {
  return type === TooltipType.Follow;
}

export function areIndexedGeometryArraysEquals(arr1: IndexedGeometry[], arr2: IndexedGeometry[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = arr1.length; i--; ) {
    return areIndexedGeomsEquals(arr1[i], arr2[i]);
  }
  return true;
}

export function areIndexedGeomsEquals(ig1: IndexedGeometry, ig2: IndexedGeometry) {
  return (
    ig1.specId === ig2.specId &&
    ig1.color === ig2.color &&
    ig1.geom.x === ig2.geom.x &&
    ig1.geom.y === ig2.geom.y &&
    ig1.geom.width === ig2.geom.width &&
    ig1.geom.height === ig2.geom.height &&
    ig1.geom.isPoint === ig2.geom.isPoint
  );
}
