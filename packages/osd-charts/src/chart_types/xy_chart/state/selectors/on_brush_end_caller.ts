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

import { ChartTypes } from '../../..';
import { Scale } from '../../../../scales';
import { GroupBrushExtent, XYBrushArea } from '../../../../specs';
import { BrushAxis } from '../../../../specs/constants';
import { DragState, GlobalChartState } from '../../../../state/chart_state';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { maxValueWithUpperLimit, minValueWithLowerLimit, Rotation } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { hasDragged, DragCheckProps } from '../../../../utils/events';
import { GroupId } from '../../../../utils/ids';
import { isVerticalRotation } from '../utils/common';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getLeftPoint, getTopPoint } from './get_brush_area';
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
    if (selector === null && state.chartType === ChartTypes.XYAxis) {
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
                minBrushDelta,
                roundHistogramBrushValues,
                allowBrushingLastHistogramBucket,
              );
            }
            if (brushAxis === BrushAxis.Y || brushAxis === BrushAxis.Both) {
              brushArea.y = getYBrushExtents(chartDimensions, lastDrag, rotation, yScales, minBrushDelta);
            }
            if (brushArea.x !== undefined || brushArea.y !== undefined) {
              onBrushEnd(brushArea);
            }
          }
          prevProps = nextProps;
        },
      )({
        keySelector: (state: GlobalChartState) => state.chartId,
      });
    }
    if (selector) {
      selector(state);
    }
  };
}

function getXBrushExtent(
  chartDimensions: Dimensions,
  lastDrag: DragState,
  rotation: Rotation,
  histogramMode: boolean,
  xScale: Scale,
  minBrushDelta?: number,
  roundHistogramBrushValues?: boolean,
  allowBrushingLastHistogramBucket?: boolean,
): [number, number] | undefined {
  let startPos = getLeftPoint(chartDimensions, lastDrag.start.position);
  let endPos = getLeftPoint(chartDimensions, lastDrag.end.position);
  let chartMax = chartDimensions.width;

  if (isVerticalRotation(rotation)) {
    startPos = getTopPoint(chartDimensions, lastDrag.start.position);
    endPos = getTopPoint(chartDimensions, lastDrag.end.position);
    chartMax = chartDimensions.height;
  }

  let minPos = minValueWithLowerLimit(startPos, endPos, 0);
  let maxPos = maxValueWithUpperLimit(startPos, endPos, chartMax);
  if (rotation === -90 || rotation === 180) {
    minPos = chartMax - minPos;
    maxPos = chartMax - maxPos;
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

function getYBrushExtents(
  chartDimensions: Dimensions,
  lastDrag: DragState,
  rotation: Rotation,
  yScales: Map<GroupId, Scale>,
  minBrushDelta?: number,
): GroupBrushExtent[] | undefined {
  const yValues: GroupBrushExtent[] = [];
  yScales.forEach((yScale, groupId) => {
    let startPos = getTopPoint(chartDimensions, lastDrag.start.position);
    let endPos = getTopPoint(chartDimensions, lastDrag.end.position);
    let chartMax = chartDimensions.height;
    if (isVerticalRotation(rotation)) {
      startPos = getLeftPoint(chartDimensions, lastDrag.start.position);
      endPos = getLeftPoint(chartDimensions, lastDrag.end.position);
      chartMax = chartDimensions.width;
    }
    let minPos = minValueWithLowerLimit(startPos, endPos, 0);
    let maxPos = maxValueWithUpperLimit(startPos, endPos, chartMax);
    if (rotation === -90 || rotation === 180) {
      minPos = chartMax - minPos;
      maxPos = chartMax - maxPos;
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
