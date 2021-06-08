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

import { SeriesIdentifier } from '../common/series_id';
import { SettingsSpec, SortSeriesByConfig } from '../specs/settings';

/**
 * A compare function used to determine the order of the elements. It is expected to return
 * a negative value if first argument is less than second argument, zero if they're equal and a positive
 * value otherwise.
 * @public
 */
export type SeriesCompareFn = (siA: SeriesIdentifier, siB: SeriesIdentifier) => number;

/** @internal */
export const DEFAULT_SORTING_FN = () => {
  return 0;
};

/** @internal */
export function getRenderingCompareFn(
  // @ts-ignore
  sortSeriesBy: SettingsSpec['sortSeriesBy'],
  defaultSortFn?: SeriesCompareFn,
): SeriesCompareFn {
  return getCompareFn('rendering', sortSeriesBy, defaultSortFn);
}

/** @internal */
export function getLegendCompareFn(
  // @ts-ignore
  sortSeriesBy: SettingsSpec['sortSeriesBy'],
  defaultSortFn?: SeriesCompareFn,
): SeriesCompareFn {
  return getCompareFn('legend', sortSeriesBy, defaultSortFn);
}

/** @internal */
export function getTooltipCompareFn(
  // @ts-ignore
  sortSeriesBy: SettingsSpec['sortSeriesBy'],
  defaultSortFn?: SeriesCompareFn,
): SeriesCompareFn {
  return getCompareFn('tooltip', sortSeriesBy, defaultSortFn);
}

function getCompareFn(
  aspect: keyof SortSeriesByConfig,
  // @ts-ignore
  sortSeriesBy: SettingsSpec['sortSeriesBy'],
  defaultSortFn: SeriesCompareFn = DEFAULT_SORTING_FN,
): SeriesCompareFn {
  if (typeof sortSeriesBy === 'object') {
    return sortSeriesBy[aspect] ?? sortSeriesBy.default ?? defaultSortFn;
  }
  return sortSeriesBy ?? defaultSortFn;
}
