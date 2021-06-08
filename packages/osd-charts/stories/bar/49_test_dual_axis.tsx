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

import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../packages/charts/src';

export const Example = () => {
  const stack13 = boolean('Stack bars1 and bars3', true);
  const stack24 = boolean('Stack bars2 and bars4', false);
  return (
    <Chart className="story-chart">
      <Settings showLegend />
      <Axis id="count1" title="count" position={Position.Left} />
      <Axis id="count2" groupId="2" title="count" position={Position.Right} />
      <Axis id="x" title="goods" position={Position.Bottom} />
      <BarSeries
        id="bars1"
        xScaleType={ScaleType.Ordinal}
        groupId="2"
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={stack13 ? ['y'] : undefined}
        data={[
          { x: 'trousers', y: 252 },
          { x: 'watches', y: 499 },
          { x: 'bags', y: 489 },
          { x: 'cocktail dresses', y: 391 },
        ]}
      />

      <BarSeries
        id="bars2"
        xScaleType={ScaleType.Ordinal}
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={stack24 ? ['y'] : undefined}
        data={[
          { x: 'trousers', y: 390 },
          { x: 'watches', y: 23 },
          { x: 'bags', y: 750 },
          { x: 'cocktail dresses', y: 853 },
        ]}
      />

      <BarSeries
        id="bars3"
        groupId="2"
        xScaleType={ScaleType.Ordinal}
        xAccessor="x"
        stackAccessors={stack13 ? ['y'] : undefined}
        data={[
          { x: 'trousers', y: 39 },
          { x: 'watches', y: 2 },
          { x: 'bags', y: 75 },
          { x: 'cocktail dresses', y: 150 },
        ]}
      />

      <BarSeries
        id="bars4"
        xScaleType={ScaleType.Ordinal}
        xAccessor="x"
        stackAccessors={stack24 ? ['y'] : undefined}
        data={[
          { x: 'trousers', y: 39 },
          { x: 'watches', y: 2 },
          { x: 'bags', y: 75 },
          { x: 'cocktail dresses', y: 150 },
        ]}
      />
    </Chart>
  );
};
