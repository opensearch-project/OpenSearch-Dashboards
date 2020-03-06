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
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getTooltipAnchorPosition } from '../../crosshair/crosshair_utils';
import { getProjectedPointerPositionSelector } from './get_projected_pointer_position';
import { getComputedScalesSelector } from './get_computed_scales';
import { getCursorBandPositionSelector } from './get_cursor_band';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { TooltipAnchorPosition } from '../../../../components/tooltip/utils';

export const getTooltipAnchorPositionSelector = createCachedSelector(
  [
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
    getCursorBandPositionSelector,
    getProjectedPointerPositionSelector,
    getComputedScalesSelector,
  ],
  (
    { chartDimensions },
    settings,
    cursorBandPosition,
    projectedPointerPosition,
    scales,
  ): TooltipAnchorPosition | null => {
    if (!cursorBandPosition) {
      return null;
    }
    return getTooltipAnchorPosition(
      chartDimensions,
      settings.rotation,
      cursorBandPosition,
      projectedPointerPosition,
      scales.xScale.isSingleValue(),
    );
  },
)(getChartIdSelector);
