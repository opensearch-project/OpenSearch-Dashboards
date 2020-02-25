import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType } from '../../src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Log}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        stackAccessors={['x']}
        data={[
          { x: 1, y: 0, g: 'a' },
          { x: 1, y: 0, g: 'b' },
          { x: 2, y: 1, g: 'a' },
          { x: 2, y: 1, g: 'b' },
          { x: 3, y: 2, g: 'a' },
          { x: 3, y: 2, g: 'b' },
          { x: 4, y: 3, g: 'a' },
          { x: 4, y: 0, g: 'b' },
          { x: 5, y: 4, g: 'a' },
          { x: 5, y: 0.5, g: 'b' },
          { x: 6, y: 5, g: 'a' },
          { x: 6, y: 1, g: 'b' },
          { x: 7, y: 6, g: 'b' },
          { x: 8, y: 7, g: 'a' },
          { x: 8, y: 10, g: 'b' },
          { x: 9, y: 4, g: 'a' },
        ]}
        yScaleToDataExtent={true}
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
