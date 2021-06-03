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

import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src';
import * as TestDatasets from '../../src/utils/data_samples/test_dataset';
import {
  getBoundaryKnob,
  getChartRotationKnob,
  getFallbackPlacementsKnob,
  getPlacementKnob,
  getStickToKnob,
  getTooltipTypeKnob,
} from '../utils/knobs';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const CustomTooltip = () => (
  <div
    style={{
      padding: 10,
      height: 40,
      backgroundColor: 'blue',
      color: 'white',
    }}
  >
    My Custom Tooltip
  </div>
);

export const Example = () => {
  const rotation = getChartRotationKnob();
  const tooltipOptions = {
    stickTo: getStickToKnob('stickTo'),
    placement: getPlacementKnob('Tooltip placement'),
    fallbackPlacements: getFallbackPlacementsKnob(),
    type: getTooltipTypeKnob(),
    boundary: getBoundaryKnob(),
    customTooltip: boolean('Custom Tooltip', false) ? CustomTooltip : undefined,
    offset: number('Tooltip offset', 10, { min: 0, max: 20, range: true, step: 1 }),
  };
  const showAxes = boolean('Show axes', false);
  const showLegend = boolean('Show Legend', false);

  // Added buffer to test tooltip positioning within chart container
  return (
    <div className="buffer" style={{ width: '100%', height: '100%', paddingLeft: 80, paddingRight: 80 }}>
      <Chart className="story-chart">
        <Settings rotation={rotation} tooltip={tooltipOptions} showLegend={showLegend} />
        <Axis id="bottom" hide={!showAxes} position={Position.Bottom} title="Bottom axis" showOverlappingTicks />
        <Axis
          id="left2"
          hide={!showAxes}
          title="Left axis"
          position={Position.Left}
          tickFormat={(d: any) => Number(d).toFixed(2)}
        />

        <BarSeries
          id="bars1"
          xScaleType={ScaleType.Ordinal}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y1', 'y2']}
          splitSeriesAccessors={['g']}
          data={TestDatasets.BARCHART_2Y1G}
        />
      </Chart>
    </div>
  );
};

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
