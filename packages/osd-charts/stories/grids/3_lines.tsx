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

import { array, boolean, color, number } from '@storybook/addon-knobs';
import { startCase } from 'lodash';
import React from 'react';

import {
  Axis,
  LineSeries,
  Chart,
  Position,
  ScaleType,
  Settings,
  TooltipType,
  PartialTheme,
  StrokeStyle,
  StrokeDashArray,
} from '../../packages/charts/src';
import { SeededDataGenerator } from '../../packages/charts/src/mocks/utils';
import { getTooltipTypeKnob } from '../utils/knobs';

const dg = new SeededDataGenerator();
const data = dg.generateBasicSeries(20);

type LineProps = StrokeStyle & StrokeDashArray;

const getLineStyles = ({ stroke, strokeWidth, dash }: Partial<LineProps> = {}, group?: string): LineProps => ({
  stroke: color('Stroke', stroke ?? '#ccc', group),
  strokeWidth: number('Stroke width', strokeWidth ?? 2, { min: 1, max: 6, range: true, step: 1 }, group),
  dash: (
    array(
      'Dash',
      (dash ?? []).map((n) => `${n}`),
      ',',
      group,
    ) ?? []
  ).map((s) => parseInt(s, 10)),
});

const getAxisKnobs = (position: Position) => {
  const title = `${startCase(position)} axis`;
  const visible = boolean('Show gridline', true, title);
  return {
    id: position,
    position,
    title,
    tickFormat: (n: number) => n.toFixed(1),
    gridLine: {
      visible,
      opacity: number('Opacity', 0.2, { min: 0, max: 1, range: true, step: 0.1 }, title),
      ...getLineStyles(
        {
          dash: position === Position.Left ? [4, 4] : undefined,
        },
        title,
      ),
    },
  };
};

export const Example = () => {
  const theme: PartialTheme = {
    crosshair: {
      line: getLineStyles({ stroke: 'red' }, 'Crosshair line'),
      crossLine: getLineStyles({ stroke: 'red', dash: [4, 4] }, 'Crosshair cross line'),
    },
  };
  return (
    <Chart className="story-chart">
      <Settings
        debug={boolean('debug', false)}
        tooltip={getTooltipTypeKnob('Tooltip type', TooltipType.Crosshairs)}
        theme={theme}
      />
      <Axis {...getAxisKnobs(Position.Left)} />
      <Axis {...getAxisKnobs(Position.Bottom)} />
      <LineSeries id="line" xScaleType={ScaleType.Linear} yScaleType={ScaleType.Linear} xAccessor="x" data={data} />
    </Chart>
  );
};
