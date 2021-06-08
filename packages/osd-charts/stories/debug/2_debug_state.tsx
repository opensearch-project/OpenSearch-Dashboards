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
import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';
import { debounce } from 'ts-debounce';

import {
  Chart,
  LineSeries,
  ScaleType,
  CurveType,
  AreaSeries,
  BarSeries,
  Settings,
  Axis,
  Position,
  SeriesNameFn,
  DebugState,
} from '../../packages/charts/src';
import { SeededDataGenerator } from '../../packages/charts/src/mocks/utils';

export const Example = () => {
  const debug = boolean('debug', false);
  const debugState = boolean('debugState', true);
  const line = boolean('show line', true);
  const area = boolean('show area', true);
  const bar = boolean('show bar', true);
  const groupCount = number('number of groups', 1, { min: 1 });
  const splitSeriesAccessors = groupCount > 1 ? ['g'] : undefined;
  const naming: SeriesNameFn | undefined =
    groupCount === 1 ? undefined : ({ specId, seriesKeys }) => `${specId} | ${seriesKeys[0]}`;

  const dg = new SeededDataGenerator();
  const lineData = dg.generateGroupedSeries(40, groupCount);
  const areaData = dg.generateGroupedSeries(40, groupCount);
  const barData = dg.generateGroupedSeries(40, groupCount);

  const dataStateAction = action('DataState');
  const logDebugstate = debounce(() => {
    const statusEl = document.querySelector<HTMLDivElement>('.echChartStatus');

    if (statusEl) {
      const dataState = statusEl.dataset.echDebugState
        ? (JSON.parse(statusEl.dataset.echDebugState) as DebugState)
        : null;
      dataStateAction(dataState);
    }
  }, 100);

  return (
    <Chart className="story-chart">
      <Settings onRenderChange={logDebugstate} debug={debug} debugState={debugState} showLegend showLegendExtra />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks />
      <Axis id="left" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      {line && (
        <LineSeries
          id="lines"
          name={naming}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          splitSeriesAccessors={splitSeriesAccessors}
          data={lineData}
        />
      )}
      {area && (
        <AreaSeries
          id="areas"
          name={naming}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          data={areaData}
          splitSeriesAccessors={splitSeriesAccessors}
          curve={CurveType.CURVE_MONOTONE_X}
        />
      )}

      {bar && (
        <BarSeries
          id="bars"
          name={naming}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          splitSeriesAccessors={splitSeriesAccessors}
          data={barData}
        />
      )}
    </Chart>
  );
};
