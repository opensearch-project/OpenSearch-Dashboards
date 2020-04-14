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
import { geometries } from './geometries';
import { GlobalChartState } from '../../../../state/chart_state';
import { LayerValue } from '../../../../specs';
import { BulletViewModel } from '../../layout/types/viewmodel_types';

function getCurrentPointerPosition(state: GlobalChartState) {
  return state.interactions.pointer.current.position;
}

/** @internal */
export const getPickedShapes = createCachedSelector(
  [geometries, getCurrentPointerPosition],
  (geoms, pointerPosition): BulletViewModel[] => {
    const picker = geoms.pickQuads;
    const chartCenter = geoms.chartCenter;
    const x = pointerPosition.x - chartCenter.x;
    const y = pointerPosition.y - chartCenter.y;
    return picker(x, y);
  },
)((state) => state.chartId);

/** @internal */
export const getPickedShapesLayerValues = createCachedSelector(
  [getPickedShapes],
  (pickedShapes): Array<Array<LayerValue>> => {
    const elements = pickedShapes.map<Array<LayerValue>>((model) => {
      const values: Array<LayerValue> = [];
      values.push({
        groupByRollup: 'Actual',
        value: model.actual,
      });
      return values.reverse();
    });
    return elements;
  },
)((state) => state.chartId);
