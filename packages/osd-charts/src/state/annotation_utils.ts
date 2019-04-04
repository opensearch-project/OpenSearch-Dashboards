import { isHorizontal } from '../lib/axes/axis_utils';
import {
  AnnotationDatum,
  AnnotationDomainType,
  AnnotationDomainTypes,
  AnnotationSpec,
  AnnotationTypes,
  AxisSpec,
  Position,
  Rotation,
} from '../lib/series/specs';
import { AnnotationLineStyle } from '../lib/themes/theme';
import { Dimensions } from '../lib/utils/dimensions';
import { AnnotationId, AxisId, GroupId } from '../lib/utils/ids';
import { Scale, ScaleType } from '../lib/utils/scales/scales';
import { Point } from './chart_state';
import { getAxesSpecForSpecId, isHorizontalRotation } from './utils';

export interface AnnotationTooltipState {
  isVisible: boolean;
  header?: string;
  details?: string;
  transform: string;
}
export interface AnnotationDetails {
  headerText?: string;
  detailsText?: string;
}

export interface AnnotationMarker {
  icon: JSX.Element;
  transform: string;
  dimensions: { width: number; height: number; };
  color: string;
}

export type AnnotationLinePosition = [number, number, number, number];

export interface AnnotationLineProps {
  position: AnnotationLinePosition;
  tooltipLinePosition: AnnotationLinePosition;
  details: AnnotationDetails;
  marker?: AnnotationMarker;
}

interface TransformPosition {
  xPosition: number;
  yPosition: number;
  xOffset: number;
  yOffset: number;
}

// TODO: add AnnotationRectangleProps or AnnotationTextProps
export type AnnotationDimensions = AnnotationLineProps[];

export const DEFAULT_LINE_OVERFLOW = 0;

export function computeYDomainLineAnnotationDimensions(
  dataValues: AnnotationDatum[],
  yScale: Scale,
  chartRotation: Rotation,
  lineOverflow: number,
  axisPosition: Position,
  chartDimensions: Dimensions,
  lineColor: string,
  marker?: JSX.Element,
  markerDimensions?: { width: number; height: number; },
): AnnotationLineProps[] {
  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;
  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);
  const markerOffsets = markerDimensions || { width: 0, height: 0 };
  const lineProps: AnnotationLineProps[] = [];

  dataValues.forEach((datum: AnnotationDatum) => {
    const { dataValue } = datum;
    const details = {
      detailsText: datum.details,
      headerText: datum.header || dataValue.toString(),
    };

    // d3.scale will return 0 for '', rendering the line incorrectly at 0
    if (dataValue === '') {
      return;
    }

    const scaledYValue = yScale.scale(dataValue);
    if (isNaN(scaledYValue)) {
      return;
    }

    const [domainStart, domainEnd] = yScale.domain;
    if (domainStart > dataValue || domainEnd < dataValue) {
      return;
    }

    const yDomainPosition = scaledYValue;

    const leftHorizontalAxis: AnnotationLinePosition =
      [0 - lineOverflow, yDomainPosition, chartWidth, yDomainPosition];
    const rightHorizontaAxis: AnnotationLinePosition =
      [0, yDomainPosition, chartWidth + lineOverflow, yDomainPosition];

    // Without overflow applied
    const baseLinePosition: AnnotationLinePosition = isHorizontalChartRotation ?
      [0, yDomainPosition, chartWidth, yDomainPosition]
      : [yDomainPosition, 0, yDomainPosition, chartHeight];

    const linePosition: AnnotationLinePosition = isHorizontalChartRotation ?
      (axisPosition === Position.Left) ? leftHorizontalAxis : rightHorizontaAxis
      : [yDomainPosition, 0, yDomainPosition, chartHeight + lineOverflow];

    const markerPosition = [...linePosition] as AnnotationLinePosition;

    if (isHorizontalChartRotation) {
      if (axisPosition === Position.Left) {
        markerPosition[0] -= markerOffsets.width;
      } else {
        markerPosition[2] += markerOffsets.width;
      }
    } else {
      markerPosition[3] += markerOffsets.height;
    }

    const markerTransform = getAnnotationLineTooltipTransform(chartRotation, markerPosition, axisPosition);
    const annotationMarker = marker ?
      { icon: marker, transform: markerTransform, color: lineColor, dimensions: markerOffsets }
      : undefined;
    const lineProp = {
      position: linePosition,
      details,
      marker: annotationMarker,
      tooltipLinePosition: baseLinePosition,
    };

    lineProps.push(lineProp);
  });

  return lineProps;
}

export function computeXDomainLineAnnotationDimensions(
  dataValues: AnnotationDatum[],
  xScale: Scale,
  chartRotation: Rotation,
  lineOverflow: number,
  axisPosition: Position,
  chartDimensions: Dimensions,
  lineColor: string,
  marker?: JSX.Element,
  markerDimensions?: { width: number; height: number; },
): AnnotationLineProps[] {
  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;
  const markerOffsets = markerDimensions || { width: 0, height: 0 };
  const lineProps: AnnotationLineProps[] = [];

  dataValues.forEach((datum: AnnotationDatum) => {
    const { dataValue } = datum;
    const details = {
      detailsText: datum.details,
      headerText: datum.header || dataValue.toString(),
    };

    // TODO: make offset dependent on annotationSpec.alignment (left, center, right)
    const offset = xScale.bandwidth / 2;
    const isContinuous = xScale.type !== ScaleType.Ordinal;

    const scaledXValue = xScale.scale(dataValue);

    // d3.scale will return 0 for '', rendering the line incorrectly at 0
    if (isNaN(scaledXValue) || (isContinuous && dataValue === '')) {
      return;
    }

    if (isContinuous) {
      const [domainStart, domainEnd] = xScale.domain;

      if (domainStart > dataValue || domainEnd < dataValue) {
        return;
      }
    }

    const xDomainPosition = scaledXValue + offset;

    let linePosition: AnnotationLinePosition = [0, 0, 0, 0];
    let tooltipLinePosition: AnnotationLinePosition = [0, 0, 0, 0];
    let markerPosition: AnnotationLinePosition = [0, 0, 0, 0];

    switch (chartRotation) {
      case 0: {
        const startY = (axisPosition === Position.Bottom) ? 0 : -lineOverflow;
        const endY = (axisPosition === Position.Bottom) ? chartHeight + lineOverflow : chartHeight;
        linePosition = [xDomainPosition, startY, xDomainPosition, endY];
        tooltipLinePosition = [xDomainPosition, 0, xDomainPosition, chartHeight];

        const startMarkerY = (axisPosition === Position.Bottom) ? 0 : -lineOverflow - markerOffsets.height;
        const endMarkerY = (axisPosition === Position.Bottom) ?
          chartHeight + lineOverflow + markerOffsets.height : chartHeight;
        markerPosition = [xDomainPosition, startMarkerY, xDomainPosition, endMarkerY];
        break;
      }
      case 90: {
        linePosition = [-lineOverflow, xDomainPosition, chartWidth, xDomainPosition];
        tooltipLinePosition = [0, xDomainPosition, chartWidth, xDomainPosition];

        const markerStartX = linePosition[0] - markerOffsets.width;
        markerPosition = [markerStartX, xDomainPosition, chartWidth, xDomainPosition];
        break;
      }
      case -90: {
        linePosition = [-lineOverflow, chartHeight - xDomainPosition, chartWidth, chartHeight - xDomainPosition];
        tooltipLinePosition = [0, chartHeight - xDomainPosition, chartWidth, chartHeight - xDomainPosition];

        const markerStartX = linePosition[0] - markerOffsets.width;
        markerPosition = [markerStartX, chartHeight - xDomainPosition, chartWidth, chartHeight - xDomainPosition];
        break;
      }
      case 180: {
        const startY = (axisPosition === Position.Bottom) ? 0 : -lineOverflow;
        const endY = (axisPosition === Position.Bottom) ? chartHeight + lineOverflow : chartHeight;
        linePosition = [chartWidth - xDomainPosition, startY, chartWidth - xDomainPosition, endY];
        tooltipLinePosition = [chartWidth - xDomainPosition, 0, chartWidth - xDomainPosition, chartHeight];

        const startMarkerY = (axisPosition === Position.Bottom) ? 0 : -lineOverflow - markerOffsets.height;
        const endMarkerY = (axisPosition === Position.Bottom) ?
          chartHeight + lineOverflow + markerOffsets.height : chartHeight;
        markerPosition = [chartWidth - xDomainPosition, startMarkerY, chartWidth - xDomainPosition, endMarkerY];
        break;
      }
    }

    const markerTransform = getAnnotationLineTooltipTransform(chartRotation, markerPosition, axisPosition);
    const annotationMarker = marker ?
      { icon: marker, transform: markerTransform, color: lineColor, dimensions: markerOffsets }
      : undefined;
    const lineProp = { position: linePosition, details, marker: annotationMarker, tooltipLinePosition };
    lineProps.push(lineProp);
  });

  return lineProps;
}

export function computeLineAnnotationDimensions(
  annotationSpec: AnnotationSpec,
  chartDimensions: Dimensions,
  chartRotation: Rotation,
  yScales: Map<GroupId, Scale>,
  xScale: Scale,
  axisPosition: Position,
): AnnotationLineProps[] | null {
  const { domainType, dataValues, marker, markerDimensions } = annotationSpec;

  // TODO : make line overflow configurable via prop
  const lineOverflow = DEFAULT_LINE_OVERFLOW;

  // this type is guaranteed as this has been merged with default
  const lineStyle = annotationSpec.style as AnnotationLineStyle;
  const lineColor = lineStyle.line.stroke;

  if (domainType === AnnotationDomainTypes.XDomain) {
    return computeXDomainLineAnnotationDimensions(
      dataValues,
      xScale,
      chartRotation,
      lineOverflow,
      axisPosition,
      chartDimensions,
      lineColor,
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
    lineOverflow,
    axisPosition,
    chartDimensions,
    lineColor,
    marker,
    markerDimensions,
  );
}

export function getAnnotationAxis(
  axesSpecs: Map<AxisId, AxisSpec>,
  groupId: GroupId,
  domainType: AnnotationDomainType,
): Position | null {
  const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, groupId);

  const isXDomainAnnotation = isXDomain(domainType);
  const annotationAxis = isXDomainAnnotation ? xAxis : yAxis;

  return annotationAxis ? annotationAxis.position : null;
}

export function computeAnnotationDimensions(
  annotations: Map<AnnotationId, AnnotationSpec>,
  chartDimensions: Dimensions,
  chartRotation: Rotation,
  yScales: Map<GroupId, Scale>,
  xScale: Scale,
  axesSpecs: Map<AxisId, AxisSpec>,
): Map<AnnotationId, AnnotationDimensions> {
  const annotationDimensions = new Map<AnnotationId, AnnotationDimensions>();

  annotations.forEach((annotationSpec: AnnotationSpec, annotationId: AnnotationId) => {
    switch (annotationSpec.annotationType) {
      case AnnotationTypes.Line:
        const { groupId, domainType } = annotationSpec;
        const annotationAxisPosition = getAnnotationAxis(axesSpecs, groupId, domainType);

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
        );

        if (dimensions) {
          annotationDimensions.set(annotationId, dimensions);
        }
        break;
    }
  });

  return annotationDimensions;
}

export function isWithinLineBounds(
  axisPosition: Position,
  linePosition: AnnotationLinePosition,
  cursorPosition: Point,
  offset: number,
  chartRotation: Rotation,
  domainType: AnnotationDomainType,
  marker?: AnnotationMarker,
): boolean {
  const [startX, startY, endX, endY] = linePosition;
  const isXDomainAnnotation = isXDomain(domainType);

  let isCursorWithinXBounds = false;
  let isCursorWithinYBounds = false;

  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);

  if (isXDomainAnnotation) {
    isCursorWithinXBounds = isHorizontalChartRotation ?
      cursorPosition.x >= startX - offset && cursorPosition.x <= endX + offset
      : cursorPosition.x >= startX && cursorPosition.x <= endX;
    isCursorWithinYBounds = isHorizontalChartRotation ?
      cursorPosition.y >= startY && cursorPosition.y <= endY
      : cursorPosition.y >= startY - offset && cursorPosition.y <= endY + offset;
  } else {
    isCursorWithinXBounds = isHorizontalChartRotation ?
      cursorPosition.x >= startX && cursorPosition.x <= endX
      : cursorPosition.x >= startX - offset && cursorPosition.x <= endX + offset;
    isCursorWithinYBounds = isHorizontalChartRotation ?
      cursorPosition.y >= startY - offset && cursorPosition.y <= endY + offset
      : cursorPosition.y >= startY && cursorPosition.y <= endY;
  }

  // If it's within cursor bounds, return true (no need to check marker bounds)
  if (isCursorWithinXBounds && isCursorWithinYBounds) {
    return true;
  }

  if (!marker) {
    return false;
  }

  // Check if cursor within marker bounds
  let isCursorWithinMarkerXBounds = false;
  let isCursorWithinMarkerYBounds = false;

  const markerWidth = marker.dimensions.width;
  const markerHeight = marker.dimensions.height;

  if (isXDomainAnnotation) {
    const bottomAxisYBounds =
      cursorPosition.y <= endY + markerHeight && cursorPosition.y >= endY;

    const topAxisYBounds =
      cursorPosition.y >= startY - markerHeight && cursorPosition.y <= startY;

    isCursorWithinMarkerXBounds = isHorizontalChartRotation ?
      cursorPosition.x <= endX + offset + markerWidth / 2 && cursorPosition.x >= startX - offset - markerWidth / 2
      : cursorPosition.x >= startX - markerWidth && cursorPosition.x <= startX;
    isCursorWithinMarkerYBounds = isHorizontalChartRotation ?
      (axisPosition === Position.Top ? topAxisYBounds : bottomAxisYBounds)
      : cursorPosition.y >= startY - offset - markerHeight / 2 && cursorPosition.y <= endY + offset + markerHeight / 2;
  } else {
    const leftAxisXBounds =
      cursorPosition.x >= startX - markerWidth && cursorPosition.x <= startX;

    const rightAxisXBounds =
      cursorPosition.x <= endX + markerWidth && cursorPosition.x >= endX;

    isCursorWithinMarkerXBounds = isHorizontalChartRotation ?
      (axisPosition === Position.Right ? rightAxisXBounds : leftAxisXBounds)
      : cursorPosition.x <= endX + offset + markerWidth / 2 && cursorPosition.x >= startX - offset - markerWidth / 2;
    isCursorWithinMarkerYBounds = isHorizontalChartRotation ?
      cursorPosition.y >= startY - offset - markerHeight / 2 && cursorPosition.y <= endY + offset + markerHeight / 2
      : cursorPosition.y <= endY + markerHeight && cursorPosition.y >= endY;
  }

  return isCursorWithinMarkerXBounds && isCursorWithinMarkerYBounds;
}

export function isVerticalAnnotationLine(
  isXDomainAnnotation: boolean,
  isHorizontalChartRotation: boolean,
): boolean {
  if (isXDomainAnnotation) {
    return isHorizontalChartRotation;
  }

  return !isHorizontalChartRotation;
}

export function getAnnotationLineTooltipXOffset(
  chartRotation: Rotation,
  axisPosition: Position,
): number {
  let xOffset = 0;

  const isHorizontalAxis = isHorizontal(axisPosition);
  const isChartHorizontalRotation = isHorizontalRotation(chartRotation);

  if (isHorizontalAxis) {
    xOffset = isChartHorizontalRotation ? 50 : 0;
  } else {
    xOffset = isChartHorizontalRotation ? (axisPosition === Position.Right ? 100 : 0) : 50;
  }

  return xOffset;
}

export function getAnnotationLineTooltipYOffset(
  chartRotation: Rotation,
  axisPosition: Position,
): number {
  let yOffset = 0;

  const isHorizontalAxis = isHorizontal(axisPosition);
  const isChartHorizontalRotation = isHorizontalRotation(chartRotation);

  if (isHorizontalAxis) {
    yOffset = isChartHorizontalRotation ? (axisPosition === Position.Top ? 0 : 100) : 50;
  } else {
    yOffset = isChartHorizontalRotation ? 50 : 100;
  }

  return yOffset;
}

export function getAnnotationLineTooltipPosition(
  chartRotation: Rotation,
  linePosition: AnnotationLinePosition,
  axisPosition: Position,
): TransformPosition {
  const [startX, startY, endX, endY] = linePosition;

  const xPosition = (axisPosition === Position.Right) ? endX : startX;
  const yPosition = (axisPosition === Position.Top) ? startY : endY;

  const xOffset = getAnnotationLineTooltipXOffset(chartRotation, axisPosition);
  const yOffset = getAnnotationLineTooltipYOffset(chartRotation, axisPosition);

  return { xPosition, yPosition, xOffset, yOffset };
}

export function toTransformString(position: TransformPosition): string {
  const { xPosition, yPosition, xOffset, yOffset } = position;

  const xTranslation = `calc(${xPosition}px - ${xOffset}%)`;
  const yTranslation = `calc(${yPosition}px - ${yOffset}%)`;

  return `translate(${xTranslation},${yTranslation})`;
}

export function getAnnotationLineTooltipTransform(
  chartRotation: Rotation,
  linePosition: AnnotationLinePosition,
  axisPosition: Position,
): string {
  const position = getAnnotationLineTooltipPosition(
    chartRotation,
    linePosition,
    axisPosition,
  );

  return toTransformString(position);
}

export function isXDomain(domainType: AnnotationDomainType): boolean {
  return domainType === AnnotationDomainTypes.XDomain;
}

export function computeLineAnnotationTooltipState(
  cursorPosition: Point,
  annotationLines: AnnotationLineProps[],
  groupId: GroupId,
  domainType: AnnotationDomainType,
  style: AnnotationLineStyle,
  chartRotation: Rotation,
  axesSpecs: Map<AxisId, AxisSpec>,
): AnnotationTooltipState {

  const annotationTooltipState: AnnotationTooltipState = {
    isVisible: false,
    transform: '',
  };

  const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, groupId);
  const isXDomainAnnotation = isXDomain(domainType);
  const annotationAxis = isXDomainAnnotation ? xAxis : yAxis;

  if (!annotationAxis) {
    return annotationTooltipState;
  }

  const axisPosition = annotationAxis.position;

  annotationLines.forEach((line: AnnotationLineProps) => {
    const lineOffset = style.line.strokeWidth / 2;
    const isWithinBounds = isWithinLineBounds(
      axisPosition,
      line.position,
      cursorPosition,
      lineOffset,
      chartRotation,
      domainType,
      line.marker,
    );

    if (isWithinBounds) {
      annotationTooltipState.isVisible = true;

      // Position tooltip based on axis position & lineOffset amount
      annotationTooltipState.transform = getAnnotationLineTooltipTransform(
        chartRotation,
        line.tooltipLinePosition,
        axisPosition,
      );

      if (line.details) {
        annotationTooltipState.header = line.details.headerText;
        annotationTooltipState.details = line.details.detailsText;
      }
    }
  });

  return annotationTooltipState;
}

export function computeAnnotationTooltipState(
  cursorPosition: Point,
  annotationDimensions: Map<AnnotationId, any>,
  annotationSpecs: Map<AnnotationId, AnnotationSpec>,
  chartRotation: Rotation,
  axesSpecs: Map<AxisId, AxisSpec>,
): AnnotationTooltipState | null {
  for (const [annotationId, annotationDimension] of annotationDimensions) {
    const spec = annotationSpecs.get(annotationId);
    if (!spec) {
      continue;
    }

    const { annotationType } = spec;
    switch (annotationType) {
      case AnnotationTypes.Line: {
        const groupId = spec.groupId;
        const lineAnnotationTooltipState = computeLineAnnotationTooltipState(
          cursorPosition,
          annotationDimension,
          groupId,
          spec.domainType,
          spec.style as AnnotationLineStyle, // this type is guaranteed as this has been merged with default
          chartRotation,
          axesSpecs,
        );

        if (lineAnnotationTooltipState.isVisible) {
          return lineAnnotationTooltipState;
        }
      }
    }
  }

  return null;
}
