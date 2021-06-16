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

import { SettingsSpec } from '../../../../specs/settings';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getOrientedXPosition, getOrientedYPosition } from '../../utils/interactions';
import { getPanelSize } from '../../utils/panel';
import { computeSmallMultipleScalesSelector, SmallMultipleScales } from './compute_small_multiple_scales';
import { getProjectedPointerPositionSelector, PointerPosition } from './get_projected_pointer_position';

/** @internal */
export const getOrientedProjectedPointerPositionSelector = createCustomCachedSelector(
  [getProjectedPointerPositionSelector, getSettingsSpecSelector, computeSmallMultipleScalesSelector],
  getOrientedProjectedPointerPosition,
);

function getOrientedProjectedPointerPosition(
  { x, y, horizontalPanelValue, verticalPanelValue }: PointerPosition,
  settingsSpec: SettingsSpec,
  scales: SmallMultipleScales,
): PointerPosition {
  // get the oriented projected pointer position
  const panel = getPanelSize(scales);
  return {
    x: getOrientedXPosition(x, y, settingsSpec.rotation, panel),
    y: getOrientedYPosition(x, y, settingsSpec.rotation, panel),
    horizontalPanelValue,
    verticalPanelValue,
  };
}
