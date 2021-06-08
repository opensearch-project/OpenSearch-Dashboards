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

import { Chart, Goal } from '../../packages/charts/src';
import { config } from '../../packages/charts/src/chart_types/goal_chart/layout/config/config';
import { BandFillColorAccessorInput } from '../../packages/charts/src/chart_types/goal_chart/specs';
import { GoalSubtype } from '../../packages/charts/src/chart_types/goal_chart/specs/constants';
import { Color } from '../../packages/charts/src/utils/common';

const q1 = 255 - 255 * 0.4;
const q2 = 255 - 255 * 0.25;
const q3 = 255 - 255 * 0.1;

const subtype = GoalSubtype.VerticalBullet;

const colorMap: { [k: number]: Color } = {
  '-100': 'lightcoral',
  0: 'indianred',
  200: `rgb(${q1},${q1},${q1})`,
  250: `rgb(${q2},${q2},${q2})`,
  300: `rgb(${q3},${q3},${q3})`,
};

const bandFillColor = (x: number): Color => colorMap[x];

export const Example = () => (
  <Chart className="story-chart">
    <Goal
      id="spec_1"
      subtype={subtype}
      base={0}
      target={260}
      actual={-80}
      bands={[-200, -100, 0, 200, 250, 300]}
      ticks={[-200, -100, 0, 100, 200, 300]}
      tickValueFormatter={({ value }: BandFillColorAccessorInput) => String(value)}
      bandFillColor={({ value }: BandFillColorAccessorInput) => bandFillColor(value)}
      labelMajor="Revenue 2020 YTD  "
      labelMinor="(thousand USD)  "
      centralMajor="-80"
      centralMinor="target: 260"
      config={config}
    />
  </Chart>
);
