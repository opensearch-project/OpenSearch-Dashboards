import React, { Fragment } from 'react';
import { Axis, Chart, getAxisId, getSpecId, Position, ScaleType, BarSeries } from '../src';

export class Playground extends React.Component {
  render() {
    const data = [{ x: 0, y: -4 }, { x: 1, y: -3 }, { x: 2, y: 2 }, { x: 3, y: 1 }];
    return (
      <Fragment>
        <div className="chart">
          <Chart>
            <Axis id={getAxisId('top')} position={Position.Bottom} title={'Top axis'} />
            <Axis
              id={getAxisId('left2')}
              title={'Left axis'}
              position={Position.Left}
              tickFormat={(d: any) => Number(d).toFixed(2)}
            />

            <BarSeries
              id={getSpecId('bars')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              splitSeriesAccessors={['g']}
              stackAccessors={['x']}
              data={data}
              yScaleToDataExtent={true}
            />
          </Chart>
        </div>
      </Fragment>
    );
  }
}
