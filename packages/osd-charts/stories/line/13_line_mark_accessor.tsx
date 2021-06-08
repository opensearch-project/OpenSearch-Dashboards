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

import { number, boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, Chart, Position, ScaleType, Settings, LineSeries } from '../../packages/charts/src';
import { getRandomNumberGenerator } from '../../packages/charts/src/mocks/utils';

const rng = getRandomNumberGenerator();
const bubbleData = new Array(30).fill(0).map((_, i) => ({
  x: i,
  y: rng(2, 3, 2),
  z: rng(0, 20),
}));

export const Example = () => {
  const markSizeRatio = number('markSizeRatio', 10, {
    range: true,
    min: 1,
    max: 20,
    step: 1,
  });

  const visible = boolean('show line points', true);

  return (
    <Chart className="story-chart">
      <Settings
        showLegend
        theme={{
          markSizeRatio,
          lineSeriesStyle: {
            point: {
              visible,
            },
          },
        }}
        debug={boolean('debug', false)}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" />
      <Axis
        id="left2"
        title="Left axis"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
        domain={{ max: 5 }}
      />

      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        markSizeAccessor="z"
        data={bubbleData}
      />
    </Chart>
  );
};

Example.text = 'testing';
