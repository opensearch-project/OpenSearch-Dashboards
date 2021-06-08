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

import React from 'react';

import {
  Axis,
  Chart,
  LIGHT_THEME,
  LineSeries,
  niceTimeFormatByDay,
  PointShape,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from '../../packages/charts/src';
import { KIBANA_METRICS } from '../../packages/charts/src/utils/data_samples/test_dataset_kibana';

const dateFormatter = timeFormatter(niceTimeFormatByDay(1));
const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 20);
const shapes = Object.values(PointShape);
export const Example = () => (
  <Chart className="story-chart">
    <Settings showLegend showLegendExtra legendPosition={Position.Right} />
    <Axis id="bottom" position={Position.Bottom} showOverlappingTicks tickFormat={dateFormatter} />
    <Axis
      id="left"
      title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
      position={Position.Left}
      tickFormat={(d) => `${Number(d).toFixed(0)}%`}
    />
    {shapes.map((shape, i) => {
      return (
        <LineSeries
          key={shape}
          id={shape}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          lineSeriesStyle={{ point: { shape, radius: 10 } }}
          data={data.map(([x, y]) => [x, y + 10 * i])}
        />
      );
    })}
    <LineSeries
      id="multi"
      xScaleType={ScaleType.Time}
      yScaleType={ScaleType.Linear}
      xAccessor={0}
      yAccessors={[1]}
      color="lightgray"
      pointStyleAccessor={(datum) => {
        return {
          shape: shapes[datum.datum[2] % shapes.length],
          fill: LIGHT_THEME.colors.vizColors[datum.datum[2] % LIGHT_THEME.colors.vizColors.length],
          opacity: 0.9,
          radius: 5,
          stroke: LIGHT_THEME.colors.vizColors[datum.datum[2] % LIGHT_THEME.colors.vizColors.length],
          strokeWidth: 1,
          visible: true,
        };
      }}
      data={data.map(([x, y], i) => [x, y + 60, i])}
    />
  </Chart>
);
