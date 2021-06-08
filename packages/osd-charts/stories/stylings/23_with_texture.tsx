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

import { array, boolean, color, number, text } from '@storybook/addon-knobs';
import React from 'react';

import {
  Axis,
  Chart,
  CurveType,
  Position,
  ScaleType,
  TexturedStyles,
  Settings,
  TextureShape,
  LIGHT_THEME,
} from '../../packages/charts/src';
import { SeededDataGenerator } from '../../packages/charts/src/mocks/utils';
import { getKnobsFromEnum, getXYSeriesKnob } from '../utils/knobs';
import { SB_KNOBS_PANEL } from '../utils/storybook';

const dg = new SeededDataGenerator();
const barData = dg.generateBasicSeries(4);
const areaData = dg.generateBasicSeries(20, 10);

const group = {
  texture: 'Texture',
  pattern: 'Pattern',
  series: 'Series',
};
const STAR =
  'M -7.75 -2.5 l 5.9 0 l 1.85 -6.1 l 1.85 6.1 l 5.9 0 l -4.8 3.8 l 1.85 6.1 l -4.8 -3.8 l -4.8 3.8 l 1.85 -6.1 l -4.8 -3.8 z';
const DEFAULT_COLOR = LIGHT_THEME.colors.vizColors[0];

const getTextureKnobs = (useCustomPath: boolean): TexturedStyles => ({
  ...(useCustomPath
    ? { path: text('Custom path', STAR, group.texture) }
    : {
        shape:
          getKnobsFromEnum('Shape', TextureShape, TextureShape.Line as TextureShape, {
            group: group.texture,
          }) ?? TextureShape.Line,
      }),
  stroke: boolean('Use stroke color', true, group.texture)
    ? color('Stoke color', DEFAULT_COLOR, group.texture)
    : undefined,
  strokeWidth: number('Stroke width', 1, { min: 0, max: 10, step: 0.5 }, group.texture),
  dash: array('Stroke dash', [], ',', group.texture).map((n) => parseInt(n, 10)),
  fill: boolean('Use fill color', true, group.texture) ? color('Fill color', DEFAULT_COLOR, group.texture) : undefined,
  rotation: number('Rotation (degrees)', 45, { min: -365, max: 365 }, group.pattern),
  opacity: number('Opacity', 1, { min: 0, max: 1, step: 0.1 }, group.texture),
  shapeRotation: number('Shape rotation (degrees)', 0, { min: -365, max: 365 }, group.texture),
  size: useCustomPath
    ? number('Shape size - custom path', 20, { min: 0 }, group.texture)
    : number('Shape size', 20, { min: 0 }, group.texture),
  spacing: {
    x: number('Shape spacing - x', 10, { min: 0 }, group.pattern),
    y: number('Shape spacing - y', 0, { min: 0 }, group.pattern),
  },
  offset: {
    x: number('Pattern offset - x', 0, {}, group.pattern),
    y: number('Pattern offset - y', 0, {}, group.pattern),
    global: boolean('Apply offset along global coordinate axes', true, group.pattern),
  },
});

export const Example = () => {
  const useCustomPath = boolean('Use custom path', false, group.texture);
  const texture: TexturedStyles = getTextureKnobs(useCustomPath);
  const opacity = number('Series opacity', 1, { min: 0, max: 1, step: 0.1 }, group.series);
  const showFill = boolean('Show series fill', false, group.series);
  const seriesColor = color('Series color', DEFAULT_COLOR, group.series);
  const [SeriesType, seriesType] = getXYSeriesKnob('Series type', 'area', group.series, { ignore: ['bubble', 'line'] });

  return (
    <Chart className="story-chart">
      <Settings
        theme={{
          areaSeriesStyle: {
            area: {
              texture,
              opacity,
              fill: showFill ? undefined : 'transparent',
            },
          },
          barSeriesStyle: {
            rect: {
              fill: showFill ? undefined : 'transparent',
              opacity,
              texture,
            },
            rectBorder: {
              visible: true,
              strokeWidth: 2,
            },
          },
        }}
      />

      <Axis id="bottom" position={Position.Bottom} />
      <Axis id="left" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <SeriesType
        id="series"
        color={seriesColor}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        data={seriesType === 'bar' ? barData : areaData}
        curve={CurveType.CURVE_MONOTONE_X}
      />
    </Chart>
  );
};

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};
