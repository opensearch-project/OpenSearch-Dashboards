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

import { select, boolean, optionsKnob } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings, TooltipProps, Placement } from '../../src';
import * as TestDatasets from '../../src/utils/data_samples/test_dataset';
import { getChartRotationKnob, getPlacementKnob, getTooltipTypeKnob } from '../utils/knobs';
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

const getFallbackPlacements = (): Placement[] | undefined => {
  const knob = optionsKnob<Placement>(
    'Fallback Placements',
    {
      Top: Placement.Top,
      Bottom: Placement.Bottom,
      Left: Placement.Left,
      Right: Placement.Right,
      TopStart: Placement.TopStart,
      TopEnd: Placement.TopEnd,
      BottomStart: Placement.BottomStart,
      BottomEnd: Placement.BottomEnd,
      RightStart: Placement.RightStart,
      RightEnd: Placement.RightEnd,
      LeftStart: Placement.LeftStart,
      LeftEnd: Placement.LeftEnd,
      Auto: Placement.Auto,
      AutoStart: Placement.AutoStart,
      AutoEnd: Placement.AutoEnd,
    },
    [Placement.Right, Placement.Left, Placement.Top, Placement.Bottom],
    {
      display: 'multi-select',
    },
  );

  if (typeof knob === 'string') {
    // @ts-ignore
    return knob.split(', ');
  }

  // @ts-ignore
  if (knob.length === 0) {
    return;
  }

  return knob;
};

export const Example = () => {
  const rotation = getChartRotationKnob();
  // @ts-ignore
  const boundary = select<TooltipProps['boundary']>(
    'Boundary Element',
    {
      Chart: 'chart',
      'Document Body': document.body,
      Default: undefined,
    },
    undefined,
  );
  const tooltipOptions = {
    placement: getPlacementKnob('Tooltip placement'),
    fallbackPlacements: getFallbackPlacements(),
    type: getTooltipTypeKnob(),
    boundary,
    customTooltip: boolean('Custom Tooltip', false) ? CustomTooltip : undefined,
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
