import { BarGeometry, IndexedGeometry, isBarGeometry, isPointGeometry, PointGeometry } from '../series/rendering';
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
  seriesKey: string;
}

export type TooltipValueFormatter = (data: TooltipValue) => JSX.Element | string;

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
export function getValidXPosition(xPos: number, yPos: number, chartRotation: Rotation, chartDimension: Dimensions) {
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
export function getValidYPosition(xPos: number, yPos: number, chartRotation: Rotation, chartDimension: Dimensions) {
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
  if (isPointGeometry(ig1) && isPointGeometry(ig2)) {
    return arePointsEqual(ig1, ig2);
  }
  if (isBarGeometry(ig1) && isBarGeometry(ig2)) {
    return areBarEqual(ig1, ig2);
  }
  return false;
}

export function arePointsEqual(ig1: PointGeometry, ig2: PointGeometry) {
  return (
    ig1.geometryId.specId === ig2.geometryId.specId &&
    ig1.color === ig2.color &&
    ig1.x === ig2.x &&
    ig1.transform.x === ig2.transform.x &&
    ig1.transform.y === ig2.transform.y &&
    ig1.y === ig2.y &&
    ig1.radius === ig2.radius
  );
}
export function areBarEqual(ig1: BarGeometry, ig2: BarGeometry) {
  return (
    ig1.geometryId.specId === ig2.geometryId.specId &&
    ig1.color === ig2.color &&
    ig1.x === ig2.x &&
    ig1.y === ig2.y &&
    ig1.width === ig2.width &&
    ig1.height === ig2.height
  );
}
