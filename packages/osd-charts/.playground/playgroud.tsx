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
import { KIBANA_METRICS } from '../src/lib/series/utils/test_dataset_kibana';

export class Playground extends React.Component {
  render() {
    return (
      <>
        {this.renderChart(Position.Right)}
        {this.renderChart(Position.Bottom)}
      </>
    );
  }
  renderChart(legendPosition: Position) {
    return (
      <div className="chart">
        <Chart>
          <Settings debug={true} showLegend={true} legendPosition={legendPosition} rotation={0} />
          <Axis
            id={getAxisId('timestamp')}
            title="timestamp"
            position={Position.Bottom}
            tickFormat={niceTimeFormatter([1555819200000, 1555905600000])}
          />
          <Axis id={getAxisId('count')} title="count" position={Position.Left} tickFormat={(d) => d.toFixed(2)} />
          <LineSeries
            id={getSpecId('dataset A with long title')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 15)}
            xAccessor={0}
            yAccessors={[1]}
          />
          <LineSeries
            id={getSpecId('dataset B')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
            xAccessor={0}
            yAccessors={[1]}
          />
          <LineSeries
            id={getSpecId('dataset C')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[2].data.slice(0, 15)}
            xAccessor={0}
            yAccessors={[1]}
          />
          <LineSeries
            id={getSpecId('dataset D')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
            xAccessor={0}
            yAccessors={[1]}
          />
          <LineSeries
            id={getSpecId('dataset E')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
            xAccessor={0}
            yAccessors={[1]}
          />
        </Chart>
      </div>
    );
  }
}
