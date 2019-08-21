import React from 'react';

import {
  Axis,
  Chart,
  getAxisId,
  getSpecId,
  niceTimeFormatter,
  Position,
  ScaleType,
  Settings,
  LineSeries,
} from '../src';
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
      <>
        {renderChart(
          '1',
          this.ref1,
          KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 15),
          this.onCursorUpdate,
          true,
        )}
        {renderChart(
          '2',
          this.ref2,
          KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15),
          this.onCursorUpdate,
          true,
        )}
        {renderChart('3', this.ref3, KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(15, 30), this.onCursorUpdate)}
      </>
    );
  }
}

function renderChart(
  key: string,
  ref: React.RefObject<Chart>,
  data: any,
  onCursorUpdate?: CursorUpdateListener,
  timeSeries: boolean = false,
) {
  return (
    <div key={key} className="chart">
      <Chart ref={ref}>
        <Settings
          tooltip={{ type: 'vertical' }}
          debug={false}
          legendPosition={Position.Right}
          showLegend={true}
          onCursorUpdate={onCursorUpdate}
        />
        <Axis
          id={getAxisId('timestamp')}
          title="timestamp"
          position={Position.Bottom}
          tickFormat={niceTimeFormatter([1555819200000, 1555905600000])}
        />
        <Axis id={getAxisId('count')} title="count" position={Position.Left} tickFormat={(d) => d.toFixed(2)} />
        <LineSeries
          id={getSpecId('dataset A with a really really really really long title')}
          xScaleType={timeSeries ? ScaleType.Time : ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          data={data}
          xAccessor={0}
          lineSeriesStyle={{
            line: {
              stroke: 'red',
              opacity: 1,
            },
          }}
          yAccessors={[1]}
        />
        <LineSeries
          id={getSpecId('dataset B')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
        />
        <LineSeries
          id={getSpecId('dataset C')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
        />
      </Chart>
    </div>
  );
}
