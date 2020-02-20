import React from 'react';
import { Chart, ScaleType, Position, Axis, getAxisId, timeFormatter, getSpecId, AreaSeries, Settings } from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';
export class Playground extends React.Component {
  chartRef: React.RefObject<Chart> = React.createRef();
  onBrushEnd = (min: number, max: number) => {
    // eslint-disable-next-line no-console
    console.log({ min, max });
  };

  render() {
    return (
      <>
        <div className="chart">
          <Chart className={'story-chart'}>
            <Settings showLegend={true} />
            <Axis
              id={getAxisId('bottom')}
              title={'timestamp per 1 minute'}
              position={Position.Bottom}
              showOverlappingTicks={true}
              tickFormat={timeFormatter('HH:mm')}
            />
            <Axis
              id={getAxisId('left')}
              title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
              position={Position.Left}
              tickFormat={(d) => Number(d).toFixed(2)}
            />

            <AreaSeries
              id={getSpecId('area')}
              xScaleType={ScaleType.Time}
              yScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              y0Accessors={[2]}
              data={KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d) => {
                return [...d, d[1] - 10];
              })}
            />
          </Chart>
        </div>
      </>
    );
  }
}
