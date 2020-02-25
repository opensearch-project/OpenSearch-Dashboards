import { color } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, PartialTheme, Position, ScaleType, Settings } from '../../src';
import { SeededDataGenerator } from '../../src/mocks/utils';

const dg = new SeededDataGenerator();
const data1 = dg.generateGroupedSeries(40, 4);

export const example = () => {
  const customPartialTheme: PartialTheme = {
    barSeriesStyle: {
      rectBorder: {
        stroke: color('BarBorderStroke', 'white'),
        visible: true,
      },
    },
  };

  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra theme={customPartialTheme} legendPosition={Position.Right} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />
      <Axis id="top" position={Position.Top} title="Top axis" showOverlappingTicks={true} />
      <Axis id="right" title="Right axis" position={Position.Right} tickFormat={(d) => Number(d).toFixed(2)} />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        stackAccessors={['x']}
        data={data1}
      />
    </Chart>
  );
};
