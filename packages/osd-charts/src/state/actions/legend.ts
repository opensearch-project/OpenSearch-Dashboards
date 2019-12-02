import { SeriesIdentifier } from '../../chart_types/xy_chart/utils/series';

export const ON_TOGGLE_LEGEND = 'ON_TOGGLE_LEGEND';
export const ON_LEGEND_ITEM_OVER = 'ON_LEGEND_ITEM_OVER';
export const ON_LEGEND_ITEM_OUT = 'ON_LEGEND_ITEM_OUT';
export const ON_TOGGLE_DESELECT_SERIES = 'ON_TOGGLE_DESELECT_SERIES';

interface ToggleLegendAction {
  type: typeof ON_TOGGLE_LEGEND;
}
interface LegendItemOverAction {
  type: typeof ON_LEGEND_ITEM_OVER;
  legendItemKey: string | null;
}
interface LegendItemOutAction {
  type: typeof ON_LEGEND_ITEM_OUT;
}

interface ToggleDeselectSeriesAction {
  type: typeof ON_TOGGLE_DESELECT_SERIES;
  legendItemId: SeriesIdentifier;
}

export function onToggleLegend(): ToggleLegendAction {
  return { type: ON_TOGGLE_LEGEND };
}

export function onLegendItemOverAction(legendItemKey: string | null): LegendItemOverAction {
  return { type: ON_LEGEND_ITEM_OVER, legendItemKey };
}

export function onLegendItemOutAction(): LegendItemOutAction {
  return { type: ON_LEGEND_ITEM_OUT };
}

export function onToggleDeselectSeriesAction(legendItemId: SeriesIdentifier): ToggleDeselectSeriesAction {
  return { type: ON_TOGGLE_DESELECT_SERIES, legendItemId };
}

export type LegendActions =
  | ToggleLegendAction
  | LegendItemOverAction
  | LegendItemOutAction
  | ToggleDeselectSeriesAction;
