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

import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, LIGHT_THEME, LineSeries, Position, ScaleType, Settings } from '../../src';

export const Example = () => {
  const customXDomain = boolean('customize X domain', true, 'X axis');
  const customBarYDomain = boolean('customize Y domain', true, 'Bar');
  const customLineYDomain = boolean('customize Y domain', true, 'Line');
  const options = {
    range: true,
    min: -10,
    max: 20,
    step: 0.1,
  };
  const barDomain = {
    min: number('Bar min', -5, options, 'Bar'),
    max: number('Bar max', 7, options, 'Bar'),
  };

  const lineDomain = {
    min: number('Line min', 0, options, 'Line'),
    max: number('Line max', 8, options, 'Line'),
  };

  const ticksOptions = {
    range: true,
    min: 1,
    max: 15,
    step: 1,
  };
  const barTicks = number('Bar ticks', 4, ticksOptions, 'Bar');
  const lineTicks = number('Line ticks', 10, ticksOptions, 'Line');

  const xOptions = {
    range: true,
    min: 0,
    max: 6,
    step: 1,
  };
  const xDomain = {
    min: number('X min', 0, xOptions, 'X axis'),
    max: number('X max', 3, xOptions, 'X axis'),
  };

  const showBars = boolean('show bars', true, 'Bar');
  const niceDomainBar = boolean('nice domain', true, 'Bar');
  const niceDomainLine = boolean('nice domain', true, 'Line');
  return (
    <Chart className="story-chart">
      <Settings
        showLegend={false}
        theme={{ chartPaddings: { top: 0, left: 10, right: 10, bottom: 0 } }}
        xDomain={customXDomain ? xDomain : undefined}
      />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="X axis"
        style={{
          tickLine: {
            visible: true,
          },
        }}
      />
      <Axis
        id="left"
        title="Bar"
        position={Position.Right}
        tickFormat={(d) => Number(d).toFixed(2)}
        domain={customBarYDomain ? barDomain : undefined}
        hide={boolean('Hide bar axis', false, 'Bar')}
        ticks={barTicks}
        style={{
          axisLine: {
            stroke: LIGHT_THEME.colors.vizColors[0],
            strokeWidth: 1.5,
          },
          axisTitle: {
            fill: LIGHT_THEME.colors.vizColors[0],
          },
          tickLabel: {
            fill: LIGHT_THEME.colors.vizColors[0],
          },
          tickLine: {
            stroke: LIGHT_THEME.colors.vizColors[0],
          },
        }}
      />
      <Axis
        id="right"
        title="Line"
        groupId="group2"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
        domain={customLineYDomain ? lineDomain : undefined}
        hide={boolean('Hide line axis', false, 'Line')}
        ticks={lineTicks}
        style={{
          axisLine: {
            stroke: LIGHT_THEME.colors.vizColors[1],
            strokeWidth: 1.5,
          },
          axisTitle: {
            fill: LIGHT_THEME.colors.vizColors[1],
          },
          tickLabel: {
            fill: LIGHT_THEME.colors.vizColors[1],
          },
          tickLine: {
            stroke: LIGHT_THEME.colors.vizColors[1],
          },
        }}
      />
      {showBars && (
        <BarSeries
          id="bars"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          yNice={niceDomainBar}
          xAccessor="x"
          yAccessors={['y']}
          data={[
            { x: 0, y: 2 },
            { x: 1, y: 7 },
            { x: 2, y: -3 },
            { x: 3, y: 6 },
          ]}
        />
      )}
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        xNice={niceDomainLine}
        yScaleType={ScaleType.Linear}
        yNice={niceDomainLine}
        groupId="group2"
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={['x']}
        data={[
          { x: 0, y: 3 },
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 10 },
        ]}
      />
    </Chart>
  );
};
