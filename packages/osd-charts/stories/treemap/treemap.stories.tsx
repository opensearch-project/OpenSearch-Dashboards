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

import { SB_SOURCE_PANEL } from '../utils/storybook';

export default {
  title: 'Treemap',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { Example as oneLayer } from './1_one_layer';
export { Example as oneLayer2 } from './2_one_layer_2';
export { Example as midTwoLayers } from './3_mid_two';
export { Example as twoLayersStressTest } from './4_two_layer_stress';
export { Example as multiColor } from './5_multicolor';
export { Example as customStyle } from './6_custom_style';
export { Example as percentage } from './7_percentage';
export { Example as grooveText } from './8_groove_text';
export { Example as zeroValues } from './9_zero_values';
export { Example as threeLayer } from './10_three_layers';
