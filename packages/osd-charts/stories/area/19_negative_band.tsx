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

import { select } from '@storybook/addon-knobs';
import React from 'react';

import { AreaSeries, Axis, Chart, Fit, LineSeries, Position, ScaleType, Settings } from '../../packages/charts/src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const Example = () => {
  const scaleType = select(
    'Y scale',
    {
      [ScaleType.Linear]: ScaleType.Linear,
      [ScaleType.Log]: ScaleType.Log,
    },
    ScaleType.Linear,
  );

  const data = [
    [0, -5, -2],
    [1, -6, -2.1],
    [2, -8, -0.9],
    [3, -3, -1.2],
    [4, -2.3, -1.6],
    [5, -4, -3.4],
  ];

  return (
    <Chart className="story-chart">
      <Settings
        showLegend
        theme={{ areaSeriesStyle: { point: { visible: true } }, lineSeriesStyle: { point: { visible: false } } }}
        xDomain={{ minInterval: 1 }}
      />
      <Axis id="bottom" title="timestamp" position={Position.Bottom} showOverlappingTicks />
      <Axis id="left" title="metric" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <AreaSeries
        id="band"
        xScaleType={ScaleType.Linear}
        yScaleType={scaleType}
        xAccessor={0}
        yAccessors={[1]}
        y0Accessors={[2]}
        data={data}
      />

      <LineSeries
        id="metric"
        xScaleType={ScaleType.Linear}
        yScaleType={scaleType}
        xAccessor={0}
        yAccessors={[1]}
        fit={Fit.Carry}
        data={data.map(([x, y1, y0]) => {
          return [x, (y1 + y0) / 2];
        })}
      />
    </Chart>
  );
};
// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
