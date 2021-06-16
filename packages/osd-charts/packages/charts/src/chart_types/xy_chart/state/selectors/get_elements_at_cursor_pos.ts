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

import { PointerEvent } from '../../../../specs';
import { GlobalChartState } from '../../../../state/chart_state';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { isValidPointerOverEvent } from '../../../../utils/events';
import { IndexedGeometry } from '../../../../utils/geometry';
import { ChartDimensions } from '../../utils/dimensions';
import { IndexedGeometryMap } from '../../utils/indexed_geometry_map';
import { sortClosestToPoint } from '../utils/common';
import { ComputedScales } from '../utils/types';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getComputedScalesSelector } from './get_computed_scales';
import { getGeometriesIndexSelector } from './get_geometries_index';
import { getGeometriesIndexKeysSelector } from './get_geometries_index_keys';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';
import { PointerPosition } from './get_projected_pointer_position';

const getExternalPointerEventStateSelector = (state: GlobalChartState) => state.externalEvents.pointer;

/** @internal */
export const getElementAtCursorPositionSelector = createCustomCachedSelector(
  [
    getOrientedProjectedPointerPositionSelector,
    getComputedScalesSelector,
    getGeometriesIndexKeysSelector,
    getGeometriesIndexSelector,
    getExternalPointerEventStateSelector,
    computeChartDimensionsSelector,
  ],
  getElementAtCursorPosition,
);

function getElementAtCursorPosition(
  orientedProjectedPointerPosition: PointerPosition,
  scales: ComputedScales,
  geometriesIndexKeys: (string | number)[],
  geometriesIndex: IndexedGeometryMap,
  externalPointerEvent: PointerEvent | null,
  { chartDimensions }: ChartDimensions,
): IndexedGeometry[] {
  if (isValidPointerOverEvent(scales.xScale, externalPointerEvent)) {
    const x = scales.xScale.pureScale(externalPointerEvent.value);

    if (x == null || x > chartDimensions.width + chartDimensions.left || x < 0) {
      return [];
    }
    // TODO: Handle external event with spatial points
    return geometriesIndex.find(externalPointerEvent.value, { x: -1, y: -1 });
  }
  const xValue = scales.xScale.invertWithStep(orientedProjectedPointerPosition.x, geometriesIndexKeys);
  if (!xValue) {
    return [];
  }
  // get the elements at cursor position
  return geometriesIndex
    .find(
      xValue?.value,
      orientedProjectedPointerPosition,
      orientedProjectedPointerPosition.horizontalPanelValue,
      orientedProjectedPointerPosition.verticalPanelValue,
    )
    .sort(sortClosestToPoint(orientedProjectedPointerPosition));
}
