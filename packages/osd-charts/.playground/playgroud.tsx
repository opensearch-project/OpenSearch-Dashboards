import React from 'react';
import {
  Axis,
  Chart,
  getAxisId,
  getSpecId,
  Position,
  ScaleType,
  HistogramBarSeries,
  DARK_THEME,
  Settings,
} from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';

export class Playground extends React.Component {
  render() {
    const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 5);
    return (
      <div className="chart">
        <Chart>
          <Settings theme={DARK_THEME} rotation={180} />
          <Axis id={getAxisId('x')} position={Position.Bottom} />
          <Axis id={getAxisId('y')} position={Position.Left} />

          <HistogramBarSeries
            id={getSpecId('series bars chart')}
            xScaleType={ScaleType.Linear}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            data={data}
            yScaleToDataExtent={true}
          />
        </Chart>
      </div>
    );
  }
}
