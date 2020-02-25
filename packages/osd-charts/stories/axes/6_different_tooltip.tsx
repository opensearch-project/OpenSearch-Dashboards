import React from 'react';

import { Axis, Chart, LineSeries, Position, ScaleType, Settings } from '../../src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings showLegend={false} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis
        id="left"
        groupId="group1"
        title="Line 1"
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(2)} %`}
      />
      <Axis
        id="right"
        title="Line 2"
        groupId="group2"
        position={Position.Right}
        tickFormat={(d) => `${Number(d).toFixed(2)}/s`}
      />
      <LineSeries
        id="line1"
        groupId="group1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={['x']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 5 },
          { x: 1, y: 4 },
          { x: 2, y: 3 },
          { x: 3, y: 2 },
        ]}
      />
      <LineSeries
        id="line2"
        groupId="group2"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={['x']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 3 },
          { x: 2, y: 4 },
          { x: 3, y: 5 },
        ]}
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
