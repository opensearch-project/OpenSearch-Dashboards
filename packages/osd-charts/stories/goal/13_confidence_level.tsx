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

const subtype = GOAL_SUBTYPES[0];

const colorMap: { [k: number]: Color } = {
  210: 'rgb(232,232,232)',
  218: '#66c2a4',
  224: '#2ca25f',
  229: '#006d2c',
  235: '#2ca25f',
  243: '#66c2a4',
  300: 'rgb(232,232,232)',
};

const bandFillColor = (x: number): Color => colorMap[x];

export const example = () => (
  <Chart className="story-chart" /*size={{ width: 800, height: 800 }}*/>
    <Goal
      id="spec_1"
      subtype={subtype}
      base={0}
      target={226.5}
      actual={0}
      bands={[210, 218, 224, 229, 235, 243, 300]}
      ticks={[0, 50, 100, 150, 200, 250, 300]}
      tickValueFormatter={({ value }: BandFillColorAccessorInput) => String(value)}
      bandFillColor={({ value }: BandFillColorAccessorInput) => bandFillColor(value)}
      labelMajor=""
      labelMinor=""
      centralMajor="226.5"
      centralMinor=""
      config={config}
    />
  </Chart>
);
