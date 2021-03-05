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

import { CategoryKey } from '../../../../common/category';
import { getChartContainerDimensionsSelector } from '../../../../state/selectors/get_chart_container_dimensions';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { Dimensions } from '../../../../utils/dimensions';
import { nullShapeViewModel, QuadViewModel, ShapeViewModel } from '../../layout/types/viewmodel_types';
import { getShapeViewModel } from '../../layout/viewmodel/scenegraph';
import { getPartitionSpecs } from './get_partition_specs';
import { getTree } from './tree';

/** @internal */
export const partitionMultiGeometries = createCachedSelector(
  [getPartitionSpecs, getChartContainerDimensionsSelector, getTree, getChartThemeSelector],
  (partitionSpecs, parentDimensions, tree, { background }): ShapeViewModel[] => {
    return partitionSpecs.map((spec) => getShapeViewModel(spec, parentDimensions, tree, background.color));
  },
)((state) => state.chartId);

function focusRect(quadViewModel: QuadViewModel[], { left, width }: Dimensions, drilldown: CategoryKey[]) {
  return drilldown.length === 0
    ? { x0: left, x1: left + width }
    : quadViewModel.find(
        ({ path }) => path.length === drilldown.length && path.every(({ value }, i) => value === drilldown[i]),
      ) ?? { x0: left, x1: left + width };
}

/** @internal */
export const partitionDrilldownFocus = createCachedSelector(
  [
    partitionMultiGeometries,
    getChartContainerDimensionsSelector,
    (state) => state.interactions.drilldown,
    (state) => state.interactions.prevDrilldown,
  ],
  (multiGeometries, chartDimensions, drilldown, prevDrilldown) =>
    multiGeometries.map(({ quadViewModel }) => {
      const { x0: currentFocusX0, x1: currentFocusX1 } = focusRect(quadViewModel, chartDimensions, drilldown);
      const { x0: prevFocusX0, x1: prevFocusX1 } = focusRect(quadViewModel, chartDimensions, prevDrilldown);
      return { currentFocusX0, currentFocusX1, prevFocusX0, prevFocusX1 };
    }),
)((state) => state.chartId);

/** @internal */
export const partitionGeometries = createCachedSelector(
  [partitionMultiGeometries],
  (multiGeometries: ShapeViewModel[]) => {
    return [
      multiGeometries.length > 0 // singleton!
        ? multiGeometries[0]
        : nullShapeViewModel(),
    ];
  },
)((state) => state.chartId);
