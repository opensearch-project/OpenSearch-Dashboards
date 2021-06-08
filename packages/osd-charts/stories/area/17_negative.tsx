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

import { select, number } from '@storybook/addon-knobs';
import React from 'react';

import { AreaSeries, Axis, Chart, Position, ScaleType, timeFormatter } from '../../packages/charts/src';
import { KIBANA_METRICS } from '../../packages/charts/src/utils/data_samples/test_dataset_kibana';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const dateFormatter = timeFormatter('HH:mm');

const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.map(([x, y]) => {
  return [x, -y];
});
export const Example = () => {
  const scaleType = select(
    'Y scale',
    {
      [ScaleType.Linear]: ScaleType.Linear,
      [ScaleType.Log]: ScaleType.Log,
    },
    ScaleType.Linear,
  );
  return (
    <Chart className="story-chart">
      <Axis id="bottom" position={Position.Bottom} showOverlappingTicks tickFormat={dateFormatter} />
      <Axis
        id="left"
        title="negative metric"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
        domain={{ logMinLimit: number('Y log limit', 1, { min: 0 }) }}
      />

      <AreaSeries
        id="area"
        xScaleType={ScaleType.Time}
        yScaleType={scaleType}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
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
