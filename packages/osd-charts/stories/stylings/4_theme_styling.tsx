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

import { switchTheme } from '../../.storybook/theme_service';
import {
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  CurveType,
  DEFAULT_MISSING_COLOR,
  LineSeries,
  PartialTheme,
  Position,
  ScaleType,
  Settings,
  LIGHT_THEME,
  DARK_THEME,
} from '../../src';
import { SeededDataGenerator } from '../../src/mocks/utils';
import { palettes } from '../../src/utils/themes/colors';

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

const dg = new SeededDataGenerator();
const data1 = dg.generateGroupedSeries(40, 4);
const data2 = dg.generateSimpleSeries(40);
const data3 = dg.generateSimpleSeries(40);

export const example = () => {
  const customizeLineStroke = boolean('customizeLineStroke', false, 'line');
  const customizePointStroke = boolean('customizeLinePointStroke', false, 'line');
  const customizeAreaFill = boolean('customizeAreaFill', false, 'area');
  const customizeAreaLineStroke = boolean('customizeAreaLineStroke', false, 'area');
  const customizeRectFill = boolean('customizeRectFill', false, 'bar');
  const theme: PartialTheme = {
    chartMargins: {
      left: range('margin left', 0, 50, 10, 'Margins'),
      right: range('margin right', 0, 50, 10, 'Margins'),
      top: range('margin top', 0, 50, 10, 'Margins'),
      bottom: range('margin bottom', 0, 50, 10, 'Margins'),
    },
    chartPaddings: {
      left: range('padding left', 0, 50, 10, 'Paddings'),
      right: range('padding right', 0, 50, 10, 'Paddings'),
      top: range('padding top', 0, 50, 10, 'Paddings'),
      bottom: range('padding bottom', 0, 50, 10, 'Paddings'),
    },
    lineSeriesStyle: {
      line: {
        stroke: customizeLineStroke ? color('customLineStroke', 'red', 'line') : undefined,
        strokeWidth: range('lineStrokeWidth', 0, 10, 1, 'line'),
        visible: boolean('lineVisible', true, 'line'),
      },
      point: {
        visible: boolean('linePointVisible', true, 'line'),
        radius: range('linePointRadius', 0, 20, 1, 'line', 0.5),
        fill: color('linePointFill', 'white', 'line'),
        stroke: customizePointStroke ? color('customLinePointStroke', 'red', 'line') : undefined,
        strokeWidth: range('linePointStrokeWidth', 0, 20, 0.5, 'line'),
        opacity: range('linePointOpacity', 0, 1, 1, 'line', 0.01),
      },
    },
    areaSeriesStyle: {
      area: {
        fill: customizeAreaFill ? color('customAreaFill', 'red', 'area') : undefined,
        visible: boolean('aAreaVisible', true, 'area'),
        opacity: range('aAreaOpacity', 0, 1, 1, 'area'),
      },
      line: {
        stroke: customizeAreaLineStroke ? color('customAreaLineStroke', 'red', 'area') : undefined,
        strokeWidth: range('aStrokeWidth', 0, 10, 1, 'area'),
        visible: boolean('aLineVisible', true, 'area'),
      },
      point: {
        visible: boolean('aPointVisible', true, 'area'),
        fill: color('aPointFill', 'white', 'area'),
        radius: range('aPointRadius', 0, 20, 1, 'area'),
        stroke: color('aPointStroke', 'white', 'area'),
        strokeWidth: range('aPointStrokeWidth', 0, 20, 0.5, 'area'),
        opacity: range('aPointOpacity', 0, 1, 0.01, 'area'),
      },
    },
    barSeriesStyle: {
      rect: {
        fill: customizeRectFill ? color('recCustomFull', 'red', 'bar') : undefined,
        opacity: range('rectOpacity', 0, 1, 0.5, 'bar', 0.1),
      },
      rectBorder: {
        stroke: color('bBorderStroke', 'white', 'bar'),
        strokeWidth: range('bStrokeWidth', 0, 10, 1, 'bar'),
        visible: boolean('bBorderVisible', true, 'bar'),
      },
    },
    sharedStyle: {
      default: {
        opacity: range('sOpacity', 0, 1, 1, 'Shared', 0.05),
      },
      highlighted: {
        opacity: range('sHighlighted', 0, 1, 1, 'Shared', 0.05),
      },
      unhighlighted: {
        opacity: range('sUnhighlighted', 0, 1, 0.25, 'Shared', 0.05),
      },
    },
    colors: {
      vizColors: select(
        'vizColors',
        {
          colorBlind: palettes.echPaletteColorBlind.colors,
          darkBackground: palettes.echPaletteForDarkBackground.colors,
          lightBackground: palettes.echPaletteForLightBackground.colors,
          forStatus: palettes.echPaletteForStatus.colors,
        },
        palettes.echPaletteColorBlind.colors,
        'Colors',
      ),
      defaultVizColor: DEFAULT_MISSING_COLOR,
    },
  };

  const darkmode = boolean('darkmode', false, 'Colors');
  const className = darkmode ? 'story-chart-dark' : 'story-chart';
  switchTheme(darkmode ? 'dark' : 'light');

  return (
    <Chart className={className}>
      <Settings
        theme={theme}
        baseTheme={darkmode ? DARK_THEME : LIGHT_THEME}
        debug={boolean('debug', false)}
        showLegend
        showLegendExtra
        legendPosition={Position.Right}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />
      <Axis id="top" position={Position.Top} title="Top axis" showOverlappingTicks={true} />
      <Axis id="right" title="Right axis" position={Position.Right} tickFormat={(d) => Number(d).toFixed(2)} />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        stackAccessors={['x']}
        data={data1}
      />
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        curve={CurveType.CURVE_MONOTONE_X}
        data={data2}
      />
      <AreaSeries
        id="areas"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        curve={CurveType.CURVE_MONOTONE_X}
        data={data3}
      />
    </Chart>
  );
};
