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
import { action } from '@storybook/addon-actions';
import { boolean } from '@storybook/addon-knobs';
import { DateTime } from 'luxon';
import React from 'react';

import {
  ScaleType,
  Position,
  Chart,
  Axis,
  LineSeries,
  GroupBy,
  SmallMultiples,
  Settings,
  LIGHT_THEME,
  niceTimeFormatByDay,
  timeFormatter,
} from '../../src';
import { SeededDataGenerator } from '../../src/mocks/utils';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const dg = new SeededDataGenerator();
const numOfDays = 90;
const groupNames = new Array(16).fill(0).map((d, i) => String.fromCharCode(97 + i));
const data = dg.generateGroupedSeries(numOfDays, 16).map((d) => {
  return {
    y: d.y,
    x: DateTime.fromISO('2020-01-01T00:00:00Z').plus({ days: d.x }).toMillis(),
    g: d.g,
    h: `host ${groupNames.indexOf(d.g) % 4}`,
    v: `metric ${Math.floor(groupNames.indexOf(d.g) / 4)}`,
  };
});

export const Example = () => {
  const showLegend = boolean('Show Legend', false);
  const onElementClick = action('onElementClick');

  return (
    <Chart className="story-chart">
      <Settings
        onElementClick={onElementClick}
        showLegend={showLegend}
        theme={{
          lineSeriesStyle: {
            point: {
              visible: false,
            },
          },
        }}
      />
      <Axis
        id="time"
        title="timestamp"
        position={Position.Bottom}
        gridLine={{ visible: true }}
        ticks={2}
        style={{
          tickLabel: {
            padding: 10,
          },
          axisTitle: {
            padding: 0,
          },
          tickLine: {
            visible: false,
          },
          axisLine: {
            visible: false,
          },
        }}
        tickFormat={timeFormatter(niceTimeFormatByDay(numOfDays))}
      />
      <Axis
        id="y"
        title="metric"
        position={Position.Left}
        gridLine={{ visible: true }}
        domain={{
          max: 10,
        }}
        ticks={2}
        style={{
          axisTitle: {
            padding: 0,
          },
          tickLabel: {
            padding: 5,
          },
          tickLine: {
            visible: false,
          },
          axisLine: {
            visible: false,
          },
        }}
        tickFormat={(d) => d.toFixed(2)}
      />

      <GroupBy
        id="v_split"
        by={(spec, { v }) => {
          return v;
        }}
        sort="numDesc"
      />
      <GroupBy
        id="h_split"
        by={(spec, { h }) => {
          return h;
        }}
        sort="numAsc"
      />
      <SmallMultiples
        splitVertically="v_split"
        splitHorizontally="h_split"
        style={{ verticalPanelPadding: [0, 0.3] }}
      />

      <LineSeries
        id="line"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        timeZone="UTC"
        xAccessor="x"
        yAccessors={['y']}
        color={({ smHorizontalAccessorValue }) => {
          const val = Number(`${smHorizontalAccessorValue}`.split('host ')[1]);
          return LIGHT_THEME.colors.vizColors[val];
        }}
        data={data}
      />
    </Chart>
  );
};
Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
    info: {
      text: `It is possible to add either a vertical and horizontal \`<GroupBy/>\` operations to create a grid of
small multiples.
The assignment of the series colors can be handled by defining an accessor in the \`color\` prop of the series that
consider the \`smHorizontalAccessorValue\` or \`smVerticalAccessorValue\` values when returning the assigned color.
`,
    },
  },
};
