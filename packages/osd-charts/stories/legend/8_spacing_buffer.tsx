import { number } from '@storybook/addon-knobs';
import React from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings, PartialTheme } from '../../src/';

export const example = () => {
  const theme: PartialTheme = {
    legend: {
      spacingBuffer: number('legend buffer value', 80),
    },
  };

  return (
    <Chart className="story-chart">
      <Settings theme={theme} showLegend showLegendExtra legendPosition={Position.Right} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars 1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 100000000 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
      <BarSeries
        id="bars 2"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 100000000 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
