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

import { color } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, SeriesColorAccessor, LineSeries, Position, ScaleType, Settings } from '../../src';
import * as TestDatasets from '../../src/utils/data_samples/test_dataset';

export const example = () => {
  const barColor = color('barSeriesColor', '#000');
  const barSeriesColorAccessor: SeriesColorAccessor = ({ specId, yAccessor, splitAccessors }) => {
    if (
      specId === 'bars' &&
      yAccessor === 'y1' &&
      // eslint-disable-next-line react/prop-types
      splitAccessors.get('g1') === 'cloudflare.com' &&
      // eslint-disable-next-line react/prop-types
      splitAccessors.get('g2') === 'direct-cdn'
    ) {
      return barColor;
    }
    return null;
  };

  const lineColor = color('linelineSeriesColor', '#ff0');
  const lineSeriesColorAccessor: SeriesColorAccessor = ({ specId, yAccessor, splitAccessors }) => {
    // eslint-disable-next-line react/prop-types
    if (specId === 'lines' && yAccessor === 'y1' && splitAccessors.size === 0) {
      return lineColor;
    }
    return null;
  };

  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g1', 'g2']}
        color={barSeriesColorAccessor}
        data={TestDatasets.BARCHART_2Y2G}
      />
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        color={lineSeriesColorAccessor}
        data={[
          { x: 0, y: 3 },
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 10 },
        ]}
      />
    </Chart>
  );
};
