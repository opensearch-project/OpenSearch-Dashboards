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

import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import { AreaSeries, Axis, Chart, Position, ScaleType } from '../../src';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="bottom"
        showOverlappingTicks={true}
        hide={boolean('hide botttom axis', false)}
      />
      <Axis
        id="left"
        title="left"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
        hide={boolean('hide left axis', false)}
      />
      <Axis
        id="top"
        position={Position.Top}
        title="top"
        showOverlappingTicks={true}
        hide={boolean('hide top axis', false)}
      />
      <Axis
        id="right"
        title="right"
        position={Position.Right}
        tickFormat={(d) => Number(d).toFixed(2)}
        hide={boolean('hide right axis', false)}
      />

      <AreaSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
