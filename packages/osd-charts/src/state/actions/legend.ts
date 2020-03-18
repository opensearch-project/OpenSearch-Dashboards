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

import { XYChartSeriesIdentifier } from '../../chart_types/xy_chart/utils/series';

/** @internal */
export const ON_TOGGLE_LEGEND = 'ON_TOGGLE_LEGEND';

/** @internal */
export const ON_LEGEND_ITEM_OVER = 'ON_LEGEND_ITEM_OVER';

/** @internal */
export const ON_LEGEND_ITEM_OUT = 'ON_LEGEND_ITEM_OUT';

/** @internal */
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
  legendItemId: XYChartSeriesIdentifier;
}

/** @internal */
export function onToggleLegend(): ToggleLegendAction {
  return { type: ON_TOGGLE_LEGEND };
}

/** @internal */
export function onLegendItemOverAction(legendItemKey: string | null): LegendItemOverAction {
  return { type: ON_LEGEND_ITEM_OVER, legendItemKey };
}

/** @internal */
export function onLegendItemOutAction(): LegendItemOutAction {
  return { type: ON_LEGEND_ITEM_OUT };
}

/** @internal */
export function onToggleDeselectSeriesAction(legendItemId: XYChartSeriesIdentifier): ToggleDeselectSeriesAction {
  return { type: ON_TOGGLE_DESELECT_SERIES, legendItemId };
}

/** @internal */
export type LegendActions =
  | ToggleLegendAction
  | LegendItemOverAction
  | LegendItemOutAction
  | ToggleDeselectSeriesAction;
