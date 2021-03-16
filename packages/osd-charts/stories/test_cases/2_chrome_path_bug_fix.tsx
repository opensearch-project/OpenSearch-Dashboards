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

import moment from 'moment';
import React from 'react';

import { AreaSeries, Chart, ScaleType, Settings } from '../../src';
import { SB_KNOBS_PANEL } from '../utils/storybook';

export const Example = () => {
  const data = [
    { g: 'css', x: 1614092400000, y: 13 },
    { g: 'css', x: 1614103200000, y: 17 },
    { g: 'css', x: 1614114000000, y: 9 },
    { g: 'css', x: 1614124800000, y: 3 },
    { g: 'css', x: 1614135600000, y: 1 },
    { g: 'css', x: 1614146400000, y: 0 },
    { g: 'css', x: 1614157200000, y: 0 },
    { g: 'css', x: 1614168000000, y: 4 },
    { g: 'css', x: 1614178800000, y: 14 },
    { g: 'css', x: 1614189600000, y: 6 },
    { g: 'css', x: 1614200400000, y: 8 },
    { g: 'css', x: 1614211200000, y: 2 },
    { g: 'css', x: 1614222000000, y: 1 },
    { g: 'css', x: 1614232800000, y: 0 },
    { g: 'css', x: 1614243600000, y: 0 },
    { g: 'css', x: 1614254400000, y: 3 },
    { g: 'css', x: 1614265200000, y: 11 },
    { g: 'css', x: 1614276000000, y: null },
    { g: 'css', x: 1614286800000, y: 6 },
    { g: 'css', x: 1614297600000, y: 3 },
    { g: 'css', x: 1614308400000, y: 0 },
    { g: 'css', x: 1614319200000, y: 0 },
    { g: 'css', x: 1614330000000, y: 2 },
    { g: 'css', x: 1614340800000, y: 3 },
    { g: 'css', x: 1614351600000, y: 6 },
    { g: 'gz', x: 1614092400000, y: 15 },
    { g: 'gz', x: 1614103200000, y: 16 },
    { g: 'gz', x: 1614114000000, y: 7 },
    { g: 'gz', x: 1614124800000, y: 4 },
    { g: 'gz', x: 1614135600000, y: 1 },
    { g: 'gz', x: 1614146400000, y: 0 },
    { g: 'gz', x: 1614157200000, y: 1 },
    { g: 'gz', x: 1614168000000, y: 6 },
    { g: 'gz', x: 1614178800000, y: 9 },
    { g: 'gz', x: 1614189600000, y: 5 },
    { g: 'gz', x: 1614200400000, y: 6 },
    { g: 'gz', x: 1614211200000, y: 7 },
    { g: 'gz', x: 1614222000000, y: 1 },
    { g: 'gz', x: 1614232800000, y: 0 },
    { g: 'gz', x: 1614243600000, y: 2 },
    { g: 'gz', x: 1614254400000, y: 4 },
    { g: 'gz', x: 1614265200000, y: 20 },
    { g: 'gz', x: 1614276000000, y: null },
    { g: 'gz', x: 1614286800000, y: 12 },
    { g: 'gz', x: 1614297600000, y: 3 },
    { g: 'gz', x: 1614308400000, y: 0 },
    { g: 'gz', x: 1614319200000, y: 0 },
    { g: 'gz', x: 1614330000000, y: 2 },
    { g: 'gz', x: 1614340800000, y: 3 },
    { g: 'gz', x: 1614351600000, y: 9 },
  ].map((d) => ({ ...d, x: moment(d.x).valueOf() }));

  return (
    <Chart className="story-chart">
      <Settings />
      <AreaSeries
        id="test3"
        stackMode="percentage"
        xScaleType="time"
        yScaleType={ScaleType.Linear}
        stackAccessors={['yes']}
        splitSeriesAccessors={['g']}
        data={data}
      />
    </Chart>
  );
};

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};
