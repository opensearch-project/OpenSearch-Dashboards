import {
  AnnotationDomainType,
  AnnotationDomainTypes,
  AnnotationTypes,
  LineAnnotationSpec,
  LineAnnotationDatum,
  AxisSpec,
} from '../utils/specs';
import { Position, Rotation } from '../../../utils/commons';
import {
  AnnotationTooltipState,
  AnnotationDetails,
  AnnotationMarker,
  scaleAndValidateDatum,
  isXDomain,
  Bounds,
} from './annotation_utils';
import { isHorizontalRotation, getAxesSpecForSpecId } from '../state/utils';
import { isHorizontalAxis } from '../utils/axis_utils';
import { Dimensions } from '../../../utils/dimensions';
import { Scale } from '../../../scales';
import { GroupId } from '../../../utils/ids';
import { LineAnnotationStyle } from '../../../utils/themes/theme';
import { Point } from '../../../utils/point';
import { isWithinRectBounds } from './rect_annotation_tooltip';

export type AnnotationLinePosition = [number, number, number, number];

/** Start and end points of a line annotation  */
export interface AnnotationLinePathPoints {
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
}

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

export const DEFAULT_LINE_OVERFLOW = 0;

function computeYDomainLineAnnotationDimensions(
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

function computeXDomainLineAnnotationDimensions(
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

export function getAnnotationLineTooltipXOffset(chartRotation: Rotation, axisPosition: Position): number {
  let xOffset = 0;
  const isChartHorizontalRotation = isHorizontalRotation(chartRotation);

  if (isHorizontalAxis(axisPosition)) {
    xOffset = isChartHorizontalRotation ? 50 : 0;
  } else {
    if (isChartHorizontalRotation) {
      xOffset = axisPosition === Position.Right ? 100 : 0;
    } else {
      xOffset = 50;
    }
  }

  return xOffset;
}

export function getAnnotationLineTooltipYOffset(chartRotation: Rotation, axisPosition: Position): number {
  let yOffset = 0;
  const isChartHorizontalRotation = isHorizontalRotation(chartRotation);

  if (isHorizontalAxis(axisPosition)) {
    if (isChartHorizontalRotation) {
      yOffset = axisPosition === Position.Top ? 0 : 100;
    } else {
      yOffset = 50;
    }
  } else {
    yOffset = isChartHorizontalRotation ? 50 : 100;
  }

  return yOffset;
}

export function isVerticalAnnotationLine(isXDomainAnnotation: boolean, isHorizontalChartRotation: boolean): boolean {
  if (isXDomainAnnotation) {
    return isHorizontalChartRotation;
  }

  return !isHorizontalChartRotation;
}

/**
 * Checks if the cursorPosition is within the line annotation marker
 * @param cursorPosition the cursor position relative to the projected area
 * @param marker the line annotation marker
 */
function isWithinLineMarkerBounds(cursorPosition: Point, marker: AnnotationMarker): boolean {
  const { top, left } = marker.position;
  const { width, height } = marker.dimension;
  const markerRect: Bounds = { startX: left, startY: top, endX: left + width, endY: top + height };
  return isWithinRectBounds(cursorPosition, markerRect);
}

export function computeLineAnnotationTooltipState(
  cursorPosition: Point,
  annotationLines: AnnotationLineProps[],
  groupId: GroupId,
  domainType: AnnotationDomainType,
  axesSpecs: AxisSpec[],
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
