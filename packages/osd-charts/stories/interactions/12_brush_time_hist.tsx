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
import { boolean } from '@storybook/addon-knobs';
import { DateTime } from 'luxon';
import React from 'react';

import {
  Axis,
  Chart,
  niceTimeFormatter,
  Position,
  ScaleType,
  Settings,
  HistogramBarSeries,
  BrushEndListener,
} from '../../packages/charts/src';
import { isVerticalRotation } from '../../packages/charts/src/chart_types/xy_chart/state/utils/common';
import { getChartRotationKnob } from '../utils/knobs';

export const Example = () => {
  const rotation = getChartRotationKnob();
  const isVertical = isVerticalRotation(rotation);
  const now = DateTime.fromISO('2019-01-11T00:00:00.000').setZone('utc+1').toMillis();
  const oneDay = 1000 * 60 * 60 * 24;
  const dateFormatter = niceTimeFormatter([now, now + oneDay * 5]);
  const numberFormatter = (d: any) => Number(d).toFixed(2);
  const brushEndListener: BrushEndListener = ({ x }) => {
    if (!x) {
      return;
    }
    action('onBrushEnd')(dateFormatter(x[0]), dateFormatter(x[1]));
  };
  return (
    <Chart className="story-chart">
      <Settings
        debug={boolean('debug', false)}
        onBrushEnd={brushEndListener}
        onElementClick={action('onElementClick')}
        rotation={getChartRotationKnob()}
        roundHistogramBrushValues={boolean('roundHistogramBrushValues', false)}
        allowBrushingLastHistogramBucket={boolean('allowBrushingLastHistogramBucket', false)}
      />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="bottom"
        showOverlappingTicks
        tickFormat={!isVertical ? dateFormatter : numberFormatter}
      />
      <Axis id="left" title="left" position={Position.Left} tickFormat={isVertical ? dateFormatter : numberFormatter} />

      <HistogramBarSeries
        id="bars"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        timeZone="Europe/Rome"
        data={[
          { x: now, y: 2 },
          { x: now + oneDay, y: 7 },
          { x: now + oneDay * 2, y: 3 },
          { x: now + oneDay * 5, y: 6 },
        ]}
      />
    </Chart>
  );
};
