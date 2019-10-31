import {
  AnnotationDomainType,
  AnnotationDomainTypes,
  AnnotationSpec,
  AnnotationType,
  AnnotationTypes,
  AxisSpec,
  HistogramModeAlignments,
  isLineAnnotation,
  isRectAnnotation,
  LineAnnotationDatum,
  LineAnnotationSpec,
  Position,
  RectAnnotationDatum,
  RectAnnotationSpec,
  Rotation,
} from '../utils/specs';
import { isHorizontalAxis } from '../utils/axis_utils';
import { LineAnnotationStyle } from '../../../utils/themes/theme';
import { Dimensions } from '../../../utils/dimensions';
import { AnnotationId, AxisId, GroupId } from '../../../utils/ids';
import { Scale, ScaleType } from '../../../utils/scales/scales';
import { Point } from '../store/chart_state';
import { computeXScaleOffset, getAxesSpecForSpecId, isHorizontalRotation } from '../store/utils';

export type AnnotationTooltipFormatter = (details?: string) => JSX.Element | null;

export type AnnotationTooltipState = AnnotationTooltipVisibleState | AnnotationTooltipHiddenState;
export interface AnnotationTooltipVisibleState {
  isVisible: true;
  annotationType: AnnotationType;
  header?: string;
  details?: string;
  anchor: { position?: Position; top: number; left: number };
  renderTooltip?: AnnotationTooltipFormatter;
}
export interface AnnotationTooltipHiddenState {
  isVisible: false;
}
export interface AnnotationDetails {
  headerText?: string;
  detailsText?: string;
}

export interface AnnotationMarker {
  icon: JSX.Element;
  position: { top: number; left: number };
  dimension: { width: number; height: number };
  color: string;
}

/**
 * The path points of a line annotation.
 */
export type AnnotationLinePathPoints = {
  /** x1,y1 the start point anchored to the linked axis */
  start: {
    x1: number;
    y1: number;
  };
  /** x2,y2 the end point */
  end: {
    x2: number;
    y2: number;
  };
};

export interface AnnotationLineProps {
  /** the position of the start point relative to the Chart */
  anchor: {
    position: Position;
    top: number;
    left: number;
  };
  /**
   * The path points of a line annotation
   */
  linePathPoints: AnnotationLinePathPoints;
  details: AnnotationDetails;
  marker?: AnnotationMarker;
}

export interface AnnotationRectProps {
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  details?: string;
}

// TODO: add AnnotationTextProps
export type AnnotationDimensions = AnnotationLineProps[] | AnnotationRectProps[];

export function computeYDomainLineAnnotationDimensions(
  dataValues: LineAnnotationDatum[],
  yScale: Scale,
  chartRotation: Rotation,
  axisPosition: Position,
  chartDimensions: Dimensions,
  lineColor: string,
  marker?: JSX.Element,
  markerDimension = { width: 0, height: 0 },
): AnnotationLineProps[] {
  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;
  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);

  const lineProps: AnnotationLineProps[] = [];

  dataValues.forEach((datum: LineAnnotationDatum) => {
    const { dataValue } = datum;

    // avoid rendering invalid annotation value
    if (dataValue === null || dataValue === undefined || dataValue === '') {
      return;
    }

    const annotationValueYposition = yScale.scale(dataValue);
    // avoid rendering non scalable annotation values
    if (isNaN(annotationValueYposition)) {
      return;
    }

    const [domainStart, domainEnd] = yScale.domain;
    // avoid rendering annotation with values outside the scale domain
    if (domainStart > dataValue || domainEnd < dataValue) {
      return;
    }
    const anchor = {
      position: axisPosition,
      top: 0,
      left: 0,
    };
    const markerPosition = { top: 0, left: 0 };
    const linePathPoints: AnnotationLinePathPoints = {
      start: { x1: 0, y1: 0 },
      end: { x2: 0, y2: 0 },
    };
    // the Y axis is vertical, X axis is horizontal  y|--x--|y
    if (isHorizontalChartRotation) {
      // y|__x__
      if (axisPosition === Position.Left) {
        anchor.left = 0;
        markerPosition.left = -markerDimension.width;
        linePathPoints.start.x1 = 0;
        linePathPoints.end.x2 = chartWidth;
        // __x__|y
      } else {
        anchor.left = chartWidth;
        markerPosition.left = chartWidth;
        linePathPoints.start.x1 = chartWidth;
        linePathPoints.end.x2 = 0;
      }
      // __x__
      if (chartRotation === 0) {
        anchor.top = annotationValueYposition;
        markerPosition.top = annotationValueYposition - markerDimension.height / 2;
        // ¯¯x¯¯
      } else {
        anchor.top = chartHeight - annotationValueYposition;
        markerPosition.top = chartHeight - annotationValueYposition - markerDimension.height / 2;
      }
      linePathPoints.start.y1 = annotationValueYposition;
      linePathPoints.end.y2 = annotationValueYposition;
      // the Y axis is horizontal, X axis is vertical x|--y--|x
    } else {
      // ¯¯y¯¯
      if (axisPosition === Position.Top) {
        anchor.top = 0;
        markerPosition.top = -markerDimension.height;
        linePathPoints.start.x1 = 0;
        linePathPoints.end.x2 = chartHeight;
        // __y__
      } else {
        anchor.top = chartHeight;
        markerPosition.top = chartHeight;
        linePathPoints.start.x1 = chartHeight;
        linePathPoints.end.x2 = 0;
      }
      // __y__|x
      if (chartRotation === -90) {
        anchor.left = annotationValueYposition;
        markerPosition.left = annotationValueYposition - markerDimension.width / 2;
        // x|__y__
      } else {
        anchor.left = chartWidth - annotationValueYposition;
        markerPosition.left = chartWidth - annotationValueYposition - markerDimension.width / 2;
      }
      linePathPoints.start.y1 = annotationValueYposition;
      linePathPoints.end.y2 = annotationValueYposition;
    }

    const annotationMarker: AnnotationMarker | undefined = marker
      ? {
          icon: marker,
          color: lineColor,
          dimension: markerDimension,
          position: markerPosition,
        }
      : undefined;
    const lineProp: AnnotationLineProps = {
      anchor,
      linePathPoints,
      marker: annotationMarker,
      details: {
        detailsText: datum.details,
        headerText: datum.header || dataValue.toString(),
      },
    };

    lineProps.push(lineProp);
  });

  return lineProps;
}

export function computeXDomainLineAnnotationDimensions(
  dataValues: LineAnnotationDatum[],
  xScale: Scale,
  chartRotation: Rotation,
  axisPosition: Position,
  chartDimensions: Dimensions,
  lineColor: string,
  xScaleOffset: number,
  enableHistogramMode: boolean,
  marker?: JSX.Element,
  markerDimension = { width: 0, height: 0 },
): AnnotationLineProps[] {
  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;
  const lineProps: AnnotationLineProps[] = [];
  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);

  const alignWithTick = xScale.bandwidth > 0 && !enableHistogramMode;
  dataValues.forEach((datum: LineAnnotationDatum) => {
    const { dataValue } = datum;

    const scaledXValue = scaleAndValidateDatum(dataValue, xScale, alignWithTick);

    if (scaledXValue == null) {
      return;
    }

    const offset = xScale.bandwidth / 2 - xScaleOffset;
    const annotationValueXposition = scaledXValue + offset;

    const markerPosition = { top: 0, left: 0 };
    const linePathPoints: AnnotationLinePathPoints = {
      start: { x1: 0, y1: 0 },
      end: { x2: 0, y2: 0 },
    };
    const anchor = {
      position: axisPosition,
      top: 0,
      left: 0,
    };
    // the Y axis is vertical, X axis is horizontal  y|--x--|y
    if (isHorizontalChartRotation) {
      // __x__
      if (axisPosition === Position.Bottom) {
        linePathPoints.start.y1 = chartHeight;
        linePathPoints.end.y2 = 0;
        anchor.top = chartHeight;
        markerPosition.top = chartHeight;
        // ¯¯x¯¯
      } else {
        linePathPoints.start.y1 = 0;
        linePathPoints.end.y2 = chartHeight;
        anchor.top = 0;
        markerPosition.top = 0 - markerDimension.height;
      }
      // __x__
      if (chartRotation === 0) {
        anchor.left = annotationValueXposition;
        markerPosition.left = annotationValueXposition - markerDimension.width / 2;
        // ¯¯x¯¯
      } else {
        anchor.left = chartWidth - annotationValueXposition;
        markerPosition.left = chartWidth - annotationValueXposition - markerDimension.width / 2;
      }
      linePathPoints.start.x1 = annotationValueXposition;
      linePathPoints.end.x2 = annotationValueXposition;
      // the Y axis is horizontal, X axis is vertical x|--y--|x
    } else {
      // x|--y--
      if (axisPosition === Position.Left) {
        anchor.left = 0;
        markerPosition.left = -markerDimension.width;
        linePathPoints.start.x1 = annotationValueXposition;
        linePathPoints.end.x2 = annotationValueXposition;
        // --y--|x
      } else {
        anchor.left = chartWidth;
        markerPosition.left = chartWidth;
        linePathPoints.start.x1 = annotationValueXposition;
        linePathPoints.end.x2 = annotationValueXposition;
      }
      // __y__|x
      if (chartRotation === -90) {
        anchor.top = chartHeight - annotationValueXposition;
        markerPosition.top = chartHeight - annotationValueXposition - markerDimension.height / 2;
        linePathPoints.start.y1 = 0;
        linePathPoints.end.y2 = chartWidth;
        // x|__y__
      } else {
        anchor.top = annotationValueXposition;
        markerPosition.top = annotationValueXposition - markerDimension.height / 2;
        linePathPoints.start.y1 = 0;
        linePathPoints.end.y2 = chartWidth;
      }
    }

    const annotationMarker: AnnotationMarker | undefined = marker
      ? {
          icon: marker,
          color: lineColor,
          dimension: markerDimension,
          position: markerPosition,
        }
      : undefined;
    const lineProp: AnnotationLineProps = {
      anchor,
      linePathPoints,
      details: {
        detailsText: datum.details,
        headerText: datum.header || dataValue.toString(),
      },
      marker: annotationMarker,
    };
    lineProps.push(lineProp);
  });

  return lineProps;
}

export function computeLineAnnotationDimensions(
  annotationSpec: LineAnnotationSpec,
  chartDimensions: Dimensions,
  chartRotation: Rotation,
  yScales: Map<GroupId, Scale>,
  xScale: Scale,
  axisPosition: Position,
  xScaleOffset: number,
  enableHistogramMode: boolean,
): AnnotationLineProps[] | null {
  const { domainType, dataValues, marker, markerDimensions, hideLines } = annotationSpec;

  if (hideLines) {
    return null;
  }

  // this type is guaranteed as this has been merged with default
  const lineStyle = annotationSpec.style as LineAnnotationStyle;
  const lineColor = lineStyle.line.stroke;

  if (domainType === AnnotationDomainTypes.XDomain) {
    return computeXDomainLineAnnotationDimensions(
      dataValues,
      xScale,
      chartRotation,
      axisPosition,
      chartDimensions,
      lineColor,
      xScaleOffset,
      enableHistogramMode,
      marker,
      markerDimensions,
    );
  }

  const groupId = annotationSpec.groupId;
  const yScale = yScales.get(groupId);
  if (!yScale) {
    return null;
  }

  return computeYDomainLineAnnotationDimensions(
    dataValues,
    yScale,
    chartRotation,
    axisPosition,
    chartDimensions,
    lineColor,
    marker,
    markerDimensions,
  );
}

export function scaleAndValidateDatum(dataValue: any, scale: Scale, alignWithTick: boolean): number | null {
  const isContinuous = scale.type !== ScaleType.Ordinal;
  const scaledValue = scale.scale(dataValue);
  // d3.scale will return 0 for '', rendering the line incorrectly at 0
  if (isNaN(scaledValue) || (isContinuous && dataValue === '')) {
    return null;
  }

  if (isContinuous) {
    const [domainStart, domainEnd] = scale.domain;

    // if we're not aligning the ticks, we need to extend the domain by one more tick for histograms
    const domainEndOffset = alignWithTick ? 0 : scale.minInterval;

    if (domainStart > dataValue || domainEnd + domainEndOffset < dataValue) {
      return null;
    }
  }

  return scaledValue;
}

export function computeRectAnnotationDimensions(
  annotationSpec: RectAnnotationSpec,
  yScales: Map<GroupId, Scale>,
  xScale: Scale,
  enableHistogramMode: boolean,
  barsPadding: number,
): AnnotationRectProps[] | null {
  const { dataValues } = annotationSpec;

  const groupId = annotationSpec.groupId;
  const yScale = yScales.get(groupId);
  if (!yScale) {
    return null;
  }

  const xDomain = xScale.domain;
  const yDomain = yScale.domain;
  const lastX = xDomain[xDomain.length - 1];
  const xMinInterval = xScale.minInterval;
  const rectsProps: AnnotationRectProps[] = [];

  dataValues.forEach((dataValue: RectAnnotationDatum) => {
    let { x0, x1, y0, y1 } = dataValue.coordinates;

    // if everything is null, return; otherwise we coerce the other coordinates
    if (x0 == null && x1 == null && y0 == null && y1 == null) {
      return;
    }

    if (x1 == null) {
      // if x1 is defined, we want the rect to draw to the end of the scale
      // if we're in histogram mode, extend domain end by min interval
      x1 = enableHistogramMode && !xScale.isSingleValue() ? lastX + xMinInterval : lastX;
    }

    if (x0 == null) {
      // if x0 is defined, we want the rect to draw to the start of the scale
      x0 = xDomain[0];
    }

    if (y0 == null) {
      // if y0 is defined, we want the rect to draw to the end of the scale
      y0 = yDomain[yDomain.length - 1];
    }

    if (y1 == null) {
      // if y1 is defined, we want the rect to draw to the start of the scale
      y1 = yDomain[0];
    }

    const alignWithTick = xScale.bandwidth > 0 && !enableHistogramMode;

    let x0Scaled = scaleAndValidateDatum(x0, xScale, alignWithTick);
    let x1Scaled = scaleAndValidateDatum(x1, xScale, alignWithTick);
    const y0Scaled = scaleAndValidateDatum(y0, yScale, false);
    const y1Scaled = scaleAndValidateDatum(y1, yScale, false);

    // TODO: surface this as a warning
    if (x0Scaled === null || x1Scaled === null || y0Scaled === null || y1Scaled === null) {
      return;
    }

    let xOffset = 0;
    if (xScale.bandwidth > 0) {
      const xBand = xScale.bandwidth / (1 - xScale.barsPadding);
      xOffset = enableHistogramMode ? (xBand - xScale.bandwidth) / 2 : barsPadding;
    }

    x0Scaled = x0Scaled - xOffset;
    x1Scaled = x1Scaled - xOffset;

    const minX = Math.min(x0Scaled, x1Scaled);
    const minY = Math.min(y0Scaled, y1Scaled);

    const deltaX = Math.abs(x0Scaled - x1Scaled);
    const deltaY = Math.abs(y0Scaled - y1Scaled);

    const xOrigin = minX;
    const yOrigin = minY;

    const width = deltaX;
    const height = deltaY;

    const rectDimensions = {
      x: xOrigin,
      y: yOrigin,
      width,
      height,
    };

    rectsProps.push({
      rect: rectDimensions,
      details: dataValue.details,
    });
  });

  return rectsProps;
}

export function getAnnotationAxis(
  axesSpecs: Map<AxisId, AxisSpec>,
  groupId: GroupId,
  domainType: AnnotationDomainType,
  chartRotation: Rotation,
): Position | null {
  const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, groupId);
  const isHorizontalRotated = isHorizontalRotation(chartRotation);
  const isXDomainAnnotation = isXDomain(domainType);
  const annotationAxis = isXDomainAnnotation ? xAxis : yAxis;
  const rotatedAnnotation = isHorizontalRotated ? annotationAxis : isXDomainAnnotation ? yAxis : xAxis;
  return rotatedAnnotation ? rotatedAnnotation.position : null;
}

export function computeClusterOffset(totalBarsInCluster: number, barsShift: number, bandwidth: number): number {
  if (totalBarsInCluster > 1) {
    return barsShift - bandwidth / 2;
  }

  return 0;
}

export function computeAnnotationDimensions(
  annotations: Map<AnnotationId, AnnotationSpec>,
  chartDimensions: Dimensions,
  chartRotation: Rotation,
  yScales: Map<GroupId, Scale>,
  xScale: Scale,
  axesSpecs: Map<AxisId, AxisSpec>,
  totalBarsInCluster: number,
  enableHistogramMode: boolean,
): Map<AnnotationId, AnnotationDimensions> {
  const annotationDimensions = new Map<AnnotationId, AnnotationDimensions>();

  const barsShift = (totalBarsInCluster * xScale.bandwidth) / 2;

  const band = xScale.bandwidth / (1 - xScale.barsPadding);
  const halfPadding = (band - xScale.bandwidth) / 2;
  const barsPadding = halfPadding * totalBarsInCluster;
  const clusterOffset = computeClusterOffset(totalBarsInCluster, barsShift, xScale.bandwidth);

  // Annotations should always align with the axis line in histogram mode
  const xScaleOffset = computeXScaleOffset(xScale, enableHistogramMode, HistogramModeAlignments.Start);

  annotations.forEach((annotationSpec: AnnotationSpec, annotationId: AnnotationId) => {
    if (isLineAnnotation(annotationSpec)) {
      const { groupId, domainType } = annotationSpec;
      const annotationAxisPosition = getAnnotationAxis(axesSpecs, groupId, domainType, chartRotation);

      if (!annotationAxisPosition) {
        return;
      }
      const dimensions = computeLineAnnotationDimensions(
        annotationSpec,
        chartDimensions,
        chartRotation,
        yScales,
        xScale,
        annotationAxisPosition,
        xScaleOffset - clusterOffset,
        enableHistogramMode,
      );

      if (dimensions) {
        annotationDimensions.set(annotationId, dimensions);
      }
    } else if (isRectAnnotation(annotationSpec)) {
      const dimensions = computeRectAnnotationDimensions(
        annotationSpec,
        yScales,
        xScale,
        enableHistogramMode,
        barsPadding,
      );

      if (dimensions) {
        annotationDimensions.set(annotationId, dimensions);
      }
    }
  });

  return annotationDimensions;
}

/**
 * Checks if the cursorPosition is within the line annotation marker
 * @param cursorPosition the cursor position relative to the projected area
 * @param marker the line annotation marker
 */
export function isWithinLineMarkerBounds(cursorPosition: Point, marker: AnnotationMarker): boolean {
  const { top, left } = marker.position;
  const { width, height } = marker.dimension;
  const markerRect = { startX: left, startY: top, endX: left + width, endY: top + height };
  return isWithinRectBounds(cursorPosition, markerRect);
}

export function isVerticalAnnotationLine(isXDomainAnnotation: boolean, isHorizontalChartRotation: boolean): boolean {
  if (isXDomainAnnotation) {
    return isHorizontalChartRotation;
  }

  return !isHorizontalChartRotation;
}

export function getAnnotationLineTooltipXOffset(chartRotation: Rotation, axisPosition: Position): number {
  let xOffset = 0;
  const isChartHorizontalRotation = isHorizontalRotation(chartRotation);

  if (isHorizontalAxis(axisPosition)) {
    xOffset = isChartHorizontalRotation ? 50 : 0;
  } else {
    xOffset = isChartHorizontalRotation ? (axisPosition === Position.Right ? 100 : 0) : 50;
  }

  return xOffset;
}

export function getAnnotationLineTooltipYOffset(chartRotation: Rotation, axisPosition: Position): number {
  let yOffset = 0;
  const isChartHorizontalRotation = isHorizontalRotation(chartRotation);

  if (isHorizontalAxis(axisPosition)) {
    yOffset = isChartHorizontalRotation ? (axisPosition === Position.Top ? 0 : 100) : 50;
  } else {
    yOffset = isChartHorizontalRotation ? 50 : 100;
  }

  return yOffset;
}

export function isXDomain(domainType: AnnotationDomainType): boolean {
  return domainType === AnnotationDomainTypes.XDomain;
}

export function computeLineAnnotationTooltipState(
  cursorPosition: Point,
  annotationLines: AnnotationLineProps[],
  groupId: GroupId,
  domainType: AnnotationDomainType,
  axesSpecs: Map<AxisId, AxisSpec>,
): AnnotationTooltipState {
  const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, groupId);
  const isXDomainAnnotation = isXDomain(domainType);
  const annotationAxis = isXDomainAnnotation ? xAxis : yAxis;

  if (!annotationAxis) {
    return {
      isVisible: false,
    };
  }

  const totalAnnotationLines = annotationLines.length;
  for (let i = 0; i < totalAnnotationLines; i++) {
    const line = annotationLines[i];
    const isWithinBounds = line.marker && isWithinLineMarkerBounds(cursorPosition, line.marker);

    if (isWithinBounds) {
      return {
        annotationType: AnnotationTypes.Line,
        isVisible: true,
        anchor: {
          ...line.anchor,
        },
        ...(line.details && { header: line.details.headerText }),
        ...(line.details && { details: line.details.detailsText }),
      };
    }
  }
  return {
    isVisible: false,
  };
}

export function isWithinRectBounds(
  cursorPosition: Point,
  { startX, endX, startY, endY }: { startX: number; endX: number; startY: number; endY: number },
): boolean {
  const withinXBounds = cursorPosition.x >= startX && cursorPosition.x <= endX;
  const withinYBounds = cursorPosition.y >= startY && cursorPosition.y <= endY;

  return withinXBounds && withinYBounds;
}

export function isRightRectTooltip(chartRotation: Rotation, cursorPosition: Point, chartWidth: number) {
  const xPosition = isHorizontalRotation(chartRotation) ? cursorPosition.x : cursorPosition.y;

  return chartRotation === -90 ? xPosition > chartWidth / 2 : xPosition < chartWidth / 2;
}

export function isBottomRectTooltip(chartRotation: Rotation, cursorPosition: Point, chartHeight: number) {
  const yPosition = isHorizontalRotation(chartRotation) ? cursorPosition.y : cursorPosition.x;
  return chartRotation === 180 ? yPosition > chartHeight / 2 : yPosition < chartHeight / 2;
}

export function computeRectTooltipLeft(
  chartRotation: Rotation,
  isRightTooltip: boolean,
  { startX, endX }: { startX: number; endX: number },
  cursorX: number,
  chartWidth: number,
): number {
  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);
  const horizontalLeft = isRightTooltip ? endX : startX;
  return isHorizontalChartRotation ? (chartRotation === 180 ? chartWidth - horizontalLeft : horizontalLeft) : cursorX;
}

export function computeRectTooltipTop(
  chartRotation: Rotation,
  isBottomTooltip: boolean,
  { startX, endX }: { startX: number; endX: number },
  cursorY: number,
  chartHeight: number,
): number {
  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);
  const verticalTop = isBottomTooltip ? endX : startX;

  return isHorizontalChartRotation ? cursorY : chartRotation === -90 ? chartHeight - verticalTop : verticalTop;
}

export function getRotatedCursor(
  /** the cursor position relative to the projection area */
  cursorPosition: Point,
  chartDimensions: Dimensions,
  chartRotation: Rotation,
): Point {
  const { x, y } = cursorPosition;
  const { height, width } = chartDimensions;
  switch (chartRotation) {
    case 0:
      return { x, y };
    case 90:
      return { x: y, y: width - x };
    case -90:
      return { x: height - y, y: x };
    case 180:
      return { x: width - x, y: height - y };
  }
}

export function computeRectAnnotationTooltipState(
  /** the cursor position relative to the projection area */
  cursorPosition: Point,
  annotationRects: AnnotationRectProps[],
  chartRotation: Rotation,
  chartDimensions: Dimensions,
  renderTooltip?: AnnotationTooltipFormatter,
): AnnotationTooltipState {
  const rotatedCursorPosition = getRotatedCursor(cursorPosition, chartDimensions, chartRotation);

  const totalAnnotationRect = annotationRects.length;
  for (let i = 0; i < totalAnnotationRect; i++) {
    const rectProps = annotationRects[i];
    const { rect, details } = rectProps;
    const startX = rect.x;
    const endX = startX + rect.width;

    const startY = rect.y;
    const endY = startY + rect.height;

    const isWithinBounds = isWithinRectBounds(rotatedCursorPosition, { startX, endX, startY, endY });
    if (isWithinBounds) {
      return {
        isVisible: true,
        annotationType: AnnotationTypes.Rectangle,
        anchor: {
          left: rotatedCursorPosition.x,
          top: rotatedCursorPosition.y,
        },
        ...(details && { details }),
        ...(renderTooltip && { renderTooltip }),
      };
    }
  }
  return {
    isVisible: false,
  };
}

export function computeAnnotationTooltipState(
  cursorPosition: Point,
  annotationDimensions: Map<AnnotationId, any>,
  annotationSpecs: Map<AnnotationId, AnnotationSpec>,
  chartRotation: Rotation,
  axesSpecs: Map<AxisId, AxisSpec>,
  chartDimensions: Dimensions,
): AnnotationTooltipState | null {
  for (const [annotationId, annotationDimension] of annotationDimensions) {
    const spec = annotationSpecs.get(annotationId);

    if (!spec || spec.hideTooltips) {
      continue;
    }

    const groupId = spec.groupId;

    if (isLineAnnotation(spec)) {
      if (spec.hideLines) {
        continue;
      }
      const lineAnnotationTooltipState = computeLineAnnotationTooltipState(
        cursorPosition,
        annotationDimension,
        groupId,
        spec.domainType,
        axesSpecs,
      );

      if (lineAnnotationTooltipState.isVisible) {
        return lineAnnotationTooltipState;
      }
    } else if (isRectAnnotation(spec)) {
      const rectAnnotationTooltipState = computeRectAnnotationTooltipState(
        cursorPosition,
        annotationDimension,
        chartRotation,
        chartDimensions,
        spec.renderTooltip,
      );

      if (rectAnnotationTooltipState.isVisible) {
        return rectAnnotationTooltipState;
      }
    }
  }

  return null;
}
