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

import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import createCachedSelector from 're-reselect';
import { getPickedShapesLayerValues } from './picked_shapes';
import { getPieSpecOrNull } from './pie_spec';
import { GlobalChartState } from '../../../../state/chart_state';
import { Selector } from 'react-redux';
import { ChartTypes } from '../../../index';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

/**
 * Will call the onElementOut listener every time the following preconditions are met:
 * - the onElementOut listener is available
 * - the highlighted geometries list goes from a list of at least one object to an empty one
 */
export function createOnElementOutCaller(): (state: GlobalChartState) => void {
  let prevPickedShapes: number | null = null;
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector === null && state.chartType === ChartTypes.Partition) {
      selector = createCachedSelector(
        [getPieSpecOrNull, getPickedShapesLayerValues, getSettingsSpecSelector],
        (pieSpec, pickedShapes, settings): void => {
          if (!pieSpec) {
            return;
          }
          if (!settings.onElementOut) {
            return;
          }
          const nextPickedShapes = pickedShapes.length;

          if (prevPickedShapes !== null && prevPickedShapes > 0 && nextPickedShapes === 0) {
            settings.onElementOut();
          }
          prevPickedShapes = nextPickedShapes;
        },
      )({
        keySelector: getChartIdSelector,
      });
    }
    if (selector) {
      selector(state);
    }
  };
}
