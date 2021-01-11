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

import { isVerticalAxis } from '../../chart_types/xy_chart/utils/axis_type_utils';
import { LEGEND_HIERARCHY_MARGIN } from '../../components/legend/legend_item';
import { BBox } from '../../utils/bbox/bbox_calculator';
import { CanvasTextBBoxCalculator } from '../../utils/bbox/canvas_text_bbox_calculator';
import { Position, isDefined } from '../../utils/commons';
import { GlobalChartState } from '../chart_state';
import { getChartIdSelector } from './get_chart_id';
import { getChartThemeSelector } from './get_chart_theme';
import { getLegendItemsLabelsSelector } from './get_legend_items_labels';
import { getSettingsSpecSelector } from './get_settings_specs';

const getParentDimensionSelector = (state: GlobalChartState) => state.parentDimensions;

const MARKER_WIDTH = 16;
const MARKER_LEFT_MARGIN = 4;
const VALUE_LEFT_MARGIN = 4;
const VERTICAL_PADDING = 4;

/** @internal */
export type LegendSizing = BBox & {
  margin: number;
  position: Position;
};

/** @internal */
export const getLegendSizeSelector = createCachedSelector(
  [getSettingsSpecSelector, getChartThemeSelector, getParentDimensionSelector, getLegendItemsLabelsSelector],
  (settings, theme, parentDimensions, labels): LegendSizing => {
    const bboxCalculator = new CanvasTextBBoxCalculator();
    const bbox = labels.reduce(
      (acc, { label, depth }) => {
        const labelBBox = bboxCalculator.compute(
          label,
          1,
          12,
          '"Inter UI", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
          1.5,
          400,
        );
        labelBBox.width += depth * LEGEND_HIERARCHY_MARGIN;
        if (acc.height < labelBBox.height) {
          acc.height = labelBBox.height;
        }
        if (acc.width < labelBBox.width) {
          acc.width = labelBBox.width;
        }
        return acc;
      },
      { width: 0, height: 0 },
    );

    bboxCalculator.destroy();
    const { showLegend, showLegendExtra: showLegendDisplayValue, legendPosition: position, legendAction } = settings;
    const {
      legend: { verticalWidth, spacingBuffer, margin },
    } = theme;
    if (!showLegend) {
      return { width: 0, height: 0, margin: 0, position };
    }
    const actionDimension = isDefined(legendAction) ? 24 : 0; // max width plus margin
    const legendItemWidth =
      MARKER_WIDTH + MARKER_LEFT_MARGIN + bbox.width + (showLegendDisplayValue ? VALUE_LEFT_MARGIN : 0);
    if (isVerticalAxis(position)) {
      const legendItemHeight = bbox.height + VERTICAL_PADDING * 2;
      return {
        width: Math.floor(Math.min(legendItemWidth + spacingBuffer + actionDimension, verticalWidth)),
        height: legendItemHeight,
        margin,
        position,
      };
    }
    const isSingleLine = (parentDimensions.width - 20) / 200 > labels.length;
    return {
      height: isSingleLine ? bbox.height + 16 : bbox.height * 2 + 24,
      width: Math.floor(Math.min(legendItemWidth + spacingBuffer + actionDimension, verticalWidth)),
      margin,
      position,
    };
  },
)(getChartIdSelector);
