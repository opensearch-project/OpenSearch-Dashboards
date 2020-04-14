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

import { Chart, Goal } from '../../src';
import { config } from '../../src/chart_types/goal_chart/layout/config/config';
import React from 'react';
import { Color } from '../../src/utils/commons';
import { BandFillColorAccessorInput, GOAL_SUBTYPES } from '../../src/chart_types/goal_chart/specs/index';

const q1 = 255 - 255 * 0.4;
const q2 = 255 - 255 * 0.25;
const q3 = 255 - 255 * 0.1;

const subtype = GOAL_SUBTYPES[1];

const colorMap: { [k: number]: Color } = {
  200: `rgb(${q1},${q1},${q1})`,
  250: `rgb(${q2},${q2},${q2})`,
  300: `rgb(${q3},${q3},${q3})`,
};

const bandFillColor = (x: number): Color => colorMap[x];

export const example = () => (
  <Chart className="story-chart" /*size={{ width: 800, height: 800 }}*/>
    <Goal
      id="spec_1"
      subtype={subtype}
      base={0}
      target={260}
      actual={280}
      bands={[300]}
      ticks={[0, 100, 200, 300]}
      tickValueFormatter={({ value }: BandFillColorAccessorInput) => String(value)}
      bandFillColor={({ value }: BandFillColorAccessorInput) => bandFillColor(value)}
      labelMajor="Revenue 2020 YTD  "
      labelMinor="(thousand USD)  "
      centralMajor="280"
      centralMinor="target: 260"
      config={config}
    />
  </Chart>
);
