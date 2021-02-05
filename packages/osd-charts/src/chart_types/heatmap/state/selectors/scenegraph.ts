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

import { measureText } from '../../../../common/text_utils';
import { SettingsSpec } from '../../../../specs';
import { RecursivePartial, mergePartial } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { config as defaultConfig } from '../../layout/config/config';
import { Config } from '../../layout/types/config_types';
import { ShapeViewModel, nullShapeViewModel } from '../../layout/types/viewmodel_types';
import { shapeViewModel } from '../../layout/viewmodel/viewmodel';
import { HeatmapSpec } from '../../specs';
import { HeatmapTable } from './compute_chart_dimensions';
import { ColorScaleType } from './get_color_scale';
import { GridHeightParams } from './get_grid_full_height';

/** @internal */
export function render(
  spec: HeatmapSpec,
  settingsSpec: SettingsSpec,
  chartDimensions: Dimensions,
  heatmapTable: HeatmapTable,
  colorScale: ColorScaleType,
  filterRanges: Array<[number, number | null]>,
  gridHeightParams: GridHeightParams,
): ShapeViewModel {
  const textMeasurer = document.createElement('canvas');
  const textMeasurerCtx = textMeasurer.getContext('2d');
  if (!textMeasurerCtx) {
    return nullShapeViewModel();
  }
  const { width, height } = chartDimensions;
  const { config: specConfig } = spec;
  const partialConfig: RecursivePartial<Config> = { ...specConfig, width, height };
  const config = mergePartial<Config>(defaultConfig, partialConfig);
  return shapeViewModel(
    measureText(textMeasurerCtx),
    spec,
    config,
    settingsSpec,
    chartDimensions,
    heatmapTable,
    colorScale,
    filterRanges,
    gridHeightParams,
  );
}
