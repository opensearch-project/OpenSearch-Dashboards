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
import { getLegendItemsSelector } from './get_legend_items';
import { CanvasTextBBoxCalculator } from '../../utils/bbox/canvas_text_bbox_calculator';
import { BBox } from '../../utils/bbox/bbox_calculator';
import { getSettingsSpecSelector } from './get_settings_specs';
import { isVerticalAxis } from '../../chart_types/xy_chart/utils/axis_utils';
import { getChartThemeSelector } from './get_chart_theme';
import { GlobalChartState } from '../chart_state';
import { getItemLabel } from '../../chart_types/xy_chart/legend/legend';
import { getChartIdSelector } from './get_chart_id';

const getParentDimensionSelector = (state: GlobalChartState) => state.parentDimensions;

const legendItemLabelsSelector = createCachedSelector(
  [getSettingsSpecSelector, getLegendItemsSelector],
  (settings, legendItems): string[] => {
    const labels: string[] = [];
    const { showLegendExtra } = settings;
    legendItems.forEach((item) => {
      const labelY1 = getItemLabel(item, 'y1');
      if (item.displayValue.formatted.y1 !== null) {
        labels.push(`${labelY1}${showLegendExtra ? item.displayValue.formatted.y1 : ''}`);
      } else {
        labels.push(labelY1);
      }
      if (item.banded) {
        const labelY0 = getItemLabel(item, 'y0');
        if (item.displayValue.formatted.y0 !== null) {
          labels.push(`${labelY0}${showLegendExtra ? item.displayValue.formatted.y0 : ''}`);
        } else {
          labels.push(labelY0);
        }
      }
    });
    return labels;
  },
)(getChartIdSelector);

const MARKER_WIDTH = 16;
// const MARKER_HEIGHT = 16;
const MARKER_LEFT_MARGIN = 4;
const VALUE_LEFT_MARGIN = 4;
const VERTICAL_PADDING = 4;

export const getLegendSizeSelector = createCachedSelector(
  [getSettingsSpecSelector, getChartThemeSelector, getParentDimensionSelector, legendItemLabelsSelector],
  (settings, theme, parentDimensions, labels): BBox => {
    const bboxCalculator = new CanvasTextBBoxCalculator();
    const bbox = labels.reduce(
      (acc, label) => {
        const bbox = bboxCalculator.compute(
          label,
          1,
          12,
          '"Inter UI", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
          1.5,
          400,
        );
        if (acc.height < bbox.height) {
          acc.height = bbox.height;
        }
        if (acc.width < bbox.width) {
          acc.width = bbox.width;
        }
        return acc;
      },
      { width: 0, height: 0 },
    );

    bboxCalculator.destroy();
    const { showLegend, showLegendExtra: showLegendDisplayValue, legendPosition } = settings;
    const {
      legend: { verticalWidth, spacingBuffer },
    } = theme;
    if (!showLegend) {
      return { width: 0, height: 0 };
    }
    const legendItemWidth =
      MARKER_WIDTH + MARKER_LEFT_MARGIN + bbox.width + (showLegendDisplayValue ? VALUE_LEFT_MARGIN : 0);
    if (isVerticalAxis(legendPosition)) {
      const legendItemHeight = bbox.height + VERTICAL_PADDING * 2;
      return {
        width: Math.floor(Math.min(legendItemWidth + spacingBuffer, verticalWidth)),
        height: legendItemHeight,
      };
    } else {
      const isSingleLine = (parentDimensions.width - 20) / 200 > labels.length;
      return {
        height: isSingleLine ? bbox.height + 16 : bbox.height * 2 + 24,
        width: Math.floor(Math.min(legendItemWidth + spacingBuffer, verticalWidth)),
      };
    }
  },
)(getChartIdSelector);
