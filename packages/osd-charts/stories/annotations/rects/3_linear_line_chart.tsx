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

import { boolean, select } from '@storybook/addon-knobs';
import React from 'react';
import { Axis, Chart, LineSeries, RectAnnotation, ScaleType, Settings, RectAnnotationDatum } from '../../../src';
import { getChartRotationKnob } from '../../utils/knobs';
import { BandedAccessorType } from '../../../src/utils/geometry';
import { Position } from '../../../src/utils/commons';

export const example = () => {
  const debug = boolean('debug', false);
  const rotation = getChartRotationKnob();

  const definedCoordinate = select(
    'green annotation defined coordinate',
    {
      x0: 'x0',
      x1: 'x1',
      y0: BandedAccessorType.Y0,
      y1: BandedAccessorType.Y1,
    },
    'x0',
  );

  const dataValuesRed: RectAnnotationDatum[] = [
    {
      coordinates: {
        x0: 1,
        x1: 1.25,
        y0: 0,
        y1: 7,
      },
      details: 'red annotation',
    },
  ];
  const dataValuesBlue: RectAnnotationDatum[] = [
    {
      coordinates: {
        x0: 2.0,
        x1: 2.1,
        y0: 0,
        y1: 7,
      },
      details: 'blue annotation',
    },
  ];
  const dataValuesGreen: RectAnnotationDatum[] = [
    {
      coordinates: {
        x0: definedCoordinate === 'x0' ? 0.5 : null,
        x1: definedCoordinate === 'x1' ? 2.5 : null,
        y0: definedCoordinate === BandedAccessorType.Y0 ? 1.5 : null,
        y1: definedCoordinate === BandedAccessorType.Y1 ? 5.5 : null,
      },
      details: 'green annotation',
    },
  ];

  const isLeft = boolean('y-domain axis is Position.Left', true);
  const yAxisTitle = isLeft ? 'y-domain axis (left)' : 'y-domain axis (right)';
  const yAxisPosition = isLeft ? Position.Left : Position.Right;

  const isBottom = boolean('x-domain axis is Position.Bottom', true);
  const xAxisTitle = isBottom ? 'x-domain axis (botttom)' : 'x-domain axis (top)';
  const xAxisPosition = isBottom ? Position.Bottom : Position.Top;

  return (
    <Chart className="story-chart">
      <Settings debug={debug} rotation={rotation} />
      <RectAnnotation dataValues={dataValuesGreen} id="rect3" style={{ fill: 'lightgreen' }} />
      <RectAnnotation dataValues={dataValuesBlue} id="rect2" style={{ fill: 'blue' }} />
      <RectAnnotation dataValues={dataValuesRed} id="rect1" style={{ fill: 'red' }} />
      <Axis id="bottom" position={xAxisPosition} title={xAxisTitle} />
      <Axis id="left" title={yAxisTitle} position={yAxisPosition} />
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
