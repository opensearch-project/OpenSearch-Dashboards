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

import { SB_KNOBS_PANEL } from '../../utils/storybook';

export default {
  title: 'Annotations/Lines',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { example as xContinuousDomain } from './1_x_continuous';
export { example as xOrdinalDomain } from './2_x_ordinal';
export { example as xTimeDomain } from './3_x_time';
export { example as yDomain } from './4_y_domain';
export { example as styling } from './5_styling';
// for testing
export { example as singleBarHistogram } from './6_test_single_bar_histogram';
