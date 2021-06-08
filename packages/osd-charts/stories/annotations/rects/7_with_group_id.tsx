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

import { select, boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, RectAnnotation, ScaleType, Settings } from '../../../packages/charts/src';
import { Position } from '../../../packages/charts/src/utils/common';

const getKnobs = () => {
  const enabled = boolean('enable annotation', true);
  let groupId: string | undefined = select(
    'Annotation groupId',
    { group1: 'group1', group2: 'group2', none: 'none' },
    'group1',
  );
  if (groupId === 'none') {
    groupId = undefined;
  }
  const x0 = number('x0', 5);
  const x1 = number('x1', 10);
  const yDefined = boolean('enable y0 and y1 values', false);
  return {
    enabled,
    groupId,
    x0,
    x1,
    y0: yDefined ? number('y0', 0) : undefined,
    y1: yDefined ? number('y1', 3) : undefined,
  };
};
export const Example = () => {
  const xAxisKnobs = getKnobs();

  return (
    <Chart className="story-chart">
      {xAxisKnobs.enabled && (
        <RectAnnotation
          groupId={xAxisKnobs.groupId}
          id="x axis"
          dataValues={[{ coordinates: xAxisKnobs }]}
          style={{ fill: 'red' }}
        />
      )}
      <Settings />
      <Axis id="bottom" groupId="group2" position={Position.Bottom} title="Bottom (groupId=group2)" />
      <Axis id="left" groupId="group1" position={Position.Left} title="Left (groupId=group1)" />
      <Axis id="top" groupId="group1" position={Position.Top} title="Top (groupId=group1)" />
      <Axis id="right" groupId="group2" position={Position.Right} title="Right (groupId=group2)" />
      <BarSeries
        id="bars"
        groupId="group1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 5 },
          { x: 5, y: 1 },
          { x: 20, y: 10 },
        ]}
      />
      <BarSeries
        id="bars1"
        groupId="group2"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 61 },
          { x: 5, y: 43 },
          { x: 20, y: 49 },
        ]}
      />
    </Chart>
  );
};
