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

import { GlobalChartState } from '../../../../state/chart_state';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { nullShapeViewModel, ShapeViewModel } from '../../layout/types/viewmodel_types';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getColorScale } from './get_color_scale';
import { getGridHeightParamsSelector } from './get_grid_full_height';
import { getHeatmapSpecSelector } from './get_heatmap_spec';
import { getHeatmapTableSelector } from './get_heatmap_table';
import { getLegendItemsLabelsSelector } from './get_legend_items_labels';
import { render } from './scenegraph';

const getDeselectedSeriesSelector = (state: GlobalChartState) => state.interactions.deselectedDataSeries;

/** @internal */
export const geometries = createCachedSelector(
  [
    getHeatmapSpecSelector,
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
    getHeatmapTableSelector,
    getColorScale,
    getLegendItemsLabelsSelector,
    getDeselectedSeriesSelector,
    getGridHeightParamsSelector,
  ],
  (
    heatmapSpec,
    chartDimensions,
    settingSpec,
    heatmapTable,
    colorScale,
    legendItems,
    deselectedSeries,
    gridHeightParams,
  ): ShapeViewModel => {
    const deselectedTicks = new Set(
      deselectedSeries.map(({ specId }) => {
        return Number(specId);
      }),
    );
    const { ticks } = colorScale;
    const ranges = ticks.reduce<Array<[number, number | null]>>((acc, d, i) => {
      if (deselectedTicks.has(d)) {
        const rangeEnd = i + 1 === ticks.length ? null : ticks[i + 1];
        acc.push([d, rangeEnd]);
      }
      return acc;
    }, []);

    return heatmapSpec
      ? render(heatmapSpec, settingSpec, chartDimensions, heatmapTable, colorScale, ranges, gridHeightParams)
      : nullShapeViewModel();
  },
)(getChartIdSelector);
