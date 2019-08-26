import { isHorizontal } from '../utils/axis_utils';
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
import { LineAnnotationStyle } from '../../../utils/themes/theme';
import { Dimensions } from '../../../utils/dimensions';
import { AnnotationId, AxisId, GroupId } from '../../../utils/ids';
import { Scale, ScaleType } from '../../../utils/scales/scales';
import { Point } from '../store/chart_state';
import { computeXScaleOffset, getAxesSpecForSpecId, isHorizontalRotation } from '../store/utils';

export type AnnotationTooltipFormatter = (details?: string) => JSX.Element | null;
export interface AnnotationTooltipState {
  annotationType: AnnotationType;
  isVisible: boolean;
  header?: string;
  details?: string;
  transform: string;
  top?: number;
  left?: number;
  renderTooltip?: AnnotationTooltipFormatter;
}
export interface AnnotationDetails {
  headerText?: string;
  detailsText?: string;
}

export interface AnnotationMarker {
  icon: JSX.Element;
  transform: string;
  dimensions: { width: number; height: number };
  color: string;
}

export type AnnotationLinePosition = [number, number, number, number];

export interface AnnotationLineProps {
  position: AnnotationLinePosition;
  tooltipLinePosition: AnnotationLinePosition;
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

interface TransformPosition {
  xPosition: number;
  yPosition: number;
  xOffset: number;
  yOffset: number;
}

// TODO: add AnnotationTextProps
export type AnnotationDimensions = AnnotationLineProps[] | AnnotationRectProps[];

export const DEFAULT_LINE_OVERFLOW = 0;

export function computeYDomainLineAnnotationDimensions(
  dataValues: LineAnnotationDatum[],
  yScale: Scale,
  chartRotation: Rotation,
  lineOverflow: number,
  axisPosition: Position,
  chartDimensions: Dimensions,
  lineColor: string,
  marker?: JSX.Element,
  markerDimensions?: { width: number; height: number },
): AnnotationLineProps[] {
  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;
  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);
  const markerOffsets = markerDimensions || { width: 0, height: 0 };
  const lineProps: AnnotationLineProps[] = [];

  dataValues.forEach((datum: LineAnnotationDatum) => {
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

    const leftHorizontalAxis: AnnotationLinePosition = [0 - lineOverflow, yDomainPosition, chartWidth, yDomainPosition];
    const rightHorizontaAxis: AnnotationLinePosition = [0, yDomainPosition, chartWidth + lineOverflow, yDomainPosition];

    // Without overflow applied
    const baseLinePosition: AnnotationLinePosition = isHorizontalChartRotation
      ? [0, yDomainPosition, chartWidth, yDomainPosition]
      : [yDomainPosition, 0, yDomainPosition, chartHeight];

    const linePosition: AnnotationLinePosition = isHorizontalChartRotation
      ? axisPosition === Position.Left
        ? leftHorizontalAxis
        : rightHorizontaAxis
      : [0, yDomainPosition, chartHeight + lineOverflow, yDomainPosition];

    const markerPosition: AnnotationLinePosition = isHorizontalChartRotation
      ? ([...linePosition] as AnnotationLinePosition)
      : [yDomainPosition, 0, yDomainPosition, chartHeight + lineOverflow];

    if (isHorizontalChartRotation) {
      if (axisPosition === Position.Left) {
        markerPosition[0] -= markerOffsets.width;
      } else {
        markerPosition[2] += markerOffsets.width;
      }
      if (chartRotation === 180) {
        markerPosition[1] = chartHeight - markerPosition[1];
        markerPosition[3] = chartHeight - markerPosition[3];
      }
    } else {
      markerPosition[3] += markerOffsets.height;
      if (chartRotation === 90) {
        markerPosition[0] = chartWidth - markerPosition[0];
        markerPosition[2] = chartWidth - markerPosition[2];
      }
    }

    const markerTransform = getAnnotationLineTooltipTransform(chartRotation, markerPosition, axisPosition);
    const annotationMarker = marker
      ? { icon: marker, transform: markerTransform, color: lineColor, dimensions: markerOffsets }
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
  dataValues: LineAnnotationDatum[],
  xScale: Scale,
  chartRotation: Rotation,
  lineOverflow: number,
  axisPosition: Position,
  chartDimensions: Dimensions,
  lineColor: string,
  xScaleOffset: number,
  enableHistogramMode: boolean,
  marker?: JSX.Element,
  markerDimensions?: { width: number; height: number },
): AnnotationLineProps[] {
  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;
  const markerOffsets = markerDimensions || { width: 0, height: 0 };
  const lineProps: AnnotationLineProps[] = [];

  const alignWithTick = xScale.bandwidth > 0 && !enableHistogramMode;
  dataValues.forEach((datum: LineAnnotationDatum) => {
    const { dataValue } = datum;
    const details = {
      detailsText: datum.details,
      headerText: datum.header || dataValue.toString(),
    };

    const offset = xScale.bandwidth / 2 - xScaleOffset;

    const scaledXValue = scaleAndValidateDatum(dataValue, xScale, alignWithTick);

    if (scaledXValue == null) {
      return;
    }

    const xDomainPosition = scaledXValue + offset;

    let linePosition: AnnotationLinePosition = [0, 0, 0, 0];
    let tooltipLinePosition: AnnotationLinePosition = [0, 0, 0, 0];
    let markerPosition: AnnotationLinePosition = [0, 0, 0, 0];

    switch (chartRotation) {
      case 0: {
        const startY = axisPosition === Position.Bottom ? 0 : -lineOverflow;
        const endY = axisPosition === Position.Bottom ? chartHeight + lineOverflow : chartHeight;
        linePosition = [xDomainPosition, startY, xDomainPosition, endY];
        tooltipLinePosition = [xDomainPosition, 0, xDomainPosition, chartHeight];

        const startMarkerY = axisPosition === Position.Bottom ? 0 : -lineOverflow - markerOffsets.height;
        const endMarkerY =
          axisPosition === Position.Bottom ? chartHeight + lineOverflow + markerOffsets.height : chartHeight;
        markerPosition = [xDomainPosition, startMarkerY, xDomainPosition, endMarkerY];
        break;
      }
      case 90: {
        linePosition = [xDomainPosition, -lineOverflow, xDomainPosition, chartWidth];
        tooltipLinePosition = [0, xDomainPosition, chartWidth, xDomainPosition];

        const markerStartX = -lineOverflow - markerOffsets.width;
        markerPosition = [markerStartX, xDomainPosition, chartWidth, xDomainPosition];
        break;
      }
      case -90: {
        linePosition = [xDomainPosition, -lineOverflow, xDomainPosition, chartWidth];
        tooltipLinePosition = [0, chartHeight - xDomainPosition, chartWidth, chartHeight - xDomainPosition];

        const markerStartX = -lineOverflow - markerOffsets.width;
        markerPosition = [markerStartX, chartHeight - xDomainPosition, chartWidth, chartHeight - xDomainPosition];
        break;
      }
      case 180: {
        const startY = axisPosition === Position.Bottom ? 0 : -lineOverflow;
        const endY = axisPosition === Position.Bottom ? chartHeight + lineOverflow : chartHeight;
        linePosition = [xDomainPosition, startY, xDomainPosition, endY];
        tooltipLinePosition = [xDomainPosition, 0, xDomainPosition, chartHeight];

        const startMarkerY = axisPosition === Position.Bottom ? 0 : -lineOverflow - markerOffsets.height;
        const endMarkerY =
          axisPosition === Position.Bottom ? chartHeight + lineOverflow + markerOffsets.height : chartHeight;
        markerPosition = [chartWidth - xDomainPosition, startMarkerY, chartWidth - xDomainPosition, endMarkerY];
        break;
      }
    }

    const markerTransform = getAnnotationLineTooltipTransform(chartRotation, markerPosition, axisPosition);
    const annotationMarker = marker
      ? { icon: marker, transform: markerTransform, color: lineColor, dimensions: markerOffsets }
      : undefined;
    const lineProp = { position: linePosition, details, marker: annotationMarker, tooltipLinePosition };
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

  // TODO : make line overflow configurable via prop
  const lineOverflow = DEFAULT_LINE_OVERFLOW;

  // this type is guaranteed as this has been merged with default
  const lineStyle = annotationSpec.style as LineAnnotationStyle;
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
    lineOverflow,
    axisPosition,
    chartDimensions,
    lineColor,
    marker,
    markerDimensions,
  );
}

export function scaleAndValidateDatum(dataValue: any, scale: Scale, alignWithTick: boolean): any | null {
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

    if (x0 == null) {
      // if x1 is defined, we want the rect to draw to the end of the scale
      // if we're in histogram mode, extend domain end by min interval
      x0 = enableHistogramMode ? lastX + xMinInterval : lastX;
    }

    if (x1 == null) {
      // if x0 is defined, we want the rect to draw to the start of the scale
      x1 = xDomain[0];
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
    if ([x0Scaled, x1Scaled, y0Scaled, y1Scaled].includes(null)) {
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
): Position | null {
  const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, groupId);

  const isXDomainAnnotation = isXDomain(domainType);
  const annotationAxis = isXDomainAnnotation ? xAxis : yAxis;

  return annotationAxis ? annotationAxis.position : null;
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

export function isWithinLineBounds(
  axisPosition: Position,
  linePosition: AnnotationLinePosition,
  rawCursorPosition: Point,
  offset: number,
  chartRotation: Rotation,
  chartDimensions: Dimensions,
  domainType: AnnotationDomainType,
  marker?: AnnotationMarker,
  hideLinesTooltips?: boolean,
): boolean {
  const [startX, startY, endX, endY] = linePosition;
  const isXDomainAnnotation = isXDomain(domainType);
  const cursorPosition = getRotatedCursor(rawCursorPosition, chartDimensions, chartRotation);

  let isCursorWithinXBounds = false;
  let isCursorWithinYBounds = false;

  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);
  const chartWidth = chartDimensions.width;
  const chartHeight = chartDimensions.height;
  if (!hideLinesTooltips) {
    if (isXDomainAnnotation) {
      isCursorWithinXBounds = isHorizontalChartRotation
        ? cursorPosition.x >= startX - offset && cursorPosition.x <= endX + offset
        : cursorPosition.x >= chartHeight - startX - offset && cursorPosition.x <= chartHeight - endX + offset;
      isCursorWithinYBounds = isHorizontalChartRotation
        ? cursorPosition.y >= startY && cursorPosition.y <= endY
        : cursorPosition.y >= startY - offset && cursorPosition.y <= endY + offset;
    } else {
      isCursorWithinXBounds = isHorizontalChartRotation
        ? cursorPosition.x >= startX && cursorPosition.x <= endX
        : cursorPosition.x >= startX - offset && cursorPosition.x <= endX + offset;
      isCursorWithinYBounds = isHorizontalChartRotation
        ? cursorPosition.y >= startY - offset && cursorPosition.y <= endY + offset
        : cursorPosition.y >= chartWidth - startY - offset && cursorPosition.y <= chartWidth - endY + offset;
    }
    // If it's within cursor bounds, return true (no need to check marker bounds)
    if (isCursorWithinXBounds && isCursorWithinYBounds) {
      return true;
    }
  }

  if (!marker) {
    return false;
  }

  // Check if cursor within marker bounds
  let isCursorWithinMarkerXBounds = false;
  let isCursorWithinMarkerYBounds = false;

  const markerWidth = marker.dimensions.width;
  const markerHeight = marker.dimensions.height;
  const markerWidthOffset = offset + markerWidth / 2;
  const markerHeightOffset = offset + markerHeight / 2;

  if (isXDomainAnnotation) {
    const bottomAxisYBounds =
      chartRotation === 0
        ? cursorPosition.y <= endY + markerHeight && cursorPosition.y >= endY
        : cursorPosition.y >= startY - markerHeight && cursorPosition.y <= startY;
    const topAxisYBounds =
      chartRotation === 0
        ? cursorPosition.y >= startY - markerHeight && cursorPosition.y <= startY
        : cursorPosition.y <= endY + markerHeight && cursorPosition.y >= endY;

    isCursorWithinMarkerXBounds = isHorizontalChartRotation
      ? cursorPosition.x <= endX + markerWidthOffset && cursorPosition.x >= startX - markerWidthOffset
      : cursorPosition.x >= startX - markerWidthOffset && cursorPosition.x <= startX + markerWidthOffset;
    isCursorWithinMarkerYBounds = isHorizontalChartRotation
      ? axisPosition === Position.Top
        ? topAxisYBounds
        : bottomAxisYBounds
      : cursorPosition.y >= startY - markerHeightOffset && cursorPosition.y <= endY + markerHeightOffset;
  } else {
    const leftAxisXBounds =
      chartRotation === 0
        ? cursorPosition.x >= startX - markerWidth && cursorPosition.x <= startX
        : cursorPosition.x <= endX + markerWidth && cursorPosition.x >= endX;

    const rightAxisXBounds =
      chartRotation === 0
        ? cursorPosition.x <= endX + markerWidth && cursorPosition.x >= endX
        : cursorPosition.x >= startX - markerWidth && cursorPosition.x <= startX;

    isCursorWithinMarkerXBounds = isHorizontalChartRotation
      ? axisPosition === Position.Right
        ? rightAxisXBounds
        : leftAxisXBounds
      : cursorPosition.x <= endX + offset + markerWidth && cursorPosition.x >= startX - offset - markerWidth;
    isCursorWithinMarkerYBounds = isHorizontalChartRotation
      ? cursorPosition.y >= startY - markerHeightOffset && cursorPosition.y <= endY + markerHeightOffset
      : cursorPosition.y >= chartWidth - startY - markerHeightOffset &&
        cursorPosition.y <= chartWidth - endY + markerHeightOffset;
  }

  return isCursorWithinMarkerXBounds && isCursorWithinMarkerYBounds;
}

export function isVerticalAnnotationLine(isXDomainAnnotation: boolean, isHorizontalChartRotation: boolean): boolean {
  if (isXDomainAnnotation) {
    return isHorizontalChartRotation;
  }

  return !isHorizontalChartRotation;
}

export function getAnnotationLineTooltipXOffset(chartRotation: Rotation, axisPosition: Position): number {
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

export function getAnnotationLineTooltipYOffset(chartRotation: Rotation, axisPosition: Position): number {
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

  const xPosition = axisPosition === Position.Right ? endX : startX;
  const yPosition = axisPosition === Position.Top ? startY : endY;

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
  const position = getAnnotationLineTooltipPosition(chartRotation, linePosition, axisPosition);

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
  style: LineAnnotationStyle,
  chartRotation: Rotation,
  chartDimensions: Dimensions,
  axesSpecs: Map<AxisId, AxisSpec>,
  hideLinesTooltips?: boolean,
): AnnotationTooltipState {
  const annotationTooltipState: AnnotationTooltipState = {
    isVisible: false,
    transform: '',
    annotationType: AnnotationTypes.Line,
  };

  const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, groupId);
  const isXDomainAnnotation = isXDomain(domainType);
  const annotationAxis = isXDomainAnnotation ? xAxis : yAxis;
  const chartWidth = chartDimensions.width;
  const chartHeight = chartDimensions.height;

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
      chartDimensions,
      domainType,
      line.marker,
      hideLinesTooltips,
    );

    if (isWithinBounds) {
      annotationTooltipState.isVisible = true;

      // Position tooltip based on axis position & lineOffset amount
      const [tooltipStartX, tooltipStartY, tooltipEndX, tooltipEndY] = line.tooltipLinePosition;
      const tooltipLinePosition: AnnotationLinePosition = [tooltipStartX, tooltipStartY, tooltipEndX, tooltipEndY];

      annotationTooltipState.transform = getAnnotationLineTooltipTransform(
        chartRotation,
        tooltipLinePosition,
        axisPosition,
      );

      if (chartRotation === 180 && domainType === AnnotationDomainTypes.YDomain) {
        const flippedYDomainTooltipLinePosition: AnnotationLinePosition = [
          tooltipStartX,
          chartHeight - tooltipStartY,
          tooltipEndX,
          chartHeight - tooltipEndY,
        ];

        annotationTooltipState.transform = getAnnotationLineTooltipTransform(
          chartRotation,
          flippedYDomainTooltipLinePosition,
          axisPosition,
        );
      }
      if (chartRotation === 180 && domainType === AnnotationDomainTypes.XDomain) {
        const rotatedXDomainTooltipLinePosition: AnnotationLinePosition = [
          chartWidth - tooltipStartX,
          tooltipStartY,
          chartWidth - tooltipEndX,
          tooltipEndY,
        ];
        annotationTooltipState.transform = getAnnotationLineTooltipTransform(
          chartRotation,
          rotatedXDomainTooltipLinePosition,
          axisPosition,
        );
      }
      if (chartRotation === 90 && domainType === AnnotationDomainTypes.YDomain) {
        const rotatedYDomainTooltipLinePosition: AnnotationLinePosition = [
          chartWidth - tooltipStartX,
          tooltipStartY,
          chartWidth - tooltipEndX,
          tooltipEndY,
        ];

        annotationTooltipState.transform = getAnnotationLineTooltipTransform(
          chartRotation,
          rotatedYDomainTooltipLinePosition,
          axisPosition,
        );
      }

      if (line.details) {
        annotationTooltipState.header = line.details.headerText;
        annotationTooltipState.details = line.details.detailsText;
      }
    }
  });

  return annotationTooltipState;
}

export function isWithinRectBounds(
  cursorPosition: Point,
  { startX, endX, startY, endY }: { startX: number; endX: number; startY: number; endY: number },
): boolean {
  const withinXBounds = cursorPosition.x > startX && cursorPosition.x < endX;
  const withinYBounds = cursorPosition.y > startY && cursorPosition.y < endY;

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

export function computeRectTooltipOffset(
  isRightTooltip: boolean,
  isBottomTooltip: boolean,
  chartRotation: Rotation,
): { offsetLeft: string; offsetTop: string } {
  const offsetLeft = isRightTooltip ? (chartRotation === 180 ? '-100%' : '0') : chartRotation === 180 ? '0' : '-100%';
  const offsetTop = isBottomTooltip ? (chartRotation === -90 ? '-100%' : '0') : chartRotation === -90 ? '0' : '-100%';

  return { offsetLeft, offsetTop };
}

export function getRotatedCursor(
  rawCursorPosition: Point,
  chartDimensions: Dimensions,
  chartRotation: Rotation,
): Point {
  const { x, y } = rawCursorPosition;
  const { height, width } = chartDimensions;
  switch (chartRotation) {
    case 0:
      return { x, y };
    case 90:
      return { x: y, y: x };
    case -90:
      return { x: height - y, y: width - x };
    case 180:
      return { x: width - x, y: height - y };
  }
}

export function computeRectAnnotationTooltipState(
  rawCursorPosition: Point,
  annotationRects: AnnotationRectProps[],
  chartRotation: Rotation,
  chartDimensions: Dimensions,
  renderTooltip?: AnnotationTooltipFormatter,
): AnnotationTooltipState {
  const cursorPosition = getRotatedCursor(rawCursorPosition, chartDimensions, chartRotation);

  const annotationTooltipState: AnnotationTooltipState = {
    isVisible: false,
    transform: '',
    annotationType: AnnotationTypes.Rectangle,
  };

  const isRightTooltip = isRightRectTooltip(chartRotation, cursorPosition, chartDimensions.width);
  const isBottomTooltip = isBottomRectTooltip(chartRotation, cursorPosition, chartDimensions.height);

  annotationRects.forEach((rectProps: AnnotationRectProps) => {
    const { rect, details } = rectProps;
    const startX = rect.x;
    const endX = startX + rect.width;

    const startY = rect.y;
    const endY = startY + rect.height;

    const isWithinBounds = isWithinRectBounds(cursorPosition, { startX, endX, startY, endY });
    if (isWithinBounds) {
      annotationTooltipState.isVisible = true;
      annotationTooltipState.details = details;

      const tooltipLeft = computeRectTooltipLeft(
        chartRotation,
        isRightTooltip,
        { startX, endX },
        rawCursorPosition.x,
        chartDimensions.width,
      );
      const tooltipTop = computeRectTooltipTop(
        chartRotation,
        isBottomTooltip,
        { startX, endX },
        rawCursorPosition.y,
        chartDimensions.height,
      );

      const { offsetLeft, offsetTop } = computeRectTooltipOffset(isRightTooltip, isBottomTooltip, chartRotation);

      annotationTooltipState.top = tooltipTop;
      annotationTooltipState.left = tooltipLeft;
      annotationTooltipState.transform = `translate(${offsetLeft}, ${offsetTop})`;
      annotationTooltipState.renderTooltip = renderTooltip;
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
        spec.style as LineAnnotationStyle, // this type is guaranteed as this has been merged with default
        chartRotation,
        chartDimensions,
        axesSpecs,
        spec.hideLinesTooltips,
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
