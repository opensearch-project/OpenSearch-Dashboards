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
import { GlobalChartState, PointerState } from '../../../../state/chart_state';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getHighlightedGeomsSelector } from './get_tooltip_values_highlighted_geoms';
import { SettingsSpec } from '../../../../specs';
import { IndexedGeometry, GeometryValue } from '../../../../utils/geometry';
import { ChartTypes } from '../../../index';
import { XYChartSeriesIdentifier } from '../../utils/series';

const getLastClickSelector = (state: GlobalChartState) => state.interactions.pointer.lastClick;

interface Props {
  settings: SettingsSpec | undefined;
  lastClick: PointerState | null;
  indexedGeometries: IndexedGeometry[];
}

function isClicking(prevProps: Props | null, nextProps: Props | null) {
  if (nextProps === null) {
    return false;
  }
  if (!nextProps.settings || !nextProps.settings.onElementClick || nextProps.indexedGeometries.length === 0) {
    return false;
  }
  const prevLastClick = prevProps !== null ? prevProps.lastClick : null;
  const nextLastClick = nextProps !== null ? nextProps.lastClick : null;

  if (prevLastClick === null && nextLastClick !== null) {
    return true;
  }
  if (prevLastClick !== null && nextLastClick !== null && prevLastClick.time !== nextLastClick.time) {
    return true;
  }
  return false;
}

/**
 * Will call the onElementClick listener every time the following preconditions are met:
 * - the onElementClick listener is available
 * - we have at least one highlighted geometry
 * - the pointer state goes from down state to up state
 */
export function createOnElementClickCaller(): (state: GlobalChartState) => void {
  let prevProps: Props | null = null;
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector === null && state.chartType === ChartTypes.XYAxis) {
      selector = createCachedSelector(
        [getLastClickSelector, getSettingsSpecSelector, getHighlightedGeomsSelector],
        (lastClick: PointerState | null, settings: SettingsSpec, indexedGeometries: IndexedGeometry[]): void => {
          const nextProps = {
            lastClick,
            settings,
            indexedGeometries,
          };

          if (isClicking(prevProps, nextProps)) {
            if (settings && settings.onElementClick) {
              const elements = indexedGeometries.map<[GeometryValue, XYChartSeriesIdentifier]>(
                ({ value, seriesIdentifier }) => [value, seriesIdentifier],
              );
              settings.onElementClick(elements);
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
