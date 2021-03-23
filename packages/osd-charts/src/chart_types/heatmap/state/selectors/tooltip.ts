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

import { RGBtoString } from '../../../../common/color_library_wrappers';
import { TooltipInfo } from '../../../../components/tooltip/types';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getHeatmapConfigSelector } from './get_heatmap_config';
import { getSpecOrNull } from './heatmap_spec';
import { getPickedShapes } from './picked_shapes';

const EMPTY_TOOLTIP = Object.freeze({
  header: null,
  values: [],
});

/** @internal */
export const getTooltipInfoSelector = createCachedSelector(
  [getSpecOrNull, getHeatmapConfigSelector, getPickedShapes],
  (spec, config, pickedShapes): TooltipInfo => {
    if (!spec) {
      return EMPTY_TOOLTIP;
    }

    const tooltipInfo: TooltipInfo = {
      header: null,
      values: [],
    };

    if (Array.isArray(pickedShapes)) {
      pickedShapes
        .filter(({ visible }) => visible)
        .forEach((shape) => {
          // X-axis value
          tooltipInfo.values.push({
            label: config.xAxisLabel.name,
            color: 'transparent',
            isHighlighted: false,
            isVisible: true,
            seriesIdentifier: {
              specId: spec.id,
              key: spec.id,
            },
            value: `${shape.datum.x}`,
            formattedValue: config.xAxisLabel.formatter(shape.datum.x),
            datum: shape.datum,
          });

          // Y-axis value
          tooltipInfo.values.push({
            label: config.yAxisLabel.name,
            color: 'transparent',
            isHighlighted: false,
            isVisible: true,
            seriesIdentifier: {
              specId: spec.id,
              key: spec.id,
            },
            value: `${shape.datum.y}`,
            formattedValue: config.yAxisLabel.formatter(shape.datum.y),
            datum: shape.datum,
          });

          // Cell value
          tooltipInfo.values.push({
            label: spec.name ?? spec.id,
            color: RGBtoString(shape.fill.color),
            isHighlighted: false,
            isVisible: true,
            seriesIdentifier: {
              specId: spec.id,
              key: spec.id,
            },
            value: `${shape.value}`,
            formattedValue: `${shape.formatted}`,
            datum: shape.datum,
          });
        });
    } else {
      tooltipInfo.values.push({
        label: ``,
        color: 'transparent',
        isHighlighted: false,
        isVisible: true,
        seriesIdentifier: {
          specId: spec.id,
          key: spec.id,
        },
        value: `${pickedShapes.value}`,
        formattedValue: `${pickedShapes.value}`,
        datum: pickedShapes.value,
      });
    }

    return tooltipInfo;
  },
)(getChartIdSelector);
