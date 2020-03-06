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

import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import {
  Axis,
  BarSeries,
  Chart,
  LIGHT_THEME,
  mergeWithDefaultTheme,
  PartialTheme,
  Position,
  ScaleType,
  Settings,
} from '../../src';

function createThemeAction(title: string, min: number, max: number, value: number) {
  return number(
    title,
    value,
    {
      range: true,
      min,
      max,
      step: 1,
    },
    'theme',
  );
}

function renderAxisWithOptions(position: Position, seriesGroup: string, show: boolean) {
  const axisTitle = `${position} axis (${seriesGroup})`;

  const showAxis = boolean(`show ${axisTitle} axis`, show, `${position} axes`);

  if (!showAxis) {
    return null;
  }

  const axisProps = {
    id: axisTitle,
    position,
    title: axisTitle,
    showOverlappingTicks: true,
  };

  return <Axis {...axisProps} />;
}

export const example = () => {
  const theme: PartialTheme = {
    chartMargins: {
      left: createThemeAction('margin left', 0, 50, 0),
      right: createThemeAction('margin right', 0, 50, 0),
      top: createThemeAction('margin top', 0, 50, 0),
      bottom: createThemeAction('margin bottom', 0, 50, 0),
    },
    chartPaddings: {
      left: createThemeAction('padding left', 0, 50, 0),
      right: createThemeAction('padding right', 0, 50, 0),
      top: createThemeAction('padding top', 0, 50, 0),
      bottom: createThemeAction('padding bottom', 0, 50, 0),
    },
  };
  const customTheme = mergeWithDefaultTheme(theme, LIGHT_THEME);

  const seriesGroup1 = 'group1';
  const seriesGroup2 = 'group2';
  return (
    <Chart size={[500, 300]} className="story-chart">
      <Settings showLegend={false} theme={customTheme} debug={boolean('debug', true)} />
      {renderAxisWithOptions(Position.Top, seriesGroup1, false)}
      {renderAxisWithOptions(Position.Top, seriesGroup2, true)}
      {renderAxisWithOptions(Position.Left, seriesGroup1, false)}
      {renderAxisWithOptions(Position.Left, seriesGroup2, true)}
      {renderAxisWithOptions(Position.Bottom, seriesGroup1, false)}
      {renderAxisWithOptions(Position.Bottom, seriesGroup2, true)}
      {renderAxisWithOptions(Position.Right, seriesGroup1, false)}
      {renderAxisWithOptions(Position.Right, seriesGroup2, true)}
      <BarSeries
        id="barseries1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 1 },
          { x: 1, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 4 },
        ]}
      />
    </Chart>
  );
};
