import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src';
import { getChartRotationKnob } from '../utils/knobs';

export const example = () => {
  const hasCustomDomain = boolean('has custom domain', false);
  const xDomain = hasCustomDomain ? ['a', 'b'] : undefined;

  const theme = {
    scales: {
      barsPadding: number('bars padding', 0.25, {
        range: true,
        min: 0,
        max: 1,
        step: 0.1,
      }),
    },
  };
  return (
    <Chart className="story-chart">
      <Settings xDomain={xDomain} rotation={getChartRotationKnob()} theme={theme} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[{ x: 'a', y: 10, g: 1 }]}
      />
    </Chart>
  );
};
