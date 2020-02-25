import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const example = () => (
  <Chart className="story-chart">
    <Settings xDomain={{ max: 100 }} />
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
        { x: 10, y: 7 },
        { x: 11.5, y: 9 },
        { x: 13.5, y: 3 },
        { x: 50, y: 6 },
        { x: 66, y: 13 },
        { x: 90, y: 4 },
      ]}
    />
  </Chart>
);

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
