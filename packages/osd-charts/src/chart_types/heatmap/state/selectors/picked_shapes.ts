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

import { GlobalChartState } from '../../../../state/chart_state';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { Cell, TextBox } from '../../layout/types/viewmodel_types';
import { geometries } from './geometries';

function getCurrentPointerPosition(state: GlobalChartState) {
  return state.interactions.pointer.current.position;
}

/** @internal */
export const getPickedShapes = createCustomCachedSelector(
  [geometries, getCurrentPointerPosition],
  (geoms, pointerPosition): Cell[] | TextBox => {
    const picker = geoms.pickQuads;
    const { x, y } = pointerPosition;
    return picker(x, y);
  },
);
