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

import { SB_ACTION_PANEL } from '../utils/storybook';

export default {
  title: 'Interactions',
  parameters: {
    options: { selectedPanel: SB_ACTION_PANEL },
  },
};

export { Example as barClicksAndHovers } from './1_bar_clicks';
export { Example as areaPointClicksAndHovers } from './2_area_point_clicks';
export { Example as linePointClicksAndHovers } from './3_line_point_clicks';
export { Example as lineAreaBarPointClicksAndHovers } from './4_line_area_bar_clicks';
export { Example as sunburstSliceClicks } from './4_sunburst_slice_clicks';
export { Example as clicksHoversOnLegendItemsBarChart } from './5_clicks_legend_items_bar';
export { Example as clickHoversOnLegendItemsAreaChart } from './6_clicks_legend_items_area';
export { Example as clickHoversOnLegendItemsLineChart } from './7_clicks_legend_items_line';
export { Example as clickHoversOnLegendItemsMixedChart } from './8_clicks_legend_items_mixed';
export { Example as brushSelectionToolOnLinear } from './9_brush_selection_linear';
export { Example as brushTool } from './9a_brush_selection_linear';

export { Example as brushSelectionToolOnBarChartLinear } from './10_brush_selection_bar';
export { Example as brushSelectionToolOnBarChartHistogram } from './10a_brush_selection_bar_hist';
export { Example as brushSelectionToolOnTimeCharts } from './11_brush_time';
export { Example as brushSelectionToolOnHistogramTimeCharts } from './12_brush_time_hist';
export { Example as brushDisabledOnOrdinalXAxis } from './13_brush_disabled_ordinal';
export { Example as crosshairWithTimeAxis } from './14_crosshair_time';
export { Example as renderChangeAction } from './15_render_change';
export { Example as cursorUpdateAction } from './16_cursor_update_action';
export { Example as pngExportAction } from './17_png_export';
