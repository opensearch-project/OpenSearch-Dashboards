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
import { boolean, text } from '@storybook/addon-knobs';
import { startCase } from 'lodash';
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
  niceTimeFormatByDay,
  timeFormatter,
  AxisSpec,
} from '../../packages/charts/src';
import { isVerticalAxis } from '../../packages/charts/src/chart_types/xy_chart/utils/axis_type_utils';
import { SeededDataGenerator } from '../../packages/charts/src/mocks/utils';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const dg = new SeededDataGenerator();
const numOfDays = 90;
const groupNames = new Array(16).fill(0).map((d, i) => String.fromCharCode(97 + i));
const data = dg.generateGroupedSeries(numOfDays, 16).map((d) => {
  return {
    y: d.y,
    x: DateTime.fromISO('2020-01-01T00:00:00Z').plus({ days: d.x }).toMillis(),
    g: d.g,
    h: groupNames.indexOf(d.g) % 4,
    v: Math.floor(groupNames.indexOf(d.g) / 4),
  };
});

const getAxisStyle = (position: Position): AxisSpec['style'] => ({
  tickLabel: {
    padding: 5,
  },
  axisPanelTitle: {
    visible: !boolean('Hide panel titles', false, position),
  },
  axisTitle: {
    padding: 2,
    visible: !boolean('Hide title', false, position),
  },
  tickLine: {
    visible: false,
  },
});
const tickTimeFormatter = timeFormatter(niceTimeFormatByDay(numOfDays));

const getAxisOptions = (
  position: Position,
): Pick<AxisSpec, 'id' | 'title' | 'gridLine' | 'ticks' | 'domain' | 'tickFormat' | 'style' | 'hide' | 'position'> => {
  const isPrimary = position === Position.Left || position === Position.Bottom;
  const isVertical = isVerticalAxis(position);
  return {
    id: position,
    position,
    ticks: isVertical ? 2 : undefined,
    tickFormat: isVertical ? (d) => d.toFixed(2) : tickTimeFormatter,
    domain: isVertical
      ? {
          max: 10,
        }
      : undefined,
    hide: boolean('Hide', !isPrimary, position),
    gridLine: {
      visible: boolean('Show grid line', isPrimary, position),
    },
    style: getAxisStyle(position),
    title: text(
      'Title',
      isVertical ? `Metrics - ${startCase(position)}` : `Hosts - ${startCase(position)}`,
      position,
    ).trim(),
  };
};

export const Example = () => {
  const debug = boolean('Debug', false);
  const showLegend = boolean('Show Legend', false);
  const onElementClick = action('onElementClick');

  return (
    <Chart className="story-chart">
      <Settings
        debug={debug}
        onElementClick={onElementClick}
        showLegend={showLegend}
        theme={{
          lineSeriesStyle: {
            point: {
              visible: false,
            },
          },
        }}
        onBrushEnd={(d) => {
          if (d.x) {
            action('brushEvent')(tickTimeFormatter(d.x[0] ?? 0), tickTimeFormatter(d.x[1] ?? 0));
          }
        }}
      />
      <Axis {...getAxisOptions(Position.Left)} />
      <Axis {...getAxisOptions(Position.Bottom)} />
      <Axis {...getAxisOptions(Position.Top)} />
      <Axis {...getAxisOptions(Position.Right)} />

      <GroupBy id="v_split" by={(_, { v }) => v} format={(v) => `Metric ${v}`} sort="numDesc" />
      <GroupBy id="h_split" by={(_, { h }) => h} format={(v) => `Host ${v}`} sort="numAsc" />
      <SmallMultiples
        splitVertically="v_split"
        splitHorizontally="h_split"
        style={{ verticalPanelPadding: { outer: 0, inner: 0.3 } }}
      />

      <LineSeries
        id="line"
        name={({ splitAccessors }) => `Host ${splitAccessors.get('h')}`}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        timeZone="UTC"
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['h']}
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
