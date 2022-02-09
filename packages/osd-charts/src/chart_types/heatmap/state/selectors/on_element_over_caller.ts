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

import { Selector } from 'react-redux';

import { ChartType } from '../../..';
import { SeriesIdentifier } from '../../../../common/series_id';
import { GlobalChartState } from '../../../../state/chart_state';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { Cell, isPickedCells } from '../../layout/types/viewmodel_types';
import { getSpecOrNull } from './heatmap_spec';
import { getPickedShapes } from './picked_shapes';

function isOverElement(prev: Cell[] = [], next: Cell[]) {
  if (next.length === 0) {
    return;
  }
  if (next.length !== prev.length) {
    return true;
  }
  return !next.every((nextCell, index) => {
    const prevCell = prev[index];
    if (prevCell === null) {
      return false;
    }
    return nextCell.value === prevCell.value && nextCell.x === prevCell.x && nextCell.y === prevCell.y;
  });
}

/**
 * Will call the onElementOver listener every time the following preconditions are met:
 * - the onElementOver listener is available
 * - we have a new set of highlighted geometries on our state
 * @internal
 */
export function createOnElementOverCaller(): (state: GlobalChartState) => void {
  let prevPickedShapes: Cell[] = [];
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector === null && state.chartType === ChartType.Heatmap) {
      selector = createCustomCachedSelector(
        [getSpecOrNull, getPickedShapes, getSettingsSpecSelector],
        (spec, nextPickedShapes, settings): void => {
          if (!spec) {
            return;
          }
          if (!settings.onElementOver) {
            return;
          }
          if (!isPickedCells(nextPickedShapes)) {
            return;
          }

          if (isOverElement(prevPickedShapes, nextPickedShapes)) {
            const elements = nextPickedShapes.map<[Cell, SeriesIdentifier]>((value) => [
              value,
              {
                specId: spec.id,
                key: `spec{${spec.id}}`,
              },
            ]);
            settings.onElementOver(elements);
          }
          prevPickedShapes = nextPickedShapes;
        },
      );
    }
    if (selector) {
      selector(state);
    }
  };
}
