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
  title: 'Goal (@alpha)',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as gaugeWithTarget } from './2_gauge_with_target';
export { example as horizontalBullet } from './3_horizontal_bullet';
export { example as verticalBullet } from './4_vertical_bullet';
export { example as minimalGoal } from './5_minimal';
export { example as minimalHorizontal } from './6_minimal_horizontal';
export { example as horizontalBar } from './7_horizontal_bar';
export { example as irregularTicks } from './8_irregular_ticks';
export { example as minimalBand } from './9_minimal_band';
export { example as bandInBand } from './10_band_in_band';
export { example as gaps } from './11_gaps';
export { example as range } from './12_range';
export { example as confidenceLevel } from './13_confidence_level';
export { example as third } from './14_one_third';
export { example as halfCircle } from './15_half_circle';
export { example as twoThirds } from './16_two_thirds';
export { example as threeQuarters } from './17_three_quarters';
export { example as fullCircle } from './17_total_circle';
export { example as smallGap } from './17_very_small_gap';
export { example as sideGauge } from './18_side_gauge';
export { example as horizontalNegative } from './19_horizontal_negative';
export { example as verticalNegative } from './20_vertical_negative';
export { example as goalNegative } from './21_goal_negative';
export { example as horizontalPlusMinus } from './22_horizontal_plusminus';
export { example as verticalPlusMinus } from './23_vertical_plusminus';
export { example as goalPlusMinus } from './24_goal_plusminus';
