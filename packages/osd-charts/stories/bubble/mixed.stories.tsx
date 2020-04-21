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
  title: 'Bubble Chart (@alpha)',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as simple } from './1_simple';
export { example as ordinal } from './2_ordinal';
export { example as multiple } from './3_multiple';
export { example as mixed } from './4_mixed';
