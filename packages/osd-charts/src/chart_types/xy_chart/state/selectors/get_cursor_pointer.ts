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
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getHighlightedGeomsSelector } from './get_tooltip_values_highlighted_geoms';
import { GlobalChartState } from '../../../../state/chart_state';
import { isBrushAvailableSelector } from './is_brush_available';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getCurrentPointerPositionSelector = (state: GlobalChartState) => state.interactions.pointer.current.position;

export const getPointerCursorSelector = createCachedSelector(
  [
    getHighlightedGeomsSelector,
    getSettingsSpecSelector,
    getCurrentPointerPositionSelector,
    computeChartDimensionsSelector,
    isBrushAvailableSelector,
  ],
  (highlightedGeometries, settingsSpec, currentPointerPosition, { chartDimensions }, isBrushAvailable): string => {
    const { x, y } = currentPointerPosition;
    // get positions relative to chart
    const xPos = x - chartDimensions.left;
    const yPos = y - chartDimensions.top;

    // limit cursorPosition to chartDimensions
    if (xPos < 0 || xPos >= chartDimensions.width) {
      return 'default';
    }
    if (yPos < 0 || yPos >= chartDimensions.height) {
      return 'default';
    }
    if (highlightedGeometries.length > 0 && (settingsSpec.onElementClick || settingsSpec.onElementOver)) {
      return 'pointer';
    }
    return isBrushAvailable ? 'crosshair' : 'default';
  },
)(getChartIdSelector);
