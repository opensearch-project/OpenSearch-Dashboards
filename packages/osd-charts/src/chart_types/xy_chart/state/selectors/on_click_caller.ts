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
import { ProjectedValues, SettingsSpec } from '../../../../specs';
import { GlobalChartState, PointerState } from '../../../../state/chart_state';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getLastClickSelector } from '../../../../state/selectors/get_last_click';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { isClicking } from '../../../../state/utils';
import { IndexedGeometry, GeometryValue } from '../../../../utils/geometry';
import { XYChartSeriesIdentifier } from '../../utils/series';
import { getProjectedScaledValues } from './get_projected_scaled_values';
import { getHighlightedGeomsSelector } from './get_tooltip_values_highlighted_geoms';

/**
 * Will call the onElementClick listener every time the following preconditions are met:
 * - the onElementClick listener is available
 * - we have at least one highlighted geometry
 * - the pointer state goes from down state to up state
 * @internal
 */
export function createOnClickCaller(): (state: GlobalChartState) => void {
  let prevClick: PointerState | null = null;
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector) {
      return selector(state);
    }
    if (state.chartType !== ChartType.XYAxis) {
      return;
    }
    selector = createCachedSelector(
      [getLastClickSelector, getSettingsSpecSelector, getHighlightedGeomsSelector, getProjectedScaledValues],
      (
        lastClick: PointerState | null,
        { onElementClick, onProjectionClick }: SettingsSpec,
        indexedGeometries: IndexedGeometry[],
        values,
      ): void => {
        if (!isClicking(prevClick, lastClick)) {
          return;
        }
        const elementClickFired = tryFiringOnElementClick(indexedGeometries, onElementClick);
        if (!elementClickFired) {
          tryFiringOnProjectionClick(values, onProjectionClick);
        }
        prevClick = lastClick;
      },
    )({
      keySelector: getChartIdSelector,
    });
  };
}

function tryFiringOnElementClick(
  indexedGeometries: IndexedGeometry[],
  onElementClick: SettingsSpec['onElementClick'],
): boolean {
  if (indexedGeometries.length === 0 || !onElementClick) {
    return false;
  }

  const elements = indexedGeometries.map<[GeometryValue, XYChartSeriesIdentifier]>(({ value, seriesIdentifier }) => [
    value,
    seriesIdentifier,
  ]);
  onElementClick(elements);
  return true;
}

function tryFiringOnProjectionClick(
  values: ProjectedValues | undefined,
  onProjectionClick: SettingsSpec['onProjectionClick'],
): boolean {
  if (values === undefined || !onProjectionClick) {
    return false;
  }
  onProjectionClick(values);
  return true;
}
