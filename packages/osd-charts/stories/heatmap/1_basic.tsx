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

import { Chart, Heatmap, niceTimeFormatter, RecursivePartial, ScaleType, Settings } from '../../src';
import { Config } from '../../src/chart_types/heatmap/layout/types/config_types';
import { SWIM_LANE_DATA } from '../../src/utils/data_samples/test_anomaly_swim_lane';

export const Example = () => {
  const config: RecursivePartial<Config> = {
    grid: {
      cellHeight: {
        min: 20,
      },
      stroke: {
        width: 1,
        color: '#D3DAE6',
      },
    },
    cell: {
      maxWidth: 'fill',
      maxHeight: 3,
      label: {
        visible: false,
      },
      border: {
        stroke: '#D3DAE6',
        strokeWidth: 0,
      },
    },
    yAxisLabel: {
      visible: true,
      width: 'auto',
      padding: { left: 10, right: 10 },
    },
    xAxisLabel: {
      formatter: (value: string | number) => {
        return niceTimeFormatter([1572825600000, 1572912000000])(value, { timeZone: 'UTC' });
      },
    },
  };
  return (
    <Chart className="story-chart">
      <Settings
        onElementClick={action('onElementClick')}
        showLegend
        legendPosition="top"
        onBrushEnd={action('onBrushEnd')}
        brushAxis="both"
        xDomain={{ min: 1572825600000, max: 1572912000000, minInterval: 1800000 }}
      />
      <Heatmap
        id="heatmap1"
        colorScale={ScaleType.Threshold}
        ranges={[0, 3, 25, 50, 75]}
        colors={['#ffffff', '#d2e9f7', '#8bc8fb', '#fdec25', '#fba740', '#fe5050']}
        data={SWIM_LANE_DATA.map((v) => ({ ...v, time: v.time * 1000 }))}
        // highlightedData={{ x: [], y: [] }}
        xAccessor={(d) => d.time}
        yAccessor={(d) => d.laneLabel}
        valueAccessor={(d) => d.value}
        valueFormatter={(d) => d.toFixed(0.2)}
        ySortPredicate="numAsc"
        xScaleType={ScaleType.Time}
        config={config}
      />
    </Chart>
  );
};
