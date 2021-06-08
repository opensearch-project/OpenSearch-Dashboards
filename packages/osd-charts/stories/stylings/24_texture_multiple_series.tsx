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

import { boolean, color, number, button } from '@storybook/addon-knobs';
import React, { useState } from 'react';

import { Axis, Chart, CurveType, Position, TexturedStyles, Settings, TextureShape } from '../../src';
import { getRandomNumberGenerator, SeededDataGenerator, getRandomEntryFn } from '../../src/mocks/utils';
import { getKnobsFromEnum, getXYSeriesKnob } from '../utils/knobs';
import { SB_KNOBS_PANEL } from '../utils/storybook';

const group = {
  random: 'Randomized parameters',
  default: 'Default parameters',
};
const dg = new SeededDataGenerator();
const rng = getRandomNumberGenerator();
const getRandomEntry = getRandomEntryFn();

interface Random {
  shape: boolean;
  rotation: boolean;
  shapeRotation: boolean;
  size: boolean;
  spacing: {
    x: boolean;
    y: boolean;
  };
  offset: {
    x: boolean;
    y: boolean;
  };
}

const getDefaultTextureKnobs = (): TexturedStyles => ({
  shape:
    getKnobsFromEnum('Shape', TextureShape, TextureShape.Circle as TextureShape, {
      group: group.default,
    }) ?? TextureShape.Circle,
  strokeWidth: number('Stroke width', 1, { min: 0, max: 10, step: 0.5 }, group.default),
  rotation: number('Rotation (degrees)', 45, { min: -365, max: 365 }, group.default),
  shapeRotation: number('Shape rotation (degrees)', 0, { min: -365, max: 365 }, group.default),
  size: number('Shape size', 20, { min: 0 }, group.default),
  opacity: number('Opacity', 1, { min: 0, max: 1, step: 0.1 }, group.default),
  spacing: {
    x: number('Shape spacing - x', 10, { min: 0 }, group.default),
    y: number('Shape spacing - y', 10, { min: 0 }, group.default),
  },
  offset: {
    x: number('Pattern offset - x', 0, {}, group.default),
    y: number('Pattern offset - y', 0, {}, group.default),
    global: true,
  },
});

const getRandomKnobs = (): Random => ({
  shape: boolean('Shape', true, group.random),
  rotation: boolean('Rotation', false, group.random),
  shapeRotation: boolean('Shape rotation', false, group.random),
  size: boolean('Size', true, group.random),
  spacing: {
    x: boolean('X spacing', false, group.random),
    y: boolean('Y spacing', false, group.random),
  },
  offset: {
    x: boolean('X offset', false, group.random),
    y: boolean('Y offset', false, group.random),
  },
});

const getTexture = (randomize: Random): Partial<TexturedStyles> => ({
  shape: randomize.shape ? getRandomEntry(TextureShape) : undefined,
  rotation: randomize.rotation ? rng(0, 365) : undefined,
  shapeRotation: randomize.shapeRotation ? rng(0, 365) : undefined,
  size: randomize.size ? rng(5, 30) : undefined,
  spacing: {
    x: randomize.spacing.x ? rng(0, 30) : undefined,
    y: randomize.spacing.y ? rng(0, 30) : undefined,
  },
  offset: {
    x: randomize.offset.x ? rng(0, 30) : undefined,
    y: randomize.offset.y ? rng(0, 30) : undefined,
  },
});

const data = new Array(10).fill(0).map(() => dg.generateBasicSeries(10, 10));

export const Example = () => {
  const [count, setCount] = useState(0);
  button('Randomize', () => setCount((i) => i + 1), group.random);
  const n = number('Total series', 4, { min: 0, max: 10, step: 1 }) ?? 2;
  const showLegend = boolean('Show legend', false);
  const showFill = boolean('Show series fill', false);
  const chartColor = color('Chart color', 'rgba(0,0,0,1)');
  const random = getRandomKnobs();
  const [SeriesType] = getXYSeriesKnob('Series type', 'area', undefined, { ignore: ['bubble', 'line'] });
  const texture = getDefaultTextureKnobs();

  return (
    <Chart className="story-chart" data-count={count}>
      <Settings
        showLegend={showLegend}
        theme={{
          areaSeriesStyle: {
            area: {
              texture,
              fill: showFill ? undefined : 'transparent',
            },
          },
          barSeriesStyle: {
            rect: {
              texture,
              fill: showFill ? undefined : 'transparent',
            },
            rectBorder: {
              visible: true,
              strokeWidth: 2,
            },
          },
        }}
      />

      <Axis id="bottom" position={Position.Bottom} />
      <Axis id="left" position={Position.Left} />

      {new Array(n).fill(0).map((v, i) => (
        <SeriesType
          key={i}
          id={`series-${i}`}
          areaSeriesStyle={{
            area: {
              texture: getTexture(random),
            },
          }}
          barSeriesStyle={{
            rect: {
              texture: getTexture(random),
            },
          }}
          color={chartColor}
          stackAccessors={['yes']}
          data={data[i]}
          curve={CurveType.CURVE_MONOTONE_X}
        />
      ))}
    </Chart>
  );
};

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};
