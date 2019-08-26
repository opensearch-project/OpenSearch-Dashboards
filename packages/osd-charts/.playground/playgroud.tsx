import React from 'react';

import { Axis, Chart, getAxisId, getSpecId, niceTimeFormatter, Position, ScaleType, Settings, BarSeries } from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';
import { CursorEvent } from '../src/specs/settings';
import { CursorUpdateListener } from '../src/chart_types/xy_chart/store/chart_state';

export class Playground extends React.Component {
  ref1 = React.createRef<Chart>();
  ref2 = React.createRef<Chart>();
  ref3 = React.createRef<Chart>();

  onCursorUpdate: CursorUpdateListener = (event?: CursorEvent) => {
    this.ref1.current!.dispatchExternalCursorEvent(event);
    this.ref2.current!.dispatchExternalCursorEvent(event);
    this.ref3.current!.dispatchExternalCursorEvent(event);
  };

  render() {
    return (
      <Chart>
        <Settings tooltip={{ type: 'vertical' }} debug={false} legendPosition={Position.Right} showLegend={true} />
        <Axis
          id={getAxisId('timestamp')}
          title="timestamp"
          position={Position.Bottom}
          tickFormat={niceTimeFormatter([1555819200000, 1555905600000])}
        />
        <Axis id={getAxisId('count')} title="count" position={Position.Left} tickFormat={(d) => d.toFixed(2)} />
        <BarSeries
          id={getSpecId('dataset B')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          barSeriesStyle={{
            rectBorder: {
              strokeOpacity: 1,
              strokeWidth: 4,
              stroke: 'blue',
              visible: true,
            },
            rect: {
              opacity: 0.25,
              fill: 'red',
            },
          }}
        />
        <BarSeries
          id={getSpecId('dataset C')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
        />
      </Chart>
    );
  }
}
