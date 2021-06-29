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

import { ProjectedValues } from '../../../../specs/settings';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getGeometriesIndexKeysSelector } from './get_geometries_index_keys';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';

/** @internal */
export const getProjectedScaledValues = createCustomCachedSelector(
  [getOrientedProjectedPointerPositionSelector, computeSeriesGeometriesSelector, getGeometriesIndexKeysSelector],
  (
    { x, y, verticalPanelValue, horizontalPanelValue },
    { scales: { xScale, yScales } },
    geometriesIndexKeys,
  ): ProjectedValues | undefined => {
    if (!xScale || x === -1) {
      return;
    }

    const xValue = xScale.invertWithStep(x, geometriesIndexKeys);
    if (!xValue) {
      return;
    }

    return {
      x: xValue.value,
      y: [...yScales.entries()].map(([groupId, yScale]) => {
        return { value: yScale.invert(y), groupId };
      }),
      smVerticalValue: verticalPanelValue,
      smHorizontalValue: horizontalPanelValue,
    };
  },
);
