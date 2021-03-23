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

import { TooltipInfo } from '../../../../components/tooltip/types';
import { LabelAccessor, ValueFormatter } from '../../../../utils/common';
import { percentValueGetter, sumValueGetter } from '../config';
import { QuadViewModel, ValueGetter } from '../types/viewmodel_types';
import { valueGetterFunction } from './scenegraph';

/** @internal */
export const EMPTY_TOOLTIP = Object.freeze({
  header: null,
  values: [],
});

/** @internal */
export function getTooltipInfo(
  pickedShapes: QuadViewModel[],
  labelFormatters: (LabelAccessor | undefined)[],
  valueGetter: ValueGetter,
  valueFormatter: ValueFormatter,
  percentFormatter: ValueFormatter,
  id: string,
): TooltipInfo {
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
    const formatter = labelFormatters[shape.depth - 1];
    const value = primaryValueGetterFun(shape);

    tooltipInfo.values.push({
      label: formatter ? formatter(shape.dataName) : shape.dataName,
      color: shape.fillColor,
      isHighlighted: false,
      isVisible: true,
      seriesIdentifier: {
        specId: id,
        key: id,
      },
      value,
      formattedValue: `${valueFormatter(value)} (${percentFormatter(percentValueGetter(shape))})`,
      valueAccessor: shape.depth,
      // the datum is omitted ATM due to the aggregated and nested nature of a partition section
    });
  });

  return tooltipInfo;
}
