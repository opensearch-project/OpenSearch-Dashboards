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
 * under the License. */

import createCachedSelector from 're-reselect';
import { Selector } from 'reselect';
import { GlobalChartState, DragState } from '../../../../state/chart_state';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { SettingsSpec } from '../../../../specs';
import { ChartTypes } from '../../../index';
import { getComputedScalesSelector } from './get_computed_scales';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';
import { isBrushAvailableSelector } from './is_brush_available';

const getLastDragSelector = (state: GlobalChartState) => state.interactions.pointer.lastDrag;

interface Props {
  settings: SettingsSpec | undefined;
  lastDrag: DragState | null;
}

function hasDragged(prevProps: Props | null, nextProps: Props | null) {
  if (nextProps === null) {
    return false;
  }
  if (!nextProps.settings || !nextProps.settings.onBrushEnd) {
    return false;
  }
  const prevLastDrag = prevProps !== null ? prevProps.lastDrag : null;
  const nextLastDrag = nextProps !== null ? nextProps.lastDrag : null;

  if (prevLastDrag === null && nextLastDrag !== null) {
    return true;
  }
  if (prevLastDrag !== null && nextLastDrag !== null && prevLastDrag.end.time !== nextLastDrag.end.time) {
    return true;
  }
  return false;
}

/**
 * Will call the onBrushEnd listener every time the following preconditions are met:
 * - the onBrushEnd listener is available
 * - we dragged the mouse pointer
 * @internal
 */
export function createOnBrushEndCaller(): (state: GlobalChartState) => void {
  let prevProps: Props | null = null;
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
        (lastDrag, settings, computedScales, { chartDimensions }, histogramMode): void => {
          const nextProps = {
            lastDrag,
            settings,
          };

          if (lastDrag !== null && hasDragged(prevProps, nextProps)) {
            if (settings && settings.onBrushEnd) {
              let startPos = lastDrag.start.position.x - chartDimensions.left;
              let endPos = lastDrag.end.position.x - chartDimensions.left;
              let chartMax = chartDimensions.width;
              if (settings.rotation === -90 || settings.rotation === 90) {
                startPos = lastDrag.start.position.y - chartDimensions.top;
                endPos = lastDrag.end.position.y - chartDimensions.top;
                chartMax = chartDimensions.height;
              }
              let minPos = Math.max(Math.min(startPos, endPos), 0);
              let maxPos = Math.min(Math.max(startPos, endPos), chartMax);
              if (settings.rotation === -90 || settings.rotation === 180) {
                minPos = chartMax - minPos;
                maxPos = chartMax - maxPos;
              }
              if (maxPos === minPos) {
                // if 0 size brush, avoid computing the value
                return;
              }
              const { xScale } = computedScales;
              const offset = histogramMode ? 0 : -(xScale.bandwidth + xScale.bandwidthPadding) / 2;
              const minPosScaled = xScale.invert(minPos + offset);
              const maxPosScaled = xScale.invert(maxPos + offset);
              const minValue = Math.max(Math.min(minPosScaled, maxPosScaled), xScale.domain[0]);
              const maxValue = Math.min(Math.max(minPosScaled, maxPosScaled), xScale.domain[1]);

              settings.onBrushEnd(minValue, maxValue);
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
