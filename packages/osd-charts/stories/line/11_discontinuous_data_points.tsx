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
  CurveType,
  LineSeries,
  Position,
  ScaleType,
  Settings,
  Fit,
  AreaSeries,
} from '../../packages/charts/src';

export const Example = () => {
  const fitEnabled = boolean('enable fit function', false);
  const isArea = boolean('switch to area', false);
  const LineOrAreaSeries = isArea ? AreaSeries : LineSeries;
  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} />
      <Axis id="x" position={Position.Bottom} />
      <Axis id="y" position={Position.Left} />

      <LineOrAreaSeries
        id="series 1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        fit={fitEnabled ? Fit.Linear : undefined}
        data={[
          [0, 10],
          [1, 12],
          [2, 14],
          [3, 15],
          [4, 5],
          [5, 6],
          [6, 9],
          [8, 11],
        ]}
        curve={CurveType.CURVE_MONOTONE_X}
      />

      <LineOrAreaSeries
        id="series 2"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        fit={fitEnabled ? Fit.Linear : undefined}
        data={[
          [0, 3],
          [1, 3.5],
          [3, 4],
          [4, 8],
          [6, 3],
          [7, 2],
        ]}
        curve={CurveType.CURVE_MONOTONE_X}
      />
    </Chart>
  );
};
