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
  BarSeries,
  LineAnnotation,
  getAnnotationId,
  AnnotationDomainTypes,
} from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';
import { CursorEvent } from '../src/specs/settings';
import { CursorUpdateListener } from '../src/chart_types/xy_chart/store/chart_state';
import { Icon } from '../src/components/icons/icon';

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
          rotation={0}
        />
        <Axis
          id={getAxisId('timestamp')}
          title="timestamp"
          position={Position.Bottom}
          tickFormat={niceTimeFormatter([1555819200000, 1555905600000])}
        />
        <Axis id={getAxisId('count')} title="count" position={Position.Left} tickFormat={(d) => d.toFixed(2)} />
        <LineAnnotation
          annotationId={getAnnotationId('annotation1')}
          domainType={AnnotationDomainTypes.XDomain}
          dataValues={[
            {
              dataValue: KIBANA_METRICS.metrics.kibana_os_load[1].data[5][0],
              details: 'tooltip 1',
            },
            {
              dataValue: KIBANA_METRICS.metrics.kibana_os_load[1].data[9][0],
              details: 'tooltip 2',
            },
          ]}
          hideLinesTooltips={true}
          marker={<Icon type="alert" />}
        />
        <BarSeries
          id={getSpecId('dataset A with long title')}
          xScaleType={timeSeries ? ScaleType.Time : ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          data={data}
          xAccessor={0}
          yAccessors={[1]}
        />
        <BarSeries
          id={getSpecId('dataset B')}
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
