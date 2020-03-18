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
import { TooltipInfo } from '../../../../components/tooltip/types';
import { valueGetterFunction } from './scenegraph';
import { percentValueGetter, sumValueGetter } from '../../layout/config/config';
import { getPieSpecOrNull } from './pie_spec';
import { getPickedShapes } from './picked_shapes';

const EMPTY_TOOLTIP = Object.freeze({
  header: null,
  values: [],
});

/** @internal */
export const getTooltipInfoSelector = createCachedSelector(
  [getPieSpecOrNull, getPickedShapes],
  (pieSpec, pickedShapes): TooltipInfo => {
    if (!pieSpec) {
      return EMPTY_TOOLTIP;
    }
    const { valueGetter, valueFormatter, layers: labelFormatters } = pieSpec;
    if (!valueFormatter || !labelFormatters) {
      return EMPTY_TOOLTIP;
    }

    const tooltipInfo: TooltipInfo = {
      header: null,
      values: [],
    };

    const valueGetterFun = valueGetterFunction(valueGetter);
    const primaryValueGetterFun = valueGetterFun === percentValueGetter ? sumValueGetter : valueGetterFun;
    pickedShapes.forEach((shape) => {
      const labelFormatter = labelFormatters[shape.depth - 1];
      const formatter = labelFormatter?.nodeLabel;

      tooltipInfo.values.push({
        label: formatter ? formatter(shape.dataName) : shape.dataName,
        color: shape.fillColor,
        isHighlighted: false,
        isVisible: true,
        seriesIdentifier: {
          specId: pieSpec.id,
          key: pieSpec.id,
        },
        value: `${valueFormatter(primaryValueGetterFun(shape))} (${pieSpec.percentFormatter(
          percentValueGetter(shape),
        )})`,
        valueAccessor: shape.depth,
      });
    });

    return tooltipInfo;
  },
)((state) => state.chartId);
