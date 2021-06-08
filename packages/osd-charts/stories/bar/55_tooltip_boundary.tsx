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

import { boolean, number, select } from '@storybook/addon-knobs';
import React, { useRef } from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings, TooltipProps } from '../../packages/charts/src';
import { getRandomNumberGenerator, SeededDataGenerator } from '../../packages/charts/src/mocks/utils';
import { SB_KNOBS_PANEL } from '../utils/storybook';

const dg = new SeededDataGenerator();
const rng = getRandomNumberGenerator();

export const Example = () => {
  const showAxes = boolean('Show axes', false);
  const groups = number('Groups', 5, { min: 2, max: 20, step: 1 });
  const offset = number('Offset', 10, { min: 0, step: 1 });
  const data = dg.generateGroupedSeries(4, groups).map((d) => {
    return {
      ...d,
      y1: rng(0, 20),
      y2: rng(0, 20),
      g1: `dog ${d.g}`,
      g2: `cat ${d.g}`,
    };
  });
  const red = useRef<HTMLDivElement | null>(null);
  const white = useRef<HTMLDivElement | null>(null);
  const blue = useRef<HTMLDivElement | null>(null);
  const getBoundary: Record<string, TooltipProps['boundary'] | null> = {
    default: undefined,
    red: red.current,
    white: white.current,
    blue: blue.current,
    chart: 'chart',
    root: document.getElementById('story-root'),
  };
  const boundarySting = select<string>(
    'Boundary Element',
    {
      Default: 'default',
      'Root (blanchedalmond)': 'root',
      Red: 'red',
      White: 'white',
      Blue: 'blue',
      Chart: 'chart',
    },
    'default',
  );
  const boundary = getBoundary[boundarySting] ?? undefined;
  const boundaryPadding = {
    top: number('Boundary top padding', 0, { min: 0 }),
    right: number('Boundary right padding', 0, { min: 0 }),
    bottom: number('Boundary bottom padding', 0, { min: 0 }),
    left: number('Boundary left padding', 0, { min: 0 }),
  };

  return (
    <div ref={red} style={{ backgroundColor: 'red', padding: 30, height: '100%' }}>
      <div ref={white} style={{ backgroundColor: 'white', padding: 30, height: '100%' }}>
        <div ref={blue} style={{ backgroundColor: 'blue', padding: 30, height: '100%' }}>
          <Chart className="story-chart">
            <Settings tooltip={{ boundary, boundaryPadding, offset }} />
            <Axis id="bottom" hide={!showAxes} position={Position.Bottom} title="Bottom axis" showOverlappingTicks />
            <Axis
              id="left"
              hide={!showAxes}
              title="Left axis"
              position={Position.Left}
              tickFormat={(d: any) => Number(d).toFixed(2)}
            />
            <BarSeries
              id="bars"
              xScaleType={ScaleType.Ordinal}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y1', 'y2']}
              splitSeriesAccessors={['g1', 'g2']}
              data={data}
            />
          </Chart>
        </div>
      </div>
    </div>
  );
};

Example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};
