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

import { select, boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings, BinAgg, Direction } from '../../packages/charts/src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const data = [
  { x1: 'b', x2: 2, g1: 'false', g2: 'Canada', y1: 19, y2: 22 },
  { x1: 'd', x2: 4, g1: 'false', g2: 'USA', y1: 34, y2: 21 },
  { x1: 'd', x2: 4, g1: 'true', g2: 'USA', y1: 49, y2: 169 },
  { x1: 'e', x2: 5, g1: 'false', g2: 'Canada', y1: 40, y2: 77 },
  { x1: 'b', x2: 2, g1: 'true', g2: 'USA', y1: 28, y2: 84 },
  { x1: 'a', x2: 1, g1: 'false', g2: 'USA', y1: 53, y2: 39 },
  { x1: 'a', x2: 1, g1: 'true', g2: 'Canada', y1: 93, y2: 42 },
  { x1: 'c', x2: 3, g1: 'true', g2: 'USA', y1: 55, y2: 72 },
  { x1: 'e', x2: 5, g1: 'true', g2: 'Canada', y1: 96, y2: 74 },
  { x1: 'c', x2: 3, g1: 'false', g2: 'Canada', y1: 87, y2: 39 },
];

export const Example = () => {
  const orderOrdinalBinsBy = boolean('enable orderOrdinalBinsBy', true);
  const dataType = select(
    'Data type',
    {
      linear: 'linear',
      ordinal: 'ordinal',
    },
    'ordinal',
  );
  const direction =
    select<Direction | undefined>(
      'Direction',
      {
        Ascending: Direction.Ascending,
        Descending: Direction.Descending,
        'Default (Descending)': undefined,
      },
      Direction.Descending,
    ) || undefined;
  const binAgg =
    select<BinAgg | undefined>(
      'BinAgg',
      {
        Sum: BinAgg.Sum,
        None: BinAgg.None,
        'Default (sum)': undefined,
      },
      BinAgg.Sum,
    ) || undefined;
  return (
    <Chart className="story-chart">
      <Settings
        orderOrdinalBinsBy={
          orderOrdinalBinsBy
            ? {
                direction,
                binAgg,
              }
            : undefined
        }
        showLegend
        showLegendExtra
        legendPosition={Position.Right}
      />
      <Axis id="bottom" position={Position.Bottom} showOverlappingTicks />
      <Axis id="left2" position={Position.Left} tickFormat={(d: any) => `$${Number(d).toFixed(2)}`} />

      <BarSeries
        id="bars1"
        xScaleType={dataType === 'linear' ? ScaleType.Linear : ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor={dataType === 'linear' ? 'x2' : 'x1'}
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g1', 'g2']}
        stackAccessors={['g1', 'g2']}
        data={data}
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
