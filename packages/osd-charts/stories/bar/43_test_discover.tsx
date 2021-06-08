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

import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import {
  Axis,
  Chart,
  HistogramBarSeries,
  niceTimeFormatByDay,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from '../../packages/charts/src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const TEST_DATASET_DISCOVER = {
  xAxisLabel: 'timestamp per 30 seconds',
  yAxisLabel: 'Count',
  series: [
    {
      x: 1560438420000,
      y: 1,
    },
    {
      x: 1560438510000,
      y: 1,
    },
  ],
};

// for testing purposes only
export const Example = () => {
  const formatter = timeFormatter(niceTimeFormatByDay(1));

  const xDomain = {
    minInterval: 30000,
  };

  const useCustomMinInterval = boolean('use custom minInterval of 30s', true);
  return (
    <Chart className="story-chart">
      <Settings xDomain={useCustomMinInterval ? xDomain : undefined} />
      <Axis id="discover-histogram-left-axis" position={Position.Left} title={TEST_DATASET_DISCOVER.yAxisLabel} />
      <Axis
        id="discover-histogram-bottom-axis"
        position={Position.Bottom}
        title={TEST_DATASET_DISCOVER.xAxisLabel}
        tickFormat={formatter}
      />

      <HistogramBarSeries
        id="discover-histogram"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={TEST_DATASET_DISCOVER.series}
        timeZone="local"
        name="Count"
      />
    </Chart>
  );
};

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
