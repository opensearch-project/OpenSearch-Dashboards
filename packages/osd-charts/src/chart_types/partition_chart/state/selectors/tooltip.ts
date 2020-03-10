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
import { INPUT_KEY } from '../../layout/utils/group_by_rollup';
import { TooltipInfo } from '../../../../components/tooltip/types';
import { getPieSpecOrNull } from './pie_spec';
import { getPickedShapes } from './picked_shapes';

function getValueFormatter(state: GlobalChartState) {
  return getPieSpecOrNull(state)?.valueFormatter;
}

function getLabelFormatters(state: GlobalChartState) {
  return getPieSpecOrNull(state)?.layers;
}

const EMPTY_TOOLTIP = Object.freeze({
  header: null,
  values: [],
});

export const getTooltipInfoSelector = createCachedSelector(
  [getPieSpecOrNull, getPickedShapes, getValueFormatter, getLabelFormatters],
  (pieSpec, pickedShapes, valueFormatter, labelFormatters): TooltipInfo => {
    if (!pieSpec || !valueFormatter || !labelFormatters) {
      return EMPTY_TOOLTIP;
    }

    const datumIndices = new Set();
    const tooltipInfo: TooltipInfo = {
      header: null,
      values: [],
    };
    pickedShapes.forEach((shape) => {
      const node = shape.parent;
      const formatter = labelFormatters[shape.depth - 1] && labelFormatters[shape.depth - 1].nodeLabel;

      tooltipInfo.values.push({
        label: formatter ? formatter(shape.dataName) : shape.dataName,
        color: shape.fillColor,
        isHighlighted: false,
        isVisible: true,
        seriesIdentifier: {
          specId: pieSpec.id,
          key: pieSpec.id,
        },
        value: valueFormatter(shape.value),
      });
      const shapeNode = node.children.find(([key]) => key === shape.dataName);
      if (shapeNode) {
        const indices = shapeNode[1][INPUT_KEY] || [];
        indices.forEach((i) => datumIndices.add(i));
      }
    });

    return tooltipInfo;
  },
)((state) => state.chartId);
