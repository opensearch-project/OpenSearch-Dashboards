import {
  AnnotationDomainType,
  AnnotationDomainTypes,
  AnnotationSpec,
  AnnotationType,
  AxisSpec,
  HistogramModeAlignments,
  isLineAnnotation,
  isRectAnnotation,
  Position,
  Rotation,
} from '../utils/specs';
import { Dimensions } from '../../../utils/dimensions';
import { AnnotationId, GroupId } from '../../../utils/ids';
import { Scale, ScaleType } from '../../../utils/scales/scales';
import { computeXScaleOffset, getAxesSpecForSpecId, isHorizontalRotation, getSpecsById } from '../state/utils';
import { Point } from '../../../utils/point';
import {
  computeLineAnnotationTooltipState,
  AnnotationLineProps,
  computeLineAnnotationDimensions,
} from './line_annotation_tooltip';
import {
  computeRectAnnotationTooltipState,
  AnnotationRectProps,
  computeRectAnnotationDimensions,
} from './rect_annotation_tooltip';

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
/**
 * The header and description strings for an Annotation
 */
export interface AnnotationDetails {
  headerText?: string;
  detailsText?: string;
}

/**
 * The marker for an Annotation. Usually a JSX element
 */
export interface AnnotationMarker {
  icon: JSX.Element;
  position: { top: number; left: number };
  dimension: { width: number; height: number };
  color: string;
}

export type AnnotationDimensions = AnnotationLineProps[] | AnnotationRectProps[];

export type Bounds = { startX: number; endX: number; startY: number; endY: number };

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

export function getAnnotationAxis(
  axesSpecs: AxisSpec[],
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

export function isXDomain(domainType: AnnotationDomainType): boolean {
  return domainType === AnnotationDomainTypes.XDomain;
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

export function computeAnnotationDimensions(
  annotations: AnnotationSpec[],
  chartDimensions: Dimensions,
  chartRotation: Rotation,
  yScales: Map<GroupId, Scale>,
  xScale: Scale,
  axesSpecs: AxisSpec[],
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
  annotations.forEach((annotationSpec) => {
    const { id } = annotationSpec;
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
        annotationDimensions.set(id, dimensions);
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
        annotationDimensions.set(id, dimensions);
      }
    }
  });

  return annotationDimensions;
}

export function computeAnnotationTooltipState(
  cursorPosition: Point,
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>,
  annotationSpecs: AnnotationSpec[],
  chartRotation: Rotation,
  axesSpecs: AxisSpec[],
  chartDimensions: Dimensions,
): AnnotationTooltipState | null {
  for (const [annotationId, annotationDimension] of annotationDimensions) {
    const spec = getSpecsById<AnnotationSpec>(annotationSpecs, annotationId);

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
        annotationDimension as AnnotationLineProps[],
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
        annotationDimension as AnnotationRectProps[],
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
