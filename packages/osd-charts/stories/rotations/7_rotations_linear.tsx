import React from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src/';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} rotation={0} />
      <Axis id="x top" position={Position.Top} title="x top axis" />
      <Axis id="y right" title="y right axis" position={Position.Right} />
      <Axis id="x bottom" position={Position.Bottom} title="x bottom axis" />
      <Axis id="y left" title="y left axis" position={Position.Left} />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 1 },
          { x: 1, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 4 },
        ]}
      />
    </Chart>
  );
};
