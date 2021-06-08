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

import { Chart, CurveType, AreaSeries, Position, Axis, ScaleType } from '../../packages/charts/src';

export const Example = () => (
  <Chart className="story-chart">
    <Axis id="bottom" position={Position.Bottom} />
    <Axis id="left" position={Position.Left} />
    <AreaSeries
      id="path-order"
      xScaleType={ScaleType.Ordinal}
      yScaleType={ScaleType.Linear}
      xAccessor="col-0-3"
      yAccessors={['col-2-5']}
      data={data}
      curve={CurveType.CURVE_CATMULL_ROM}
      splitSeriesAccessors={['col-1-6']}
      stackAccessors={['col-1-6']}
      areaSeriesStyle={{
        point: { visible: true },
      }}
    />
  </Chart>
);

const data = [
  {
    'col-0-3': 'ZRH',
    'col-1-6': 'Logstash Airways',
    'col-2-5': 27,
  },
  {
    'col-0-3': 'ZRH',
    'col-1-6': 'Kibana Airlines',
    'col-2-5': 38,
  },
  {
    'col-0-3': 'ZRH',
    'col-1-6': 'JetBeats',
    'col-2-5': 26,
  },
  {
    'col-0-3': 'ZRH',
    'col-1-6': 'ES-Air',
    'col-2-5': 33,
  },
  {
    'col-0-3': 'YYZ',
    'col-1-6': 'Kibana Airlines',
    'col-2-5': 5,
  },
  {
    'col-0-3': 'YYZ',
    'col-1-6': 'JetBeats',
    'col-2-5': 7,
  },
  {
    'col-0-3': 'YYZ',
    'col-1-6': 'ES-Air',
    'col-2-5': 4,
  },
  {
    'col-0-3': 'YWG',
    'col-1-6': 'ES-Air',
    'col-2-5': 10,
  },
  {
    'col-0-3': 'YWG',
    'col-1-6': 'Logstash Airways',
    'col-2-5': 17,
  },
  {
    'col-0-3': 'YWG',
    'col-1-6': 'Kibana Airlines',
    'col-2-5': 19,
  },
  {
    'col-0-3': 'YUL',
    'col-1-6': 'Logstash Airways',
    'col-2-5': 4,
  },
  {
    'col-0-3': 'YUL',
    'col-1-6': 'Kibana Airlines',
    'col-2-5': 7,
  },
  {
    'col-0-3': 'YUL',
    'col-1-6': 'JetBeats',
    'col-2-5': 4,
  },
  {
    'col-0-3': 'YUL',
    'col-1-6': 'ES-Air',
    'col-2-5': 13,
  },
  {
    'col-0-3': 'YOW',
    'col-1-6': 'Logstash Airways',
    'col-2-5': 11,
  },
  {
    'col-0-3': 'YOW',
    'col-1-6': 'Kibana Airlines',
    'col-2-5': 6,
  },
  {
    'col-0-3': 'YOW',
    'col-1-6': 'ES-Air',
    'col-2-5': 14,
  },
];
