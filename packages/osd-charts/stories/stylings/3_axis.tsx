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

import { boolean, color, number, select } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, PartialTheme, Position, ScaleType, Settings } from '../../src';

function range(title: string, min: number, max: number, value: number, groupId?: string, step = 1) {
  return number(
    title,
    value,
    {
      range: true,
      min,
      max,
      step,
    },
    groupId,
  );
}

export const example = () => {
  const theme: PartialTheme = {
    axes: {
      axisTitleStyle: {
        fill: color('titleFill', '#333', 'Axis Title'),
        fontSize: range('titleFontSize', 0, 40, 12, 'Axis Title'),
        fontStyle: 'bold',
        fontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
        padding: range('titlePadding', 0, 40, 5, 'Axis Title'),
      },
      axisLineStyle: {
        stroke: color('axisLinecolor', '#333', 'Axis Line'),
        strokeWidth: range('axisLineWidth', 0, 5, 1, 'Axis Line'),
      },
      tickLabelStyle: {
        fill: color('tickFill', '#333', 'Tick Label'),
        fontSize: range('tickFontSize', 0, 40, 10, 'Tick Label'),
        fontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
        fontStyle: 'normal',
        padding: number('tickLabelPadding', 1, {}, 'Tick Label'),
      },
      tickLineStyle: {
        visible: boolean('showTicks', true, 'Tick Line'),
        stroke: color('tickLineColor', '#333', 'Tick Line'),
        strokeWidth: range('tickLineWidth', 0, 5, 1, 'Tick Line'),
      },
    },
  };
  return (
    <Chart className="story-chart">
      <Settings
        theme={theme}
        debug={boolean('debug', true)}
        rotation={select('rotation', { '0': 0, '90': 90, '-90': -90, '180': 180 }, 0)}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
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
