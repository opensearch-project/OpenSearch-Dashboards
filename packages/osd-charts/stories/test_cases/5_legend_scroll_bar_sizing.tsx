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

import React from 'react';

import { Chart, Axis, Position, BarSeries, ScaleType, Settings } from '../../packages/charts/src';

const data = [
  { g: 'AE', x: '2021-04-06 00:00', y: 1 },
  { g: 'AE', x: '2021-04-06 03:00', y: 0 },
  { g: 'AF', x: '2021-04-07 06:00', y: 1 },
  { g: 'AF', x: '2021-04-07 09:00', y: 0 },
  { g: 'AM', x: '2021-04-10 09:00', y: 1 },
  { g: 'AO', x: '2021-04-07 09:00', y: 1 },
  { g: 'AO', x: '2021-04-07 12:00', y: 0 },
  { g: 'AR', x: '2021-04-07 03:00', y: 1 },
  { g: 'AR', x: '2021-04-07 06:00', y: 0 },
  { g: 'AT', x: '2021-04-12 03:00', y: 1 },
  { g: 'AU', x: '2021-04-06 09:00', y: 1 },
  { g: 'AU', x: '2021-04-06 12:00', y: 0 },
  { g: 'AZ', x: '2021-04-10 15:00', y: 1 },
  { g: 'AZ', x: '2021-04-10 18:00', y: 0 },
  { g: 'BA', x: '2021-04-09 06:00', y: 1 },
  { g: 'BA', x: '2021-04-09 09:00', y: 0 },
  { g: 'BD', x: '2021-04-06 03:00', y: 3 },
  { g: 'BD', x: '2021-04-06 06:00', y: 2 },
  { g: 'BD', x: '2021-04-06 09:00', y: 1 },
  { g: 'BD', x: '2021-04-06 12:00', y: 0 },
  { g: 'BE', x: '2021-04-07 06:00', y: 1 },
  { g: 'BF', x: '2021-04-09 09:00', y: 1 },
  { g: 'BJ', x: '2021-04-07 15:00', y: 1 },
  { g: 'BJ', x: '2021-04-07 18:00', y: 0 },
  { g: 'BO', x: '2021-04-07 06:00', y: 1 },
  { g: 'BO', x: '2021-04-07 09:00', y: 0 },
  { g: 'BR', x: '2021-04-06 03:00', y: 3 },
  { g: 'BR', x: '2021-04-06 06:00', y: 0 },
  { g: 'BR', x: '2021-04-06 09:00', y: 2 },
  { g: 'BR', x: '2021-04-06 12:00', y: 1 },
  { g: 'BR', x: '2021-04-06 15:00', y: 0 },
  { g: 'BW', x: '2021-04-06 03:00', y: 1 },
  { g: 'BY', x: '2021-04-08 06:00', y: 1 },
  { g: 'CA', x: '2021-04-07 09:00', y: 1 },
  { g: 'CA', x: '2021-04-07 12:00', y: 0 },
  { g: 'CA', x: '2021-04-08 06:00', y: 0 },
  { g: 'CA', x: '2021-04-08 09:00', y: 2 },
  { g: 'CA', x: '2021-04-08 12:00', y: 0 },
  { g: 'CD', x: '2021-04-07 03:00', y: 1 },
  { g: 'CD', x: '2021-04-07 06:00', y: 1 },
  { g: 'CD', x: '2021-04-07 09:00', y: 1 },
  { g: 'CD', x: '2021-04-07 12:00', y: 0 },
  { g: 'CG', x: '2021-04-12 06:00', y: 1 },
];

/**
 * Should filter out zero values when fitting domain
 */
export const Example = () => {
  return (
    <Chart className="story-chart">
      <Settings showLegend />
      <Axis id="count" position={Position.Left} />
      <Axis id="time" position={Position.Bottom} integersOnly />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        splitSeriesAccessors={['g']}
        stackAccessors={['g']}
        data={data}
      />
    </Chart>
  );
};
