import React, { Fragment } from 'react';
import { Axis, Chart, getAxisId, getSpecId, Position, ScaleType, BarSeries, Settings } from '../src';

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
    const data = [
      {
        g: null,
        i: 'aa',
        x: 1571212800000,
        y: 16,
        y1: 2,
      },
      // {
      //   x: 1571290200000,
      //   y: 1,
      //   y1: 5,
      //   // g: 'authentication_success',
      // },
    ];
    return (
      <Fragment>
        <div>
          <button onClick={this.changeData}>Reduce data</button>
        </div>
        <div className="chart">
          <Chart>
            <Settings showLegend />
            <Axis id={getAxisId('top')} position={Position.Bottom} title={'Top axis'} />
            <Axis
              id={getAxisId('left2')}
              title={'Left axis'}
              position={Position.Left}
              tickFormat={(d: any) => Number(d).toFixed(2)}
            />

            <BarSeries
              id={getSpecId('bars1')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              splitSeriesAccessors={['g']}
              stackAccessors={['x']}
              data={data.slice(0, this.state.dataLimit ? 1 : 2)}
            />
          </Chart>
        </div>
      </Fragment>
    );
  }
}
