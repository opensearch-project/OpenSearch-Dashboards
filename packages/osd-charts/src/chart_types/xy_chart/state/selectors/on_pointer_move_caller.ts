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
import { GlobalChartState } from '../../../../state/chart_state';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { SettingsSpec, PointerEvent, PointerEventType } from '../../../../specs';
import { ChartTypes } from '../../../index';
import { Scale } from '../../../../scales';
import { Point } from '../../../../utils/point';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getGeometriesIndexKeysSelector } from './get_geometries_index_keys';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getPointerEventSelector = createCachedSelector(
  [
    getChartIdSelector,
    getOrientedProjectedPointerPositionSelector,
    computeSeriesGeometriesSelector,
    getGeometriesIndexKeysSelector,
  ],
  (chartId, orientedProjectedPointerPosition, seriesGeometries, geometriesIndexKeys): PointerEvent => {
    return getPointerEvent(
      chartId,
      orientedProjectedPointerPosition,
      seriesGeometries.scales.xScale,
      geometriesIndexKeys,
    );
  },
)(getChartIdSelector);

function getPointerEvent(
  chartId: string,
  orientedProjectedPoinerPosition: Point,
  xScale: Scale | undefined,
  geometriesIndexKeys: any[],
): PointerEvent {
  // update che cursorBandPosition based on chart configuration
  if (!xScale) {
    return {
      chartId,
      type: PointerEventType.Out,
    };
  }
  const { x, y } = orientedProjectedPoinerPosition;
  if (x === -1 || y === -1) {
    return {
      chartId,
      type: PointerEventType.Out,
    };
  }
  const xValue = xScale.invertWithStep(x, geometriesIndexKeys);
  if (!xValue) {
    return {
      chartId,
      type: PointerEventType.Out,
    };
  }
  return {
    chartId,
    type: PointerEventType.Over,
    unit: xScale.unit,
    scale: xScale.type,
    value: xValue.value,
  };
}

function hasPointerEventChanged(prevPointerEvent: PointerEvent, nextPointerEvent: PointerEvent | null) {
  if (nextPointerEvent && prevPointerEvent.type !== nextPointerEvent.type) {
    return true;
  }
  if (
    nextPointerEvent &&
    prevPointerEvent.type === nextPointerEvent.type &&
    prevPointerEvent.type === PointerEventType.Out
  ) {
    return false;
  }
  // if something changed in the pointerEvent than recompute
  if (
    nextPointerEvent &&
    prevPointerEvent.type === PointerEventType.Over &&
    nextPointerEvent.type === PointerEventType.Over &&
    (prevPointerEvent.value !== nextPointerEvent.value ||
      prevPointerEvent.scale !== nextPointerEvent.scale ||
      prevPointerEvent.unit !== nextPointerEvent.unit)
  ) {
    return true;
  }
  return false;
}

/** @internal */
export function createOnPointerMoveCaller(): (state: GlobalChartState) => void {
  let prevPointerEvent: PointerEvent | null = null;
  let selector: Selector<GlobalChartState, void> | null = null;
  return (state: GlobalChartState) => {
    if (selector === null && state.chartType === ChartTypes.XYAxis) {
      selector = createCachedSelector(
        [getSettingsSpecSelector, getPointerEventSelector, getChartIdSelector],
        (settings: SettingsSpec, nextPointerEvent: PointerEvent, chartId: string): void => {
          if (prevPointerEvent === null) {
            prevPointerEvent = {
              chartId,
              type: PointerEventType.Out,
            };
          }
          const tempPrev = {
            ...prevPointerEvent,
          };
          // we have to update the prevPointerEvents before possiibly calling the onPointerUpdate
          // to avoid a recursive loop of calls caused by the impossibility to update the prevPointerEvent
          prevPointerEvent = nextPointerEvent;
          if (settings && settings.onPointerUpdate && hasPointerEventChanged(tempPrev, nextPointerEvent)) {
            settings.onPointerUpdate(nextPointerEvent);
          }
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
