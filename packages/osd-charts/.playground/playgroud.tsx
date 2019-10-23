import React, { Fragment } from 'react';
import { Axis, Chart, getAxisId, getSpecId, Position, ScaleType, BarSeries, Settings, niceTimeFormatter } from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';

export class Playground extends React.Component<{}, { dataLimit: boolean }> {
  state = {
    dataLimit: false,
  };
  changeData = () => {
    this.setState((prevState) => {
      return {
        dataLimit: !prevState.dataLimit,
      };
    });
  };
  render() {
    const { data } = KIBANA_METRICS.metrics.kibana_os_load[0];
    return (
      <Fragment>
        <div>
          <button onClick={this.changeData}>Reduce data</button>
        </div>
        <div className="chart">
          <Chart>
            <Settings showLegend />
            <Axis
              id={getAxisId('top')}
              position={Position.Bottom}
              title={'Top axis'}
              tickFormat={niceTimeFormatter([data[0][0], data[data.length - 1][0]])}
            />
            <Axis id={getAxisId('left2')} title={'Left axis'} position={Position.Left} />

            <BarSeries
              id={getSpecId('bars1')}
              xScaleType={ScaleType.Time}
              yScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              timeZone={'US/Pacific'}
              data={data}
            />
          </Chart>
        </div>
      </Fragment>
    );
  }
}
