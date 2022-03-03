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
import { SeriesIdentifier } from '../../../../common/series_id';
import { SettingsSpec } from '../../../../specs';
import { GlobalChartState, PointerState } from '../../../../state/chart_state';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getLastClickSelector } from '../../../../state/selectors/get_last_click';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { isClicking } from '../../../../state/utils';
import { Cell, isPickedCells } from '../../layout/types/viewmodel_types';
import { getSpecOrNull } from './heatmap_spec';
import { getPickedShapes } from './picked_shapes';

/**
 * Will call the onElementClick listener every time the following preconditions are met:
 * - the onElementClick listener is available
 * - we have at least one highlighted geometry
 * - the pointer state goes from down state to up state
 * @internal
 */
export function createOnElementClickCaller(): (state: GlobalChartState) => void {
  let prevClick: PointerState | null = null;
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector === null && state.chartType === ChartType.Heatmap) {
      selector = createCustomCachedSelector(
        [getSpecOrNull, getLastClickSelector, getSettingsSpecSelector, getPickedShapes],
        (spec, lastClick: PointerState | null, settings: SettingsSpec, pickedShapes): void => {
          if (!spec) {
            return;
          }
          if (!settings.onElementClick) {
            return;
          }
          if (!isPickedCells(pickedShapes)) {
            return;
          }
          const nextPickedShapesLength = pickedShapes.length;
          if (nextPickedShapesLength > 0 && isClicking(prevClick, lastClick) && settings && settings.onElementClick) {
            const elements = pickedShapes.map<[Cell, SeriesIdentifier]>((value) => [
              value,
              {
                specId: spec.id,
                key: `spec{${spec.id}}`,
              },
            ]);
            settings.onElementClick(elements);
          }
          prevClick = lastClick;
        },
      );
    }
    if (selector) {
      selector(state);
    }
  };
}
