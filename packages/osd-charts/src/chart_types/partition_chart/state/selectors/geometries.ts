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
import { GlobalChartState } from '../../../../state/chart_state';
import { getSpecsFromStore } from '../../../../state/utils';
import { ChartTypes } from '../../..';
import { render } from './scenegraph';
import { nullShapeViewModel, ShapeViewModel } from '../../layout/types/viewmodel_types';
import { PartitionSpec } from '../../specs/index';
import { SpecTypes } from '../../../../specs/settings';
import { getTree } from './tree';
import { getChartContainerDimensionsSelector } from '../../../../state/selectors/get_chart_container_dimensions';

const getSpecs = (state: GlobalChartState) => state.specs;

/** @internal */
export const partitionGeometries = createCachedSelector(
  [getSpecs, getChartContainerDimensionsSelector, getTree],
  (specs, parentDimensions, tree): ShapeViewModel => {
    const pieSpecs = getSpecsFromStore<PartitionSpec>(specs, ChartTypes.Partition, SpecTypes.Series);
    return pieSpecs.length === 1 ? render(pieSpecs[0], parentDimensions, tree) : nullShapeViewModel();
  },
)((state) => state.chartId);
