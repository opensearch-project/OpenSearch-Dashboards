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

import { TooltipInfo } from '../../../../components/tooltip/types';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { EMPTY_TOOLTIP, getTooltipInfo } from '../../layout/viewmodel/tooltip_info';
import { getPartitionSpec } from './partition_spec';
import { getPickedShapes } from './picked_shapes';

/** @internal */
export const getTooltipInfoSelector = createCachedSelector(
  [getPartitionSpec, getPickedShapes],
  (spec, pickedShapes): TooltipInfo => {
    return spec
      ? getTooltipInfo(
          pickedShapes,
          spec.layers.map((l) => l.nodeLabel),
          spec.valueGetter,
          spec.valueFormatter,
          spec.percentFormatter,
          spec.id,
        )
      : EMPTY_TOOLTIP;
  },
)(getChartIdSelector);
