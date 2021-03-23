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

import { LegendItemExtraValues } from '../../../../common/legend';
import { SeriesKey } from '../../../../common/series_id';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getExtraValueMap } from '../../layout/viewmodel/hierarchy_of_arrays';
import { getPartitionSpec } from './partition_spec';
import { getTrees } from './tree';

/** @internal */
export const getLegendItemsExtra = createCachedSelector(
  [getPartitionSpec, getSettingsSpecSelector, getTrees],
  (spec, { legendMaxDepth }, trees): Map<SeriesKey, LegendItemExtraValues> => {
    return spec && !Number.isNaN(legendMaxDepth) && legendMaxDepth > 0
      ? getExtraValueMap(spec.layers, spec.valueFormatter, trees[0].tree, legendMaxDepth) // singleton! wrt inner small multiples
      : new Map<SeriesKey, LegendItemExtraValues>();
  },
)(getChartIdSelector);
