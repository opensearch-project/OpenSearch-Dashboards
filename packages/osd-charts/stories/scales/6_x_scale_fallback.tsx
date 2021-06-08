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

import { Axis, Chart, BarSeries, Position, ScaleType, Settings } from '../../packages/charts/src';

export const Example = () => {
  const includeString = boolean('include string is x data', true);
  return (
    <Chart className="story-chart">
      <Settings xDomain={{ min: 0, max: 10 }} />
      <Axis id="y" title="count" position={Position.Left} />
      <Axis id="x" title={includeString ? 'ordinal fallback scale' : 'linear scale'} position={Position.Bottom} />
      <BarSeries
        id="bars"
        name="amount"
        xScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 1, y: 390, val: 1222 },
          { x: 2, y: 23, val: 1222 },
          { x: includeString ? '3' : 3, y: 750, val: 1222 },
          { x: 4, y: 854, val: 1222 },
        ]}
      />
    </Chart>
  );
};

Example.story = {
  parameters: {
    info: {
      text:
        'Using string values with a `Linear` scale will attempt to fallback to an `Ordinal` scale. Notice how the custom `xDomain` is ignored when the scale falls back to `Ordinal`.',
    },
  },
};
