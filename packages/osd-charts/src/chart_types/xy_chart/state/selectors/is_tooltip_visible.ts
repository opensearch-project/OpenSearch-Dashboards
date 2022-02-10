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

import { TooltipInfo } from '../../../../components/tooltip/types';
import { getTooltipType } from '../../../../specs';
import { TooltipType } from '../../../../specs/constants';
import { GlobalChartState, PointerStates } from '../../../../state/chart_state';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { isExternalTooltipVisibleSelector } from '../../../../state/selectors/is_external_tooltip_visible';
import { Point } from '../../../../utils/point';
import { getProjectedPointerPositionSelector } from './get_projected_pointer_position';
import { getTooltipInfoSelector } from './get_tooltip_values_highlighted_geoms';
import { isAnnotationTooltipVisibleSelector } from './is_annotation_tooltip_visible';

const getTooltipTypeSelector = (state: GlobalChartState): TooltipType => getTooltipType(getSettingsSpecSelector(state));

const getPointerSelector = (state: GlobalChartState) => state.interactions.pointer;

/** @internal */
export const isTooltipVisibleSelector = createCustomCachedSelector(
  [
    getTooltipTypeSelector,
    getPointerSelector,
    getProjectedPointerPositionSelector,
    getTooltipInfoSelector,
    isAnnotationTooltipVisibleSelector,
    isExternalTooltipVisibleSelector,
  ],
  isTooltipVisible,
);

function isTooltipVisible(
  tooltipType: TooltipType,
  pointer: PointerStates,
  projectedPointerPosition: Point,
  tooltip: TooltipInfo,
  isAnnotationTooltipVisible: boolean,
  externalTooltipVisible: boolean,
) {
  const isLocalTooltop =
    tooltipType !== TooltipType.None &&
    pointer.down === null &&
    projectedPointerPosition.x > -1 &&
    projectedPointerPosition.y > -1 &&
    tooltip.values.length > 0 &&
    !isAnnotationTooltipVisible;
  const isExternalTooltip = externalTooltipVisible && tooltip.values.length > 0;
  return {
    visible: isLocalTooltop || isExternalTooltip,
    isExternal: externalTooltipVisible,
  };
}
