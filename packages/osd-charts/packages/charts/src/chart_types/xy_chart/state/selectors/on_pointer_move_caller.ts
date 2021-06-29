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
import { PointerEvent, PointerOverEvent, PointerUpdateTrigger } from '../../../../specs';
import { PointerEventType } from '../../../../specs/constants';
import { GlobalChartState } from '../../../../state/chart_state';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { ComputedScales } from '../utils/types';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getGeometriesIndexKeysSelector } from './get_geometries_index_keys';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';
import { PointerPosition } from './get_projected_pointer_position';

const getPointerEventSelector = createCustomCachedSelector(
  [
    getChartIdSelector,
    getOrientedProjectedPointerPositionSelector,
    computeSeriesGeometriesSelector,
    getGeometriesIndexKeysSelector,
  ],
  (chartId, orientedProjectedPointerPosition, seriesGeometries, geometriesIndexKeys): PointerEvent =>
    getPointerEvent(chartId, orientedProjectedPointerPosition, seriesGeometries.scales, geometriesIndexKeys),
);

function getPointerEvent(
  chartId: string,
  orientedProjectedPointerPosition: PointerPosition,
  { xScale, yScales }: ComputedScales,
  geometriesIndexKeys: any[],
): PointerEvent {
  // update the cursorBandPosition based on chart configuration
  if (!xScale) {
    return {
      chartId,
      type: PointerEventType.Out,
    };
  }
  const { x, y, verticalPanelValue, horizontalPanelValue } = orientedProjectedPointerPosition;
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
    x: xValue.value,
    y: [...yScales.entries()].map(([groupId, yScale]) => {
      return { value: yScale.invert(y), groupId };
    }),
    smVerticalValue: verticalPanelValue,
    smHorizontalValue: horizontalPanelValue,
  };
}

function isSameEventValue(a: PointerOverEvent, b: PointerOverEvent, changeTrigger: PointerUpdateTrigger) {
  const checkX = changeTrigger === PointerUpdateTrigger.X || changeTrigger === PointerUpdateTrigger.Both;
  const checkY = changeTrigger === PointerUpdateTrigger.Y || changeTrigger === PointerUpdateTrigger.Both;

  return (
    (!checkX || (a.x === b.x && a.scale === b.scale && a.unit === b.unit)) &&
    (!checkY || a.y.every((y, i) => y.value === b.y[i]?.value))
  );
}

function hasPointerEventChanged(
  prevPointerEvent: PointerEvent,
  nextPointerEvent: PointerEvent | null,
  changeTrigger: PointerUpdateTrigger,
) {
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
    !isSameEventValue(prevPointerEvent, nextPointerEvent, changeTrigger)
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
    if (selector === null && state.chartType === ChartType.XYAxis) {
      selector = createCustomCachedSelector(
        [getSettingsSpecSelector, getPointerEventSelector, getChartIdSelector],
        ({ onPointerUpdate, pointerUpdateTrigger }, nextPointerEvent, chartId): void => {
          if (prevPointerEvent === null) {
            prevPointerEvent = {
              chartId,
              type: PointerEventType.Out,
            };
          }
          const tempPrev = {
            ...prevPointerEvent,
          };
          // we have to update the prevPointerEvents before possibly calling the onPointerUpdate
          // to avoid a recursive loop of calls caused by the impossibility to update the prevPointerEvent
          prevPointerEvent = nextPointerEvent;

          if (onPointerUpdate && hasPointerEventChanged(tempPrev, nextPointerEvent, pointerUpdateTrigger))
            onPointerUpdate(nextPointerEvent);
        },
      );
    }
    if (selector) {
      selector(state);
    }
  };
}
