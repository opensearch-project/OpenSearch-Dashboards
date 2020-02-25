import { SB_ACTION_PANEL } from '../utils/storybook';

export default {
  title: 'Interactions',
  parameters: {
    options: { selectedPanel: SB_ACTION_PANEL },
  },
};

export { example as barClicksAndHovers } from './1_bar_clicks';
export { example as areaPointClicksAndHovers } from './2_area_point_clicks';
export { example as linePointClicksAndHovers } from './3_line_point_clicks';
export { example as lineAreaBarPointClicksAndHovers } from './4_line_area_bar_clicks';
export { example as clicksHoversOnLegendItemsBarChart } from './5_clicks_legend_items_bar';
export { example as clickHoversOnLegendItemsAreaChart } from './6_clicks_legend_items_area';
export { example as clickHoversOnLegendItemsLineChart } from './7_clicks_legend_items_line';
export { example as clickHoversOnLegendItemsMixedChart } from './8_clicks_legend_items_mixed';
export { example as brushSelectionToolOnLinear } from './9_brush_selection_linear';

export { example as brushSelectionToolOnBarChartLinear } from './10_brush_selection_bar';
export { example as brushSelectionToolOnTimeCharts } from './11_brush_time';
export { example as brushSelectionToolOnHistogramTimeCharts } from './12_brush_time_hist';
export { example as brushDisabledOnOrdinalXAxis } from './13_brush_disabled_ordinal';
export { example as crosshairWithTimeAxis } from './14_crosshair_time';
export { example as renderChangeAction } from './15_render_change';
export { example as cursorUpdateAction } from './16_cursor_update_action';
export { example as pngExportAction } from './17_png_export';
