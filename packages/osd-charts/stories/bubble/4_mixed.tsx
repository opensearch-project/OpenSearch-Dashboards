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

import { action } from '@storybook/addon-actions';
import { number, boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, Chart, BubbleSeries, Position, ScaleType, Settings, LineSeries } from '../../packages/charts/src';
import { SeededDataGenerator, getRandomNumberGenerator } from '../../packages/charts/src/mocks/utils';
import { SB_KNOBS_PANEL } from '../utils/storybook';

const dg = new SeededDataGenerator();
const rng = getRandomNumberGenerator();
const lineData = dg.generateGroupedSeries(100, 2);
const bubbleData = new Array(100).fill(0).map((_, i) => ({
  x: i,
  y: rng(0, 10),
  z: rng(0, 100),
}));

export const Example = () => {
  const onElementListeners = {
    onElementClick: action('onElementClick'),
    onElementOver: action('onElementOver'),
    onElementOut: action('onElementOut'),
  };
  const markSizeRatio = number('markSizeRatio', 30, {
    range: true,
    min: 1,
    max: 100,
    step: 1,
  });

  return (
    <Chart className="story-chart">
      <Settings
        showLegend
        theme={{
          markSizeRatio,
          bubbleSeriesStyle: {
            point: {
              fill: 'transparent',
            },
          },
        }}
        debug={boolean('debug', false)}
        pointBuffer={(r) => 20 / r}
        {...onElementListeners}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BubbleSeries
        id="bubbles"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        markSizeAccessor="z"
        data={bubbleData}
      />
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={lineData}
      />
    </Chart>
  );
};

Example.text = 'testing';

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};
