import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, LineSeries, Position, ScaleType, Settings } from '../../src';

export const example = () => {
  const leftDomain = {
    min: number('left min', 0),
    max: number('left max', 7),
  };

  const rightDomain1 = {
    min: number('right1 min', 0),
    max: number('right1 max', 10),
  };

  const rightDomain2 = {
    min: number('right2 min', 0),
    max: number('right2 max', 10),
  };

  const xDomain = {
    min: number('xDomain min', 0),
    max: number('xDomain max', 3),
  };
  return (
    <Chart className="story-chart">
      <Settings showLegend={false} xDomain={xDomain} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis
        id="left"
        title="Bar axis"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
        domain={leftDomain}
        hide={boolean('hide left axis', false)}
      />
      <Axis
        id="right"
        title="Line axis (Right 1)"
        groupId="group2"
        position={Position.Right}
        tickFormat={(d) => Number(d).toFixed(2)}
        domain={rightDomain1}
      />
      <Axis
        id="right2"
        title="Line axis (Right 2)"
        groupId="group2"
        position={Position.Right}
        tickFormat={(d) => Number(d).toFixed(2)}
        domain={rightDomain2}
      />
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
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        groupId="group2"
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={['x']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 3 },
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 10 },
        ]}
      />
    </Chart>
  );
};
