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

import { boolean, color, number } from '@storybook/addon-knobs';
import React from 'react';
import { Axis, Chart, LineSeries, RectAnnotation, ScaleType, Settings } from '../../../src';
import { Icon } from '../../../src/components/icons/icon';
import { getChartRotationKnob } from '../../utils/knobs';
import { Position } from '../../../src/utils/commons';

export const example = () => {
  const debug = boolean('debug', false);
  const rotation = getChartRotationKnob();

  const dataValues = [
    {
      coordinates: {
        x0: 0,
        x1: 0.25,
        y0: 0,
        y1: 7,
      },
      details: 'annotation 1',
    },
    {
      coordinates: {
        x0: -0.1,
        x1: 0,
        y0: 0,
        y1: 7,
      },
      details: 'annotation 2',
    },
    {
      coordinates: {
        x0: 1.1,
        x1: 1.3,
        y0: 0,
        y1: 7,
      },
      details: 'annotation 2',
    },
    {
      coordinates: {
        x0: 2.5,
        x1: 3,
        y0: 0,
        y1: 7,
      },
      details: 'annotation 3',
    },
  ];

  const zIndex = number('annotation zIndex', 0);

  const style = {
    strokeWidth: number('rect border stroke width', 1),
    stroke: color('rect border stroke color', '#e5e5e5'),
    fill: color('fill color', '#e5e5e5'),
    opacity: number('annotation opacity', 0.5, {
      range: true,
      min: 0,
      max: 1,
      step: 0.1,
    }),
  };

  const hasCustomTooltip = boolean('has custom tooltip render', false);

  const customTooltip = (details?: string) => (
    <div>
      <Icon type="alert" />
      {details}
    </div>
  );
  const renderTooltip = hasCustomTooltip ? customTooltip : undefined;

  const isLeft = boolean('y-domain axis is Position.Left', true);
  const yAxisTitle = isLeft ? 'y-domain axis (left)' : 'y-domain axis (right)';
  const yAxisPosition = isLeft ? Position.Left : Position.Right;

  const isBottom = boolean('x-domain axis is Position.Bottom', true);
  const xAxisTitle = isBottom ? 'x-domain axis (botttom)' : 'x-domain axis (top)';
  const xAxisPosition = isBottom ? Position.Bottom : Position.Top;
  const hideTooltips = boolean('hide tooltips', false);

  return (
    <Chart className="story-chart">
      <Settings debug={debug} rotation={rotation} />
      <RectAnnotation
        dataValues={dataValues}
        id="rect"
        style={style}
        renderTooltip={renderTooltip}
        zIndex={zIndex}
        hideTooltips={hideTooltips}
      />
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
