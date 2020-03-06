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
import { Axis, Chart, LineSeries, Position, ScaleType, Settings } from '../../src';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings hideDuplicateAxes={boolean('hideDuplicateAxes', true)} />
      <Axis id="bottom" position={Position.Bottom} />
      <Axis id="y1" position={Position.Left} tickFormat={(d) => `${d}%`} />
      <Axis id="y2" position={Position.Left} tickFormat={(d) => `${d}%`} />
      <Axis title="Axis - Different title" id="y3" position={Position.Left} tickFormat={(d) => `${d}%`} />
      <Axis domain={{ min: 0 }} id="y4" position={Position.Left} tickFormat={(d) => `${d}%`} />
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        timeZone="utc-6"
        data={[
          [1, 62],
          [2, 56],
          [3, 41],
          [4, 62],
          [5, 90],
        ]}
      />
    </Chart>
  );
};

example.story = {
  parameters: {
    info: {
      text: `hideDuplicateAxes will remove redundant axes that have the same min and max labels and position`,
    },
  },
};
