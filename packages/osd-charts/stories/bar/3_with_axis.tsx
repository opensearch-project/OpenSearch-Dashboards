import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, DARK_THEME, LIGHT_THEME, Position, ScaleType, Settings } from '../../src';

export const example = () => {
  const darkmode = boolean('darkmode', false);
  const className = darkmode ? 'story-chart-dark' : 'story-chart';
  const defaultTheme = darkmode ? DARK_THEME : LIGHT_THEME;
  return (
    <Chart className={className}>
      <Settings theme={defaultTheme} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
