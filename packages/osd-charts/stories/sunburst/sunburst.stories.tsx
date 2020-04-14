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
  title: 'Sunburst',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as mostBasic } from './1_simple';
export { example as valueFormatted } from './2_value_formatted';
export { example as valueFormattedWithCategoricalColorPalette } from './3_value_formatted_2';
export { example as withFillLabels } from './4_fill_labels';
export { example as donutChartWithFillLabels } from './5_donut';
export { example as withDirectTextLabels } from './6_pie_chart_labels';
export { example as someZeroValueSlice } from './7_zero_slice';
export { example as sunburstWithTwoLayers } from './8_sunburst_two_layers';
export { example as sunburstWithThreeLayers } from './9_sunburst_three_layers';

export { example as withTwoSlices } from './10_2_slice';
export { example as largeAndSmallSlices } from './11_small_large';
export { example as veryLargeAndSmall } from './12_very_small';
export { example as nearFullNearEmpty } from './13_empty';
export { example as fullAndZeroSlices } from './14_full_zero';
export { example as singleSlice } from './15_single';
export { example as singleSunburst } from './15_single_sunburst';
export { example as singleSmallSice } from './16_single_small';
export { example as singleVerySmall } from './17_single_very_small';
export { example as noSlice } from './18_no_sliced';
export { example as negative } from './19_negative';

export { example as totalZero } from './20_total_zero';
export { example as highNumberOfSlices } from './21_high_pie';
export { example as counterClockwiseSpecial } from './22_counter_clockwise';
export { example as clockwiseNoSpecial } from './23_clockwise';
export { example as linkedLabelsOnly } from './24_linked_label';
export { example as noLabels } from './25_no_labels';
export { example as percentage } from './26_percentage';
export { example as heterogeneous } from './27_heterogeneous_depth';
export { example as notANumber } from './28_not_a_number';
export { example as customStroke } from './29_custom_stroke';
export { example as largestCircle } from './30_largest_circle';
export { example as boldLinkValue } from './31_bold_link_value';
