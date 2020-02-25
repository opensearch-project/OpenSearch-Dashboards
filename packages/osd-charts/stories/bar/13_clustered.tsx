import { number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, LIGHT_THEME, Position, ScaleType, Settings } from '../../src';
import { getChartRotationKnob } from '../utils/knobs';

export const example = () => {
  const theme = {
    ...LIGHT_THEME,
    scales: {
      histogramPadding: number('histogram padding', 0.05, {
        range: true,
        min: 0,
        max: 1,
        step: 0.01,
      }),
      barsPadding: number('bar padding', 0.25, {
        range: true,
        min: 0,
        max: 1,
        step: 0.01,
      }),
    },
  };
  return (
    <Chart className="story-chart">
      <Settings
        showLegend
        showLegendExtra
        legendPosition={Position.Right}
        theme={theme}
        rotation={getChartRotationKnob()}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 2, g: 'a' },
          { x: 1, y: 7, g: 'a' },
          { x: 2, y: 3, g: 'a' },
          { x: 3, y: 6, g: 'a' },
          { x: 0, y: 4, g: 'b' },
          { x: 1, y: 5, g: 'b' },
          { x: 2, y: 8, g: 'b' },
          { x: 3, y: 2, g: 'b' },
        ]}
      />
    </Chart>
  );
};
