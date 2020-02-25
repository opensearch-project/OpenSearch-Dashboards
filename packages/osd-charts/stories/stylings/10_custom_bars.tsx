import { boolean, color, number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src';
import * as TestDatasets from '../../src/utils/data_samples/test_dataset';

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

export const example = () => {
  const applyBarStyle = boolean('apply bar style (bar 1 series)', true, 'Chart Global Theme');

  const barSeriesStyle = {
    rectBorder: {
      stroke: color('border stroke', 'blue', 'Bar 1 Style'),
      strokeWidth: range('border strokeWidth', 0, 5, 2, 'Bar 1 Style', 0.1),
      visible: boolean('border visible', true, 'Bar 1 Style'),
    },
    rect: {
      fill: color('rect fill', '#22C61A', 'Bar 1 Style'),
      opacity: range('rect opacity', 0, 1, 0.3, 'Bar 1 Style', 0.1),
    },
  };

  const theme = {
    barSeriesStyle: {
      rectBorder: {
        stroke: color('theme border stroke', 'red', 'Chart Global Theme'),
        strokeWidth: range('theme border strokeWidth', 0, 5, 2, 'Chart Global Theme', 0.1),
        visible: boolean('theme border visible', true, 'Chart Global Theme'),
      },
      rect: {
        opacity: range('theme opacity ', 0, 1, 0.9, 'Chart Global Theme', 0.1),
      },
    },
  };

  return (
    <Chart renderer="canvas" className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} theme={theme} />
      <Axis id="bottom" position={Position.Bottom} showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="bar 1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={TestDatasets.BARCHART_1Y0G}
        yScaleToDataExtent={false}
        barSeriesStyle={applyBarStyle ? barSeriesStyle : undefined}
        name="bars 1"
      />
      <BarSeries
        id="bar 2"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={TestDatasets.BARCHART_1Y0G}
        yScaleToDataExtent={false}
        name="bars 2"
      />
    </Chart>
  );
};
