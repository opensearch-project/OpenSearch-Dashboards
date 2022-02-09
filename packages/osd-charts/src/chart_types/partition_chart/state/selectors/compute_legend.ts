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

import { LegendItem } from '../../../../common/legend';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getLegendConfigSelector } from '../../../../state/selectors/get_legend_config_selector';
import { getLegendItems } from '../../layout/utils/legend';
import { partitionMultiGeometries } from './geometries';
import { getPartitionSpecs } from './get_partition_specs';

/** @internal */
export const computeLegendSelector = createCustomCachedSelector(
  [getPartitionSpecs, getLegendConfigSelector, partitionMultiGeometries],
  (specs, { flatLegend, legendMaxDepth, legendPosition }, geometries): LegendItem[] =>
    specs.flatMap((partitionSpec, i) => {
      const quadViewModel = geometries.filter((g) => g.index === i).flatMap((g) => g.quadViewModel);
      return getLegendItems(
        partitionSpec.id,
        partitionSpec.layers,
        flatLegend,
        legendMaxDepth,
        legendPosition,
        quadViewModel,
      );
    }),
);
