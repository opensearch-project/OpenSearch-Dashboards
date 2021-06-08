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

import { Axis, BarSeries, Settings, Chart, Position, ScaleType } from '../../packages/charts/src';
import { SB_KNOBS_PANEL } from '../utils/storybook';

export const Example = () => {
  const data1 = [
    [1, 2],
    [2, 2],
    [3, 3],
    [4, 5],
  ];
  const data2 = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
  ];
  const data3 = [
    [1, 6],
    [2, 6],
    [3, 3],
    [4, 2],
  ];
  const data4 = [
    [1, 2],
    [2, 6],
    [3, 2],
    [4, 9],
  ];
  const data5 = [
    [1, 1],
    [2, 7],
    [3, 5],
    [4, 6],
  ];
  const useDifferentGroup = boolean('Apply a different groupId to some series', false);
  const useDefaultDomain = boolean('Use the same data domain for each group', false);

  return (
    <Chart renderer="canvas" className="story-chart">
      <Settings />
      <Axis id="bottom" position={Position.Bottom} />
      <Axis
        id="left y"
        title="Default groupId"
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <Axis
        id="right y"
        groupId={useDifferentGroup && !useDefaultDomain ? 'otherGroupId' : undefined}
        title={useDifferentGroup ? 'Other groupId' : 'Default groupId'}
        position={Position.Right}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id="stacked bar 1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data1}
      />
      <BarSeries
        id="stacked bar 2"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data2}
      />

      <BarSeries
        id="stacked bar A"
        groupId={useDifferentGroup ? 'otherGroupId' : undefined}
        useDefaultGroupDomain={useDefaultDomain}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data4}
      />
      <BarSeries
        id="stacked bar B"
        groupId={useDifferentGroup ? 'otherGroupId' : undefined}
        useDefaultGroupDomain={useDefaultDomain}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data5}
      />
      <BarSeries
        id="non stacked bar"
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
      text: `You can group together series specifying a \`groupId\` prop on the series.
In the case of barchart, series with the same \`groupId\` will be grouped and eventually stacked together.

The data Y domain of each group, specified by \`groupId\`, is computed independently. This is reflected also on the rendering
where the Y value position is scaled independently on the Y axis from the other groups. An axis with the same \`groupId\`
will reflect that scale.

Use \`useDefaultGroupDomain\` if the same domain is required on every series. If you sent a \`boolean\` value, it will use
the group id applied by default on every series with no specific groupId. You can also pass a \`string\` to use a different \`groupId\`
see next storybook example.
      `,
    },
  },
};
