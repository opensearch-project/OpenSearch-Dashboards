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

import { action } from '@storybook/addon-actions';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../packages/charts/src';
import { isVerticalRotation } from '../../packages/charts/src/chart_types/xy_chart/state/utils/common';
import { getChartRotationKnob } from '../utils/knobs';

export const Example = () => {
  const rotation = getChartRotationKnob();
  const isVertical = isVerticalRotation(rotation);

  return (
    <Chart className="story-chart">
      <Settings onBrushEnd={action('onBrushEnd')} rotation={rotation} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="bottom"
        showOverlappingTicks
        tickFormat={isVertical ? (d) => Number(d).toFixed(2) : undefined}
      />
      <Axis
        id="left"
        title="left"
        position={Position.Left}
        tickFormat={!isVertical ? (d) => Number(d).toFixed(2) : undefined}
      />
      <Axis
        id="top"
        position={Position.Top}
        title="top"
        showOverlappingTicks
        tickFormat={isVertical ? (d) => Number(d).toFixed(2) : undefined}
      />
      <Axis
        id="right"
        title="right"
        position={Position.Right}
        tickFormat={!isVertical ? (d) => Number(d).toFixed(2) : undefined}
      />

      <BarSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 1, y: 2 },
          { x: 2, y: 7 },
          { x: 3, y: 3 },
        ]}
      />
    </Chart>
  );
};
