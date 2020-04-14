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

import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, LineSeries, Position, ScaleType, timeFormatter } from '../../src';
import { getRandomNumberGenerator } from '../../src/mocks/utils';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';

const dateFormatter = timeFormatter('HH:mm:ss');

export const example = () => {
  const getRandomNumber = getRandomNumberGenerator();
  const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d: any) => {
    return {
      x: d[0],
      max: d[1] + 4 + 4 * getRandomNumber(),
      min: d[1] - 4 - 4 * getRandomNumber(),
    };
  });
  const lineData = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d: any) => {
    return [d[0], d[1]];
  });
  const scaleToDataExtent = boolean('scale to extent', true);
  return (
    <Chart className="story-chart">
      <Axis
        id="bottom"
        title="timestamp per 1 minute"
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id="left"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['max']}
        y0Accessors={['min']}
        data={data}
        yScaleToDataExtent={scaleToDataExtent}
      />

      <LineSeries
        id="average"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={lineData}
        yScaleToDataExtent={scaleToDataExtent}
      />
    </Chart>
  );
};
