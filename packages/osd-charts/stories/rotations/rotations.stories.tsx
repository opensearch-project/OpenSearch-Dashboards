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
  title: 'Rotations',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as withOrdinalAxis } from './1_ordinal';
export { example as negative90DegreeOrdinal } from './2_negative_ordinal';
export { example as rotations0DegOrdinal } from './3_rotations_ordinal';
export { example as rotations90DegOrdinal } from './4_90_ordinal';
export { example as rotations180DegOrdinal } from './5_180_ordinal';
export { example as negative90DegLinear } from './6_negative_linear';
export { example as rotations0DegLinear } from './7_rotations_linear';
export { example as rotations90DegLinear } from './8_90_deg_linear';
export { example as rotations180DegLinear } from './9_180_deg_linear';
