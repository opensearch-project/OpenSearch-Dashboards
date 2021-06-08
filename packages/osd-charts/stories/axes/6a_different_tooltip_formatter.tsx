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

import { Axis, Chart, LineSeries, Position, ScaleType, Settings } from '../../packages/charts/src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const Example = () => {
  const showLegend = boolean('Show legend', true, 'Y axis');
  const disableYAxisFormat = boolean('Disable Axis tickFormat', false, 'Y axis');
  const yAxisFormat = text('Axis value format', '0[.]0', 'Y axis');
  const yAxisUnit = text('Axis unit', 'pets', 'Y axis');
  const disableHeaderFormat = boolean('Disable header tickFormat', false, 'X axis');
  const headerUnit = text('Header unit', '(header)', 'X axis');
  const disableXAxisFormat = boolean('Disable Axis tickFormat', false, 'X axis');
  const xAxisUnit = text('Axis unit', '(axis)', 'X axis');
  const disableDogLineFormat = boolean('Disable dog line tickFormat', false, 'Y axis');
  const dogLineFormat = text('Dog line unit', 'dogs', 'Y axis');
  const disableCatLineFormat = boolean('Disable cat line tickFormat', false, 'Y axis');
  const catLineFormat = text('Cat line unit', 'cats', 'Y axis');

  return (
    <Chart className="story-chart">
      <Settings
        showLegendExtra
        showLegend={showLegend}
        tooltip={{
          headerFormatter: disableHeaderFormat
            ? undefined
            : ({ value }) => `${value}${headerUnit ? ` ${headerUnit}` : ''}`,
        }}
      />
      <Axis
        id="bottom"
        title="Country"
        position={Position.Bottom}
        showOverlappingTicks
        tickFormat={disableXAxisFormat ? undefined : (value) => `${value}${xAxisUnit ? ` ${xAxisUnit}` : ''}`}
      />
      <Axis
        id="left"
        title="Units"
        position={Position.Left}
        tickFormat={
          disableYAxisFormat ? undefined : (d) => `${numeral(d).format(yAxisFormat)}${yAxisUnit ? ` ${yAxisUnit}` : ''}`
        }
      />
      <LineSeries
        id="Dog line"
        xScaleType={ScaleType.Ordinal}
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
        xScaleType={ScaleType.Ordinal}
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
