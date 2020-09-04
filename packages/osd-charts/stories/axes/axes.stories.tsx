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
  title: 'Axes',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { Example as basic } from './1_basic';
export { Example as tickLabelRotation } from './2_tick_label_rotation';
export { Example as with4Axes } from './3_axis_4_axes';
export { Example as multiAxes } from './4_multi_axis';
export { Example as barsAndLines } from './5_multi_axis_bar_lines';
export { Example as differentTooltip } from './6_different_tooltip';
export { Example as differentTooltipFormatter } from './6a_different_tooltip_formatter';
export { Example as manyTickLabels } from './7_many_tick_labels';
export { Example as customDomain } from './8_custom_domain';
export { Example as customMixed } from './9_custom_mixed_domain';
export { Example as oneDomainBound } from './10_one_domain_bound';
export { Example as fitDomain } from './11_fit_domain_extent';
export { Example as duplicateTicks } from './12_duplicate_ticks';
export { Example as labelFormatting } from './13_label_formatting';
