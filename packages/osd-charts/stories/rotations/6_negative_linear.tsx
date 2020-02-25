import React from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src/';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} rotation={-90} />
      <Axis id="y top" position={Position.Top} title="y top axis" />
      <Axis id="x right" title="x right axis" position={Position.Right} />
      <Axis id="y bottom" position={Position.Bottom} title="y bottom axis" />
      <Axis id="x left" title="x left axis" position={Position.Left} />
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
