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

import { SB_KNOBS_PANEL } from '../utils/storybook';

export default {
  title: 'Area Chart',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { Example as basic } from './1_basic';
export { Example as withTimeXAxis } from './2_with_time';
export { Example as withLinearXAxis } from './3_with_linear';
export { Example as withLogYAxis } from './4_with_log';
export { Example as with4Axes } from './5_with_4_axes';
export { Example as withAxisAndLegend } from './6_with_axis_and_legend';
export { Example as stacked } from './7_stacked';
export { Example as stackedPercentage } from './8_stacked_percentage';
export { Example as stackedPercentageWithZeros } from './8_stacked_percentage_zeros';
export { Example as stackedSeparateSpecs } from './9_stacked_separate_specs';
export { Example as stackedSameNaming } from './10_stacked_same_naming';
export { Example as bandArea } from './13_band_area';
export { Example as stackedBand } from './14_stacked_band';
export { Example as stackedGrouped } from './15_stacked_grouped';
export { Example as withNegativeValues } from './17_negative';
export { Example as withNegativeAndPositive } from './18_negative_positive';
export { Example as withNegativeBand } from './19_negative_band';

export { Example as testLinear } from './11_test_linear';
export { Example as testTime } from './12_test_time';
export { Example as testStackedWithMissingValues } from './16_test_stacked_with_missing';
