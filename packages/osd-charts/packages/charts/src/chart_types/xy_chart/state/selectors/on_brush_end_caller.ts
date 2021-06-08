/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import createCachedSelector from 're-reselect';
import { Selector } from 'reselect';

import { ChartType } from '../../..';
import { Scale } from '../../../../scales';
import { GroupBrushExtent, XYBrushArea } from '../../../../specs';
import { BrushAxis } from '../../../../specs/constants';
import { DragState, GlobalChartState } from '../../../../state/chart_state';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { maxValueWithUpperLimit, minValueWithLowerLimit, Rotation } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { hasDragged, DragCheckProps } from '../../../../utils/events';
import { GroupId } from '../../../../utils/ids';
import { isVerticalRotation } from '../utils/common';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { computeSmallMultipleScalesSelector, SmallMultipleScales } from './compute_small_multiple_scales';
import { getPlotAreaRestrictedPoint, getPointsConstraintToSinglePanel, PanelPoints } from './get_brush_area';
import { getComputedScalesSelector } from './get_computed_scales';
import { isBrushAvailableSelector } from './is_brush_available';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';

const getLastDragSelector = (state: GlobalChartState) => state.interactions.pointer.lastDrag;

/**
 * Will call the onBrushEnd listener every time the following preconditions are met:
 * - the onBrushEnd listener is available
 * - we dragged the mouse pointer
 * @internal
 */
export function createOnBrushEndCaller(): (state: GlobalChartState) => void {
  let prevProps: DragCheckProps | null = null;
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector === null && state.chartType === ChartType.XYAxis) {
      if (!isBrushAvailableSelector(state)) {
        selector = null;
        prevProps = null;
        return;
      }
      selector = createCachedSelector(
        [
          getLastDragSelector,
          getSettingsSpecSelector,
          getComputedScalesSelector,
          computeChartDimensionsSelector,
          isHistogramModeEnabledSelector,
          computeSmallMultipleScalesSelector,
        ],
        (
          lastDrag,
          {
            onBrushEnd,
            rotation,
            brushAxis,
            minBrushDelta,
            roundHistogramBrushValues,
            allowBrushingLastHistogramBucket,
          },
          computedScales,
          { chartDimensions },
          histogramMode,
          smallMultipleScales,
        ): void => {
          const nextProps = {
            lastDrag,
            onBrushEnd,
          };
          if (lastDrag !== null && hasDragged(prevProps, nextProps) && onBrushEnd) {
            const brushArea: XYBrushArea = {};
            const { yScales, xScale } = computedScales;

            if (brushAxis === BrushAxis.X || brushAxis === BrushAxis.Both) {
              brushArea.x = getXBrushExtent(
                chartDimensions,
                lastDrag,
                rotation,
                histogramMode,
                xScale,
                smallMultipleScales,
                minBrushDelta,
                roundHistogramBrushValues,
                allowBrushingLastHistogramBucket,
              );
            }
            if (brushAxis === BrushAxis.Y || brushAxis === BrushAxis.Both) {
              brushArea.y = getYBrushExtents(
                chartDimensions,
                lastDrag,
                rotation,
                yScales,
                smallMultipleScales,
                minBrushDelta,
              );
            }
            if (brushArea.x !== undefined || brushArea.y !== undefined) {
              onBrushEnd(brushArea);
            }
          }
          prevProps = nextProps;
        },
      )(getChartIdSelector);
    }
    if (selector) {
      selector(state);
    }
  };
}

function scalePanelPointsToPanelCoordinates(
  scaleXPoint: boolean,
  { start, end, vPanelStart, hPanelStart, vPanelHeight, hPanelWidth }: PanelPoints,
) {
  // scale screen coordinates down to panel scale
  const startPos = scaleXPoint ? start.x - hPanelStart : start.y - vPanelStart;
  const endPos = scaleXPoint ? end.x - hPanelStart : end.y - vPanelStart;
  const panelMax = scaleXPoint ? hPanelWidth : vPanelHeight;
  return {
    minPos: Math.min(startPos, endPos),
    maxPos: Math.max(startPos, endPos),
    panelMax,
  };
}

function getXBrushExtent(
  chartDimensions: Dimensions,
  lastDrag: DragState,
  rotation: Rotation,
  histogramMode: boolean,
  xScale: Scale,
  smallMultipleScales: SmallMultipleScales,
  minBrushDelta?: number,
  roundHistogramBrushValues?: boolean,
  allowBrushingLastHistogramBucket?: boolean,
): [number, number] | undefined {
  const isXHorizontal = !isVerticalRotation(rotation);
  // scale screen coordinates down to panel scale
  const scaledPanelPoints = getMinMaxPos(chartDimensions, lastDrag, smallMultipleScales, isXHorizontal);
  let { minPos, maxPos } = scaledPanelPoints;
  // reverse the positions if chart is mirrored
  if (rotation === -90 || rotation === 180) {
    minPos = scaledPanelPoints.panelMax - minPos;
    maxPos = scaledPanelPoints.panelMax - maxPos;
  }
  if (minBrushDelta !== undefined ? Math.abs(maxPos - minPos) < minBrushDelta : maxPos === minPos) {
    // if 0 size brush, avoid computing the value
    return;
  }

  const offset = histogramMode ? 0 : -(xScale.bandwidth + xScale.bandwidthPadding) / 2;
  const invertValue = roundHistogramBrushValues
    ? (value: number) => xScale.invertWithStep(value, xScale.domain)?.value
    : (value: number) => xScale.invert(value);
  const minPosScaled = invertValue(minPos + offset);
  const maxPosScaled = invertValue(maxPos + offset);

  const maxDomainValue = xScale.domain[1] + (allowBrushingLastHistogramBucket ? xScale.minInterval : 0);

  const minValue = minValueWithLowerLimit(minPosScaled, maxPosScaled, xScale.domain[0]);
  const maxValue = maxValueWithUpperLimit(minPosScaled, maxPosScaled, maxDomainValue);

  return [minValue, maxValue];
}

function getMinMaxPos(
  chartDimensions: Dimensions,
  lastDrag: DragState,
  smallMultipleScales: SmallMultipleScales,
  scaleXPoint: boolean,
) {
  const panelPoints = getPanelPoints(chartDimensions, lastDrag, smallMultipleScales);
  // scale screen coordinates down to panel scale
  return scalePanelPointsToPanelCoordinates(scaleXPoint, panelPoints);
}

function getPanelPoints(chartDimensions: Dimensions, lastDrag: DragState, smallMultipleScales: SmallMultipleScales) {
  const plotStartPointPx = getPlotAreaRestrictedPoint(lastDrag.start.position, chartDimensions);
  const plotEndPointPx = getPlotAreaRestrictedPoint(lastDrag.end.position, chartDimensions);
  return getPointsConstraintToSinglePanel(plotStartPointPx, plotEndPointPx, smallMultipleScales);
}

function getYBrushExtents(
  chartDimensions: Dimensions,
  lastDrag: DragState,
  rotation: Rotation,
  yScales: Map<GroupId, Scale>,
  smallMultipleScales: SmallMultipleScales,
  minBrushDelta?: number,
): GroupBrushExtent[] | undefined {
  const yValues: GroupBrushExtent[] = [];
  yScales.forEach((yScale, groupId) => {
    const isXVertical = isVerticalRotation(rotation);
    // scale screen coordinates down to panel scale
    const scaledPanelPoints = getMinMaxPos(chartDimensions, lastDrag, smallMultipleScales, isXVertical);
    let { minPos, maxPos } = scaledPanelPoints;

    if (rotation === 90 || rotation === 180) {
      minPos = scaledPanelPoints.panelMax - minPos;
      maxPos = scaledPanelPoints.panelMax - maxPos;
    }
    if (minBrushDelta !== undefined ? Math.abs(maxPos - minPos) < minBrushDelta : maxPos === minPos) {
      // if 0 size brush, avoid computing the value
      return;
    }

    const minPosScaled = yScale.invert(minPos);
    const maxPosScaled = yScale.invert(maxPos);
    const minValue = minValueWithLowerLimit(minPosScaled, maxPosScaled, yScale.domain[0]);
    const maxValue = maxValueWithUpperLimit(minPosScaled, maxPosScaled, yScale.domain[1]);
    yValues.push({ extent: [minValue, maxValue], groupId });
  });
  return yValues.length === 0 ? undefined : yValues;
}
