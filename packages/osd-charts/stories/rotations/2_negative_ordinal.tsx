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
