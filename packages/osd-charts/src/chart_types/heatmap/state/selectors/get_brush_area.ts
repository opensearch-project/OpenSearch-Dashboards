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

import createCachedSelector from 're-reselect';

import { BrushAxis } from '../../../../specs';
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { Dimensions } from '../../../../utils/dimensions';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';

const getMouseDownPosition = (state: GlobalChartState) => state.interactions.pointer.down;
const getIsDragging = (state: GlobalChartState) => state.interactions.pointer.dragging;
const getCurrentPointerPosition = (state: GlobalChartState) => state.interactions.pointer.current.position;

/** @internal */
export const getBrushAreaSelector = createCachedSelector(
  [
    getIsDragging,
    getMouseDownPosition,
    getCurrentPointerPosition,
    getChartRotationSelector,
    getSettingsSpecSelector,
    computeChartDimensionsSelector,
  ],
  (isDragging, mouseDownPosition, end, chartRotation, { brushAxis }, chartDimensions): Dimensions | null => {
    if (!isDragging || !mouseDownPosition) {
      return null;
    }
    const start = {
      x: mouseDownPosition.position.x - chartDimensions.left,
      y: mouseDownPosition.position.y,
    };
    switch (brushAxis) {
      case BrushAxis.Both:
      default:
        return { top: start.y, left: start.x, width: end.x - start.x - chartDimensions.left, height: end.y - start.y };
    }
  },
)(getChartIdSelector);
