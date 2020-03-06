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

import { SB_KNOBS_PANEL } from '../utils/storybook';

import React from 'react';
import {
  Axis,
  BarSeries,
  Chart,
  DARK_THEME,
  LIGHT_THEME,
  LineSeries,
  niceTimeFormatByDay,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
  TooltipType,
} from '../../src/';

import { boolean, select } from '@storybook/addon-knobs';
import { switchTheme } from '../../.storybook/theme_service';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';
import { getChartRotationKnob } from '../utils/knobs';

export const example = () => {
  const hideBars = boolean('hideBars', false);
  const formatter = timeFormatter(niceTimeFormatByDay(1));
  const darkmode = boolean('darkmode', false);
  const className = darkmode ? 'story-chart-dark' : 'story-chart';
  const defaultTheme = darkmode ? DARK_THEME : LIGHT_THEME;
  switchTheme(darkmode ? 'dark' : 'light');
  const chartRotation = getChartRotationKnob();
  const numberFormatter = (d: any) => Number(d).toFixed(2);

  const tooltipType = select(
    'tooltipType',
    {
      cross: TooltipType.Crosshairs,
      vertical: TooltipType.VerticalCursor,
      follow: TooltipType.Follow,
      none: TooltipType.None,
    },
    TooltipType.Crosshairs,
  );

  const tooltipProps = {
    type: tooltipType,
    snap: boolean('tooltip snap to grid', true),
  };

  return (
    <Chart className={className}>
      <Settings debug={boolean('debug', false)} tooltip={tooltipProps} theme={defaultTheme} rotation={chartRotation} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="Bottom axis"
        tickFormat={[0, 180].includes(chartRotation) ? formatter : numberFormatter}
      />
      <Axis
        id="left2"
        title="Left axis"
        position={Position.Left}
        tickFormat={[0, 180].includes(chartRotation) ? numberFormatter : formatter}
      />
      {!hideBars && (
        <BarSeries
          id="data 1"
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 20)}
        />
      )}
      {!hideBars && (
        <BarSeries
          id="data 2"
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 20)}
        />
      )}
      <LineSeries
        id="data 3"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[2].data.slice(0, 20)}
        yScaleToDataExtent={hideBars}
      />
    </Chart>
  );
};

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};
