import React from 'react';
import { Axis, Chart, getAxisId, getSpecId, Position, ScaleType, Settings, BarSeries } from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';

export class Playground extends React.Component {
  render() {
    return (
      <div className="chart">
        <Chart>
          <Settings showLegend={true} />
          <Axis id={getAxisId('y')} position={Position.Left} />
          <Axis id={getAxisId('x')} position={Position.Bottom} />
          <BarSeries
            id={getSpecId('bar')}
            yScaleType={ScaleType.Linear}
            xScaleType={ScaleType.Time}
            xAccessor={0}
            yAccessors={[1]}
            data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 15)}
          />
        </Chart>
      </div>
    );
  }
}
