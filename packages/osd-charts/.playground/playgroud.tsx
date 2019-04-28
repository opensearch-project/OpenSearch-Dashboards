import React from 'react';

import {
  Axis,
  Chart,
  getAxisId,
  getSpecId,
  LineSeries,
  niceTimeFormatter,
  Position,
  ScaleType,
  Settings,
} from '../src';

export class Playground extends React.Component {
  render() {
    const data = [
      [1555819200000, 111],
      [1555840800000, 90],
      [1555862400000, 20],
      [1555884000000, 210],
      [1555905600000, 88],
    ];
    return (
      <Chart>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis
          id={getAxisId('timestamp')}
          title="timestamp"
          position={Position.Bottom}
          tickFormat={niceTimeFormatter([1555819200000, 1555905600000])}
        />
        <Axis id={getAxisId('count')} title="count" position={Position.Left} />
        <LineSeries
          id={getSpecId('dataset A')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          data={data}
          xAccessor={0}
          yAccessors={[1]}
        />
      </Chart>
    );
  }
}
