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

import { Selector } from 'reselect';

import { ChartType } from '../../..';
import { GlobalChartState } from '../../../../state/chart_state';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getLastDragSelector } from '../../../../state/selectors/get_last_drag';
import { DragCheckProps, hasDragged } from '../../../../utils/events';
import { getHeatmapConfigSelector } from './get_heatmap_config';
import { getPickedCells } from './get_picked_cells';
import { getSpecOrNull } from './heatmap_spec';
import { isBrushEndProvided } from './is_brush_available';

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
    if (selector === null && state.chartType === ChartType.Heatmap) {
      if (!isBrushEndProvided(state)) {
        selector = null;
        prevProps = null;
        return;
      }
      selector = createCustomCachedSelector(
        [getLastDragSelector, getSpecOrNull, getHeatmapConfigSelector, getPickedCells],
        (lastDrag, spec, { onBrushEnd }, pickedCells): void => {
          const nextProps: DragCheckProps = {
            lastDrag,
            onBrushEnd,
          };
          if (!spec || !onBrushEnd || pickedCells === null) {
            return;
          }
          if (lastDrag !== null && hasDragged(prevProps, nextProps)) {
            onBrushEnd(pickedCells);
          }
          prevProps = nextProps;
        },
      );
    }
    if (selector) {
      selector(state);
    }
  };
}
