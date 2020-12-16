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
  title: 'Legend',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { Example as right } from './1_legend_right';
export { Example as bottom } from './2_legend_bottom';
export { Example as left } from './3_legend_left';
export { Example as top } from './4_legend_top';
export { Example as changingSpecs } from './5_changing_specs';
export { Example as hideLegendItemsBySeries } from './6_hide_legend';
export { Example as displayValuesInLegendElements } from './7_display_values';
export { Example as legendSpacingBuffer } from './8_spacing_buffer';
export { Example as colorPicker } from './9_color_picker';
export { Example as piechart } from './10_sunburst';
export { Example as piechartRepeatedLabels } from './10_sunburst_repeated_label';
export { Example as actions } from './11_legend_actions';
export { Example as margins } from './12_legend_margins';
