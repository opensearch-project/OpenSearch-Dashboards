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

import { Dimensions } from '../../../../utils/dimensions';
import createCachedSelector from 're-reselect';
import { Point } from '../../../../utils/point';
import { Scale } from '../../../../scales';
import { isLineAreaOnlyChart } from '../utils';
import { getCursorBandPosition } from '../../crosshair/crosshair_utils';
import { SettingsSpec, PointerEvent } from '../../../../specs/settings';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { BasicSeriesSpec } from '../../utils/specs';
import { countBarsInClusterSelector } from './count_bars_in_cluster';
import { getSeriesSpecsSelector } from './get_specs';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';
import { isTooltipSnapEnableSelector } from './is_tooltip_snap_enabled';
import { getGeometriesIndexKeysSelector } from './get_geometries_index_keys';
import { GlobalChartState } from '../../../../state/chart_state';
import { isValidPointerOverEvent } from '../../../../utils/events';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getExternalPointerEventStateSelector = (state: GlobalChartState) => state.externalEvents.pointer;

/** @internal */
export const getCursorBandPositionSelector = createCachedSelector(
  [
    getOrientedProjectedPointerPositionSelector,
    getExternalPointerEventStateSelector,
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
    computeSeriesGeometriesSelector,
    getSeriesSpecsSelector,
    countBarsInClusterSelector,
    isTooltipSnapEnableSelector,
    getGeometriesIndexKeysSelector,
  ],
  (
    orientedProjectedPointerPosition,
    externalPointerEvent,
    chartDimensions,
    settingsSpec,
    seriesGeometries,
    seriesSpec,
    totalBarsInCluster,
    isTooltipSnapEnabled,
    geometriesIndexKeys,
  ) => {
    return getCursorBand(
      orientedProjectedPointerPosition,
      externalPointerEvent,
      chartDimensions.chartDimensions,
      settingsSpec,
      seriesGeometries.scales.xScale,
      seriesSpec,
      totalBarsInCluster,
      isTooltipSnapEnabled,
      geometriesIndexKeys,
    );
  },
)(getChartIdSelector);

function getCursorBand(
  orientedProjectedPoinerPosition: Point,
  externalPointerEvent: PointerEvent | null,
  chartDimensions: Dimensions,
  settingsSpec: SettingsSpec,
  xScale: Scale | undefined,
  seriesSpecs: BasicSeriesSpec[],
  totalBarsInCluster: number,
  isTooltipSnapEnabled: boolean,
  geometriesIndexKeys: any[],
): (Dimensions & { visible: boolean }) | undefined {
  // update che cursorBandPosition based on chart configuration
  const isLineAreaOnly = isLineAreaOnlyChart(seriesSpecs);
  if (!xScale) {
    return;
  }
  let pointerPosition = orientedProjectedPoinerPosition;
  let xValue;
  if (isValidPointerOverEvent(xScale, externalPointerEvent)) {
    const x = xScale.pureScale(externalPointerEvent.value);

    if (x == null || x > chartDimensions.width + chartDimensions.left) {
      return;
    }
    pointerPosition = { x, y: 0 };
    xValue = {
      value: externalPointerEvent.value,
      withinBandwidth: true,
    };
  } else {
    xValue = xScale.invertWithStep(orientedProjectedPoinerPosition.x, geometriesIndexKeys);
    if (!xValue) {
      return;
    }
  }
  return getCursorBandPosition(
    settingsSpec.rotation,
    chartDimensions,
    pointerPosition,
    {
      value: xValue.value,
      withinBandwidth: true,
    },
    isTooltipSnapEnabled,
    xScale,
    isLineAreaOnly ? 1 : totalBarsInCluster,
  );
}
