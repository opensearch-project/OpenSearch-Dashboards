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
import { boolean, number, select } from '@storybook/addon-knobs';
import React from 'react';

import {
  Axis,
  BarSeries,
  Chart,
  Position,
  ScaleType,
  Settings,
  PointerEvent,
  Placement,
  niceTimeFormatter,
  TooltipType,
  LineSeries,
  AreaSeries,
} from '../../packages/charts/src';
import { KIBANA_METRICS } from '../../packages/charts/src/utils/data_samples/test_dataset_kibana';
import { palettes } from '../../packages/charts/src/utils/themes/colors';
import { getTooltipTypeKnob, getPlacementKnob } from '../utils/knobs';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const chartTypes: Record<string, any> = {
  bar: BarSeries,
  line: LineSeries,
  area: AreaSeries,
};

const getSeriesKnob = (group?: string) => {
  const type =
    select<string>(
      'Series type',
      {
        Bar: 'bar',
        Line: 'line',
        Area: 'area',
      },
      'bar',
      group,
    ) ?? 'bar';
  return chartTypes[type] ?? BarSeries;
};

export const Example = () => {
  const ref1 = React.createRef<Chart>();
  const ref2 = React.createRef<Chart>();
  const pointerUpdate = (event: PointerEvent) => {
    action('onPointerUpdate')(event);
    if (ref1.current) {
      ref1.current.dispatchExternalPointerEvent(event);
    }
    if (ref2.current) {
      ref2.current.dispatchExternalPointerEvent(event);
    }
  };
  const { data } = KIBANA_METRICS.metrics.kibana_os_load[0];
  const data1 = KIBANA_METRICS.metrics.kibana_os_load[0].data;
  const data2 = KIBANA_METRICS.metrics.kibana_os_load[1].data;

  const group1 = 'Top Chart';
  const group2 = 'Bottom Chart';

  const TopSeries = getSeriesKnob(group1);
  const BottomSeries = getSeriesKnob(group2);
  const topType = getTooltipTypeKnob('local tooltip type', TooltipType.VerticalCursor, group1);
  const bottomType = getTooltipTypeKnob('local tooltip type', TooltipType.VerticalCursor, group2);
  const topVisible = boolean('enable external tooltip', true, group1);
  const bottomVisible = boolean('enable external tooltip', true, group2);
  const topPlacement = getPlacementKnob('external tooltip placement', Placement.Left, group1);
  const bottomPlacement = getPlacementKnob('external tooltip placement', Placement.Left, group2);

  const debounceDelay = number('pointer update debounce', 20, { min: 0, max: 200, step: 10 });
  const trigger =
    select(
      'pointer update trigger',
      {
        'Only x': 'x',
        'Only y': 'y',
        'Both x and y': 'both',
      },
      'x',
    ) ?? 'x';

  return (
    <>
      <Chart className="story-chart" ref={ref1} size={{ height: '50%' }} id="chart1">
        <Settings
          showLegend
          showLegendExtra
          onPointerUpdate={pointerUpdate}
          pointerUpdateDebounce={debounceDelay}
          pointerUpdateTrigger={trigger}
          externalPointerEvents={{
            tooltip: { visible: topVisible, placement: topPlacement },
          }}
          tooltip={{ type: topType }}
        />
        <Axis
          id="bottom"
          position={Position.Bottom}
          title={`External tooltip visible: ${topVisible} - boundary: scroll parent`}
          tickFormat={niceTimeFormatter([data[0][0], data[data.length - 1][0]])}
        />
        <Axis id="left2" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

        <TopSeries
          id="Top"
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data1.slice(3, 60)}
        />
      </Chart>
      <Chart className="story-chart" ref={ref2} size={{ height: '50%' }} id="chart2">
        <Settings
          showLegend
          showLegendExtra
          onPointerUpdate={pointerUpdate}
          tooltip={{
            type: bottomType,
          }}
          externalPointerEvents={{
            tooltip: { visible: bottomVisible, placement: bottomPlacement, boundary: 'chart' },
          }}
        />
        <Axis
          id="bottom"
          position={Position.Bottom}
          title={`External tooltip visible: ${bottomVisible} - boundary: chart`}
          tickFormat={niceTimeFormatter([data[0][0], data[data.length - 1][0]])}
        />
        <Axis
          id="left2"
          position={Position.Left}
          tickFormat={(d: any) => Number(d).toFixed(2)}
          domain={{ min: 5, max: 20 }}
        />

        <BottomSeries
          id="Bottom"
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Sqrt}
          xAccessor={0}
          yAccessors={[1]}
          data={data2.slice(10)}
          color={palettes.echPaletteForLightBackground.colors[0]}
        />
      </Chart>
    </>
  );
};

Example.story = {
  parameters: {
    info: {
      text: 'Sends an event every time the cursor changes. This is provided to sync cursors between multiple charts.',
    },
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
