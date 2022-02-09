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

import { CategoryKey } from '../../common/category';
import { SeriesIdentifier } from '../../common/series_id';

/** @internal */
export const ON_LEGEND_ITEM_OVER = 'ON_LEGEND_ITEM_OVER';

/** @internal */
export const ON_LEGEND_ITEM_OUT = 'ON_LEGEND_ITEM_OUT';

/** @internal */
export const ON_TOGGLE_DESELECT_SERIES = 'ON_TOGGLE_DESELECT_SERIES';

/** @public */
export type LegendPathElement = { index: number; value: CategoryKey };

/**
 * This is an array that defines a path for chart types characterized by hierarchical breakdown of the data, currently
 * partition charts. With partition charts,
 *   - element index 0 is the `groupBy` breakdown: a panel `index` number, and a stringified category `value`
 *      - if the chart is a singleton, ie. there's no trellising, it's `{index: 0, value: NULL_SMALL_MULTIPLES_KEY}`
 *   - element index 1 represents the singular root of a specific pie etc. chart `{index: 0, value: HIERARCHY_ROOT_KEY}`
 *   - element index 2 represents the primary breakdown categories within a pie/treemap/etc.
 *   - element index 3 the next level breakdown, if any (eg. a ring around the pie, ie. sunburst)
 *   etc.
 * @public
 */
export type LegendPath = LegendPathElement[];

interface LegendItemOverAction {
  type: typeof ON_LEGEND_ITEM_OVER;
  legendPath: LegendPath;
}

interface LegendItemOutAction {
  type: typeof ON_LEGEND_ITEM_OUT;
}

/** @internal */
export interface ToggleDeselectSeriesAction {
  type: typeof ON_TOGGLE_DESELECT_SERIES;
  legendItemIds: SeriesIdentifier[];
  negate: boolean;
}

/** @internal */
export function onLegendItemOverAction(legendPath: LegendPath): LegendItemOverAction {
  return { type: ON_LEGEND_ITEM_OVER, legendPath };
}

/** @internal */
export function onLegendItemOutAction(): LegendItemOutAction {
  return { type: ON_LEGEND_ITEM_OUT };
}

/** @internal */
export function onToggleDeselectSeriesAction(
  legendItemIds: SeriesIdentifier[],
  negate = false,
): ToggleDeselectSeriesAction {
  return { type: ON_TOGGLE_DESELECT_SERIES, legendItemIds, negate };
}

/** @internal */
export type LegendActions = LegendItemOverAction | LegendItemOutAction | ToggleDeselectSeriesAction;
