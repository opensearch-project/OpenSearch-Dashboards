import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import { AreaSeries, Axis, Chart, Position, ScaleType } from '../../src';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="bottom"
        showOverlappingTicks={true}
        hide={boolean('hide botttom axis', false)}
      />
      <Axis
        id="left"
        title="left"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
        hide={boolean('hide left axis', false)}
      />
      <Axis
        id="top"
        position={Position.Top}
        title="top"
        showOverlappingTicks={true}
        hide={boolean('hide top axis', false)}
      />
      <Axis
        id="right"
        title="right"
        position={Position.Right}
        tickFormat={(d) => Number(d).toFixed(2)}
        hide={boolean('hide right axis', false)}
      />

      <AreaSeries
        id="lines"
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
