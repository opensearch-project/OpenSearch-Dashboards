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

import { number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../packages/charts/src';
import { BARCHART_1Y1G } from '../../packages/charts/src/utils/data_samples/test_dataset';

export const Example = () => (
  <Chart className="story-chart">
    <Settings
      showLegend
      theme={{
        legend: {
          margin: number('legend margins', 20, {
            min: 0,
          }),
        },
      }}
    />
    <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks />
    <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

    <BarSeries
      id="bars 1"
      xScaleType={ScaleType.Linear}
      yScaleType={ScaleType.Linear}
      xAccessor="x"
      yAccessors={['y']}
      splitSeriesAccessors={['g']}
      data={BARCHART_1Y1G}
    />
  </Chart>
);

Example.story = {
  parameters: {
    info: {
      text:
        'The `Theme.chartMargins` does not contain the legend element. Adding legend margins via `Theme.legend.margin` allows adding margins to the Left/right or Top/Bottom of the legend.',
    },
  },
};
