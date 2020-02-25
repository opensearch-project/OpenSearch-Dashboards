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
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 'a', y: 1 },
          { x: 'b', y: 2 },
          { x: 'c', y: 3 },
          { x: 'd', y: 4 },
        ]}
      />
    </Chart>
  );
};
