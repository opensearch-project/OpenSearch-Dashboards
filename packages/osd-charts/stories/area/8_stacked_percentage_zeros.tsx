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

import React from 'react';
import { AreaSeries, Axis, Chart, Position, ScaleType, Settings, niceTimeFormatter } from '../../src';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="Bottom axis"
        tickFormat={niceTimeFormatter([1585234800000, 1585836000000])}
      />
      <Axis
        id="left2"
        title="Left axis"
        position={Position.Left}
        tickFormat={(d) => `${Number(d * 100).toFixed(0)} %`}
      />

      <AreaSeries
        id="areas1"
        name="area"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={DATA[0].data}
        stackAccessors={[0]}
        stackAsPercentage
      />
      <AreaSeries
        id="areas2"
        name="area"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={DATA[1].data}
        stackAccessors={[0]}
        stackAsPercentage
      />
      <AreaSeries
        id="areas3"
        name="area"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={DATA[2].data}
        stackAsPercentage
        stackAccessors={[0]}
      />
    </Chart>
  );
};

const DATA = [
  {
    id: '61ca57f1-469d-11e7-af02-69e470af7417:200',
    label: '200',
    color: 'rgb(115, 216, 255)',
    data: [
      [1585234800000, 10],
      [1585249200000, 6],
      [1585263600000, 2],
      [1585278000000, 5],
      [1585292400000, 70],
      [1585306800000, 84],
      [1585321200000, 32],
      [1585335600000, 3],
      [1585350000000, 2],
      [1585364400000, 18],
      [1585378800000, 66],
      [1585393200000, 82],
      [1585407600000, 32],
      [1585422000000, 4],
      [1585436400000, 1],
      [1585447200000, 9],
      [1585461600000, 58],
      [1585476000000, 70],
      [1585490400000, 58],
      [1585504800000, 9],
      [1585519200000, 0],
      [1585533600000, 10],
      [1585548000000, 46],
      [1585562400000, 95],
      [1585576800000, 43],
      [1585591200000, 10],
      [1585605600000, 1],
      [1585620000000, 8],
      [1585634400000, 56],
      [1585648800000, 88],
      [1585663200000, 50],
      [1585677600000, 7],
      [1585692000000, 1],
      [1585706400000, 9],
      [1585720800000, 59],
      [1585735200000, 83],
      [1585749600000, 46],
      [1585764000000, 7],
      [1585778400000, 2],
      [1585792800000, 12],
      [1585807200000, 44],
      [1585821600000, 84],
      [1585836000000, 41],
    ],
    seriesId: '61ca57f1-469d-11e7-af02-69e470af7417',
    stack: 'percent',
    lines: { show: true, fill: 0.5, lineWidth: 2, steps: false },
    points: { show: false, radius: 1, lineWidth: 5 },
    bars: { show: false, fill: 0.5, lineWidth: 2 },
  },
  {
    id: '61ca57f1-469d-11e7-af02-69e470af7417:404',
    label: '404',
    color: 'rgb(0, 157, 217)',
    data: [
      [1585234800000, 0],
      [1585249200000, 0],
      [1585263600000, 0],
      [1585278000000, 1],
      [1585292400000, 6],
      [1585306800000, 8],
      [1585321200000, 3],
      [1585335600000, 0],
      [1585350000000, 1],
      [1585364400000, 1],
      [1585378800000, 2],
      [1585393200000, 3],
      [1585407600000, 1],
      [1585422000000, 0],
      [1585436400000, 0],
      [1585447200000, 1],
      [1585461600000, 0],
      [1585476000000, 6],
      [1585490400000, 3],
      [1585504800000, 0],
      [1585519200000, 0],
      [1585533600000, 1],
      [1585548000000, 4],
      [1585562400000, 6],
      [1585576800000, 1],
      [1585591200000, 0],
      [1585605600000, 1],
      [1585620000000, 0],
      [1585634400000, 1],
      [1585648800000, 6],
      [1585663200000, 4],
      [1585677600000, 0],
      [1585692000000, 0],
      [1585706400000, 0],
      [1585720800000, 1],
      [1585735200000, 8],
      [1585749600000, 2],
      [1585764000000, 0],
      [1585778400000, 0],
      [1585792800000, 0],
      [1585807200000, 1],
      [1585821600000, 6],
      [1585836000000, 3],
    ],
    seriesId: '61ca57f1-469d-11e7-af02-69e470af7417',
    stack: 'percent',
    lines: { show: true, fill: 0.5, lineWidth: 2, steps: false },
    points: { show: false, radius: 1, lineWidth: 5 },
    bars: { show: false, fill: 0.5, lineWidth: 2 },
  },
  {
    id: '61ca57f1-469d-11e7-af02-69e470af7417:503',
    label: '503',
    color: 'rgb(0, 46, 64)',
    data: [
      [1585234800000, 0],
      [1585249200000, 0],
      [1585263600000, 0],
      [1585278000000, 1],
      [1585292400000, 2],
      [1585306800000, 3],
      [1585321200000, 3],
      [1585335600000, 0],
      [1585350000000, 0],
      [1585364400000, 0],
      [1585378800000, 2],
      [1585393200000, 2],
      [1585407600000, 2],
      [1585422000000, 0],
      [1585436400000, 0],
      [1585447200000, 0],
      [1585461600000, 1],
      [1585476000000, 3],
      [1585490400000, 2],
      [1585504800000, 0],
      [1585519200000, 0],
      [1585533600000, 0],
      [1585548000000, 2],
      [1585562400000, 1],
      [1585576800000, 3],
      [1585591200000, 0],
      [1585605600000, 0],
      [1585620000000, 0],
      [1585634400000, 1],
      [1585648800000, 1],
      [1585663200000, 1],
      [1585677600000, 0],
      [1585692000000, 0],
      [1585706400000, 0],
      [1585720800000, 1],
      [1585735200000, 3],
      [1585749600000, 1],
      [1585764000000, 1],
      [1585778400000, 0],
      [1585792800000, 0],
      [1585807200000, 2],
      [1585821600000, 1],
      [1585836000000, 3],
    ],
    seriesId: '61ca57f1-469d-11e7-af02-69e470af7417',
    stack: 'percent',
    lines: { show: true, fill: 0.5, lineWidth: 2, steps: false },
    points: { show: false, radius: 1, lineWidth: 5 },
    bars: { show: false, fill: 0.5, lineWidth: 2 },
  },
];
