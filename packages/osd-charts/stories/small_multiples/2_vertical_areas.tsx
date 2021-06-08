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
  GroupBy,
  SmallMultiples,
  Settings,
  AreaSeries,
  LIGHT_THEME,
  niceTimeFormatByDay,
  timeFormatter,
  BrushAxis,
} from '../../packages/charts/src';
import { SeededDataGenerator } from '../../packages/charts/src/mocks/utils';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const dg = new SeededDataGenerator();
const numOfDays = 60;
const data = dg.generateGroupedSeries(numOfDays, 6, 'metric ').map((d) => {
  return {
    ...d,
    x: DateTime.fromISO('2020-01-01T00:00:00Z').plus({ days: d.x }).toMillis(),
  };
});

export const Example = () => {
  const showLegend = boolean('Show Legend', true);
  const onElementClick = action('onElementClick');
  const tickTimeFormatter = timeFormatter(niceTimeFormatByDay(numOfDays));
  return (
    <Chart className="story-chart">
      <Settings
        onElementClick={onElementClick}
        showLegend={showLegend}
        onBrushEnd={(d) => {
          if (d.x) {
            action('brushEventX')(tickTimeFormatter(d.x[0] ?? 0), tickTimeFormatter(d.x[1] ?? 0), d.y);
          }
        }}
        brushAxis={BrushAxis.X}
      />
      <Axis
        id="time"
        title="Timestamp"
        position={Position.Bottom}
        gridLine={{ visible: false }}
        tickFormat={tickTimeFormatter}
      />
      <Axis
        id="y"
        title="Metric"
        position={Position.Left}
        gridLine={{ visible: false }}
        tickFormat={(d) => d.toFixed(2)}
      />

      <GroupBy
        id="v_split"
        by={(spec, { g }) => {
          return g;
        }}
        sort="alphaDesc"
      />
      <SmallMultiples splitVertically="v_split" style={{ verticalPanelPadding: { outer: 0, inner: 0.3 } }} />
      <AreaSeries
        id="line"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        timeZone="local"
        xAccessor="x"
        yAccessors={['y']}
        color={LIGHT_THEME.colors.vizColors[1]}
        data={data}
      />
    </Chart>
  );
};
Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
    info: {
      text: `The above chart shows an example of small multiples technique that splits our dataset into multiple
      sub-series vertically positioned one below the other.
      The configuration is obtained by defining a \`<GroupBy />\` operation component that define the property used to
       divide/group my dataset(via to the \`by\` props) and using the specified \`id\` of that operation inside the
       \`<SmallMultiples splitVertically="id_of_group_by_op" />\` component.

Each charts has the same vertical and horizontal axis scale.
`,
    },
  },
};
