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

import { computeChartDimensionsSelector } from '../../chart_types/xy_chart/state/selectors/compute_chart_dimensions';
import { getComputedScalesSelector } from '../../chart_types/xy_chart/state/selectors/get_computed_scales';
import { PointerEventType } from '../../specs';
import { GlobalChartState } from '../chart_state';
import { createCustomCachedSelector } from '../create_selector';
import { getSettingsSpecSelector } from './get_settings_specs';
import { hasExternalEventSelector } from './has_external_pointer_event';

const getExternalEventPointer = ({ externalEvents: { pointer } }: GlobalChartState) => pointer;

/** @internal */
export const isExternalTooltipVisibleSelector = createCustomCachedSelector(
  [
    getSettingsSpecSelector,
    hasExternalEventSelector,
    getExternalEventPointer,
    getComputedScalesSelector,
    computeChartDimensionsSelector,
  ],
  ({ externalPointerEvents }, hasExternalEvent, pointer, { xScale }, { chartDimensions }): boolean => {
    if (!pointer || pointer.type !== PointerEventType.Over || externalPointerEvents.tooltip?.visible === false) {
      return false;
    }
    const x = xScale.pureScale(pointer.x);

    if (x == null || x > chartDimensions.width + chartDimensions.left || x < 0) {
      return false;
    }
    return hasExternalEvent && externalPointerEvents.tooltip?.visible === true;
  },
);
