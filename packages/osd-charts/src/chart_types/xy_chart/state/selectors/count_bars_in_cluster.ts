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

import { SeriesType } from '../../../../specs';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { groupBy } from '../../utils/group_data_series';
import { SeriesDomainsAndData } from '../utils/types';
import { getBarIndexKey } from '../utils/utils';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';

/** @internal */
export const countBarsInClusterSelector = createCustomCachedSelector(
  [computeSeriesDomainsSelector, isHistogramModeEnabledSelector],
  countBarsInCluster,
);

/** @internal */
export function countBarsInCluster({ formattedDataSeries }: SeriesDomainsAndData, isHistogramEnabled: boolean): number {
  const barDataSeries = formattedDataSeries.filter(({ seriesType }) => seriesType === SeriesType.Bar);

  const dataSeriesGroupedByPanel = groupBy(
    barDataSeries,
    ['smVerticalAccessorValue', 'smHorizontalAccessorValue'],
    false,
  );

  const barIndexByPanel = Object.keys(dataSeriesGroupedByPanel).reduce<Record<string, string[]>>((acc, panelKey) => {
    const panelBars = dataSeriesGroupedByPanel[panelKey];
    const barDataSeriesByBarIndex = groupBy(
      panelBars,
      (d) => {
        return getBarIndexKey(d, isHistogramEnabled);
      },
      false,
    );

    acc[panelKey] = Object.keys(barDataSeriesByBarIndex);
    return acc;
  }, {});

  return Object.values(barIndexByPanel).reduce((acc, curr) => {
    return Math.max(acc, curr.length);
  }, 0);
}
