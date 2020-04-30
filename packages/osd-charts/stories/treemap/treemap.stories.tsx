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
  title: 'Treemap',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as oneLayer } from './1_one_layer';
export { example as oneLayer2 } from './2_one_layer_2';
export { example as midTwoLayers } from './3_mid_two';
export { example as twoLayersStressTest } from './4_two_layer_stress';
export { example as multiColor } from './5_multicolor';
export { example as customStyle } from './6_custom_style';
export { example as percentage } from './7_percentage';
export { example as grooveText } from './8_groove_text';
