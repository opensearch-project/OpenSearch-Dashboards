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
  title: 'Mixed Charts',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as barsAndLines } from './1_bars_and_lines';
export { example as linesAndAreas } from './2_lines_and_areas';
export { example as areasAndBars } from './3_areas_and_bars';
export { example as testBarLinesLinear } from './4_test_bar';
export { example as testBarLinesTime } from './5_test_bar_time';
export { example as fittingFunctionsNonStackedSeries } from './6_fitting';
export { example as markSizeAccessor } from './7_marks';
