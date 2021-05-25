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

import { select, boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import {
  AreaSeries,
  Axis,
  Chart,
  DARK_THEME,
  LIGHT_THEME,
  Position,
  ScaleType,
  Settings,
  LegendPositionConfig,
  VerticalAlignment,
  HorizontalAlignment,
  LayoutDirection,
} from '../../src';
import { SeededDataGenerator } from '../../src/mocks/utils';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';
import { switchTheme } from '../../storybook/theme_service';
import { SB_KNOBS_PANEL } from '../utils/storybook';

const dg = new SeededDataGenerator();
const data = dg.generateGroupedSeries(10, 20);
export const Example = () => {
  const numberOfSeries = number('Number of series', 5, { min: 1, max: 20, step: 1, range: true });
  const seriesWithLongName = number('Series with long name', 3, {
    min: 0,
    max: numberOfSeries - 1,
    step: 1,
    range: true,
  });

  const floating: LegendPositionConfig['floating'] = boolean('Inside chart', true, 'Legend');
  const floatingColumns: LegendPositionConfig['floatingColumns'] = number(
    'floating columns',
    2,
    { min: 1, max: 10, range: true, step: 1 },
    'Legend',
  );
  const vAlign: LegendPositionConfig['vAlign'] = select(
    'vAlign',
    {
      [Position.Top]: VerticalAlignment.Top,
      // not yet implemented
      // [VerticalAlignment.Middle]: VerticalAlignment.Middle,
      [Position.Bottom]: VerticalAlignment.Bottom,
    },
    Position.Bottom,
    'Legend',
  );

  const hAlign: LegendPositionConfig['hAlign'] = select(
    'hAlign',
    {
      [Position.Left]: HorizontalAlignment.Left,
      // not yet implemented
      // [HorizontalAlignment.Center]: HorizontalAlignment.Center,
      [Position.Right]: HorizontalAlignment.Right,
    },
    Position.Right,
    'Legend',
  );
  const direction: LegendPositionConfig['direction'] = select(
    'direction',
    {
      ...LayoutDirection,
    },
    LayoutDirection.Vertical,
    'Legend',
  );

  const darkMode = boolean('Dark Mode', false);
  const className = darkMode ? 'story-chart-dark' : 'story-chart';

  switchTheme(darkMode ? 'dark' : 'light');
  return (
    <Chart className={className}>
      <Settings
        showLegend
        showLegendExtra
        legendPosition={{
          vAlign,
          hAlign,
          direction,
          floating,
          floatingColumns,
        }}
        theme={darkMode ? DARK_THEME : LIGHT_THEME}
      />
      <Axis id="bottom" position={Position.Bottom} showOverlappingTicks />
      <Axis
        id="left"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
      />
      <AreaSeries
        id={KIBANA_METRICS.metrics.kibana_os_load[0].metric.label}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={['x']}
        splitSeriesAccessors={['g']}
        data={data.slice(0, numberOfSeries * 10).map((d, i) => {
          if (i >= seriesWithLongName * 10 && i < seriesWithLongName * 10 + 10) {
            return {
              ...d,
              g: 'long name',
            };
          }
          return d;
        })}
      />
    </Chart>
  );
};

// storybook configuration
Example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};
