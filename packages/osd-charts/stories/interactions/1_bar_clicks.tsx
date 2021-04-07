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
import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings, TooltipValue, TooltipValueFormatter } from '../../src';

const onElementListeners = {
  onElementClick: action('onElementClick'),
  onElementOver: action('onElementOver'),
  onElementOut: action('onElementOut'),
  onProjectionClick: action('onProjectionClick'),
};

export const Example = () => {
  const useObjectAsX = boolean('use object on x', false);
  const headerFormatter: TooltipValueFormatter = (tooltip: TooltipValue) => {
    if (tooltip.value % 2 === 0) {
      return (
        <div>
          <p>special header for even x values</p>
          <p>{tooltip.value}</p>
        </div>
      );
    }

    return tooltip.value;
  };

  const tooltipProps = {
    headerFormatter,
  };

  return (
    <Chart className="story-chart">
      <Settings
        showLegend
        showLegendExtra
        legendPosition={Position.Right}
        {...onElementListeners}
        tooltip={tooltipProps}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={useObjectAsX ? ScaleType.Ordinal : ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={useObjectAsX ? 'sObj' : 'x'}
        yAccessors={['y']}
        data={[
          { x: 0, y: 2, obj: { from: 10, to: 20 }, sObj: 'from 10 to 20' },
          { x: 1, y: 7, obj: { from: 20, to: 30 }, sObj: 'from 20 to 30' },
          { x: 2, y: -3, obj: { from: 30, to: 40 }, sObj: 'from 30 to 40' },
          { x: 3, y: 6, obj: { from: 40, to: 50 }, sObj: 'from 40 to 50' },
        ]}
      />
    </Chart>
  );
};
