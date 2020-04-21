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

import React from 'react';
import { number, boolean } from '@storybook/addon-knobs';

import { AreaSeries, Axis, Chart, LineSeries, Position, ScaleType, Settings } from '../../src';
import { getRandomNumberGenerator } from '../../src/mocks/utils';
import { action } from '@storybook/addon-actions';

const getRandomNumber = getRandomNumberGenerator();
const data1 = new Array(100).fill(0).map((_, x) => ({
  x,
  y: getRandomNumber(0, 100),
  z: getRandomNumber(0, 50),
}));
const data2 = new Array(100).fill(0).map((_, x) => ({
  x,
  y: getRandomNumber(0, 100),
  z: getRandomNumber(0, 50),
}));

export const example = () => {
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
  const size = number('data size', 20, {
    range: true,
    min: 10,
    max: 100,
    step: 10,
  });

  return (
    <Chart className="story-chart">
      <Settings
        theme={{
          markSizeRatio,
          areaSeriesStyle: {
            point: {
              visible: true,
            },
          },
        }}
        debug={boolean('debug', false)}
        pointBuffer={(r) => 20 / r}
        {...onElementListeners}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <AreaSeries
        id="area"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        markSizeAccessor="z"
        data={data1.slice(0, size)}
      />
      <LineSeries
        id="line"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        markSizeAccessor="z"
        data={data2.slice(0, size)}
      />
    </Chart>
  );
};
