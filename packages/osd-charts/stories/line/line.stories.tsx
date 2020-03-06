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

import { SB_SOURCE_PANEL } from '../utils/storybook';

export default {
  title: 'Line Chart',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as basic } from './1_basic';
export { example as withAxis } from './2_w_axis';
export { example as ordinalWithAxis } from './3_ordinal';
export { example as linearWithAxis } from './4_linear';
export { example as withAxisAndLegend } from './5_w_axis_and_legend';
export { example as curvedWithAxisAndLegend } from './6_curved';
export { example as multipleWithAxisAndLegend } from './7_multiple';
export { example as stackedWithAxisAndLegend } from './8_stacked';
export { example as multiSeriesWithLogValues } from './9_multi_series';
