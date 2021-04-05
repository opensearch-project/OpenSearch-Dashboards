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

import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, RectAnnotation, ScaleType, Settings } from '../../../src';
import { Position } from '../../../src/utils/common';

const getKnobs = () => {
  const minY = number('min y', 0);
  const maxY = number('max y', 20);
  const x0 = number('x0', 5);
  const x1 = number('x1', 10);
  const enableYValues = boolean('enable y0 and y1 values', true);
  return {
    minY,
    maxY,
    x0,
    x1,
    y0: enableYValues ? number('y0', 1) : undefined,
    y1: enableYValues ? number('y1', 5) : undefined,
  };
};

export const Example = () => {
  const xAxisKnobs = getKnobs();
  // only show the fit enable or disable if relevant
  const fit = xAxisKnobs.minY === xAxisKnobs.maxY ? boolean('fit to the domain', false) : undefined;

  return (
    <Chart className="story-chart">
      <RectAnnotation id="rect" dataValues={[{ coordinates: xAxisKnobs }]} style={{ fill: 'red' }} />
      <Settings />
      <Axis id="bottom" position={Position.Bottom} title="x-domain axis" />
      <Axis domain={{ fit }} id="left" title="y-domain axis" position={Position.Left} />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        data={[
          { x: 0, y: xAxisKnobs.minY },
          { x: 5, y: (xAxisKnobs.minY + xAxisKnobs.maxY) / 2 },
          { x: 20, y: xAxisKnobs.maxY },
        ]}
      />
    </Chart>
  );
};
