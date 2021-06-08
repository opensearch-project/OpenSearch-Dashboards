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

import { LegendItem } from '../../../../common/legend';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getDeselectedSeriesSelector } from '../../../../state/selectors/get_deselected_data_series';
import { getColorScale } from './get_color_scale';
import { getSpecOrNull } from './heatmap_spec';

/** @internal */
export const computeLegendSelector = createCachedSelector(
  [getSpecOrNull, getColorScale, getDeselectedSeriesSelector],
  (spec, colorScale, deselectedDataSeries): LegendItem[] => {
    const legendItems: LegendItem[] = [];

    if (colorScale === null || spec === null) {
      return legendItems;
    }

    return colorScale.ticks.map((tick) => {
      const color = colorScale.config(tick);
      const seriesIdentifier = {
        key: String(tick),
        specId: String(tick),
      };

      return {
        color,
        label: `> ${spec.valueFormatter ? spec.valueFormatter(tick) : tick}`,
        seriesIdentifiers: [seriesIdentifier],
        isSeriesHidden: deselectedDataSeries.some((dataSeries) => dataSeries.key === seriesIdentifier.key),
        isToggleable: true,
        path: [{ index: 0, value: seriesIdentifier.key }],
        keys: [],
      };
    });
  },
)(getChartIdSelector);
