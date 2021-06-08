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

import { boolean, number, select } from '@storybook/addon-knobs';
import React from 'react';

import {
  AreaSeries,
  Axis,
  Chart,
  Position,
  ScaleType,
  Settings,
  AxisStyle,
  RecursivePartial,
  DEFAULT_CHART_MARGINS,
  DEFAULT_CHART_PADDING,
} from '../../packages/charts/src';
import { getVerticalTextAlignmentKnob, getHorizontalTextAlignmentKnob, getPositiveNumberKnob } from '../utils/knobs';

const getAxisKnobs = (group?: string, gridLines = false): RecursivePartial<AxisStyle> => ({
  axisTitle: {
    visible: !boolean('Hide axis title', false, group),
    padding: {
      outer: getPositiveNumberKnob('Axis title padding - outer', 6, group),
      inner: getPositiveNumberKnob('Axis title padding - inner', 6, group),
    },
  },
  axisLine: {
    visible: !boolean('Hide axis line', false, group),
  },
  tickLine: {
    visible: !boolean('Hide tick lines', false, group),
    padding: getPositiveNumberKnob('Tick line padding', 10, group),
    size: getPositiveNumberKnob('Tick line size', 10, group),
  },
  tickLabel: {
    visible: !boolean('Hide tick labels', false, group),
    rotation: number(
      'Tick label rotation',
      0,
      {
        range: true,
        min: -90,
        max: 90,
        step: 1,
      },
      group,
    ),
    padding: {
      outer: getPositiveNumberKnob('Tick label padding - outer', 0, group),
      inner: getPositiveNumberKnob('Tick label padding - inner', 0, group),
    },
    offset: {
      y: number(
        'Tick label y offset',
        0,
        {
          range: true,
          min: -10,
          max: 10,
          step: 1,
        },
        group,
      ),
      x: number(
        'Tick label x offset',
        0,
        {
          range: true,
          min: -10,
          max: 10,
          step: 1,
        },
        group,
      ),
      reference: select(
        'Tick label offset reference',
        {
          Global: 'global',
          Local: 'local',
        },
        'local',
        group,
      ),
    },
    alignment: {
      vertical: getVerticalTextAlignmentKnob(group),
      horizontal: getHorizontalTextAlignmentKnob(group),
    },
  },
  ...(gridLines && {
    gridLine: {
      horizontal: {
        visible: boolean('show horizontal gridLines', false, group),
      },
      vertical: {
        visible: boolean('show vertical gridLines', false, group),
      },
    },
  }),
});

export const Example = () => {
  const debug = boolean('debug', false, 'general');
  const onlyGlobal = !boolean('disable axis overrides', false, 'general');
  const chartMargins = {
    left: getPositiveNumberKnob('margin left', DEFAULT_CHART_MARGINS.left, 'general'),
    right: getPositiveNumberKnob('margin right', DEFAULT_CHART_MARGINS.right, 'general'),
    top: getPositiveNumberKnob('margin top', DEFAULT_CHART_MARGINS.top, 'general'),
    bottom: getPositiveNumberKnob('margin bottom', DEFAULT_CHART_MARGINS.bottom, 'general'),
  };
  const chartPaddings = {
    left: getPositiveNumberKnob('padding left', DEFAULT_CHART_PADDING.left, 'general'),
    right: getPositiveNumberKnob('padding right', DEFAULT_CHART_PADDING.right, 'general'),
    top: getPositiveNumberKnob('padding top', DEFAULT_CHART_PADDING.top, 'general'),
    bottom: getPositiveNumberKnob('padding bottom', DEFAULT_CHART_PADDING.bottom, 'general'),
  };
  const bottomAxisStyles = getAxisKnobs(Position.Bottom);
  const leftAxisStyles = getAxisKnobs(Position.Left);
  const topAxisStyles = getAxisKnobs(Position.Top);
  const rightAxisStyles = getAxisKnobs(Position.Right);
  const theme = {
    axes: getAxisKnobs('shared', true),
    chartMargins,
    chartPaddings,
  };

  return (
    <Chart className="story-chart">
      <Settings debug={debug} theme={theme} />
      <Axis
        id="bottom"
        hide={boolean('hide axis', false, Position.Bottom)}
        position={Position.Bottom}
        title="Bottom axis"
        showOverlappingTicks
        gridLine={
          onlyGlobal
            ? {
                visible: boolean('show gridLines', false, Position.Bottom),
              }
            : undefined
        }
        style={onlyGlobal ? bottomAxisStyles : undefined}
      />
      <Axis
        id="left"
        hide={boolean('hide axis', false, Position.Left)}
        title="Left axis"
        position={Position.Left}
        style={onlyGlobal ? leftAxisStyles : undefined}
        gridLine={
          onlyGlobal
            ? {
                visible: boolean('show gridLines', false, Position.Left),
              }
            : undefined
        }
      />
      <Axis
        id="top"
        hide={boolean('hide axis', false, Position.Top)}
        title="Top axis"
        position={Position.Top}
        style={onlyGlobal ? topAxisStyles : undefined}
        gridLine={
          onlyGlobal
            ? {
                visible: boolean('show gridLines', false, Position.Top),
              }
            : undefined
        }
      />
      <Axis
        id="right"
        hide={boolean('hide axis', false, Position.Right)}
        title="Right axis"
        position={Position.Right}
        style={onlyGlobal ? rightAxisStyles : undefined}
        gridLine={
          onlyGlobal
            ? {
                visible: boolean('show gridLines', false, Position.Right),
              }
            : undefined
        }
        domain={{ min: 0, max: 100 }}
      />
      <AreaSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 20 },
          { x: 1, y: 70 },
          { x: 2, y: 30 },
          { x: 3, y: 60 },
        ]}
      />
    </Chart>
  );
};
