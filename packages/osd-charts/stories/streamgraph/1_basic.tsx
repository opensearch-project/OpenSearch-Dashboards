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

import { select } from '@storybook/addon-knobs';
import React from 'react';

import { AreaSeries, Chart, ScaleType, StackMode, Axis, Position, CurveType } from '../../src';
import { BABYNAME_DATA } from '../../src/utils/data_samples/babynames';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const Example = () => {
  const stackMode = select<StackMode>(
    'stackMode',
    {
      Silhouette: StackMode.Silhouette,
      Wiggle: StackMode.Wiggle,
    },
    StackMode.Silhouette,
  );
  return (
    <Chart className="story-chart">
      <Axis id="x" position={Position.Bottom} />
      <Axis id="y" position={Position.Left} />
      <AreaSeries
        id="area1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[3]}
        splitSeriesAccessors={[2]}
        data={BABYNAME_DATA}
        stackAccessors={[0]}
        curve={CurveType.CURVE_MONOTONE_X}
        stackMode={stackMode}
        areaSeriesStyle={{
          area: {
            opacity: 0.7,
          },
          line: {
            visible: false,
          },
        }}
      />
    </Chart>
  );
};

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
