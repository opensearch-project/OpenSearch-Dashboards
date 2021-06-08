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
  AreaSeries,
  Axis,
  Chart,
  niceTimeFormatter,
  Position,
  ScaleType,
  Settings,
  StackMode,
} from '../../packages/charts/src';
import DATA from '../../packages/charts/src/utils/data_samples/4_time_series.json';

const dataNames = Object.keys(DATA);
export const Example = () => {
  const stackedAsPercentage = boolean('stacked as percentage', true);
  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="Time"
        tickFormat={niceTimeFormatter([1583100000000, 1583622000000])}
      />
      <Axis
        id="left2"
        title="Left axis"
        position={Position.Left}
        tickFormat={(d) => (stackedAsPercentage ? `${Number(d * 100).toFixed(0)} %` : d.toFixed(0))}
      />
      {Object.values(DATA).map((d, i) => {
        return (
          <AreaSeries
            key={dataNames[i]}
            id={dataNames[i]}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor="key"
            yAccessors={[
              (datum) => {
                return datum['ffbd09b8-04af-4fcc-ba5f-b0fd50c4862b'].value;
              },
            ]}
            stackMode={stackedAsPercentage ? StackMode.Percentage : undefined}
            stackAccessors={['key']}
            data={d.buckets}
          />
        );
      })}
    </Chart>
  );
};
