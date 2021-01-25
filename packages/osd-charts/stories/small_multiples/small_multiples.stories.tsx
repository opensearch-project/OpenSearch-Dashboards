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
  title: 'Small Multiples (@alpha)',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { Example as verticalAreas } from './2_vertical_areas';
export { Example as horizontalBars } from './4_horizontal_bars';
export { Example as gridLines } from './3_grid_lines';
export { Example as histogramBars } from './5_histogram_bars';
export { Example as heterogeneous } from './6_heterogeneous_cartesians';
