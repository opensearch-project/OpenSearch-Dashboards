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

import { text, boolean } from '@storybook/addon-knobs';
import numeral from 'numeral';
import React from 'react';

import { Axis, Chart, LineSeries, Position, ScaleType, Settings } from '../../src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const Example = () => {
  const showLegend = boolean('Show legend', true);
  const disableAxisFormat = boolean('Disable Y Axis tickFormat', false);
  const axisFormat = text('Y Axis value format', '0[.]0');
  const axisUnit = text('Y Axis unit', 'pets');
  const disableDogLineFormat = boolean('Disable dog line tickFormat', false);
  const dogLineFormat = text('Dog line unit', 'dogs');
  const disableCatLineFormat = boolean('Disable cat line tickFormat', false);
  const catLineFormat = text('Cat line unit', 'cats');

  return (
    <Chart className="story-chart">
      <Settings
        theme={{
          legend: {
            // Used to allow space for long formatting
            spacingBuffer: 60,
          },
        }}
        showLegendExtra
        showLegend={showLegend}
      />
      <Axis id="bottom" title="Country" position={Position.Bottom} showOverlappingTicks />
      <Axis
        id="left"
        title="Units"
        position={Position.Left}
        tickFormat={
          disableAxisFormat ? undefined : (d) => `${numeral(d).format(axisFormat)}${axisUnit ? ` ${axisUnit}` : ''}`
        }
      />
      <LineSeries
        id="Dog line"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        tickFormat={disableDogLineFormat ? undefined : (d) => `${Number(d).toFixed(2)} ${dogLineFormat}`}
        data={[
          { x: 'USA', y: 8 },
          { x: 'Canada', y: 7 },
          { x: 'Mexico', y: 18 },
        ]}
      />
      <LineSeries
        id="Cat line"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        tickFormat={disableCatLineFormat ? undefined : (d) => `${Number(d).toFixed(2)} ${catLineFormat}`}
        data={[
          { x: 'USA', y: 14 },
          { x: 'Canada', y: 15 },
          { x: 'Mexico', y: 14 },
        ]}
      />
    </Chart>
  );
};

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
    info: {
      text: 'Using a single axis with different unit types is discouraged. ',
    },
  },
};
