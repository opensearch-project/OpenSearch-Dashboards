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

import { boolean, select } from '@storybook/addon-knobs';
import React from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src/';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings
        debug={boolean('Debug', true)}
        showLegend={boolean('Legend', true)}
        showLegendExtra
        legendPosition={select(
          'Legend position',
          {
            Left: Position.Left,
            Right: Position.Right,
            Top: Position.Top,
            Bottom: Position.Bottom,
          },
          Position.Right,
        )}
        rotation={select(
          'Rotation degree',
          {
            '0 deg(default)': 0,
            '90 deg': 90,
            '-90 deg': -90,
            '180 deg': 180,
          },
          0,
        )}
      />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="Bottom axis"
        showOverlappingTicks={true}
        showOverlappingLabels={boolean('bottom show overlapping labels', false)}
      />
      <Axis
        id="left2"
        title="Left axis"
        position={Position.Left}
        showOverlappingTicks={true}
        showOverlappingLabels={boolean('left show overlapping labels', false)}
      />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 'a', y: 1 },
          { x: 'b', y: 2 },
          { x: 'c', y: 3 },
          { x: 'd', y: 4 },
        ]}
      />
    </Chart>
  );
};

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
