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

import { Axis, BarSeries, Settings, Chart, Position, ScaleType, DEFAULT_GLOBAL_ID } from '../../packages/charts/src';
import { SB_KNOBS_PANEL } from '../utils/storybook';

export const Example = () => {
  const data1 = [
    [1, 1],
    [2, 2],
  ];
  const data2 = [
    [1, 1],
    [2, 5],
  ];
  const data3 = [
    [1, 1],
    [2, 9],
  ];
  const groupId1 = select(
    'groupId used on blue series',
    {
      default: DEFAULT_GLOBAL_ID,
      group1: 'group1',
      group2: 'group2',
    },
    'group2',
  );

  const groupId2 = select(
    'groupId used on red series',
    {
      default: DEFAULT_GLOBAL_ID,
      group1: 'group1',
      group2: 'group2',
    },
    'group2',
  );

  return (
    <Chart renderer="canvas" className="story-chart">
      <Settings />
      <Axis id="bottom" position={Position.Bottom} />
      <Axis id="left y" title="GREEN" position={Position.Right} />
      <Axis id="right 1 y" groupId={groupId1} title="BLUE" position={Position.Right} />
      <Axis id="right 2 y" groupId={groupId2} title="RED" position={Position.Right} />
      <BarSeries
        id="stacked bar 1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data1}
      />
      <BarSeries
        id="stacked bar 2"
        groupId={groupId1}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data2}
      />

      <BarSeries
        id="stacked bar A"
        groupId={groupId2}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data3}
      />
    </Chart>
  );
};

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
    info: {
      text: `You can specify a \`groupId\` in the \`useDefaultGroupDomain\` prop.
This will allows you to match and merge the data domain of two different groups and reuse it on multiple series group.
      `,
    },
  },
};
