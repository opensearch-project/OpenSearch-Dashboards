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

import React from 'react';
import { select, color } from '@storybook/addon-knobs';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings, PartialTheme } from '../../src';
import * as TestDatasets from '../../src/utils/data_samples/test_dataset';
import { SB_SOURCE_PANEL } from '../utils/storybook';
import { ColorVariant } from '../../src/utils/commons';

export const example = () => {
  const fillOption = select(
    'fillColor',
    {
      None: ColorVariant.None,
      Series: ColorVariant.Series,
      Custom: 'custom',
    },
    ColorVariant.None,
  );
  const fillColor = color('custom fill color', 'aquamarine');
  const fill = fillOption === 'custom' ? fillColor : fillOption;
  const strokeOption = select(
    'strokeColor',
    {
      None: ColorVariant.None,
      Series: ColorVariant.Series,
      Custom: 'custom',
    },
    ColorVariant.Series,
  );
  const strokeColor = color('custom stroke color', 'aquamarine');
  const stroke = strokeOption === 'custom' ? strokeColor : strokeOption;
  const customTheme: PartialTheme = {
    barSeriesStyle: {
      rect: {
        fill,
      },
      rectBorder: {
        visible: true,
        strokeWidth: 10,
        stroke,
      },
    },
  };

  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} theme={customTheme} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bar"
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g']}
        data={TestDatasets.BARCHART_2Y1G}
      />
    </Chart>
  );
};

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
