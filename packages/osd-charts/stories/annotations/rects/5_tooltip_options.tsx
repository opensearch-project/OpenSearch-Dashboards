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

import { boolean, select } from '@storybook/addon-knobs';
import React from 'react';

import {
  AnnotationTooltipFormatter,
  Axis,
  BarSeries,
  Chart,
  ScaleType,
  RectAnnotation,
  Settings,
} from '../../../packages/charts/src';
import { CustomAnnotationTooltip } from '../../../packages/charts/src/chart_types/xy_chart/annotations/types';
import { Position } from '../../../packages/charts/src/utils/common';
import { getBoundaryKnob, getChartRotationKnob, getFallbackPlacementsKnob, getPlacementKnob } from '../../utils/knobs';

export const Example = () => {
  const boundary = getBoundaryKnob();
  const placement = getPlacementKnob('Tooltip placement');
  const fallbackPlacements = getFallbackPlacementsKnob();
  const rotation = getChartRotationKnob();
  const showCustomTooltip = boolean('custom tooltip', false);
  const showCustomDetails = boolean('custom tooltip details', false);
  const details = select(
    'details value',
    {
      foo: 'foo',
      undefined,
    },
    'foo',
  );

  const dataValues = [
    {
      coordinates: {
        x0: 0,
        x1: 1,
        y0: 0,
        y1: 7,
      },
      details,
    },
  ];

  const customTooltip: CustomAnnotationTooltip | undefined = showCustomTooltip
    ? ({ details }) => (
        <div style={{ backgroundColor: 'blue', color: 'white', padding: 10 }}>
          <h2>custom tooltip</h2>
          <p>{details}</p>
        </div>
      )
    : undefined;
  const customTooltipDetails: AnnotationTooltipFormatter | undefined = showCustomDetails
    ? (details) => (
        <div>
          <h2>custom Details</h2>
          <p>{details}</p>
        </div>
      )
    : undefined;

  return (
    <Chart className="story-chart">
      <Settings rotation={rotation} />
      <RectAnnotation
        dataValues={dataValues}
        id="rect"
        boundary={boundary}
        placement={placement}
        fallbackPlacements={fallbackPlacements}
        customTooltip={customTooltip}
        customTooltipDetails={customTooltipDetails}
      />
      <Axis id="bottom" position={Position.Bottom} title="x-domain axis" />
      <Axis id="left" title="y-domain axis" position={Position.Left} />
      <BarSeries
        id="bars"
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
