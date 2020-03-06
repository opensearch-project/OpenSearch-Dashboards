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

import { boolean, color, number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, Chart, LineSeries, Position, ScaleType, Settings, LineSeriesStyle } from '../../src';

function range(title: string, min: number, max: number, value: number, groupId?: string, step = 1) {
  return number(
    title,
    value,
    {
      range: true,
      min,
      max,
      step,
    },
    groupId,
  );
}

function generateLineSeriesStyleKnobs(
  groupName: string,
  tag: string,
  pointFill?: string,
  pointStroke?: string,
  pointStrokeWidth?: number,
  pointRadius?: number,
  lineStrokeWidth?: number,
  lineStroke?: string,
): LineSeriesStyle {
  return {
    line: {
      stroke: lineStroke ? color(`line.stroke (${tag})`, lineStroke, groupName) : undefined,
      strokeWidth: range(`line.strokeWidth (${tag})`, 0, 10, lineStrokeWidth ? lineStrokeWidth : 1, groupName),
      visible: boolean(`line.visible (${tag})`, true, groupName),
      opacity: range(`line.opacity (${tag})`, 0, 1, 1, groupName, 0.01),
    },
    point: {
      visible: boolean(`point.visible (${tag})`, true, groupName),
      radius: range(`point.radius (${tag})`, 0, 20, pointRadius ? pointRadius : 5, groupName, 0.5),
      opacity: range(`point.opacity (${tag})`, 0, 1, 1, groupName, 0.01),
      stroke: color(`point.stroke (${tag})`, pointStroke ? pointStroke : 'black', groupName),
      fill: color(`point.fill (${tag})`, pointFill ? pointFill : 'lightgray', groupName),
      strokeWidth: range(`point.strokeWidth (${tag})`, 0, 5, pointStrokeWidth ? pointStrokeWidth : 2, groupName, 0.01),
    },
  };
}

export const example = () => {
  const applyLineStyles = boolean('apply line series style', true, 'Chart Global Theme');
  const lineSeriesStyle1 = generateLineSeriesStyleKnobs('Line 1 style', 'line1', 'lime', 'green', 4, 10, 6);
  const lineSeriesStyle2 = generateLineSeriesStyleKnobs('Line 2 style', 'line2', 'blue', 'violet', 2, 5, 4);

  const chartTheme = {
    lineSeriesStyle: generateLineSeriesStyleKnobs('Chart Global Theme', 'chartTheme'),
  };

  const dataset1 = [
    { x: 0, y: 3 },
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 10 },
  ];
  const dataset2 = dataset1.map((datum) => ({ ...datum, y: datum.y - 1 }));
  const dataset3 = dataset1.map((datum) => ({ ...datum, y: datum.y - 2 }));

  return (
    <Chart renderer="canvas" className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} theme={chartTheme} />
      <Axis id="bottom" position={Position.Bottom} showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />
      <LineSeries
        id="lines1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={dataset1}
        yScaleToDataExtent={false}
        lineSeriesStyle={applyLineStyles ? lineSeriesStyle1 : undefined}
      />
      <LineSeries
        id="lines2"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={dataset2}
        yScaleToDataExtent={false}
        lineSeriesStyle={applyLineStyles ? lineSeriesStyle2 : undefined}
      />
      <LineSeries
        id="lines3"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={dataset3}
        yScaleToDataExtent={false}
      />
    </Chart>
  );
};
